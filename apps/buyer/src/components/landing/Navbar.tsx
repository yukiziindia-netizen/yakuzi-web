"use client";

import { useRouter } from "next/navigation";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  Search,
  ShoppingCart,
  Heart,
  User,
  X,
  MapPin,
  ChevronRight,
  LogOut,
  Package,
  Settings,
  Bell,
  MessageSquare,
  Share2,
  Clock,
  RotateCw,
  Plus,
  AudioLines,
  Send,
  MessageSquarePlus,
  Trash2,
  ChevronLeft,
  Filter,
  ShoppingBag,
  ClipboardList,
  HelpCircle,
  ArrowRight,
  Bookmark,
  LifeBuoy,
  ChevronDown,
  ChevronUp,
  LayoutGrid
} from "lucide-react";



import CategoryMegaMenu from "@/components/landing/CategoryMegaMenu";
import CartDrawer from "@/components/cart/CartDrawer";
import WishlistDrawer from "@/components/wishlist/WishlistDrawer";
import { OrderDrawer } from "@/components/orders/OrderDrawer";
import NotificationDrawer from "@/components/notifications/NotificationDrawer";
import SearchBar from "@/components/shared/SearchBar";
import { SidebarSheet, type SidebarView } from "@/components/landing/SidebarSheet";
import WishlistIcon from "@/components/shared/WishlistIcon";

import { useAuth, type Category, sendChatMessage, type ChatMessage } from "@yukizi/api-client";
import { useCart } from "@/hooks/useCart";
import { localCart } from "@/lib/local-cart";
import { useQueryClient } from "@tanstack/react-query";
import { useCategories } from "@/hooks/useProducts";
import { useNotifications } from "@/hooks/useNotifications";
import { useWishlist } from "@/hooks/useWishlist";
import { useScrollLock } from "@/hooks/useScrollLock";

