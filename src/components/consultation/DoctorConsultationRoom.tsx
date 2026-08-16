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
  AlertCircle
} from 'lucide-react';
import { ConsultationSession, PrescriptionMedication } from '../../types';
import { ApiService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { DateTimeValue } from '../common/DateTimeValue';

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
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [activeTab, setActiveTab] = useState<'rx' | 'chat'>('rx');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

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

  // Chat State
  const [chatMessages, setChatMessages] = useState<{ sender: string; text: string; time: string }[]>([
    { sender: 'System', text: 'Secure WebRTC end-to-end encrypted room connected.', time: '18:00' },
    { sender: 'Dr. Rahim', text: 'Hello! I can see you clearly. How have you been feeling?', time: '18:01' }
  ]);
  const [chatInput, setChatInput] = useState('');

  const [isEnding, setIsEnding] = useState(false);
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);

  const isDoctor = activeRole === 'EXPERT' || (user && user.roles.includes('EXPERT'));

  useEffect(() => {
    const loadSession = async () => {
      const role = isDoctor ? 'DOCTOR' : 'PATIENT';
      const s = await ApiService.joinConsultation(consultationId, role);
      setSession(s);
      setLoading(false);
    };
    loadSession();
  }, [consultationId, isDoctor]);

  // Live timer ticker
  useEffect(() => {
    if (!session || session.sessionStatus === 'completed') return;
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [session]);

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
    const newMsg = {
      sender: user ? user.name : (isDoctor ? 'Doctor' : 'Patient'),
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, newMsg]);
    setChatInput('');
  };

  const handleEndConsultation = async () => {
    setIsEnding(true);
    const summary = `Chief Complaints: ${chiefComplaints}\nDiagnosis: ${diagnosis || 'Upper Respiratory Tract Infection'}\nAdvice: ${adviceNotes}`;
    const rxJson = JSON.stringify(medications);

    const completed = await ApiService.endConsultation(consultationId, rxJson, summary);
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
            {/* Visual Simulated Stream Avatar / Background */}
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              <div className="relative">
                <img
                  src={isDoctor 
                    ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80" 
                    : "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800&auto=format&fit=crop&q=80"}
                  alt="Remote participant"
                  className="w-40 h-40 sm:w-56 sm:h-56 rounded-full object-cover ring-4 ring-[#34C759]/40 shadow-2xl animate-pulse"
                />
                <div className="absolute bottom-2 right-2 p-2 bg-[#34C759] text-white rounded-full shadow-lg">
                  <Stethoscope className="w-5 h-5" />
                </div>
              </div>
              <p className="mt-4 text-sm font-semibold text-gray-200">
                {isDoctor ? session?.userName : session?.doctorName} (HD 1080p Stream)
              </p>
              <span className="text-xs text-emerald-400 font-mono mt-1">Audio/Video Stream Active • Latency 14ms</span>
            </div>

            {/* Picture-in-Picture Local Stream (Self) */}
            <div className="absolute bottom-4 right-4 w-36 h-28 sm:w-48 sm:h-36 bg-gray-800 rounded-xl border-2 border-gray-700 overflow-hidden shadow-2xl flex items-center justify-center">
              {isVideoOn ? (
                <div className="w-full h-full bg-gray-700 flex flex-col items-center justify-center p-2 relative">
                  <img
                    src={user?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80"}
                    alt="You"
                    className="w-12 h-12 rounded-full object-cover mb-1 ring-2 ring-white"
                  />
                  <span className="text-[10px] font-semibold text-gray-300">You (Camera On)</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400">
                  <VideoOff className="w-6 h-6 mb-1" />
                  <span className="text-[10px]">Camera Paused</span>
                </div>
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
              onClick={() => setIsMicOn(!isMicOn)}
              className={`p-3.5 rounded-full transition-all cursor-pointer shadow-lg ${
                isMicOn ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-red-600 text-white ring-4 ring-red-600/30'
              }`}
              title={isMicOn ? 'Mute Mic' : 'Unmute Mic'}
            >
              {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setIsVideoOn(!isVideoOn)}
              className={`p-3.5 rounded-full transition-all cursor-pointer shadow-lg ${
                isVideoOn ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-red-600 text-white ring-4 ring-red-600/30'
              }`}
              title={isVideoOn ? 'Turn Off Camera' : 'Turn On Camera'}
            >
              {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
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
        <div className="w-full lg:w-[480px] bg-white text-gray-900 border-l border-gray-200 flex flex-col h-[50vh] lg:h-full overflow-hidden">
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
                Room Chat ({chatMessages.length})
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
                    <h4 className="text-sm font-bold text-gray-900">{session?.doctorName || 'Dr. Rahim Ahmed'}</h4>
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
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${msg.sender === 'System' ? 'items-center' : msg.sender === (user?.name || 'You') ? 'items-end' : 'items-start'}`}
                  >
                    {msg.sender === 'System' ? (
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full my-1">
                        {msg.text}
                      </span>
                    ) : (
                      <div className={`max-w-[80%] rounded-xl p-2.5 text-xs ${
                        msg.sender === (user?.name || 'You') 
                          ? 'bg-[#34C759] text-white rounded-br-none' 
                          : 'bg-gray-100 text-gray-900 rounded-bl-none'
                      }`}>
                        <div className="flex justify-between gap-2 text-[10px] opacity-75 mb-0.5">
                          <span className="font-semibold">{msg.sender}</span>
                          <span>{msg.time}</span>
                        </div>
                        <p>{msg.text}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendChat} className="pt-3 border-t border-gray-100 flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#34C759]"
                />
                <button
                  type="submit"
                  className="p-2 bg-[#34C759] text-white rounded-xl hover:bg-[#2fb34f] transition-colors"
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
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn text-gray-900">
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 bg-[#34C759]/10 text-[#34C759] rounded-full flex items-center justify-center mx-auto ring-8 ring-[#34C759]/5">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#34C759]">Consultation Concluded</span>
              <h3 className="text-xl font-bold text-gray-900 mt-1">Session Complete & Escrow Released!</h3>
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
