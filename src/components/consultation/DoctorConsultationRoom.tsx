import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  FileText,
  Send,
  Plus,
  Trash2,
  Download,
  Printer,
  ShieldCheck,
  Clock,
  User,
  Stethoscope,
  MessageSquare,
  CheckCircle2,
  Maximize2,
  Minimize2,
  AlertCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  Loader2
} from 'lucide-react';
import { ConsultationSession, PrescriptionMedication } from '../../types';
import { ApiService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { DateTimeValue } from '../common/DateTimeValue';
import { useConsultationWebRTC } from '../../hooks/useConsultationWebRTC';

interface DoctorConsultationRoomProps {
  consultationId: string;
  onExit: () => void;
  onViewPrescription?: (consultation: ConsultationSession) => void;
}

export const DoctorConsultationRoom: React.FC<DoctorConsultationRoomProps> = ({
  consultationId,
  onExit,
  onViewPrescription
}) => {
  const { user, activeRole } = useAuth();
  const { t, formatDateTime } = useLanguage();

  const [session, setSession] = useState<ConsultationSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rx' | 'chat'>('rx');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const startedAtMsRef = useRef<number | null>(null);

  const isDoctor = activeRole === 'EXPERT' || (user && user.roles.includes('EXPERT'));
  const role: 'DOCTOR' | 'PATIENT' = isDoctor ? 'DOCTOR' : 'PATIENT';

  // Real WebRTC + signaling stack.
  const webrtc = useConsultationWebRTC({
    consultationId,
    role,
    userId: user?.id ?? `anon-${Date.now()}`,
    name: user?.name ?? (isDoctor ? 'Doctor' : 'Patient'),
    enabled: !loading && !!session
  });

  // Prescription Form State
  const [diagnosis, setDiagnosis] = useState('');
  const [chiefComplaints, setChiefComplaints] = useState('Mild fever, dry cough for 3 days');
  const [adviceNotes, setAdviceNotes] = useState('Drink plenty of warm fluids. Complete 5-day course.');
  const [medications, setMedications] = useState<PrescriptionMedication[]>([
    {
      id: 'med-1',
      name: 'Tab. Napa Extra (Paracetamol 500mg + Caffeine 65mg)',
      dosage: '1 + 0 + 1',
      duration: '3 Days',
      instruction: 'After meal if fever > 100°F'
    },
    {
      id: 'med-2',
      name: 'Syrup Tusca (Dextromethorphan HBr)',
      dosage: '2 tsp',
      duration: '5 Days',
      instruction: 'Three times daily after food'
    }
  ]);

  // Chat State — backed by the live signaling channel via `webrtc.chat`.
  const [chatInput, setChatInput] = useState('');

  const [isEnding, setIsEnding] = useState(false);
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);

  useEffect(() => {
    const loadSession = async () => {
      const role = isDoctor ? 'DOCTOR' : 'PATIENT';
      const s = await ApiService.joinConsultation(consultationId, role);
      if (s?.consultationStartedAt) {
        startedAtMsRef.current = new Date(s.consultationStartedAt).getTime();
      } else if (s?.doctorJoinedAt || s?.userJoinedAt) {
        // Fallback: start the timer from the first join timestamp.
        const first = s.doctorJoinedAt || s.userJoinedAt;
        startedAtMsRef.current = new Date(first as string).getTime();
      } else {
        startedAtMsRef.current = Date.now();
      }
      setSession(s);
      setLoading(false);
    };
    loadSession();
  }, [consultationId, isDoctor]);

  // Live timer ticker — now wall-clock anchored so it survives pauses.
  useEffect(() => {
    if (!session || session.sessionStatus === 'completed') return;
    const tick = () => {
      if (startedAtMsRef.current) {
        setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAtMsRef.current) / 1000)));
      } else {
        setElapsedSeconds(prev => prev + 1);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session?.sessionStatus, session]);

  const handleAddMedication = () => {
    setMedications(prev => [
      ...prev,
      {
        id: `med-${Date.now()}`,
        name: '',
        dosage: '1 + 0 + 1',
        duration: '5 Days',
        instruction: 'After meal'
      }
    ]);
  };

  const handleRemoveMedication = (id: string) => {
    setMedications(prev => prev.filter(m => m.id !== id));
  };

  const handleUpdateMedication = (id: string, field: keyof PrescriptionMedication, value: string) => {
    setMedications(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    webrtc.sendChat(chatInput.trim());
    setChatInput('');
  };

  const handleEndConsultation = async () => {
    setIsEnding(true);
    webrtc.hangup();
    const summary = `Chief Complaints: ${chiefComplaints}\nDiagnosis: ${diagnosis || 'Upper Respiratory Tract Infection'}\nAdvice: ${adviceNotes}`;
    const rxJson = JSON.stringify(medications);

    // Prefer the authoritative server-side end endpoint (also frees the
    // signaling room); fall back to local-only end for offline demo mode.
    let completed = await ApiService.endConsultationRemote(
      consultationId,
      elapsedSeconds,
      rxJson,
      summary
    );
    if (!completed) {
      completed = await ApiService.endConsultation(consultationId, rxJson, summary);
    }
    if (completed) {
      setSession(completed);
      setIsCompletedModalOpen(true);
    }
    setIsEnding(false);
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-[#34C759] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium">Connecting to secure medical room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A] text-white flex flex-col overflow-hidden font-sans">
      {/* Top Bar */}
      <header className="h-14 bg-[#1E293B] border-b border-gray-700/60 px-4 sm:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#34C759] flex items-center justify-center font-bold text-sm">
            wU
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-md">
                {isDoctor ? `Patient: ${session?.userName}` : `Doctor: ${session?.doctorName}`}
              </span>
              <span className="text-[10px] bg-[#34C759]/20 text-[#34C759] font-semibold px-2 py-0.5 rounded-full border border-[#34C759]/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" />
                Live WebRTC
              </span>
            </div>
          </div>
        </div>

        {/* Timer & Session status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-gray-700 font-mono text-sm font-bold text-white">
            <Clock className="w-4 h-4 text-[#34C759]" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>

          <button
            onClick={handleEndConsultation}
            disabled={isEnding}
            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>{isEnding ? 'Finalizing...' : 'End & Release'}</span>
          </button>
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Video Area */}
        <div className="flex-1 flex flex-col bg-[#0B0F17] relative p-4 justify-between">
          {/* Main Video Stream Frame (Remote Party) */}
          <div className="flex-1 rounded-2xl bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-800 relative overflow-hidden flex items-center justify-center shadow-inner">
            <RemoteVideoPanel
              remotePeers={webrtc.remotePeers}
              isDoctor={isDoctor}
              doctorName={session?.doctorName}
              userName={session?.userName}
              connectionState={webrtc.connectionState}
              errorMessage={webrtc.errorMessage}
            />

            {/* Picture-in-Picture Local Stream (Self) */}
            <LocalPreviewTile
              localStream={webrtc.localStream}
              cameraEnabled={webrtc.cameraEnabled}
              micEnabled={webrtc.micEnabled}
              avatarUrl={user?.avatarUrl}
            />

            {/* Connection status banner */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <ConnectionBadge state={webrtc.connectionState} signalingState={webrtc.signalingState} />
              {webrtc.connectionState === 'failed' && (
                <button
                  onClick={() => webrtc.restartIce()}
                  className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold rounded-md flex items-center gap-1 cursor-pointer"
                  title="Restart ICE"
                >
                  <RefreshCw className="w-3 h-3" /> Reconnect
                </button>
              )}
            </div>

            {/* Escrow Badge overlay */}
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-700 text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#34C759]" />
              <span>Escrow Protected Consultation</span>
            </div>
          </div>

          {/* Bottom Floating Control Bar */}
          <div className="h-16 flex items-center justify-center gap-3 shrink-0 pt-3">
            <button
              onClick={webrtc.toggleMic}
              className={`p-3.5 rounded-full transition-all cursor-pointer shadow-lg ${
                webrtc.micEnabled ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-red-600 text-white ring-4 ring-red-600/30'
              }`}
              title={webrtc.micEnabled ? 'Mute Mic' : 'Unmute Mic'}
            >
              {webrtc.micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            <button
              onClick={webrtc.toggleCamera}
              className={`p-3.5 rounded-full transition-all cursor-pointer shadow-lg ${
                webrtc.cameraEnabled ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-red-600 text-white ring-4 ring-red-600/30'
              }`}
              title={webrtc.cameraEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
            >
              {webrtc.cameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            <div className="h-6 w-px bg-gray-700 mx-2" />

            <button
              onClick={() => setActiveTab('rx')}
              className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'rx' ? 'bg-[#34C759] text-white shadow-md' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Digital Prescription</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'chat' ? 'bg-[#34C759] text-white shadow-md' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Live Chat</span>
            </button>
          </div>
        </div>

        {/* Right Sidebar: Prescription Pad / Live Chat */}
        <div className="w-full lg:w-[480px] bg-white  border-l border-gray-200 flex flex-col h-[50vh] lg:h-full overflow-hidden">
          {/* Tab Header */}
          <div className="bg-[#F8FAFC] border-b border-gray-200 p-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('rx')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'rx' ? 'bg-white text-[#34C759] shadow-xs border border-gray-200' : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                Digital Rx Pad
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'chat' ? 'bg-white text-[#34C759] shadow-xs border border-gray-200' : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                Room Chat ({webrtc.chat.length})
              </button>
            </div>

            <span className="text-[10px] text-gray-500 font-semibold uppercase">
              BMDC #A-89421
            </span>
          </div>

          {/* Rx Pad Content */}
          {activeTab === 'rx' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* Doctor Official Header */}
              <div className="border-b-2 border-emerald-600 pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold ">{session?.doctorName || 'Dr. Rahim Ahmed'}</h4>
                    <p className="text-[11px] text-gray-600">MBBS, FCPS, MD (Cardiology) • BMDC Reg: A-89421</p>
                    <p className="text-[10px] text-emerald-700 font-medium">Associate Professor, National Heart Foundation</p>
                  </div>
                  <div className="w-10 h-10 rounded bg-[#34C759]/10 text-[#34C759] flex items-center justify-center font-bold text-xs border border-[#34C759]/30">
                    Rx
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-gray-100 grid grid-cols-3 gap-2 text-[11px] text-gray-600">
                  <span><strong>Patient:</strong> {session?.userName}</span>
                  <span><strong>Age:</strong> 34 Y</span>
                  <span><strong>Date:</strong> {new Date().toLocaleDateString('en-GB')}</span>
                </div>
              </div>

              {/* Diagnosis / Complaints */}
              <div className="space-y-2">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Chief Complaints</label>
                  <input
                    type="text"
                    disabled={!isDoctor}
                    value={chiefComplaints}
                    onChange={(e) => setChiefComplaints(e.target.value)}
                    placeholder="e.g. Cough, fever, chest tightness"
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#34C759]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Clinical Diagnosis</label>
                  <input
                    type="text"
                    disabled={!isDoctor}
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="e.g. Acute Viral Bronchitis"
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#34C759]"
                  />
                </div>
              </div>

              {/* Medications Rx */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
                    <span className="text-base text-emerald-600 font-serif font-black">℞</span>
                    Prescribed Medications ({medications.length})
                  </span>
                  {isDoctor && (
                    <button
                      type="button"
                      onClick={handleAddMedication}
                      className="text-xs text-[#34C759] font-bold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Drug
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {medications.map((med, idx) => (
                    <div key={med.id} className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2 relative group">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-700 text-[11px]">#{idx + 1}</span>
                        {isDoctor && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMedication(med.id)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        disabled={!isDoctor}
                        value={med.name}
                        onChange={(e) => handleUpdateMedication(med.id, 'name', e.target.value)}
                        placeholder="Brand Name & Strength (e.g. Tab. Ace Plus 500mg)"
                        className="w-full p-1.5 text-xs font-semibold bg-white border border-gray-200 rounded-md outline-none"
                      />

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-gray-500 block">Dosage</label>
                          <input
                            type="text"
                            disabled={!isDoctor}
                            value={med.dosage}
                            onChange={(e) => handleUpdateMedication(med.id, 'dosage', e.target.value)}
                            placeholder="1+0+1"
                            className="w-full p-1 text-[11px] font-mono bg-white border border-gray-200 rounded-md outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 block">Duration</label>
                          <input
                            type="text"
                            disabled={!isDoctor}
                            value={med.duration}
                            onChange={(e) => handleUpdateMedication(med.id, 'duration', e.target.value)}
                            placeholder="5 Days"
                            className="w-full p-1 text-[11px] bg-white border border-gray-200 rounded-md outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 block">Timing</label>
                          <input
                            type="text"
                            disabled={!isDoctor}
                            value={med.instruction}
                            onChange={(e) => handleUpdateMedication(med.id, 'instruction', e.target.value)}
                            placeholder="After meal"
                            className="w-full p-1 text-[11px] bg-white border border-gray-200 rounded-md outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advice */}
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">Doctor's Advice & Investigation</label>
                <textarea
                  rows={2}
                  disabled={!isDoctor}
                  value={adviceNotes}
                  onChange={(e) => setAdviceNotes(e.target.value)}
                  placeholder="Rest, hydration, CBC test if fever persists after 3 days..."
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none"
                />
              </div>
            </div>
          )}

          {/* Chat Content */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col justify-between p-4 overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {webrtc.chat.length === 0 && (
                  <p className="text-center text-[11px] text-gray-400 italic my-4">
                    Encrypted chat will appear here once both parties connect.
                  </p>
                )}
                {webrtc.chat.map((msg, i) => {
                  const isSelf = webrtc.selfPeerId ? msg.fromPeerId === webrtc.selfPeerId : msg.fromName === (user?.name || '');
                  const time = new Date(msg.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div
                      key={i}
                      className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`max-w-[80%] rounded-xl p-2.5 text-xs ${
                        isSelf
                          ? 'bg-[#34C759] text-white rounded-br-none'
                          : 'bg-gray-100  rounded-bl-none'
                      }`}>
                        <div className="flex justify-between gap-2 text-[10px] opacity-75 mb-0.5">
                          <span className="font-semibold">{msg.fromName}</span>
                          <span>{time}</span>
                        </div>
                        <p>{msg.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleSendChat} className="pt-3 border-t border-gray-100 flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={webrtc.signalingState === 'connected' ? 'Type a message...' : 'Connecting to room...'}
                  disabled={webrtc.signalingState !== 'connected'}
                  className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#34C759] disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={webrtc.signalingState !== 'connected'}
                  className="p-2 bg-[#34C759] text-white rounded-xl hover:bg-[#2fb34f] transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Completion Modal with Escrow Released Notice */}
      {isCompletedModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn ">
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 bg-[#34C759]/10 text-[#34C759] rounded-full flex items-center justify-center mx-auto ring-8 ring-[#34C759]/5">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#34C759]">Consultation Concluded</span>
              <h3 className="text-xl font-bold  mt-1">Session Complete & Escrow Released!</h3>
              <p className="text-xs text-gray-500 mt-1">
                Duration: {formatTimer(elapsedSeconds)} • Official Prescription Saved to Patient Record
              </p>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-900 text-left space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-[#34C759]" />
                Escrow Settlement Complete
              </div>
              <p className="text-[11px] text-emerald-700">
                Payment has been credited to the provider's verified ledger after 12% platform commission deduction.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  if (onViewPrescription && session) {
                    onViewPrescription(session);
                  } else {
                    onExit();
                  }
                }}
                className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                View / Print Rx
              </button>
              <button
                onClick={onExit}
                className="flex-1 py-2.5 px-4 bg-[#34C759] hover:bg-[#2fb34f] text-white font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Internal sub-components for the live video stage.
// ---------------------------------------------------------------------------

interface RemoteVideoPanelProps {
  remotePeers: { peerId: string; role: 'DOCTOR' | 'PATIENT'; name: string; stream: MediaStream | null; audioEnabled: boolean; videoEnabled: boolean; connectionState: RTCPeerConnectionState }[];
  isDoctor: boolean;
  doctorName?: string;
  userName?: string;
  connectionState: string;
  errorMessage: string | null;
}

const RemoteVideoPanel: React.FC<RemoteVideoPanelProps> = ({
  remotePeers,
  isDoctor,
  doctorName,
  userName,
  connectionState,
  errorMessage
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const peer = remotePeers[0];

  useEffect(() => {
    if (videoRef.current && peer?.stream) {
      if (videoRef.current.srcObject !== peer.stream) {
        videoRef.current.srcObject = peer.stream;
      }
    }
  }, [peer?.stream]);

  if (errorMessage) {
    return (
      <div className="flex flex-col items-center justify-center text-center px-6 space-y-2">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-sm font-semibold text-red-300">{errorMessage}</p>
        <p className="text-xs text-gray-400">Check that your camera & microphone permissions are allowed.</p>
      </div>
    );
  }

  if (!peer) {
    return (
      <div className="flex flex-col items-center justify-center text-center px-6 space-y-2">
        <Loader2 className="w-10 h-10 text-[#34C759] animate-spin" />
        <p className="text-sm font-semibold text-gray-200">
          {connectionState === 'waiting-peer' ? 'Waiting for the other party to join…' : 'Establishing secure connection…'}
        </p>
        <p className="text-xs text-gray-400">Share the consultation link or invite the patient from the dashboard.</p>
      </div>
    );
  }

  const displayName = peer.name || (isDoctor ? userName || 'Patient' : doctorName || 'Doctor');

  return (
    <div className="relative w-full h-full">
      {peer.stream && peer.videoEnabled ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover bg-black"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900">
          <div className="w-32 h-32 rounded-full bg-gray-800 flex items-center justify-center">
            <User className="w-16 h-16 text-gray-500" />
          </div>
          <p className="mt-3 text-sm font-semibold text-gray-200">{displayName}</p>
          <p className="text-xs text-gray-500 mt-1">Camera off</p>
        </div>
      )}

      <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-700">
        <div className={`w-2 h-2 rounded-full ${
          peer.connectionState === 'connected' ? 'bg-[#34C759] animate-pulse' : 'bg-amber-400'
        }`} />
        <span className="text-[11px] font-semibold text-white">{displayName}</span>
        {!peer.audioEnabled && <MicOff className="w-3 h-3 text-red-400 ml-1" />}
      </div>
    </div>
  );
};

interface LocalPreviewTileProps {
  localStream: MediaStream | null;
  cameraEnabled: boolean;
  micEnabled: boolean;
  avatarUrl?: string;
}

const LocalPreviewTile: React.FC<LocalPreviewTileProps> = ({ localStream, cameraEnabled, micEnabled, avatarUrl }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    if (videoRef.current && localStream && videoRef.current.srcObject !== localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  return (
    <div className="absolute bottom-4 right-4 w-36 h-28 sm:w-48 sm:h-36 bg-gray-800 rounded-xl border-2 border-gray-700 overflow-hidden shadow-2xl flex items-center justify-center">
      {localStream && cameraEnabled ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!micEnabled && (
            <div className="absolute top-1 right-1 p-1 bg-red-600 rounded-full">
              <MicOff className="w-3 h-3 text-white" />
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center text-gray-400">
          {localStream && !cameraEnabled ? (
            <>
              <img
                src={avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80'}
                alt="You"
                className="w-12 h-12 rounded-full object-cover mb-1 ring-2 ring-white"
              />
              <span className="text-[10px] font-semibold text-gray-300">Camera Off</span>
            </>
          ) : (
            <>
              <VideoOff className="w-6 h-6 mb-1" />
              <span className="text-[10px]">Acquiring camera…</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const ConnectionBadge: React.FC<{ state: string; signalingState: string }> = ({ state, signalingState }) => {
  if (state === 'connected') {
    return (
      <span className="bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1 text-[10px]">
        <Wifi className="w-3 h-3" /> Live
      </span>
    );
  }
  if (state === 'reconnecting' || signalingState === 'reconnecting') {
    return (
      <span className="bg-amber-500/20 text-amber-200 font-semibold px-2 py-1 rounded-full border border-amber-500/30 flex items-center gap-1 text-[10px]">
        <RefreshCw className="w-3 h-3 animate-spin" /> Reconnecting
      </span>
    );
  }
  if (state === 'failed') {
    return (
      <span className="bg-red-500/20 text-red-200 font-semibold px-2 py-1 rounded-full border border-red-500/30 flex items-center gap-1 text-[10px]">
        <WifiOff className="w-3 h-3" /> Connection failed
      </span>
    );
  }
  return (
    <span className="bg-blue-500/20 text-blue-200 font-semibold px-2 py-1 rounded-full border border-blue-500/30 flex items-center gap-1 text-[10px]">
      <Loader2 className="w-3 h-3 animate-spin" /> Connecting
    </span>
  );
};
