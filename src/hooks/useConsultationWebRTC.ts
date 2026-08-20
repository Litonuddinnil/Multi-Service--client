/**
 * useConsultationWebRTC — orchestrates the browser-side WebRTC stack for a
 * single consultation session.
 *
 * Pipeline:
 *   1. fetchSignalingToken(consultationId, role, userId, name)  → REST
 *   2. Open ConsultationSignalingClient  → WebSocket
 *   3. getUserMedia({ audio, video })     → local MediaStream
 *   4. For each remote peer, create an RTCPeerConnection, attach the local
 *      tracks, and exchange offer/answer/ICE via the signaling channel.
 *   5. Surface remoteMediaStream + mediaState + connectionState to the UI.
 *
 * Polite peer pattern: the peer with the *larger* peerId is "polite" — it
 * rolls back if it ever collides. This is the standard "perfect negotiation"
 * pattern and means the call works whichever side hangs up first.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ConsultationSignalingClient,
  type InboundMessage,
  type PeerInfo,
  type SignalingClientOptions
} from '../services/consultation/signalingClient';
import { ApiService } from '../services/api';

// Public Google STUN servers match the ones configured server-side; the
// server's REST /ice-config response is the authoritative source.
const DEFAULT_ICE_SERVERS: Array<{ urls: string | string[] }> = [
  { urls: 'stun:stun.l.google.com:19302' }
];

export type CallConnectionState =
  | 'idle'
  | 'preparing'
  | 'waiting-peer'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'failed'
  | 'ended';

export interface RemotePeerView {
  peerId: string;
  role: 'DOCTOR' | 'PATIENT';
  name: string;
  stream: MediaStream | null;
  audioEnabled: boolean;
  videoEnabled: boolean;
  connectionState: RTCPeerConnectionState;
  iceState: RTCIceConnectionState;
}

export interface UseConsultationWebRTCOptions {
  consultationId: string;
  role: 'DOCTOR' | 'PATIENT';
  userId: string;
  name: string;
  /** Override the HTTP base URL — defaults to window.location.origin. */
  httpBaseUrl?: string;
  /** When set, the hook runs token fetch + signaling. Set to false to keep
   * the local preview only (live banner disabled). */
  enabled?: boolean;
}

export interface UseConsultationWebRTCResult {
  localStream: MediaStream | null;
  remotePeers: RemotePeerView[];
  micEnabled: boolean;
  cameraEnabled: boolean;
  connectionState: CallConnectionState;
  signalingState: 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'closed' | 'error';
  chat: { fromPeerId: string; fromName: string; fromRole: 'DOCTOR' | 'PATIENT'; text: string; at: number }[];
  errorMessage: string | null;
  selfPeerId: string | null;
  sendChat: (text: string) => void;
  toggleMic: () => void;
  toggleCamera: () => void;
  hangup: () => void;
  restartIce: () => void;
}

interface PeerEntry {
  view: RemotePeerView;
  pc: RTCPeerConnection;
  makingOffer: boolean;
  ignoreOffer: boolean;
  isSettingRemoteAnswerPending: boolean;
}

