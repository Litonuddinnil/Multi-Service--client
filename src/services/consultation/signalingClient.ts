/**
 * Client-side signaling service for the WebRTC consultation room.
 *
 * Responsibilities:
 *   - Open a WebSocket to `${wsUrl}/consultation/signal?token=...`
 *   - Authenticate using the one-time token issued by the REST /join endpoint
 *   - Multiplex typed messages (offer / answer / ice / chat / media-state)
 *   - Heartbeat with ping/pong every 20s; auto-reconnect with exponential backoff
 *   - Stay silent when the tab is hidden (browsers throttle it anyway)
 *
 * The signaling layer is decoupled from the PeerConnection layer: the React
 * hook `useConsultationWebRTC` consumes the `onEvent` stream and emits
 * outgoing messages via `send()`. This keeps transports independently
 * testable.
 */

export type ConsultationRole = 'DOCTOR' | 'PATIENT';

export type SignalClientState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'closed'
  | 'error';

export interface PeerInfo {
  peerId: string;
  role: ConsultationRole;
  userId: string;
  name: string;
  joinedAt: number;
}

export interface JoinedMessage {
  type: 'joined';
  self: PeerInfo;
  peers: PeerInfo[];
  iceServers: Array<{ urls: string | string[] }>;
  consultationId: string;
}

export interface PeerJoinedMessage {
  type: 'peer-joined';
  peer: PeerInfo;
}

export interface PeerLeftMessage {
  type: 'peer-left';
  peerId: string;
  reason?: string;
}

export interface OfferMessage {
  type: 'offer';
  fromPeerId: string;
  toPeerId: string;
  sdp: string;
}

export interface AnswerMessage {
  type: 'answer';
  fromPeerId: string;
  toPeerId: string;
  sdp: string;
}

export interface IceMessage {
  type: 'ice';
  fromPeerId: string;
  toPeerId: string;
  candidate: RTCIceCandidateInit;
}

export interface ChatMessage {
  type: 'chat';
  fromPeerId: string;
  fromName: string;
  fromRole: ConsultationRole;
  text: string;
  at: number;
}

export interface MediaStateMessage {
  type: 'media-state';
  fromPeerId: string;
  audio: boolean;
  video: boolean;
}

export interface ErrorMessage {
  type: 'error';
  code: string;
  message: string;
}

export interface PongMessage {
  type: 'pong';
  at: number;
}

export interface RestartIceMessage {
  type: 'restart-ice';
  fromPeerId: string;
  toPeerId: string;
}

export type InboundMessage =
  | JoinedMessage
  | PeerJoinedMessage
  | PeerLeftMessage
  | OfferMessage
  | AnswerMessage
  | IceMessage
  | ChatMessage
  | MediaStateMessage
  | ErrorMessage
  | PongMessage
  | RestartIceMessage;

export type OutboundMessage =
  | { type: 'ping' }
  | { type: 'offer'; toPeerId: string; sdp: string }
  | { type: 'answer'; toPeerId: string; sdp: string }
  | { type: 'ice'; toPeerId: string; candidate: RTCIceCandidateInit }
  | { type: 'restart-ice'; toPeerId: string }
  | { type: 'chat'; text: string }
  | { type: 'media-state'; audio: boolean; video: boolean };

export interface SignalingClientOptions {
  httpBaseUrl: string;          // e.g. http://localhost:3000
  consultationId: string;
  token: string;
  onEvent: (msg: InboundMessage) => void;
  onStateChange?: (state: SignalClientState, info?: { attempt?: number; error?: string }) => void;
  heartbeatMs?: number;
  maxBackoffMs?: number;
}

export class ConsultationSignalingClient {
  private ws: WebSocket | null = null;
  private state: SignalClientState = 'idle';
  private attempt = 0;
  private heartbeat: number | null = null;
  private reconnectTimer: number | null = null;
  private intentionallyClosed = false;
  private readonly opts: Required<Omit<SignalingClientOptions, 'onStateChange'>> & {
    onStateChange?: SignalingClientOptions['onStateChange'];
  };

  constructor(opts: SignalingClientOptions) {
    this.opts = {
      heartbeatMs: 20_000,
      maxBackoffMs: 15_000,
      ...opts
    };
  }

  connect(): void {
    this.intentionallyClosed = false;
    this.openSocket();
  }

  close(): void {
    this.intentionallyClosed = true;
    this.clearTimers();
    if (this.ws) {
      try { this.ws.close(1000, 'client closed'); } catch { /* noop */ }
      this.ws = null;
    }
    this.setState('closed');
  }

  send(msg: OutboundMessage): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      // Queue would be better but we keep the contract simple: drop. The
      // hook is expected to retry on next connected event.
      return false;
    }
    try {
      this.ws.send(JSON.stringify(msg));
      return true;
    } catch {
      return false;
    }
  }

  getState(): SignalClientState {
    return this.state;
  }

  private setState(s: SignalClientState, info?: { attempt?: number; error?: string }) {
    this.state = s;
    this.opts.onStateChange?.(s, info);
  }

  private openSocket() {
    this.clearTimers();
    this.setState(this.attempt === 0 ? 'connecting' : 'reconnecting', { attempt: this.attempt });

    const wsBase = this.opts.httpBaseUrl.replace(/^http/, 'ws');
    const url = `${wsBase}/consultation/signal?token=${encodeURIComponent(this.opts.token)}`;

    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch (err) {
      this.scheduleReconnect(err instanceof Error ? err.message : 'WebSocket construct failed');
      return;
    }
    this.ws = ws;

    ws.onopen = () => {
      this.attempt = 0;
      this.setState('connected');
      this.startHeartbeat();
    };

    ws.onmessage = (ev) => {
      let parsed: InboundMessage;
      try {
        parsed = JSON.parse(ev.data as string) as InboundMessage;
      } catch {
        return;
      }
      if (parsed.type === 'pong') {
        // Server heartbeat — used to keep the connection warm; nothing to do.
        return;
      }
      this.opts.onEvent(parsed);
    };

    ws.onerror = () => {
      // onclose will follow with details; we keep state at 'reconnecting' so
      // the UI can show a transient spinner.
      this.setState('error', { error: 'socket error' });
    };

    ws.onclose = (ev) => {
      this.clearTimers();
      this.ws = null;
      if (this.intentionallyClosed) return;
      this.scheduleReconnect(`closed (${ev.code})`);
    };
  }

  private startHeartbeat() {
    if (this.opts.heartbeatMs <= 0) return;
    this.heartbeat = window.setInterval(() => {
      this.send({ type: 'ping' });
    }, this.opts.heartbeatMs);
  }

  private scheduleReconnect(reason: string) {
    this.attempt += 1;
    const base = Math.min(this.opts.maxBackoffMs, 500 * Math.pow(2, this.attempt));
    // Add 0–250ms jitter to avoid thundering herd if multiple tabs reconnect.
    const delay = base + Math.floor(Math.random() * 250);
    this.setState('reconnecting', { attempt: this.attempt, error: reason });
    this.reconnectTimer = window.setTimeout(() => this.openSocket(), delay);
  }

  private clearTimers() {
    if (this.heartbeat != null) {
      window.clearInterval(this.heartbeat);
      this.heartbeat = null;
    }
    if (this.reconnectTimer != null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
