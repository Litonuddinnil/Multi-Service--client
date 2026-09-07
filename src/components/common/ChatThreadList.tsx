import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Loader2, MessageCircle, Search, Send } from 'lucide-react';
import { ApiService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from './Toast';
import type { ChatThread, MessageItem } from '../../types';

/**
 * Two-pane chat surface for persistent (pre/post session) messaging.
 *
 * Left column: thread list filtered by participant id, with unread
 * badges and the most-recent message preview.
 *
 * Right column: conversation window with message history, mark-read
 * on open, and a send box. Auto-scrolls to the newest message and
 * polls every 8 s for new inbound messages so both parties see fresh
 * activity without a websocket.
 *
 * Roles:
 *   - "customer" — only threads where customerId === current user
 *   - "expert"   — only threads where expertId === current expert
 */
export interface ChatThreadListProps {
  role: 'customer' | 'expert';
  /** Optional thread to preselect (e.g. deep-link from expert detail page). */
  initialThreadId?: string;
  /** Optional handler when a thread is selected (e.g. open in mobile drawer). */
  onSelect?: (threadId: string) => void;
}

const POLL_INTERVAL_MS = 8000;

export const ChatThreadList: React.FC<ChatThreadListProps> = ({
  role,
  initialThreadId,
  onSelect,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const participantId =
    role === 'customer' ? user?.id ?? 'user-cust-1' : 'exp-doc-1';

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeThreadId, setActiveThreadId] = useState<string | null>(
    initialThreadId ?? null,
  );
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const loadThreads = useCallback(async () => {
    try {
      const data = await ApiService.fetchThreads(
        role === 'customer'
          ? { customerId: participantId }
          : { expertId: participantId },
      );
      setThreads(data);
    } finally {
      setLoading(false);
    }
  }, [participantId, role]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  // Background refresh every 8s so unread badges + new messages surface
  useEffect(() => {
    const id = window.setInterval(() => {
      loadThreads();
      if (activeThreadId) {
        ApiService.fetchMessages(activeThreadId).then(setMessages).catch(() => {});
      }
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [loadThreads, activeThreadId]);

  const filteredThreads = useMemo(() => {
    if (!search) return threads;
    const q = search.toLowerCase();
    return threads.filter(
      t =>
        t.entityTitle.toLowerCase().includes(q) ||
        (role === 'customer' ? t.expertName : t.customerName).toLowerCase().includes(q) ||
        t.lastMessageText.toLowerCase().includes(q),
    );
  }, [threads, search, role]);

  // When the active thread id changes, fetch its messages + mark-read
  useEffect(() => {
    if (!activeThreadId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setLoadingMessages(true);
    ApiService.fetchMessages(activeThreadId)
      .then(msgs => {
        if (cancelled) return;
        setMessages(msgs);
        const me = role === 'customer' ? 'CUSTOMER' : 'EXPERT';
        ApiService.markThreadRead(activeThreadId, me).then(res => {
          if (cancelled || !res.thread) return;
          setThreads(prev =>
            prev.map(t =>
              t.id === res.thread!.id ? { ...t, ...res.thread! } : t,
            ),
          );
        });
      })
      .finally(() => {
        if (!cancelled) setLoadingMessages(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeThreadId, role]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  const activeThread = threads.find(t => t.id === activeThreadId);

  const unreadTotal = useMemo(() => {
    const key = role === 'customer' ? 'unreadCountCustomer' : 'unreadCountExpert';
    return threads.reduce((acc, t) => acc + (t[key] ?? 0), 0);
  }, [threads, role]);

  const handleSelect = (id: string) => {
    setActiveThreadId(id);
    onSelect?.(id);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !activeThread || !user) return;
    setSending(true);
    const me = role === 'customer' ? 'CUSTOMER' : 'EXPERT';
    try {
      const msg = await ApiService.sendMessage({
        threadId: activeThread.id,
        senderId: user.id,
        senderName: user.name,
        senderRole: me,
        senderAvatar: user.avatarUrl || '',
        text,
      });
      setMessages(prev => [...prev, msg]);
      setDraft('');
      // Refresh thread summary (lastMessageText + unread for the other side)
      loadThreads();
    } catch (err: any) {
      showToast(err?.message || 'Failed to send message.', 'error');
    } finally {
      setSending(false);
    }
  };

  const myName = user?.name ?? (role === 'customer' ? 'You' : 'Expert');
  const theirName = role === 'customer'
    ? activeThread?.expertName
    : activeThread?.customerName;
  const theirAvatar = role === 'customer'
    ? activeThread?.expertAvatar
    : activeThread?.customerAvatar;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 lg:gap-6 min-h-[520px]">
      {/* Thread list */}
      <aside
        className={`bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden flex flex-col ${
          activeThreadId ? 'hidden lg:flex' : 'flex'
        }`}
      >
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold ">Messages</h3>
            {unreadTotal > 0 && (
              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black">
                {unreadTotal} new
              </span>
            )}
          </div>
        </div>
        <div className="px-3 py-2 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations"
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-2" aria-busy="true">
              {[0, 1, 2].map(i => (
                <div key={i} className="h-14 bg-gray-50 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-400">
              No conversations yet.
            </div>
          ) : (
            filteredThreads.map(t => {
              const isActive = t.id === activeThreadId;
              const otherName = role === 'customer' ? t.expertName : t.customerName;
              const otherAvatar = role === 'customer' ? t.expertAvatar : t.customerAvatar;
              const unread = role === 'customer' ? t.unreadCountCustomer : t.unreadCountExpert;
              return (
                <button
                  key={t.id}
                  onClick={() => handleSelect(t.id)}
                  className={`w-full text-left px-3 py-3 border-b border-gray-50 hover:bg-emerald-50/40 transition flex items-start gap-3 ${
                    isActive ? 'bg-emerald-50/60' : ''
                  }`}
                >
                  <img
                    src={
                      otherAvatar ||
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80'
                    }
                    alt={otherName}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs  truncate">{otherName}</span>
                      {unread > 0 && (
                        <span className="px-1.5 py-0.5 bg-emerald-600 text-white text-[10px] font-black rounded-full shrink-0">
                          {unread}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 truncate mt-0.5">{t.entityTitle}</p>
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">{t.lastMessageText || 'No messages yet.'}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Conversation window */}
      <section
        className={`bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden flex flex-col min-h-[520px] ${
          activeThreadId ? 'flex' : 'hidden lg:flex'
        }`}
      >
        {!activeThread ? (
          <div className="flex-1 flex items-center justify-center text-center text-xs text-gray-400 p-8">
            Select a conversation from the left to read or reply.
          </div>
        ) : (
          <>
            <header className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 bg-gradient-to-r from-emerald-50/60 to-white">
              <button
                onClick={() => setActiveThreadId(null)}
                className="lg:hidden p-1 text-gray-500 hover:"
                aria-label="Back to thread list"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <img
                src={
                  theirAvatar ||
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80'
                }
                alt={theirName}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold  truncate">{theirName}</h4>
                <p className="text-[11px] text-gray-500 truncate">{activeThread.entityTitle}</p>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded-full text-[10px] font-bold text-gray-500 uppercase">
                {activeThread.entityType}
              </span>
            </header>

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gradient-to-b from-white to-emerald-50/20"
            >
              {loadingMessages ? (
                <div className="flex justify-center py-12 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-xs text-gray-400 py-12">
                  No messages yet. Send the first one to start the conversation.
                </div>
              ) : (
                messages.map(m => {
                  const mine = m.senderName === myName;
                  return (
                    <div
                      key={m.id}
                      className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}
                    >
                      {!mine && (
                        <img
                          src={
                            m.senderAvatar ||
                            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80'
                          }
                          alt={m.senderName}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                      )}
                      <div
                        className={`max-w-[78%] sm:max-w-[60%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                          mine
                            ? 'bg-emerald-600 text-white rounded-br-sm'
                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                        }`}
                      >
                        {!mine && (
                          <div className="text-[10px] font-bold text-gray-500 mb-0.5">
                            {m.senderName}
                          </div>
                        )}
                        <p className="whitespace-pre-line">{m.text}</p>
                        <div
                          className={`text-[10px] mt-1 ${
                            mine ? 'text-emerald-100' : 'text-gray-400'
                          }`}
                        >
                          {new Date(m.createdAt).toLocaleString()}
                          {mine && (m.isRead ? ' · Read' : ' · Sent')}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form
              onSubmit={handleSend}
              className="px-3 py-3 border-t border-gray-100 flex items-end gap-2"
            >
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                rows={1}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e as unknown as React.FormEvent);
                  }
                }}
                placeholder="Type a message…"
                className="flex-1 resize-none px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 max-h-32"
              />
              <button
                type="submit"
                disabled={!draft.trim() || sending}
                className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white flex items-center justify-center shadow-sm cursor-pointer"
                aria-label="Send message"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
};

export default ChatThreadList;