'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Loader2, Inbox, RefreshCw } from 'lucide-react';
import { useScrollLock } from '@/hooks/useScrollLock';
import { Outfit } from 'next/font/google';
import { useAuth } from '@yukizi/api-client';
import {
  useTickets,
  useTicketById,
  useCreateTicket,
  useAddTicketMessage,
  useCloseTicket,
} from '@/hooks/useTickets';

const outfit = Outfit({ subsets: ['latin'] });

interface SupportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

function statusLabel(status?: string) {
  const key = (status || '').toUpperCase();
  return STATUS_LABEL[key] ?? 'Open';
}

function isLive(status?: string) {
  const key = (status || '').toUpperCase();
  return key === 'OPEN' || key === 'IN_PROGRESS';
}

function formatTime(iso?: string) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return '';
  }
}

// The API returns messages with `sender` as a relation ({ id, role }). Older
// payloads used a plain string, so both are accepted here.
function isFromSupport(msg: any) {
  const sender = msg?.sender;
  if (!sender) return false;
  if (typeof sender === 'string') return sender.toUpperCase() === 'ADMIN' || sender.toUpperCase() === 'SUPPORT';
  return sender?.role === 'ADMIN';
}

export default function SupportDrawer({ isOpen, onClose }: SupportDrawerProps) {
  const [screen, setScreen] = useState<'list' | 'new' | 'thread'>('list');
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [formError, setFormError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useScrollLock(isOpen);
  const { isAuthenticated } = useAuth();

  const ticketsQuery = useTickets(undefined, { enabled: isOpen && !!isAuthenticated });
  const tickets: any[] = (ticketsQuery.data as any)?.data ?? [];

  const threadQuery = useTicketById(activeTicketId ?? '');
  const ticket: any = threadQuery.data;
  const messages: any[] = ticket?.messages ?? [];

  const createTicket = useCreateTicket();
  const addMessage = useAddTicketMessage();
  const closeTicket = useCloseTicket();

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, screen]);

  const resetToList = () => {
    setScreen('list');
    setActiveTicketId(null);
    setSubject('');
    setFirstMessage('');
    setChatInput('');
    setFormError('');
  };

  const handleClose = () => {
    resetToList();
    onClose();
  };

  const openThread = (id: string) => {
    setActiveTicketId(id);
    setChatInput('');
    setScreen('thread');
  };

  const handleSignIn = () => {
    onClose();
    window.dispatchEvent(new CustomEvent('open-login'));
  };

  const handleCreateTicket = () => {
    const s = subject.trim();
    const m = firstMessage.trim();
    if (!s || !m) {
      setFormError('Add a subject and a message so the team knows what to help with.');
      return;
    }
    setFormError('');
    createTicket.mutate(
      { subject: s, message: m },
      {
        onSuccess: (created: any) => {
          setSubject('');
          setFirstMessage('');
          if (created?.id) {
            openThread(created.id);
          } else {
            setScreen('list');
          }
        },
        onError: () => setFormError('Could not create the ticket. Please try again.'),
      },
    );
  };

  const handleSendMessage = () => {
    const text = chatInput.trim();
    if (!text || !activeTicketId || addMessage.isPending) return;
    addMessage.mutate(
      { ticketId: activeTicketId, message: text },
      { onSuccess: () => setChatInput('') },
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="support-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 z-[100]"
          />

          {/* Drawer Panel */}
          <motion.div
            key="support-drawer-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
 className={`fixed top-0 right-0 h-full w-[92%] sm:w-[500px] md:w-[520px] max-w-full glass-overlay z-[110] flex flex-col overflow-hidden rounded-l-3xl ${outfit.className}`}
          >
            {/* ── Signed out ─────────────────────────────── */}
            {!isAuthenticated && (
              <div className="flex-1 flex flex-col h-full">
                <div className="flex justify-between items-center px-6 pt-6 pb-2">
                  <h2 className="text-2xl font-bold text-gray-900">Customer Support</h2>
                  <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4">
                  <p className="text-base font-medium text-gray-800">Sign in to contact support</p>
                  <p className="text-sm text-gray-400 max-w-[280px]">
                    Your tickets are tied to your account so our team can reply to you.
                  </p>
                  <button
                    onClick={handleSignIn}
                    className="mt-2 px-6 py-3 bg-[#8C52FF] hover:bg-[#7b46e0] text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
                  >
                    Sign in
                  </button>
                </div>
              </div>
            )}

            {/* ── Screen 1: ticket list ──────────────────── */}
            {isAuthenticated && screen === 'list' && (
              <div className="flex-1 flex flex-col h-full relative">
                <div className="flex justify-between items-center px-6 pt-6 pb-2">
                  <h2 className="text-2xl font-bold text-gray-900">Customer Support</h2>
                  <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="px-6 py-4 flex-1 overflow-y-auto">
                  {ticketsQuery.isLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-[#7B2FBE] animate-spin" />
                    </div>
                  ) : ticketsQuery.isError ? (
                    <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
                      <p className="text-sm font-medium text-gray-700">Could not load your tickets</p>
                      <button
                        onClick={() => ticketsQuery.refetch()}
                        className="text-sm font-bold text-[#7B2FBE] hover:underline"
                      >
                        Try again
                      </button>
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
                      <Inbox className="w-10 h-10 text-gray-200" />
                      <p className="text-sm font-medium text-gray-700">No tickets yet</p>
                      <p className="text-sm text-gray-400 max-w-[260px]">
                        Start a ticket and our team will reply here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {tickets.map((t: any) => (
                        <div
                          key={t.id}
                          onClick={() => openThread(t.id)}
                          className="flex justify-between items-center py-4 border-b border-gray-100 group transition-all cursor-pointer hover:bg-gray-50/50 px-2 -mx-2 rounded-xl"
                        >
                          <div className="min-w-0 pr-3">
                            <span className="block text-base font-medium text-gray-800 truncate">
                              {t.subject}
                            </span>
                            {t.description && (
                              <span className="block text-xs text-gray-400 truncate mt-0.5">
                                {t.description}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {isLive(t.status) ? (
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-green-500 rounded-full" />
                                <span className="text-xs font-bold text-green-600">{statusLabel(t.status)}</span>
                              </div>
                            ) : (
                              <span className="text-xs font-semibold text-gray-400">{statusLabel(t.status)}</span>
                            )}
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pb-16 pt-4 flex justify-center bg-white shrink-0">
                  <button
                    onClick={() => {
                      setFormError('');
                      setScreen('new');
                    }}
                    className="px-6 py-3 bg-[#8C52FF] hover:bg-[#7b46e0] text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-[0.98] w-[80%] max-w-[280px]"
                  >
                    New Support Ticket
                  </button>
                </div>
              </div>
            )}

            {/* ── Screen 2: new ticket ───────────────────── */}
            {isAuthenticated && screen === 'new' && (
              <div className="flex-1 flex flex-col h-full relative">
                <div className="flex justify-between items-center px-6 pt-6 pb-2 border-b border-gray-50 shadow-sm shrink-0">
                  <button
                    onClick={() => setScreen('list')}
                    className="w-8 h-8 rounded-full bg-[#b59fe6]/30 flex items-center justify-center hover:bg-[#b59fe6]/40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-[#7B2FBE]" strokeWidth={2.5} />
                  </button>
                  <div className="text-center flex-1">
                    <h3 className="text-sm font-bold text-gray-900">New Support Ticket</h3>
                    <p className="text-2xs text-gray-400">Our team will reply here</p>
                  </div>
                  <span className="w-8" />
                </div>

                <div className="flex-1 px-6 py-5 overflow-y-auto space-y-5">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                      Subject
                    </label>
                    <input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Brief description of your issue"
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#8C52FF]/40"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                      Message
                    </label>
                    <textarea
                      value={firstMessage}
                      onChange={(e) => setFirstMessage(e.target.value)}
                      rows={5}
                      placeholder="Tell us what went wrong..."
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#8C52FF]/40 resize-none"
                    />
                  </div>
                  {formError && <p className="text-xs font-medium text-red-500">{formError}</p>}
                </div>

                <div className="pb-16 pt-4 flex justify-center bg-white shrink-0">
                  <button
                    onClick={handleCreateTicket}
                    disabled={createTicket.isPending}
                    className="px-6 py-3 bg-[#8C52FF] hover:bg-[#7b46e0] disabled:opacity-60 text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-[0.98] w-[80%] max-w-[280px] flex items-center justify-center gap-2"
                  >
                    {createTicket.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    {createTicket.isPending ? 'Sending…' : 'Send to support'}
                  </button>
                </div>
              </div>
            )}

            {/* ── Screen 3: ticket thread ────────────────── */}
            {isAuthenticated && screen === 'thread' && (
              <div className="flex-1 flex flex-col h-full relative">
                <div className="flex justify-between items-center px-6 pt-6 pb-2 border-b border-gray-50 shadow-sm shrink-0 gap-2">
                  <button
                    onClick={resetToList}
                    className="w-8 h-8 rounded-full bg-[#b59fe6]/30 flex items-center justify-center hover:bg-[#b59fe6]/40 transition-colors shrink-0"
                  >
                    <ChevronLeft className="w-4 h-4 text-[#7B2FBE]" strokeWidth={2.5} />
                  </button>
                  <div className="text-center flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 truncate">
                      {ticket?.subject || 'Support'}
                    </h3>
                    <p className="text-2xs text-gray-400">
                      {ticket ? statusLabel(ticket.status) : 'Loading…'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {/* Replies land whenever an admin answers, and the query client
                        runs with refetchOnWindowFocus off, so the thread needs an
                        explicit way to pull them in. */}
                    <button
                      onClick={() => threadQuery.refetch()}
                      disabled={threadQuery.isFetching}
                      title="Check for new replies"
                      aria-label="Check for new replies"
                      className="w-8 h-8 rounded-full bg-[#b59fe6]/30 flex items-center justify-center hover:bg-[#b59fe6]/40 transition-colors disabled:opacity-60"
                    >
                      <RefreshCw
                        className={`w-4 h-4 text-[#7B2FBE] ${threadQuery.isFetching ? 'animate-spin' : ''}`}
                        strokeWidth={2.5}
                      />
                    </button>
                    {ticket && isLive(ticket.status) && (
                      <button
                        onClick={() => activeTicketId && closeTicket.mutate(activeTicketId)}
                        disabled={closeTicket.isPending}
                        className="text-red-500 text-xs font-semibold hover:text-red-600 transition-colors disabled:opacity-60"
                      >
                        Close
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 px-6 py-4 overflow-y-auto space-y-4 bg-white">
                  {threadQuery.isLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-[#7B2FBE] animate-spin" />
                    </div>
                  ) : (
                    <>
                      {messages.map((msg: any, idx: number) => {
                        const fromSupport = isFromSupport(msg);
                        return (
                          <div
                            key={msg.id ?? idx}
                            className={`flex items-start gap-3 ${fromSupport ? 'justify-start' : 'justify-end'}`}
                          >
                            {fromSupport && <div className="w-8 h-8 rounded-full bg-[#b59fe6] shrink-0" />}
                            <div className="flex flex-col gap-1 max-w-[75%]">
                              <div
                                className={`rounded-2xl px-4 py-2.5 text-sm font-medium whitespace-pre-line ${
                                  fromSupport
                                    ? 'bg-[#b89fe6] text-white rounded-tl-sm'
                                    : 'bg-[#f4f4f6] text-gray-800 rounded-tr-sm shadow-sm'
                                }`}
                              >
                                {msg.message}
                              </div>
                              <span
                                className={`text-2xs text-gray-400 ${fromSupport ? 'text-left' : 'text-right'}`}
                              >
                                {formatTime(msg.createdAt)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      {messages.length > 0 && !messages.some(isFromSupport) && (
                        <p className="text-center text-xs text-gray-400 pt-2">
                          Sent. Our team will reply here — tap refresh to check.
                        </p>
                      )}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between bg-white shrink-0 gap-3">
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendMessage();
                      }}
                      placeholder="Start typing ..."
                      className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400 w-full"
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={addMessage.isPending || !chatInput.trim()}
                    className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100/50 hover:bg-gray-50/50 transition-colors active:scale-95 shrink-0 disabled:opacity-50"
                  >
                    {addMessage.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#562996]" />
                    ) : (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="#562996"
                        stroke="#562996"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-[#562996] rotate-45 transform"
                      >
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