export function useConsultationWebRTC(
  opts: UseConsultationWebRTCOptions
): UseConsultationWebRTCResult {
  const enabled = opts.enabled !== false;
  const httpBaseUrl = opts.httpBaseUrl ?? (typeof window !== 'undefined' ? window.location.origin : '');

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remotePeers, setRemotePeers] = useState<RemotePeerView[]>([]);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [connectionState, setConnectionState] = useState<CallConnectionState>('idle');
  const [signalingState, setSignalingState] = useState<UseConsultationWebRTCResult['signalingState']>('idle');
  const [chat, setChat] = useState<UseConsultationWebRTCResult['chat']>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selfPeerId, setSelfPeerId] = useState<string | null>(null);

  const sigRef = useRef<ConsultationSignalingClient | null>(null);
  const peersRef = useRef<Map<string, PeerEntry>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const selfIdRef = useRef<string | null>(null);
  const iceServersRef = useRef<Array<{ urls: string | string[] }>>(DEFAULT_ICE_SERVERS);
  const consultationIdRef = useRef(opts.consultationId);
  consultationIdRef.current = opts.consultationId;

  // ----- Helpers -----------------------------------------------------------

  const broadcastMediaState = useCallback(() => {
    sigRef.current?.send({
      type: 'media-state',
      audio: micEnabled,
      video: cameraEnabled
    });
  }, [micEnabled, cameraEnabled]);

  const updatePeer = useCallback((peerId: string, patch: Partial<RemotePeerView>) => {
    const entry = peersRef.current.get(peerId);
    if (!entry) return;
    entry.view = { ...entry.view, ...patch };
    setRemotePeers(prev => {
      const idx = prev.findIndex(p => p.peerId === peerId);
      if (idx === -1) return [...prev, entry.view];
      const copy = [...prev];
      copy[idx] = entry.view;
      return copy;
    });
  }, []);

  const createPeer = useCallback((peer: PeerInfo, polite: boolean): PeerEntry => {
    const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });

    const view: RemotePeerView = {
      peerId: peer.peerId,
      role: peer.role,
      name: peer.name,
      stream: null,
      audioEnabled: true,
      videoEnabled: true,
      connectionState: pc.connectionState,
      iceState: pc.iceConnectionState
    };

    const entry: PeerEntry = {
      view,
      pc,
      makingOffer: false,
      ignoreOffer: false,
      isSettingRemoteAnswerPending: false
    };

    // Attach local tracks so they can be sent.
    if (localStreamRef.current) {
      for (const track of localStreamRef.current.getTracks()) {
        pc.addTrack(track, localStreamRef.current);
      }
    }

    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        sigRef.current?.send({
          type: 'ice',
          toPeerId: peer.peerId,
          candidate: ev.candidate.toJSON()
        });
      }
    };

    pc.ontrack = (ev) => {
      const remote = ev.streams[0] ?? new MediaStream([ev.track]);
      updatePeer(peer.peerId, { stream: remote });
    };

    pc.onconnectionstatechange = () => {
      updatePeer(peer.peerId, { connectionState: pc.connectionState });
      if (pc.connectionState === 'connected') {
        setConnectionState(prev => prev === 'connecting' ? 'connected' : prev);
      } else if (pc.connectionState === 'failed') {
        // Try ICE restart once automatically.
        sigRef.current?.send({ type: 'restart-ice', toPeerId: peer.peerId });
      } else if (pc.connectionState === 'disconnected') {
        setConnectionState('reconnecting');
      }
    };

    pc.oniceconnectionstatechange = () => {
      updatePeer(peer.peerId, { iceState: pc.iceConnectionState });
    };

    pc.onnegotiationneeded = async () => {
      try {
        entry.makingOffer = true;
        await pc.setLocalDescription();
        const sdp = pc.localDescription?.sdp;
        if (sdp) {
          sigRef.current?.send({
            type: 'offer',
            toPeerId: peer.peerId,
            sdp
          });
        }
      } catch (err) {
        console.error('[webrtc] negotiationneeded failed', err);
      } finally {
        entry.makingOffer = false;
      }
    };

    // Expose polite flag for the perfect negotiation logic.
    (entry as PeerEntry & { polite?: boolean }).polite = polite;

    return entry;
  }, [updatePeer]);

  const handleInbound = useCallback(async (msg: InboundMessage) => {
    switch (msg.type) {
      case 'joined': {
        selfIdRef.current = msg.self.peerId;
        setSelfPeerId(msg.self.peerId);
        if (msg.iceServers && msg.iceServers.length > 0) {
          iceServersRef.current = msg.iceServers;
        }
        // Pre-create PCs for any peers already in the room.
        for (const peer of msg.peers) {
          const polite = msg.self.peerId > peer.peerId;
          peersRef.current.set(peer.peerId, createPeer(peer, polite));
          setRemotePeers(prev => [...prev, peersRef.current.get(peer.peerId)!.view]);
        }
        setConnectionState(msg.peers.length === 0 ? 'waiting-peer' : 'connecting');
        break;
      }

      case 'peer-joined': {
        const polite = (selfIdRef.current ?? '') > msg.peer.peerId;
        peersRef.current.set(msg.peer.peerId, createPeer(msg.peer, polite));
        setRemotePeers(prev => [...prev, peersRef.current.get(msg.peer.peerId)!.view]);
        setConnectionState('connecting');
        break;
      }

      case 'peer-left': {
        const entry = peersRef.current.get(msg.peerId);
        if (entry) {
          try { entry.pc.close(); } catch { /* noop */ }
          peersRef.current.delete(msg.peerId);
        }
        setRemotePeers(prev => prev.filter(p => p.peerId !== msg.peerId));
        if (peersRef.current.size === 0) {
          setConnectionState('waiting-peer');
        }
        break;
      }

      case 'offer': {
        const entry = peersRef.current.get(msg.fromPeerId);
        if (!entry) return;
        const { pc } = entry;
        const offerCollision = entry.makingOffer || pc.signalingState !== 'stable';
        entry.ignoreOffer = !entry.polite && offerCollision;
        if (entry.ignoreOffer) return;
        try {
          await pc.setRemoteDescription({ type: 'offer', sdp: msg.sdp });
          await pc.setLocalDescription();
          const sdp = pc.localDescription?.sdp;
          if (sdp) {
            sigRef.current?.send({
              type: 'answer',
              toPeerId: msg.fromPeerId,
              sdp
            });
          }
        } catch (err) {
          console.error('[webrtc] failed to handle offer', err);
        }
        break;
      }

      case 'answer': {
        const entry = peersRef.current.get(msg.fromPeerId);
        if (!entry) return;
        try {
          await entry.pc.setRemoteDescription({ type: 'answer', sdp: msg.sdp });
        } catch (err) {
          console.error('[webrtc] failed to set answer', err);
        }
        break;
      }

      case 'ice': {
        const entry = peersRef.current.get(msg.fromPeerId);
        if (!entry) return;
        try {
          if (msg.candidate) {
            await entry.pc.addIceCandidate(msg.candidate);
          }
        } catch (err) {
          if (!entry.ignoreOffer) console.error('[webrtc] addIceCandidate failed', err);
        }
        break;
      }

      case 'chat': {
        setChat(prev => [...prev, {
          fromPeerId: msg.fromPeerId,
          fromName: msg.fromName,
          fromRole: msg.fromRole,
          text: msg.text,
          at: msg.at
        }]);
        break;
      }

      case 'media-state': {
        updatePeer(msg.fromPeerId, {
          audioEnabled: msg.audio,
          videoEnabled: msg.video
        });
        break;
      }

      case 'restart-ice': {
        const entry = peersRef.current.get(msg.fromPeerId);
        if (!entry) return;
        try {
          // Force ICE restart by reissuing an offer with updated credentials.
          await entry.pc.setLocalDescription();
          const sdp = entry.pc.localDescription?.sdp;
          if (sdp) {
            sigRef.current?.send({
              type: 'offer',
              toPeerId: msg.fromPeerId,
              sdp
            });
          }
        } catch (err) {
          console.error('[webrtc] restart-ice failed', err);
        }
        break;
      }

      case 'error': {
        setErrorMessage(msg.message);
        break;
      }

      case 'pong':
        break;
    }
  }, [createPeer, updatePeer]);

  // ----- Lifecycle ---------------------------------------------------------

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const start = async () => {
      setConnectionState('preparing');
      try {
        // 1. Acquire local media stream.
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: { width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);
        setMicEnabled(stream.getAudioTracks().every(t => t.enabled));
        setCameraEnabled(stream.getVideoTracks().every(t => t.enabled));

        // 2. Fetch signaling token.
        const tokenData = await ApiService.fetchSignalingToken(
          opts.consultationId,
          opts.role,
          opts.userId,
          opts.name
        );
        if (cancelled) return;
        if (!tokenData) {
          setErrorMessage('Could not acquire consulting token. Please retry.');
          setConnectionState('failed');
          return;
        }
        if (tokenData.iceServers?.length) {
          iceServersRef.current = tokenData.iceServers;
        }

        // 3. Open signaling WebSocket.
        const sig = new ConsultationSignalingClient({
          httpBaseUrl,
          consultationId: opts.consultationId,
          token: tokenData.token,
          onEvent: handleInbound,
          onStateChange: (s) => setSignalingState(s as UseConsultationWebRTCResult['signalingState'])
        });
        sigRef.current = sig;
        sig.connect();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to start camera/microphone';
        setErrorMessage(msg);
        setConnectionState('failed');
      }
    };

    start();

    return () => {
      cancelled = true;
      sigRef.current?.close();
      sigRef.current = null;
      for (const entry of peersRef.current.values()) {
        try { entry.pc.close(); } catch { /* noop */ }
      }
      peersRef.current.clear();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
      setLocalStream(null);
      setRemotePeers([]);
      setConnectionState('ended');
    };
  }, [enabled, httpBaseUrl, opts.consultationId, opts.role, opts.userId, opts.name, handleInbound]);

  // Broadcast media-state changes whenever toggles flip.
  useEffect(() => {
    if (signalingState !== 'connected') return;
    broadcastMediaState();
    // Intentional: only when the booleans change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [micEnabled, cameraEnabled, signalingState]);

  // ----- Controls ----------------------------------------------------------

  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !micEnabled;
    stream.getAudioTracks().forEach(t => { t.enabled = next; });
    setMicEnabled(next);
    if (sigRef.current?.getState() === 'connected') {
      sigRef.current.send({ type: 'media-state', audio: next, video: cameraEnabled });
    }
  }, [micEnabled, cameraEnabled]);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !cameraEnabled;
    stream.getVideoTracks().forEach(t => { t.enabled = next; });
    setCameraEnabled(next);
    if (sigRef.current?.getState() === 'connected') {
      sigRef.current.send({ type: 'media-state', audio: micEnabled, video: next });
    }
  }, [cameraEnabled, micEnabled]);

  const sendChat = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sigRef.current?.send({ type: 'chat', text: trimmed });
    // Optimistic local echo so the sender sees their own message immediately.
    if (selfIdRef.current) {
      setChat(prev => [...prev, {
        fromPeerId: selfIdRef.current!,
        fromName: opts.name,
        fromRole: opts.role,
        text: trimmed,
        at: Date.now()
      }]);
    }
  }, [opts.name, opts.role]);

  const restartIce = useCallback(() => {
    for (const peerId of peersRef.current.keys()) {
      sigRef.current?.send({ type: 'restart-ice', toPeerId: peerId });
    }
  }, []);

  const hangup = useCallback(() => {
    sigRef.current?.close();
    sigRef.current = null;
    for (const entry of peersRef.current.values()) {
      try { entry.pc.close(); } catch { /* noop */ }
    }
    peersRef.current.clear();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemotePeers([]);
    setConnectionState('ended');
  }, []);

  return useMemo(() => ({
    localStream,
    remotePeers,
    micEnabled,
    cameraEnabled,
    connectionState,
    signalingState,
    chat,
    errorMessage,
    selfPeerId,
    sendChat,
    toggleMic,
    toggleCamera,
    hangup,
    restartIce
  }), [
    localStream, remotePeers, micEnabled, cameraEnabled,
    connectionState, signalingState, chat, errorMessage, selfPeerId,
    sendChat, toggleMic, toggleCamera, hangup, restartIce
  ]);
}