export default function Navbar({
  onLoginClick,
  showUserActions = false,
  onFilterClick,
}: {
  onLoginClick?: () => void;
  showUserActions?: boolean;
  onFilterClick?: () => void;
}) {
  const { isAuthenticated, logout } = useAuth();
  const queryClient = useQueryClient();
  const { data: cartData } = useCart();
  const { data: notificationsData } = useNotifications();
  const { data: wishlistData } = useWishlist();

  const unreadNotificationCount =
    notificationsData?.unreadCount ?? 0;

  const wishlistCount =
    wishlistData?.items?.length ?? 0;

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] =
    useState(false);
  const [isOrderDrawerOpen, setIsOrderDrawerOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] =
    useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [sidebarView, setSidebarView] = useState<SidebarView>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSearchChatOpen, setIsSearchChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatSessions, setChatSessions] = useState<{ id: string, date: number, messages: ChatMessage[] }[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState<{ name: string; data: string; type: string }[]>([]);
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: categoriesData } = useCategories();
  const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData as any)?.data ?? [];

  useEffect(() => {
    setIsMounted(true);

    const scrollContainer = scrollContainerRef.current;
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        if (scrollContainer) scrollContainer.scrollLeft += e.deltaY;
      }
    };

    if (scrollContainer) {
      scrollContainer.addEventListener('wheel', handleWheel, { passive: false });
    }

    // Handle clicks outside of profile dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    // Load chat sessions on mount
    const savedSessions = localStorage.getItem('yukizi_chat_sessions');
    if (savedSessions) {
      try { setChatSessions(JSON.parse(savedSessions)); } catch (e) { }
    }
    const savedCurrent = localStorage.getItem('yukizi_current_chat');
    if (savedCurrent) {
      try { setChatMessages(JSON.parse(savedCurrent)); } catch (e) { }
    }

    return () => {
      if (scrollContainer) scrollContainer.removeEventListener('wheel', handleWheel);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('yukizi_chat_sessions', JSON.stringify(chatSessions));
    }
  }, [chatSessions, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('yukizi_current_chat', JSON.stringify(chatMessages));
    }
  }, [chatMessages, isMounted]);

  const performChatRequest = async (userMsgText: string, currentHistory: ChatMessage[], currentAttachments: typeof attachments) => {
    const userMessage: ChatMessage = { role: 'user', content: userMsgText, attachments: currentAttachments };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setAttachments([]);
    setIsChatLoading(true);

    try {
      const response = await sendChatMessage(userMessage.content, currentHistory, userMessage.attachments);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error processing your request.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleChatSubmit = async () => {
    if ((!chatInput.trim() && attachments.length === 0) || isChatLoading) return;
    await performChatRequest(chatInput.trim(), chatMessages, attachments);
  };

  // 1. Share Chat Logic
  const handleShare = async () => {
    if (chatMessages.length === 0) return alert("Nothing to share yet! Send a message first.");
    const transcript = chatMessages.map(m => `${m.role === 'user' ? 'You' : 'Yukizi AI'}: ${m.content}`).join('\n\n');
    if (navigator.share) {
      try { await navigator.share({ title: 'Yukizi Chat Transcript', text: transcript }); } catch (err) { console.error("Share failed", err); }
    } else {
      navigator.clipboard.writeText(transcript);
      alert('Transcript copied to clipboard!');
    }
  };

  // 2. Chat History Logic
  const handleHistory = () => {
    setIsHistoryModalOpen(true);
  };

  const handleNewChat = () => {
    if (chatMessages.length > 0) {
      setChatSessions(prev => [
        { id: Math.random().toString(36).substring(7), date: Date.now(), messages: chatMessages },
        ...prev
      ]);
      setChatMessages([]);
      setChatInput("");
      setAttachments([]);
    }
  };

  const loadSession = (session: { id: string, messages: ChatMessage[] }) => {
    if (chatMessages.length > 0) {
      setChatSessions(prev => [
        { id: Math.random().toString(36).substring(7), date: Date.now(), messages: chatMessages },
        ...prev.filter(s => s.id !== session.id)
      ]);
    } else {
      setChatSessions(prev => prev.filter(s => s.id !== session.id));
    }
    setChatMessages(session.messages);
    setIsHistoryModalOpen(false);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setChatSessions(prev => prev.filter(s => s.id !== id));
  };

  // 3. Regenerate Logic
  const handleRegenerate = async () => {
    if (chatMessages.length < 2 || isChatLoading) {
      if (chatMessages.length < 2) alert("Need at least one exchange to regenerate.");
      return;
    }
    let lastUserMsgIndex = -1;
    for (let i = chatMessages.length - 1; i >= 0; i--) {
      if (chatMessages[i].role === 'user') {
        lastUserMsgIndex = i;
        break;
      }
    }
    if (lastUserMsgIndex === -1) {
      alert("No previous user message found to regenerate.");
      return;
    }
    const lastUserMsg = chatMessages[lastUserMsgIndex];
    const historyToKeep = chatMessages.slice(0, lastUserMsgIndex);

    setChatMessages(historyToKeep);
    await performChatRequest(lastUserMsg.content || "", historyToKeep, lastUserMsg.attachments || []);
  };

  // 4. File Attachment Logic
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAttachments(prev => [...prev, { name: file.name, data: event.target!.result as string, type: file.type }]);
        }
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 5. Voice Input Logic
  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser doesn't support voice input. (Try Chrome)");
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = (event: any) => {
        alert(`Voice input error: ${event.error}`);
        setIsRecording(false);
      };
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setChatInput((prev) => prev + (prev ? " " : "") + transcript);
      };
      recognition.start();
    } catch (e) {
      alert("Failed to start microphone. Please check permissions.");
    }
  };

  const handleSearchSubmit = () => {
    if (!searchInput.trim()) return;
    router.push(`/?search=${encodeURIComponent(searchInput.trim())}`);
    setIsSearchChatOpen(false);
    setSearchInput('');
  };

  const isAnyDrawerOpen =
    isMobileMenuOpen ||
    isCartOpen ||
    isWishlistOpen ||
    isOrderDrawerOpen ||
    isNotificationsOpen ||
    sidebarView !== null;

  useScrollLock(isAnyDrawerOpen);

  const handleLogout = () => {
    localCart.clear();
    queryClient.invalidateQueries({
      queryKey: ["cart"],
    });
    logout();
  };

  return (
    <>
      {/* Navbar Fixed at Bottom */}
      <nav className="fixed bottom-4 sm:bottom-6 md:bottom-4 left-0 right-0 z-[60] flex justify-center items-end sm:items-center pointer-events-none px-2 sm:px-6 w-full">
        <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-6 md:gap-2 pointer-events-auto flex-nowrap justify-center w-full max-w-[1200px] px-1 sm:px-4 relative">
          {/* Left Segment: Logo, Profile, Notifications, Search */}
          <div className="flex items-center bg-white sm:bg-[#562996] rounded-[24px] sm:rounded-xl md:rounded-xl pl-[2px] pr-1 xs:pl-1 xs:pr-1.5 sm:px-4 md:px-6 h-[48px] sm:h-[60px] md:h-[64px] shadow-[0_4px_15px_rgba(0,0,0,0.08)] sm:shadow-2xl flex-[1.3] sm:flex-1 max-w-[480px] justify-between overflow-hidden min-w-0 border border-gray-100 sm:border-0">
            {/* DESKTOP VIEW (sm and up) */}
            <div className="hidden sm:flex items-center w-full justify-between">
                <div className="flex items-center h-full">
                  <Link href="/" className="shrink-0 flex items-center">
                    <img src="/yukizi-logo-new.png" alt="YUKiZi" className="h-[28px] md:h-[32px] object-contain" />
                  </Link>

                  <div className="flex items-center gap-1 md:gap-2 ml-2 md:ml-3 lg:ml-4">
                    {!isAuthenticated ? (
                      <button 
                        onClick={onLoginClick || (() => window.dispatchEvent(new CustomEvent('open-login')))} 
                        className="text-white font-bold text-[14px] md:text-[15px] bg-white/20 hover:bg-white/30 px-3 md:px-4 py-1.5 md:py-2 rounded-lg transition-colors border border-white/20"
                      >
                        Start
                      </button>
                    ) : (
                      <>
                        <div className="relative" ref={profileDropdownRef}>
                          <button onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)} className="text-white hover:text-purple-300 transition-colors flex items-center">
                            <User className="w-5 h-5 md:w-6 md:h-6 stroke-[2]" />
                          </button>
                          <AnimatePresence>
                            {isProfileDropdownOpen && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="absolute left-0 bottom-full mb-3 w-40 sm:w-48 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-[60]"
                              >
                                <Link href="/profile" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-sky-600 transition-colors">
                                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  My Profile
                                </Link>
                                <Link href="/orders" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-sky-600 transition-colors">
                                  <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  My Orders
                                </Link>
                                <div className="h-px bg-gray-50 my-1 mx-2" />
                                <button onClick={() => { handleLogout(); setIsProfileDropdownOpen(false); }} className="w-full flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors text-left">
                                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  Logout
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Vertical Divider between User and Bell */}
                        <div className="h-5 w-[1px] bg-white/20 mx-1" />

                        <button onClick={() => setIsNotificationsOpen(true)} className="relative text-white hover:text-purple-300 transition-colors flex items-center">
                          <Bell className="w-5 h-5 md:w-6 md:h-6 stroke-[2]" />
                          {unreadNotificationCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 md:w-4 md:h-4 bg-[#f7941d] text-white text-[9px] md:text-[10px] font-bold rounded-full flex items-center justify-center border border-[#562996]">
                              {unreadNotificationCount}
                            </span>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              <div className="relative flex items-center justify-end ml-3 sm:ml-4 w-[110px] sm:w-[130px] md:w-[170px] lg:w-[200px]">
                <input
                  type="text"
                  placeholder="Search"
                  readOnly
                  onClick={() => {
                    setIsSearchChatOpen(!isSearchChatOpen);
                    setIsChatOpen(false);
                  }}
                  className="w-full h-8 md:h-[34px] bg-white rounded-md text-gray-800 text-[13px] md:text-[14px] pl-3 md:pl-4 pr-8 md:pr-10 focus:outline-none cursor-pointer placeholder-gray-400 shadow-sm font-medium"
                />
                <Search className="w-4 h-4 text-gray-400 absolute right-3 md:right-4 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
              </div>
            </div>

            {/* MOBILE VIEW (below sm) */}
            <div className="flex sm:hidden items-center w-full justify-between h-full px-1">
              {!isAuthenticated ? (
                // BEFORE LOGIN
                <div className="flex items-center justify-between w-full h-full py-[6px] gap-0.5">
                  <div className="h-[36px] flex items-center justify-center bg-gradient-to-b from-[#a155e8] via-[#7b41b0] to-[#512384] px-2 xs:px-2.5 rounded-[12px] text-[#e0e0e0] shrink-0 shadow-sm border border-[#a155e8]/20">
                    <Link href="/" className="h-full flex items-center">
                      <Image src="/YukiziLogo.png" alt="YUKiZi" width={70} height={24} className="w-[36px] xs:w-[44px] object-contain [filter:brightness(0)_invert(0.88)_drop-shadow(0.25px_0_0_#e0e0e0)_drop-shadow(-0.25px_0_0_#e0e0e0)_drop-shadow(0_0.25px_0_#e0e0e0)] cursor-pointer" />
                    </Link>
                    <div className="w-[1px] h-3.5 bg-[#e0e0e0]/30 mx-1 xs:mx-1.5" />
                    <Link href="/login" className="h-full flex items-center cursor-pointer">
                      <span className="text-[10px] xs:text-[11px] font-normal whitespace-nowrap">Start Now</span>
                    </Link>
                  </div>

                  <div className="relative h-[34px] flex items-center flex-1 max-w-[110px] xs:max-w-[130px]">
                    <button
                      onClick={() => {
                        setIsSearchChatOpen(!isSearchChatOpen);
                        setIsChatOpen(false);
                      }}
                      className="w-full h-full bg-white border border-gray-200 rounded-[8px] text-left pl-2.5 pr-7 text-[10px] xs:text-[11px] text-gray-400 font-medium shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.06)] cursor-pointer"
                    >
                      Search
                    </button>
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.5]" />
                  </div>
                </div>
              ) : (
                // AFTER LOGIN
                <div className="flex items-center justify-between w-full h-full py-[6px] gap-2">
                  <Link href="/" className="shrink-0 flex items-center pl-1">
                    <Image src="/YukiziLogo.png" alt="YUKiZi" width={70} height={24} className="w-[55px] xs:w-[65px] object-contain" />
                  </Link>

                  <div className="flex items-center gap-1.5 xs:gap-2 h-full flex-1 justify-end">
                    <button onClick={() => setIsNotificationsOpen(true)} className="relative p-1 text-[#562996] transition-colors shrink-0">
                      <Bell className="w-[18px] h-[18px] xs:w-[20px] xs:h-[20px] stroke-[2]" />
                      <span className="absolute top-0 right-0 w-1.5 h-1.5 xs:w-2 xs:h-2 bg-[#eb4335] rounded-full shadow-sm" />
                    </button>

                    <div className="relative h-[34px] flex items-center w-[75px] xs:w-[95px]">
                      <button
                        onClick={() => {
                          setIsSearchChatOpen(!isSearchChatOpen);
                          setIsChatOpen(false);
                        }}
                        className="w-full h-full bg-white border border-gray-200 rounded-[8px] text-left pl-2.5 pr-7 text-[10px] xs:text-[11px] text-gray-400 font-medium shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.06)] cursor-pointer"
                      >
                        Search
                      </button>
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.5]" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center Mascot */}
          <div
            onClick={() => {
              setIsChatOpen(!isChatOpen);
              setIsSearchChatOpen(false);
            }}
            className="relative -mt-4 sm:-mt-8 md:-mt-10 z-20 w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-b from-[#ffb040] to-[#ff8c00] rounded-[18px] sm:rounded-2xl md:rounded-[1.5rem] flex items-center justify-center shadow-[0_4px_15px_rgba(255,176,64,0.4)] sm:shadow-[0_0_20px_rgba(255,176,64,0.5)] hover:-translate-y-1 sm:hover:-translate-y-2 transition-transform cursor-pointer shrink-0 mx-1 xs:mx-2 sm:mx-2 md:mx-4 border-[2px] border-[#fff5eb]"
          >
            <Image src="/yukizi.jpg" alt="Mascot" width={96} height={96} className="w-full h-full object-cover rounded-[16px] sm:rounded-2xl md:rounded-[1.5rem]" />
          </div>



          {/* Right Segment: Cart, Wishlist, Filter, Menu */}
          <div className="flex items-center justify-between bg-white sm:bg-[#562996] rounded-[24px] sm:rounded-xl md:rounded-xl px-2.5 xs:px-4 sm:px-8 md:px-12 lg:px-16 h-[48px] sm:h-[60px] md:h-[64px] shadow-[0_4px_15px_rgba(0,0,0,0.08)] sm:shadow-2xl text-[#562996] sm:text-white sm:shrink-0 flex-[1] sm:flex-1 max-w-[480px] z-10 overflow-hidden min-w-0 border border-gray-100 sm:border-0">

            <button onClick={() => setIsWishlistOpen(true)} className="relative sm:hover:text-purple-300 transition-colors">
              <Bookmark 
                className="w-[20px] h-[20px] xs:w-[22px] xs:h-[22px] sm:w-6 sm:h-6 stroke-[2] rotate-90" 
                fill={wishlistCount > 0 ? "currentColor" : "none"} 
              />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 bg-[#f7941d] text-white text-[8px] xs:text-[9px] sm:text-[10px] font-bold rounded-full flex items-center justify-center border border-white sm:border-[#562996]">
                  {wishlistCount}
                </span>
              )}
            </button>

            <button onClick={() => setIsCartOpen(true)} className="relative sm:hover:text-purple-300 transition-colors">
              <ShoppingCart className="w-[20px] h-[20px] xs:w-[22px] xs:h-[22px] sm:w-6 sm:h-6 stroke-[2]" />
              {cartData?.items && cartData.items.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 bg-[#f7941d] text-white text-[8px] xs:text-[9px] sm:text-[10px] font-bold rounded-full flex items-center justify-center border border-white sm:border-[#562996]">
                  {cartData.items.length}
                </span>
              )}
            </button>

            <button onClick={() => setIsOrderDrawerOpen(true)} className="hidden sm:block relative hover:text-purple-300 transition-colors">
              <Package className="w-[18px] h-[18px] xs:w-[22px] xs:h-[22px] sm:w-6 sm:h-6 stroke-[2.5]" />
            </button>

            <button onClick={() => {
              setSidebarView("filters");
              onFilterClick?.();
            }} className="sm:hover:text-purple-300 transition-colors">
              <Filter className="w-[20px] h-[20px] xs:w-[22px] xs:h-[22px] sm:w-6 sm:h-6 stroke-[2]" />
            </button>

            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="sm:hover:text-purple-300 transition-colors">
              {isMobileMenuOpen ? (
                <X className="w-[20px] h-[20px] xs:w-[22px] xs:h-[22px] sm:w-6 sm:h-6 stroke-[2]" />
              ) : (
                <Menu className="w-[20px] h-[20px] xs:w-[22px] xs:h-[22px] sm:w-6 sm:h-6 stroke-[2]" />
              )}
            </button>
          </div>

          {/* Chat Box Popup (Mascot) */}
          <AnimatePresence>
            {isChatOpen && (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                className="absolute bottom-[-16px] md:bottom-[-24px] left-0 right-0 z-[-1] pointer-events-auto h-[75vh] max-h-[850px]"
              >
                <div className="w-full h-full bg-gradient-to-br from-[#9b49e6] to-[#7f26d9] rounded-[2rem] md:rounded-[2.5rem] shadow-[0_0_60px_rgba(155,73,230,0.5)] p-6 sm:p-8 md:p-10 flex flex-col">
                  {/* Chat Messages Area */}
                  {chatMessages.length > 0 && (
                    <div className="flex-1 overflow-y-auto mb-4 flex flex-col gap-4 scrollbar-hide">
                      {chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${msg.role === 'user' ? 'bg-white text-[#7f26d9]' : 'bg-[#562996] text-white border border-white/20'}`}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Chat Box Header / Input Area */}
                  <div className={`${chatMessages.length > 0 ? 'h-16 shrink-0' : 'flex-1'} transition-all duration-300 pb-4 flex flex-col`}>
                    {/* Attachments Preview */}
                    {attachments.length > 0 && (
                      <div className="flex items-center gap-2 mb-2 overflow-x-auto">
                        {attachments.map((att, i) => (
                          <div key={i} className="relative w-12 h-12 rounded bg-white/10 flex-shrink-0 flex items-center justify-center border border-white/20">
                            {att.type.startsWith('image/') ? (
                              <img src={att.data} alt="preview" className="w-full h-full object-cover rounded" />
                            ) : (
                              <span className="text-[10px] text-white font-bold uppercase truncate px-1">
                                {att.name.split('.').pop()}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                              className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 shadow-md transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <textarea
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleChatSubmit();
                        }
                      }}
                      placeholder={isRecording ? "Listening..." : "Start typing ..."}
                      className="w-full flex-1 bg-transparent text-white text-base sm:text-xl md:text-2xl placeholder-white/70 outline-none resize-none font-medium"
                      disabled={isChatLoading || isRecording}
                    />
                  </div>

                  {/* Chat Box Footer (Positioned above the navbar) */}
                  <div className="flex items-center justify-between pb-[70px] md:pb-[80px] px-2 md:px-4">
                    {/* Left Icons */}
                    <div className="flex items-center gap-5 sm:gap-7 text-white ml-2 md:ml-4">
                      <button onClick={handleNewChat} className="hover:text-white/80 transition-colors" title="New Chat">
                        <MessageSquarePlus className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2]" />
                      </button>
                      <button onClick={handleHistory} className="hover:text-white/80 transition-colors" title="Chat History">
                        <Clock className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2]" />
                      </button>
                      <button onClick={handleShare} className="hover:text-white/80 transition-colors" title="Share Chat">
                        <Share2 className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2]" />
                      </button>
                    </div>

                    {/* Right Icons */}
                    <div className="flex items-center gap-5 sm:gap-7 text-white mr-2 md:mr-4">
                      <button onClick={handleRegenerate} disabled={isChatLoading || chatMessages.length < 2} className="hover:text-white/80 transition-colors disabled:opacity-50">
                        <RotateCw className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
                      </button>
                      <button onClick={() => fileInputRef.current?.click()} className="hover:text-white/80 transition-colors">
                        <Plus className="w-6 h-6 sm:w-7 sm:h-7 stroke-[3]" />
                      </button>
                      <button onClick={handleVoiceInput} className={`transition-colors ${isRecording ? 'text-red-400 animate-pulse' : 'hover:text-white/80'}`}>
                        <AudioLines className="w-6 h-6 sm:w-8 sm:h-8 stroke-[2]" />
                      </button>
                      <button
                        onClick={handleChatSubmit}
                        disabled={(!chatInput.trim() && attachments.length === 0) || isChatLoading}
                        className={`w-12 h-10 sm:w-16 sm:h-12 bg-white rounded-xl flex items-center justify-center transition-colors shadow-lg ml-2 ${isChatLoading || (!chatInput.trim() && attachments.length === 0) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                      >
                        {isChatLoading ? (
                          <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-[#562996] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send className="w-5 h-5 sm:w-6 sm:h-6 text-[#562996] fill-[#562996] rotate-45" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Hidden File Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*,application/pdf"
                    multiple={false}
                    onChange={handleFileChange}
                  />
                </div>

                {/* Chat History Modal */}
                <AnimatePresence>
                  {isHistoryModalOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute inset-0 z-50 bg-[#401b73] rounded-[2rem] md:rounded-[2.5rem] flex flex-col overflow-hidden"
                    >
                      <div className="p-6 sm:p-8 md:p-10 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-8">
                          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Clock className="w-6 h-6" /> Chat History
                          </h2>
                          <button
                            onClick={() => setIsHistoryModalOpen(false)}
                            className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                          {chatSessions.length === 0 ? (
                            <div className="text-white/50 text-center py-10">
                              No previous chat sessions found.
                            </div>
                          ) : (
                            chatSessions.map(session => (
                              <div
                                key={session.id}
                                onClick={() => loadSession(session)}
                                className="group bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 cursor-pointer transition-all flex items-center justify-between"
                              >
                                <div className="flex-1 min-w-0 pr-4">
                                  <div className="text-white/60 text-xs mb-1 font-medium">
                                    {new Date(session.date).toLocaleString()}
                                  </div>
                                  <div className="text-white text-sm truncate font-medium">
                                    {session.messages.find(m => m.role === 'user')?.content || "Empty conversation"}
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => deleteSession(e, session.id)}
                                  className="opacity-0 group-hover:opacity-100 p-2 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-all"
                                  title="Delete Session"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search Box Popup (White) */}
          <AnimatePresence>
            {isSearchChatOpen && (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                className="absolute bottom-[-16px] md:bottom-[-24px] left-0 right-0 z-[-2] pointer-events-auto h-[60vh] max-h-[600px]"
              >
                <div className="w-full h-full bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-[0_0_40px_rgba(0,0,0,0.1)] border border-gray-100 p-6 sm:p-8 md:p-10 flex flex-col relative overflow-hidden">

                  {/* Subtle pink/purple glow behind the mascot area */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300px] h-[150px] bg-pink-500/10 blur-[50px] pointer-events-none rounded-full" />

                  {/* Chat Box Header / Input Area */}
                  <div className="flex-1 pb-4 z-10">
                    <textarea
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSearchSubmit();
                        }
                      }}
                      placeholder="Start typing ..."
                      className="w-full h-full bg-transparent text-[#562996] text-base sm:text-xl md:text-2xl placeholder-[#a66ee8] outline-none resize-none font-medium"
                    />
                  </div>

                  {/* Chat Box Footer */}
                  <div className="flex items-center justify-between pb-[70px] md:pb-[80px] px-2 md:px-4 z-10">
                    {/* Left Icons */}
                    <div className="flex items-center gap-5 sm:gap-7 text-gray-700">
                      <button className="hover:text-gray-900 transition-colors">
                        <Clock className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2]" />
                      </button>
                    </div>

                    {/* Right Icons */}
                    <div className="flex items-center gap-5 sm:gap-7 text-gray-700 mr-2 md:mr-4">
                      <button className="hover:text-gray-900 transition-colors">
                        <RotateCw className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
                      </button>
                      <button className="hover:text-gray-900 transition-colors">
                        <Plus className="w-6 h-6 sm:w-7 sm:h-7 stroke-[3]" />
                      </button>
                      <button className="hover:text-gray-900 transition-colors">
                        <AudioLines className="w-6 h-6 sm:w-8 sm:h-8 stroke-[2]" />
                      </button>
                      <button
                        onClick={handleSearchSubmit}
                        className="w-12 h-10 sm:w-16 sm:h-12 bg-white rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors shadow-md border border-gray-100 ml-2"
                      >
                        <Send className="w-5 h-5 sm:w-6 sm:h-6 text-[#562996] fill-[#562996] rotate-45" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>



      {/* Menu Drawer (Now active on Mobile and Desktop) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            key="mobile-menu-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[65]"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        {isMobileMenuOpen && (
          <motion.div
            key="mobile-menu-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-[85%] max-w-[400px] bg-white z-[70] shadow-2xl rounded-l-3xl flex flex-col p-6 sm:p-8"
          >
            {/* Hidden Close Button */}
            <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 bg-white/80 rounded-full z-[80] transition-colors">
              <X className="w-5 h-5" />
            </button>
            {/* Header */}
            <div className="flex justify-between items-center mb-10 pt-4">
              <h2 className="text-[22px] font-bold text-[#333]">Menu</h2>
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-gray-500 text-sm hover:text-gray-800 transition-colors"
                >
                  Sign out
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onLoginClick?.();
                  }}
                  className="text-gray-500 text-sm hover:text-gray-800 transition-colors"
                >
                  Sign out
                </button>
              )}
            </div>

            {/* Links List */}
            <div className="flex-1 overflow-y-auto mt-16 sm:mt-24 pb-24 pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#854cbc] [&::-webkit-scrollbar-thumb]:rounded-full">
              {categories.map((category: Category) => {
                const hasSub = (category as any).subCategories && (category as any).subCategories.length > 0;
                const isExpanded = expandedCategory === category.id;

                return (
                  <div key={category.id} className="flex flex-col border-b border-gray-50 last:border-0">
                    <div className="flex justify-between items-center py-4 group">
                      <Link
                        href={`/category/${category.slug || category.id}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex-1 text-[16px] font-medium tracking-wide text-gray-700 hover:text-black transition-colors"
                      >
                        {category.name}
                      </Link>
                      {hasSub ? (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setExpandedCategory(isExpanded ? null : category.id);
                          }}
                          className="p-1 -mr-1 text-gray-400 group-hover:text-gray-600 transition-colors"
                        >
                          <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} strokeWidth={2.5} />
                        </button>
                      ) : (
                        <Link
                          href={`/category/${category.slug || category.id}`}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="p-1 -mr-1"
                        >
                          <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors rotate-90" strokeWidth={2.5} />
                        </Link>
                      )}
                    </div>

                    <AnimatePresence>
                      {isExpanded && hasSub && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-col space-y-4 pl-6 pb-4 pt-1">
                            {(category as any).subCategories.map((sub: any) => (
                              <Link
                                key={sub.id}
                                href={`/category/${category.slug || category.id}?sub=${sub.slug || sub.id}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-[15px] text-gray-600 hover:text-black transition-colors block"
                              >
                                {sub.name}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Bottom Drawer Icons */}
            <div className="mt-auto pt-2 pb-24 flex sm:hidden justify-end pr-2">
              <Image 
                src="/drawer-icons.png" 
                alt="Drawer Icons" 
                width={80} 
                height={35} 
                className="w-[80px] object-contain mix-blend-multiply opacity-90" 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drawers */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
      />

      <Suspense fallback={null}>
        <SidebarSheet
          view={sidebarView}
          onClose={() => setSidebarView(null)}
          onViewChange={setSidebarView}
        />
      </Suspense>

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() =>
          setIsNotificationsOpen(false)
        }
      />

      <OrderDrawer
        isOpen={isOrderDrawerOpen}
        onClose={() => setIsOrderDrawerOpen(false)}
      />

      {/* GLOBAL MEGA MENU - Outside scroll context to prevent clipping */}
      {categories.map((category: Category) => (
        <CategoryMegaMenu
          key={`mega-${category.id}`}
          category={category}
          isOpen={activeCategory === category.id}
          onMouseEnter={() => setActiveCategory(category.id)}
          onMouseLeave={() => setActiveCategory(null)}
        />
      ))}
    </>
  );
}
