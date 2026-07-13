'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Plus, Send } from 'lucide-react';
import { useScrollLock } from '@/hooks/useScrollLock';
import { Outfit } from 'next/font/google';

const outfit = Outfit({ subsets: ['latin'] });

interface SupportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  role: 'agent' | 'user';
  content: string;
  time: string;
}

export default function SupportDrawer({ isOpen, onClose }: SupportDrawerProps) {
  const [activeScreen, setActiveScreen] = useState<'list' | 'connecting' | 'chat'>('list');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [connectingTimer, setConnectingTimer] = useState<NodeJS.Timeout | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useScrollLock(isOpen);

  // Scroll to bottom on message updates
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeScreen, isKeyboardOpen]);

  // Handle connecting screen transition
  useEffect(() => {
    if (activeScreen === 'connecting') {
      const timer = setTimeout(() => {
        setActiveScreen('chat');
        // Initial agent message
        setChatMessages([
          {
            role: 'agent',
            content: 'Hi Yukizi,\nhow can I help you?',
            time: '11:55',
          },
        ]);
      }, 2000);
      setConnectingTimer(timer);
      return () => clearTimeout(timer);
    }
  }, [activeScreen]);

  const handleClose = () => {
    if (connectingTimer) clearTimeout(connectingTimer);
    setActiveScreen('list');
    setChatMessages([]);
    setChatInput('');
    setIsKeyboardOpen(false);
    onClose();
  };

  const startNewChat = () => {
    setChatMessages([]);
    setChatInput('');
    setIsKeyboardOpen(false);
    setActiveScreen('connecting');
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend ?? chatInput).trim();
    if (!text) return;

    // Add user message
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    
    const newMsg: ChatMessage = {
      role: 'user',
      content: text,
      time: timeStr,
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput('');

    // Trigger mock response
    setTimeout(() => {
      let replyContent = "Can you tell me more about your problem? I will try to deeply analyze your request.";
      if (text.toLowerCase().includes('card') || text.toLowerCase().includes('payment')) {
        replyContent = "Can you tell me more about your problem? I will try to deeply analyze your request.";
      } else if (text.toLowerCase().includes('delivery') || text.toLowerCase().includes('ship')) {
        replyContent = "I've checked the status. Let me coordinate with our logistics team to expedite your shipment.";
      } else {
        replyContent = "Thank you for sharing details. Our engineering team is currently investigating this issue for you.";
      }

      setChatMessages((prev) => [
        ...prev,
        {
          role: 'agent',
          content: replyContent,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        },
      ]);
    }, 1500);
  };

  // Keyboard helper
  const handleKeyClick = (key: string) => {
    if (key === 'SPACE') {
      setChatInput((prev) => prev + ' ');
    } else if (key === 'BACKSPACE') {
      setChatInput((prev) => prev.slice(0, -1));
    } else if (key === 'RETURN') {
      handleSendMessage();
    } else if (key === 'SHIFT') {
      setIsShiftActive(!isShiftActive);
    } else {
      const char = isShiftActive ? key.toUpperCase() : key.toLowerCase();
      setChatInput((prev) => prev + char);
      if (isShiftActive) setIsShiftActive(false); // standard keyboard behavior
    }
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
            className={`fixed top-0 right-0 h-full w-[92%] sm:w-[500px] md:w-[520px] max-w-full bg-white shadow-2xl z-[110] flex flex-col overflow-hidden rounded-l-3xl ${outfit.className}`}
          >
            {/* SCREEN 1: TICKETS LIST */}
            {activeScreen === 'list' && (
              <div className="flex-1 flex flex-col h-full bg-white relative">
                {/* Header */}
                <div className="flex justify-between items-center px-6 pt-6 pb-2">
                  <h2 className="text-[22px] font-bold text-gray-900">Customer Support</h2>
                  <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Ticket List */}
                <div className="px-6 py-4 flex-1 overflow-y-auto space-y-4">
                  {[
                    { id: '1', subject: 'Payment Issue', status: 'Live', type: 'live' },
                    { id: '2', subject: 'Delivery Issue', status: 'On Hold', type: 'hold' },
                    { id: '3', subject: 'Payment not received', status: 'Closed', type: 'closed' },
                    { id: '4', subject: 'Shipping problem', status: 'Closed', type: 'closed' },
                  ].map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => ticket.type === 'live' ? setActiveScreen('connecting') : null}
                      className={`flex justify-between items-center py-4 border-b border-gray-100 group transition-all ${
                        ticket.type === 'live' ? 'cursor-pointer hover:bg-gray-50/50 px-2 -mx-2 rounded-xl' : 'opacity-85'
                      }`}
                    >
                      <span className="text-[15px] font-medium text-gray-800">{ticket.subject}</span>
                      <div className="flex items-center gap-2">
                        {ticket.type === 'live' && (
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-xs font-bold text-red-500">Live</span>
                          </div>
                        )}
                        {ticket.type === 'hold' && (
                          <span className="text-xs font-semibold text-gray-500">On Hold</span>
                        )}
                        {ticket.type === 'closed' && (
                          <span className="text-xs font-semibold text-gray-400">Closed</span>
                        )}
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Create New Chat Button - Pinned to bottom */}
                <div className="pb-16 pt-4 flex justify-center bg-white shrink-0">
                  <button
                    onClick={startNewChat}
                    className="px-6 py-3 bg-[#8C52FF] hover:bg-[#7b46e0] text-white text-[14px] font-bold rounded-xl shadow-md transition-all active:scale-[0.98] w-[80%] max-w-[280px]"
                  >
                    New Customer Support Chat
                  </button>
                </div>
              </div>
            )}

            {/* SCREEN 2: CONNECTING STATE */}
            {activeScreen === 'connecting' && (
              <div className="flex-1 flex flex-col h-full bg-white relative">
                {/* Header */}
                <div className="flex justify-between items-center px-6 pt-6 pb-2 border-b border-gray-50 shadow-sm shrink-0">
                  <button
                    onClick={() => setActiveScreen('list')}
                    className="w-8 h-8 rounded-full bg-[#b59fe6]/30 flex items-center justify-center hover:bg-[#b59fe6]/40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-[#7B2FBE]" strokeWidth={2.5} />
                  </button>
                  <div className="text-center flex-1">
                    <h3 className="text-sm font-bold text-gray-900">Live Chat</h3>
                    <p className="text-[10px] text-gray-400">Connecting to an agent ..</p>
                  </div>
                  <button
                    onClick={() => setActiveScreen('list')}
                    className="text-red-500 text-xs font-semibold hover:text-red-600 transition-colors"
                  >
                    End Chat
                  </button>
                </div>

                {/* Connecting Chat Area */}
                <div className="flex-1 px-6 py-4 overflow-y-auto bg-white">
                  <div className="flex items-start gap-3 mt-4">
                    <div className="w-8 h-8 rounded-full bg-[#b59fe6] shrink-0" />
                    <div className="bg-[#b59fe6]/20 text-[#7B2FBE] rounded-2xl rounded-tl-sm px-4 py-2 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-[#7B2FBE] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-[#7B2FBE] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-[#7B2FBE] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN 3: ACTIVE CHAT */}
            {activeScreen === 'chat' && (
              <div className="flex-1 flex flex-col h-full bg-white relative">
                {/* Header */}
                <div className="flex justify-between items-center px-6 pt-6 pb-2 border-b border-gray-50 shadow-sm shrink-0">
                  <button
                    onClick={() => {
                      setActiveScreen('list');
                      setIsKeyboardOpen(false);
                    }}
                    className="w-8 h-8 rounded-full bg-[#b59fe6]/30 flex items-center justify-center hover:bg-[#b59fe6]/40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-[#7B2FBE]" strokeWidth={2.5} />
                  </button>
                  <div className="text-center flex-1">
                    <h3 className="text-sm font-bold text-gray-900">Live Chat</h3>
                    <p className="text-[10px] text-gray-400 font-medium">Today</p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveScreen('list');
                      setIsKeyboardOpen(false);
                    }}
                    className="text-red-500 text-xs font-semibold hover:text-red-600 transition-colors"
                  >
                    End Chat
                  </button>
                </div>

                {/* Active Chat Messages */}
                <div className="flex-1 px-6 py-4 overflow-y-auto space-y-4 flex flex-col justify-end bg-white">
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'agent' && (
                          <div className="w-8 h-8 rounded-full bg-[#b59fe6] shrink-0" />
                        )}
                        <div className="flex flex-col gap-1 max-w-[75%]">
                          <div
                            className={`rounded-2xl px-4 py-2.5 text-sm font-medium whitespace-pre-line ${
                              msg.role === 'agent'
                                ? 'bg-[#b89fe6] text-white rounded-tl-sm'
                                : 'bg-[#f4f4f6] text-gray-800 rounded-tr-sm shadow-sm'
                            }`}
                          >
                            {msg.content}
                          </div>
                          <span className={`text-[9px] text-gray-400 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                            {msg.time}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Input Area */}
                <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between bg-white shrink-0 gap-3">
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5">
                    <input
                      type="text"
                      value={chatInput}
                      onFocus={() => setIsKeyboardOpen(true)}
                      onClick={() => setIsKeyboardOpen(true)}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendMessage();
                      }}
                      placeholder="Start typing ..."
                      className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400 w-full"
                    />
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button className="text-gray-700 hover:text-gray-900 transition-colors p-1">
                      <Plus className="w-5.5 h-5.5 stroke-[2.5]" />
                    </button>
                    <button
                      onClick={() => handleSendMessage()}
                      className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100/50 hover:bg-gray-50/50 transition-colors active:scale-95 shrink-0"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#562996" stroke="#562996" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-[#562996] rotate-45 transform">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Keyboard Simulator (Framer Motion Slide-Up Animation) */}
                <AnimatePresence>
                  {isKeyboardOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                      className="overflow-hidden bg-[#181818] shrink-0 border-t border-black pb-2"
                    >
                      <KeyboardSimulator onKeyClick={handleKeyClick} isShiftActive={isShiftActive} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Keyboard Simulator Component (Matches style of 2nd screenshot)
function KeyboardSimulator({
  onKeyClick,
  isShiftActive,
}: {
  onKeyClick: (key: string) => void;
  isShiftActive: boolean;
}) {
  const row1 = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
  const row2 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];
  const row3 = ['Z', 'X', 'C', 'V', 'B', 'N', 'M'];

  return (
    <div className="w-full bg-[#181818] p-1.5 flex flex-col gap-1.5 select-none shrink-0 pb-4 pt-2">
      {/* Row 1 */}
      <div className="flex justify-between gap-1 w-full">
        {row1.map((k) => (
          <button
            key={k}
            onClick={() => onKeyClick(k)}
            className="flex-1 h-9 bg-[#383838] hover:bg-[#484848] active:bg-[#585858] text-white text-[15px] font-medium rounded-lg flex items-center justify-center transition-colors shadow-sm max-w-[34px]"
          >
            {isShiftActive ? k.toUpperCase() : k.toLowerCase()}
          </button>
        ))}
      </div>

      {/* Row 2 (Narrower, centered) */}
      <div className="flex justify-center gap-1.5 w-full px-[5%]">
        {row2.map((k) => (
          <button
            key={k}
            onClick={() => onKeyClick(k)}
            className="flex-1 h-9 bg-[#383838] hover:bg-[#484848] active:bg-[#585858] text-white text-[15px] font-medium rounded-lg flex items-center justify-center transition-colors shadow-sm max-w-[34px]"
          >
            {isShiftActive ? k.toUpperCase() : k.toLowerCase()}
          </button>
        ))}
      </div>

      {/* Row 3 */}
      <div className="flex justify-between items-center gap-1.5 w-full">
        {/* Shift Key */}
        <button
          onClick={() => onKeyClick('SHIFT')}
          className={`flex-[1.2] h-9 rounded-lg flex items-center justify-center transition-colors shadow-sm shrink-0 min-w-[38px] ${
            isShiftActive ? 'bg-white text-black' : 'bg-[#242425] text-white hover:bg-[#343435]'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L3 11h6v9h6v-9h6L12 2z" />
          </svg>
        </button>

        {/* Letters */}
        {row3.map((k) => (
          <button
            key={k}
            onClick={() => onKeyClick(k)}
            className="flex-1 h-9 bg-[#383838] hover:bg-[#484848] active:bg-[#585858] text-white text-[15px] font-medium rounded-lg flex items-center justify-center transition-colors shadow-sm max-w-[34px]"
          >
            {isShiftActive ? k.toUpperCase() : k.toLowerCase()}
          </button>
        ))}

        {/* Backspace Key */}
        <button
          onClick={() => onKeyClick('BACKSPACE')}
          className="flex-[1.2] h-9 bg-[#242425] hover:bg-[#343435] text-white rounded-lg flex items-center justify-center transition-colors shadow-sm shrink-0 min-w-[38px]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
            <line x1="18" y1="9" x2="12" y2="15" />
            <line x1="12" y1="9" x2="18" y2="15" />
          </svg>
        </button>
      </div>

      {/* Row 4 */}
      <div className="flex justify-between items-center gap-1.5 w-full">
        {/* 123 Key */}
        <button
          className="flex-[1.2] h-9 bg-[#242425] text-white text-xs font-semibold rounded-lg flex items-center justify-center shrink-0 min-w-[42px]"
        >
          123
        </button>

        {/* Settings Gear Key */}
        <button
          className="flex-[1] h-9 bg-[#242425] text-white rounded-lg flex items-center justify-center shrink-0 min-w-[36px]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        {/* Emoji smiley Key */}
        <button
          className="flex-[1] h-9 bg-[#242425] text-white rounded-lg flex items-center justify-center shrink-0 min-w-[36px]"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </button>

        {/* Space Key */}
        <button
          onClick={() => onKeyClick('SPACE')}
          className="flex-[4] h-9 bg-[#383838] hover:bg-[#484848] text-white rounded-lg flex items-center justify-center transition-colors shadow-sm"
        />

        {/* Period Key */}
        <button
          onClick={() => onKeyClick('.')}
          className="flex-[1] h-9 bg-[#383838] hover:bg-[#484848] text-white text-[18px] font-bold rounded-lg flex items-center justify-center transition-colors shadow-sm shrink-0 min-w-[32px]"
        >
          .
        </button>

        {/* Return Key */}
        <button
          onClick={() => onKeyClick('RETURN')}
          className="flex-[1.4] h-9 bg-[#242425] hover:bg-[#343435] text-white rounded-lg flex items-center justify-center transition-colors shadow-sm shrink-0 min-w-[48px]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 4v7a4 4 0 0 1-4 4H4" />
            <polyline points="9 20 4 15 9 10" />
          </svg>
        </button>
      </div>
    </div>
  );
}
