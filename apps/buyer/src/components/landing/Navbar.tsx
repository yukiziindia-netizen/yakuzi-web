"use client";

import { useRouter } from "next/navigation";

import Link from "next/link";
import { track } from '@/lib/analytics/tracker';
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
  LayoutGrid,
  Brain
} from "lucide-react";



import CategoryMegaMenu from "@/components/landing/CategoryMegaMenu";
import EditProfileDrawer from "@/components/profile/EditProfileDrawer";
import CartDrawer from "@/components/cart/CartDrawer";
import WishlistDrawer from "@/components/wishlist/WishlistDrawer";
import SupportDrawer from "@/components/shared/SupportDrawer";
import { useToast } from "@/components/shared/Toast";
import NotificationDrawer from "@/components/notifications/NotificationDrawer";
import SearchBar from "@/components/shared/SearchBar";
import { SidebarSheet, type SidebarView } from "@/components/landing/SidebarSheet";
import WishlistIcon from "@/components/shared/WishlistIcon";

import { useAuth, type Category, sendChatMessage, sendChatMessageFull, type ChatMessage, getProducts } from "@yukizi/api-client";
import { useCart } from "@/hooks/useCart";
import { localCart } from "@/lib/local-cart";
import { useQueryClient } from "@tanstack/react-query";
import { useCategories } from "@/hooks/useProducts";
import { useNotifications } from "@/hooks/useNotifications";
import { useWishlist } from "@/hooks/useWishlist";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useIsDesktop } from "@/hooks/useIsDesktop";

// A buyer reopening the site after being away this long gets a fresh chat -
// the old conversation moves to history instead of reappearing as if
// nothing happened.
const CHAT_IDLE_RESET_MS = 60 * 60 * 1000;

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
  // Replaces the blocking window.alert() calls in the chat panel: a native
  // modal freezes the page and cannot be styled, and this app already has a
  // toast system mounted globally in providers.tsx.
  const { toast } = useToast();
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
  const [isNotificationsOpen, setIsNotificationsOpen] =
    useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSupportDrawerOpen, setIsSupportDrawerOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [sidebarView, setSidebarView] = useState<SidebarView>(null);
  const [isMounted, setIsMounted] = useState(false);
  const isDesktop = useIsDesktop();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  // The floating bar is pinned to the bottom of the viewport, so at the end of the
  // page it used to sit on top of the footer and hide it. Once the footer scrolls
  // into view the bar rides up with it and comes to rest just above it.
  //
  // The offset is measured from the footer itself rather than hardcoded per
  // breakpoint, so it stays correct if the footer's height or content changes.
  useEffect(() => {
    let frame = 0;

    const applyFooterOffset = () => {
      frame = 0;
      const nav = navRef.current;
      if (!nav) return;

      const footer = document.querySelector('footer');
      if (!footer) {
        nav.style.transform = '';
        return;
      }

      // How far the footer has intruded into the viewport, if at all.
      const overlap = window.innerHeight - footer.getBoundingClientRect().top;
      nav.style.transform =
        overlap > 0 ? `translate3d(0, ${-Math.round(overlap)}px, 0)` : '';
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(applyFooterOffset);
    };

    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    // Content loading in below the fold moves the footer without any scrolling,
    // which would otherwise leave the bar sitting at a stale offset.
    const bodyObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    bodyObserver?.observe(document.body);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      bodyObserver?.disconnect();
    };
  }, []);

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSearchChatOpen, setIsSearchChatOpen] = useState(false);

  // Type-immediately: focus the search box as soon as the panel opens. The
  // panel mounts inside AnimatePresence, so wait a beat for it to exist
  // (same idiom as SearchBar's open-focus).
  useEffect(() => {
    if (isSearchChatOpen) {
      const t = setTimeout(() => searchTextareaRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [isSearchChatOpen]);

  // Same for the chatbot panel: open it, type immediately.
  useEffect(() => {
    if (isChatOpen) {
      const t = setTimeout(() => chatTextareaRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [isChatOpen]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatSessions, setChatSessions] = useState<{ id: string, date: number, messages: ChatMessage[] }[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  // Live results shown inside the search panel while typing.
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  useEffect(() => {
    const q = searchInput.trim();
    if (!isSearchChatOpen || q.length < 2) {
      setSearchResults([]);
      setIsSearchLoading(false);
      return;
    }
    setIsSearchLoading(true);
    let stale = false;
    // Debounced so a fast typist fires one request, not one per keystroke.
    const timer = setTimeout(async () => {
      const res = await getProducts({ search: q, limit: 6 });
      if (!stale) {
        setSearchResults(res.data);
        setIsSearchLoading(false);
      }
    }, 300);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput, isSearchChatOpen]);
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState<{ name: string; data: string; type: string }[]>([]);
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  // The bar itself: holds the search panel and the button that opens it.
  const navPanelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const searchTextareaRef = useRef<HTMLTextAreaElement>(null);
  const chatTextareaRef = useRef<HTMLTextAreaElement>(null);

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
      const target = event.target as Node;

      if (profileDropdownRef.current && !profileDropdownRef.current.contains(target)) {
        setIsProfileDropdownOpen(false);
      }

      // The search panel had no dismissal of its own, so it stayed open until
      // the toggle was pressed again. The ref is on the bar that holds both the
      // panel and the button that opens it, so pressing that button still just
      // toggles instead of being closed here and reopened by its own handler.
      if (navPanelRef.current && !navPanelRef.current.contains(target)) {
        setIsSearchChatOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsSearchChatOpen(false);
    };
    document.addEventListener('keydown', handleEscape);

    const savedSessions = localStorage.getItem('yukizi_chat_sessions');
    let loadedSessions: { id: string, date: number, messages: ChatMessage[] }[] = [];
    if (savedSessions) {
      try { loadedSessions = JSON.parse(savedSessions); } catch (e) { console.error("Error loading chat sessions:", e); }
    }

    const savedCurrent = localStorage.getItem('yukizi_current_chat');
    if (savedCurrent) {
      try {
        const restoredMessages: ChatMessage[] = JSON.parse(savedCurrent);
        const lastActiveRaw = localStorage.getItem('yukizi_chat_last_active');
        const lastActive = lastActiveRaw ? Number(lastActiveRaw) : 0;
        const isStale = restoredMessages.length > 0 && Date.now() - lastActive > CHAT_IDLE_RESET_MS;

        if (isStale) {
          // The buyer is opening the site again after being away over an
          // hour (e.g. a fresh login) - the old conversation is unlikely to
          // still be relevant context, so file it into history instead of
          // dropping them back into a stale chat. Same shape handleNewChat()
          // already produces, dated to when that chat actually happened
          // rather than now.
          loadedSessions = [
            { id: Math.random().toString(36).substring(7), date: lastActive || Date.now(), messages: restoredMessages },
            ...loadedSessions,
          ];
        } else {
          setChatMessages(restoredMessages);
        }
      } catch (e) { console.error("Error loading current chat:", e); }
    }
    setChatSessions(loadedSessions);

    return () => {
      if (scrollContainer) scrollContainer.removeEventListener('wheel', handleWheel);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
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
      if (chatMessages.length > 0) {
        localStorage.setItem('yukizi_chat_last_active', String(Date.now()));
      }
    }
    // Auto-scroll chat when messages change
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, isMounted]);

  const formatFormattedMessage = (content: string) => {
    if (!content) return null;
    const lines = content.split('\n');
    return lines.map((line, lineIdx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const lineElements = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          return <strong key={pIdx} className="font-bold">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      const trimmed = line.trim();
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        const rest = line.substring(line.indexOf(trimmed.startsWith('* ') ? '*' : '-') + 1);
        const bulletParts = rest.split(/(\*\*.*?\*\*)/g).map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
            return <strong key={pIdx} className="font-bold">{part.slice(2, -2)}</strong>;
          }
          return part;
        });
        return (
          <div key={lineIdx} className="flex items-start gap-2 my-1 pl-1">
            <span className="text-purple-200 font-bold">•</span>
            <div className="flex-1">{bulletParts}</div>
          </div>
        );
      }

      return (
        <div key={lineIdx} className={trimmed === '' ? 'h-2' : ''}>
          {lineElements}
        </div>
      );
    });
  };

  const performChatRequest = async (userMsgText: string, currentHistory: ChatMessage[], currentAttachments: typeof attachments) => {
    const userMessage: ChatMessage = { role: 'user', content: userMsgText, attachments: currentAttachments };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setAttachments([]);
    setIsChatLoading(true);

    try {
      const response = await sendChatMessageFull(userMessage.content, currentHistory, userMessage.attachments);
      setChatMessages((prev) => [...prev, {
        role: 'assistant',
        content: response.response,
        thoughts: response.thoughts,
        thinkingTimeMs: response.thinkingTimeMs
      }]);
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
    if (chatMessages.length === 0) return toast("Nothing to share yet! Send a message first.", "info");
    const transcript = chatMessages.map(m => `${m.role === 'user' ? 'You' : 'Yukizi AI'}: ${m.content}`).join('\n\n');
    if (navigator.share) {
      try { await navigator.share({ title: 'Yukizi Chat Transcript', text: transcript }); } catch (err) { console.error("Share failed", err); }
    } else {
      navigator.clipboard.writeText(transcript);
      toast('Transcript copied to clipboard!', 'success');
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
      if (chatMessages.length < 2) toast("Need at least one exchange to regenerate.", "info");
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
      toast("No previous user message found to regenerate.", "info");
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
      toast("Your browser doesn't support voice input. Try Chrome.", "error");
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = (event: any) => {
        toast(`Voice input error: ${event.error}`, "error");
        setIsRecording(false);
      };
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setChatInput((prev) => prev + (prev ? " " : "") + transcript);
      };
      recognition.start();
    } catch (e) {
      toast("Failed to start microphone. Please check permissions.", "error");
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
    isNotificationsOpen ||
    isProfileOpen ||
    sidebarView !== null;

  useScrollLock(isAnyDrawerOpen);

  // Cart/Wishlist/Filters/Menu are now exclusive full-screen-or-near-full-screen
  // panels sharing the same screen real estate, so opening one closes the
  // others — and clicking an already-open one's icon closes it, matching how
  // the search panel already behaves.
  const toggleWishlist = () => {
    const next = !isWishlistOpen;
    setIsWishlistOpen(next);
    if (next) {
      setIsCartOpen(false);
      setSidebarView(null);
      setIsMobileMenuOpen(false);
    }
  };

  const toggleCart = () => {
    const next = !isCartOpen;
    setIsCartOpen(next);
    if (next) {
      setIsWishlistOpen(false);
      setSidebarView(null);
      setIsMobileMenuOpen(false);
    }
  };

  const toggleFilters = () => {
    const next: SidebarView = sidebarView === "filters" ? null : "filters";
    setSidebarView(next);
    if (next) {
      setIsCartOpen(false);
      setIsWishlistOpen(false);
      setIsMobileMenuOpen(false);
    }
  };

  const toggleMenu = () => {
    const next = !isMobileMenuOpen;
    setIsMobileMenuOpen(next);
    if (next) {
      setIsCartOpen(false);
      setIsWishlistOpen(false);
      setSidebarView(null);
    }
  };

  // Notifications/Profile now stay reachable behind their own drawer (the nav
  // bar no longer disappears while either is open), so tapping the same icon
  // again needs to close it — matching the toggle-to-close convention the
  // other panels above already use, instead of always forcing it open.
  const toggleNotifications = () => {
    const next = !isNotificationsOpen;
    setIsNotificationsOpen(next);
    if (next) {
      setIsProfileOpen(false);
      setIsCartOpen(false);
      setIsWishlistOpen(false);
      setSidebarView(null);
      setIsMobileMenuOpen(false);
    }
  };

  const toggleProfile = () => {
    const next = !isProfileOpen;
    setIsProfileOpen(next);
    if (next) {
      setIsNotificationsOpen(false);
      setIsCartOpen(false);
      setIsWishlistOpen(false);
      setSidebarView(null);
      setIsMobileMenuOpen(false);
    }
  };

  const handleLogout = () => {
    localCart.clear();
    queryClient.invalidateQueries({
      queryKey: ["cart"],
    });
    logout();
  };

  return (
    <>
      {/* Dims and blurs the page while the chat or search panel is open.
          Rendered outside <nav> deliberately: the bar carries a transform, which
          makes it the containing block for fixed children, so a backdrop placed
          inside it is sized to the bar rather than the viewport and dims
          nothing. It sits below the bar's z-index so the panels stay sharp. */}
      <AnimatePresence>
        {(isChatOpen || isSearchChatOpen) && (
          <motion.div
            key="panel-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              setIsChatOpen(false);
              setIsSearchChatOpen(false);
            }}
            className="fixed inset-0 z-[85] bg-black/40 backdrop-blur-sm"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <nav
        ref={navRef}
        className="fixed bottom-0 left-0 right-0 z-[90] flex justify-center items-end sm:items-center pointer-events-none px-2 pb-2 sm:pb-6 md:pb-4 sm:px-6 w-full will-change-transform"
      >
        {/* Soft white glow behind the floating bar. Absolutely positioned so it
            never affects layout, and painted before the z-10 panel so the bar
            always sits on top of it. The whole <nav> is pointer-events-none, so
            the page underneath stays clickable through it. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 -top-[60px] sm:-top-[70px] pointer-events-none bg-[linear-gradient(to_top,#fff_45%,rgba(255,255,255,0.85)_70%,rgba(255,255,255,0)_100%)] sm:[-webkit-mask-image:linear-gradient(to_right,#000,transparent_16%,transparent_84%,#000)] sm:[mask-image:linear-gradient(to_right,#000,transparent_16%,transparent_84%,#000)]"
        />
        <div
          ref={navPanelRef}
          // Desktop-only 20% shrink (rather than re-deriving every one of this
          // bar's many hardcoded per-breakpoint sizes) — origin bottom-center so
          // it shrinks toward the edge it's docked to instead of drifting. Left
          // at full size on phones — the mobile bar was already sized for that
          // viewport and shrinking it further just made it hard to tap.
          // Lives on this inner wrapper, not <nav> itself, because <nav> already
          // owns an imperative `style.transform` (see the footer-avoidance
          // effect above) that would silently overwrite a class-based scale.
          className="flex items-center gap-1.5 xs:gap-2 sm:gap-6 md:gap-2 pointer-events-auto flex-nowrap justify-center w-full max-w-[1200px] px-1 sm:px-4 relative z-10 origin-bottom scale-100 sm:scale-[0.8]"
        >
          {/* Left Segment: Logo, Profile, Notifications, Search */}
          <div className="flex items-center bg-white sm:bg-[#562996] rounded-full sm:rounded-xl pl-2.5 pr-1.5 xs:pl-3 xs:pr-2 sm:px-4 md:px-6 h-9 sm:h-[60px] md:h-[64px] shadow-[0_6px_20px_rgba(0,0,0,0.08)] sm:shadow-2xl flex-[1.08] sm:flex-1 max-w-[480px] justify-between overflow-hidden min-w-0">
            {/* DESKTOP VIEW (sm and up) */}
            <div className="hidden sm:flex items-center w-full justify-between">
                <div className="flex items-center h-full">
                  <Link href="/" className="shrink-0 flex items-center">
                    <img src="/yukizi-logo-new.png" alt="YUKiZi" className="h-[20px] md:h-[24px] object-contain" />
                  </Link>

                  <div className="flex items-center gap-1 md:gap-2 ml-2 md:ml-3 lg:ml-4">
                    {!isAuthenticated ? (
                      <button 
                        onClick={onLoginClick || (() => window.dispatchEvent(new CustomEvent('open-login')))} 
                        className="text-white font-bold text-[12px] md:text-[13px] bg-white/20 hover:bg-white/30 px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg transition-colors border border-white/20"
                      >
                        Start
                      </button>
                    ) : (
                      <>
                        <button onClick={toggleProfile} className="text-white hover:text-purple-300 transition-all duration-200 hover:scale-110 flex items-center">
                          <User className="w-[24px] h-[24px] md:w-[26px] md:h-[26px] stroke-[2]" fill={isProfileOpen ? "currentColor" : "none"} />
                        </button>
                        {/* Vertical Divider between User and Bell */}
                        <div className="h-5 w-[1px] bg-white/20 ml-1 mr-3" />

                        <button
                          onClick={toggleNotifications}
                          className={`relative transition-all duration-200 flex items-center ${
                            isNotificationsOpen
                              ? "text-white scale-110 opacity-100"
                              : isAnyDrawerOpen
                              ? "text-white/40 opacity-50"
                              : "text-white hover:text-purple-300"
                          }`}
                        >
                          <Bell className="w-[24px] h-[24px] md:w-[26px] md:h-[26px] stroke-[2]" fill={isNotificationsOpen ? "currentColor" : "none"} />
                          {unreadNotificationCount > 0 && (
                            <span className="absolute top-[-2px] right-[-2px] w-[7px] h-[7px] bg-[#f7941d] rounded-full border border-[#562996]" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              <div className="relative flex items-center justify-end ml-3 sm:ml-4 md:ml-5 flex-1 max-w-[220px] sm:max-w-[260px] md:max-w-[300px]">
                <input
                  type="text"
                  placeholder="Search"
                  readOnly
                  onClick={() => {
                    setIsSearchChatOpen(!isSearchChatOpen);
                    setIsChatOpen(false);
                  }}
                  className="w-full h-[28px] md:h-[30px] bg-white rounded-md text-gray-800 text-[11px] md:text-[12px] pl-2 md:pl-3 pr-7 md:pr-9 focus:outline-none cursor-pointer placeholder-gray-400 shadow-sm font-medium"
                />
                <Search className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 md:right-3.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
              </div>
            </div>

            {/* MOBILE VIEW (below sm) */}
            <div className="flex sm:hidden items-center w-full justify-between h-full">
              {!isAuthenticated ? (
                // BEFORE LOGIN
                <div className="flex items-center justify-between w-full h-full gap-1">
                  <Link href="/" className="shrink-0 flex items-center cursor-pointer">
                    <Image src="/YukiziLogo.png" alt="YUKiZi" width={70} height={24} className="w-[38px] xs:w-[44px] object-contain" />
                  </Link>

                  <button
                    type="button"
                    onClick={onLoginClick || (() => window.dispatchEvent(new CustomEvent('open-login')))}
                    className="h-[26px] flex items-center justify-center bg-[#854cbc] px-2 xs:px-2.5 rounded-[10px] shrink-0 cursor-pointer"
                  >
                    <span className="text-[10px] font-medium text-white whitespace-nowrap">Start Now</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsSearchChatOpen(!isSearchChatOpen);
                      setIsChatOpen(false);
                    }}
                    className={`relative p-1 transition-all duration-200 shrink-0 ${
                      isSearchChatOpen
                        ? "text-[#562996] scale-110 opacity-100"
                        : "text-[#442f58] hover:text-black"
                    }`}
                  >
                    <Search className="w-[17px] h-[17px] xs:w-[18px] xs:h-[18px] stroke-[2.5]" />
                  </button>
                </div>
              ) : (
                // AFTER LOGIN
                <div className="flex items-center w-full h-full py-[6px] gap-2">
                  <Link href="/" className="shrink-0 flex items-center pl-1">
                    <Image src="/YukiziLogo.png" alt="YUKiZi" width={70} height={24} className="w-[38px] xs:w-[45px] md:w-[65px] object-contain" />
                  </Link>

                  <div className="flex items-center gap-1.5 xs:gap-2 h-full ml-2 xs:ml-3 mr-0.5 xs:mr-1">
                    <button
                      onClick={toggleProfile}
                      className={`relative p-1 transition-all duration-200 shrink-0 ${
                        isProfileOpen
                          ? "text-[#562996] scale-110 opacity-100"
                          : isAnyDrawerOpen
                          ? "text-[#562996]/40 opacity-50"
                          : "text-[#562996]"
                      }`}
                    >
                      <User className="w-[15px] h-[15px] xs:w-[17px] xs:h-[17px] stroke-[2.5]" fill={isProfileOpen ? "currentColor" : "none"} />
                    </button>

                    <button
                      onClick={toggleNotifications}
                      className={`relative p-1 transition-all duration-200 shrink-0 ${
                        isNotificationsOpen
                          ? "text-[#562996] scale-110 opacity-100"
                          : isAnyDrawerOpen
                          ? "text-[#562996]/40 opacity-50"
                          : "text-[#562996]"
                      }`}
                    >
                      <Bell className="w-[15px] h-[15px] xs:w-[17px] xs:h-[17px] stroke-[2.5]" fill={isNotificationsOpen ? "currentColor" : "none"} />
                      <span className="absolute top-0 right-0 w-1 h-1 xs:w-1.5 xs:h-1.5 bg-[#eb4335] rounded-full shadow-sm" />
                    </button>

                    <button
                      onClick={() => {
                        setIsSearchChatOpen(!isSearchChatOpen);
                        setIsChatOpen(false);
                      }}
                      className={`relative p-1 mr-1 transition-all duration-200 shrink-0 ${
                        isSearchChatOpen
                          ? "text-[#562996] scale-110 opacity-100"
                          : isAnyDrawerOpen
                          ? "text-[#562996]/40 opacity-50"
                          : "text-[#562996]"
                      }`}
                    >
                      <Search className="w-[15px] h-[15px] xs:w-[17px] xs:h-[17px] stroke-[2.5]" />
                    </button>
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
            className="relative -mt-2 sm:-mt-1.5 md:-mt-2 z-20 w-11 h-[54px] xs:w-12 xs:h-[59px] sm:w-20 sm:h-20 md:w-24 md:h-24 bg-[#f76409] rounded-xl xs:rounded-[14px] sm:rounded-2xl md:rounded-[1.5rem] flex items-center justify-center shadow-[0_6px_16px_rgba(247,100,9,0.3)] sm:shadow-[0_4px_20px_rgba(247,100,9,0.45)] hover:-translate-y-1 sm:hover:-translate-y-2 transition-transform cursor-pointer shrink-0 border-0 sm:border-[6px] md:border-[7px] border-[#ffa168] mx-0.5 xs:mx-1 sm:mx-2 md:mx-2"
          >
            {/* unoptimized: next/image's optimizer serves a single frame for
                animated GIFs — this must stay dancing. 192px source (2x of the
                largest 96px render), palette-optimized to ~200KB. */}
            <Image src="/yukizi-happy-dance.gif" alt="Mascot" width={96} height={96} unoptimized className="w-full h-full object-cover rounded-xl xs:rounded-[14px] sm:rounded-xl md:rounded-[1.1rem]" />

            {/* Top dots */}
            <div className="absolute -top-[8px] left-[32%] w-[4px] h-[4px] sm:-top-[14px] sm:left-[32%] sm:w-[6px] sm:h-[6px] bg-[#ffa168] rounded-[1px] shadow-[0_0_4px_rgba(255,161,104,0.6)]" />
            <div className="absolute -top-[15px] left-[48%] w-[5px] h-[5px] sm:-top-[26px] sm:left-[48%] sm:w-[8px] sm:h-[8px] bg-[#ffa168] rounded-[1.5px] shadow-[0_0_5px_rgba(255,161,104,0.6)]" />
            <div className="absolute -top-[21px] left-[40%] w-[3px] h-[3px] sm:-top-[38px] sm:left-[40%] sm:w-[4px] sm:h-[4px] bg-[#ffa168] rounded-[0.5px] shadow-[0_0_3px_rgba(255,161,104,0.6)]" />
          </div>



          {/* Right Segment: Cart, Wishlist, Filter, Menu */}
          <div className="flex items-center justify-between bg-white sm:bg-[#562996] rounded-full sm:rounded-xl px-3.5 xs:px-4 sm:px-8 md:px-12 lg:px-16 h-9 sm:h-[60px] md:h-[64px] shadow-[0_6px_20px_rgba(0,0,0,0.08)] sm:shadow-2xl text-[#562996] sm:text-white sm:shrink-0 flex-[0.92] sm:flex-1 max-w-[480px] z-10 overflow-hidden min-w-0">

            <button
              onClick={toggleWishlist}
              className={`relative transition-all duration-200 hover:scale-110 flex items-center justify-center ${
                isWishlistOpen
                  ? "text-[#562996] sm:text-white scale-110 opacity-100"
                  : isAnyDrawerOpen
                  ? "text-[#562996]/40 sm:text-white/40 opacity-50"
                  : "text-[#562996] sm:text-white sm:hover:text-purple-300"
              }`}
            >
              <span 
                className={`w-[18px] h-[18px] xs:w-[24px] xs:h-[24px] sm:w-[26px] sm:h-[26px] md:w-[28px] md:h-[28px] shrink-0 ${
                  isWishlistOpen || wishlistCount > 0 ? "save-icon-active-mask" : "save-icon-mask"
                }`}
              />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 sm:text-[9px] bg-[#f7941d] text-white text-[8px] xs:text-[9px] font-bold rounded-full flex items-center justify-center border border-white sm:border-[#562996]">
                  {wishlistCount}
                </span>
              )}
            </button>

            <button
              onClick={toggleCart}
              className={`relative transition-all duration-200 hover:scale-110 ${
                isCartOpen
                  ? "text-[#562996] sm:text-white scale-110 opacity-100"
                  : isAnyDrawerOpen
                  ? "text-[#562996]/40 sm:text-white/40 opacity-50"
                  : "text-[#562996] sm:text-white sm:hover:text-purple-300"
              }`}
            >
              <ShoppingCart 
                className="w-[18px] h-[18px] xs:w-[24px] xs:h-[24px] sm:w-[26px] sm:h-[26px] md:w-[28px] md:h-[28px] stroke-[2]" 
                fill={isCartOpen ? "currentColor" : "none"}
              />
              {cartData?.items && cartData.items.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 sm:text-[9px] bg-[#f7941d] text-white text-[8px] xs:text-[9px] font-bold rounded-full flex items-center justify-center border border-white sm:border-[#562996]">
                  {cartData.items.length}
                </span>
              )}
            </button>

            <button
              onClick={() => router.push('/orders')}
              className={`hidden sm:block relative transition-all duration-200 hover:scale-110 ${
                isAnyDrawerOpen
                  ? "text-[#562996]/40 sm:text-white/40 opacity-50"
                  : "text-[#562996] sm:text-white sm:hover:text-purple-300"
              }`}
            >
              <img
                src="/icons/save box button.png"
                alt="Orders"
                className="w-[56px] h-[56px] xs:w-[60px] xs:h-[60px] sm:w-[64px] sm:h-[64px] md:w-[68px] md:h-[68px] object-contain brightness-0 invert"
              />
            </button>

            <button
              onClick={() => {
                toggleFilters();
                onFilterClick?.();
              }}
              className={`transition-all duration-200 hover:scale-110 ${
                sidebarView === "filters"
                  ? "text-[#562996] sm:text-white scale-110 opacity-100"
                  : isAnyDrawerOpen
                  ? "text-[#562996]/40 sm:text-white/40 opacity-50"
                  : "text-[#562996] sm:text-white sm:hover:text-purple-300"
              }`}
            >
              <Filter 
                className="w-[18px] h-[18px] xs:w-[24px] xs:h-[24px] sm:w-[26px] sm:h-[26px] md:w-[28px] md:h-[28px] stroke-[2]" 
                fill={sidebarView === "filters" ? "currentColor" : "none"}
              />
            </button>

            <button
              onClick={toggleMenu}
              className={`transition-all duration-200 hover:scale-110 ${
                isMobileMenuOpen
                  ? "text-[#562996] sm:text-white scale-110 opacity-100"
                  : isAnyDrawerOpen
                  ? "text-[#562996]/40 sm:text-white/40 opacity-50"
                  : "text-[#562996] sm:text-white sm:hover:text-purple-300"
              }`}
            >
              {isMobileMenuOpen ? (
                <X className="w-[18px] h-[18px] xs:w-[24px] xs:h-[24px] sm:w-[26px] sm:h-[26px] md:w-[28px] md:h-[28px] stroke-[2]" />
              ) : (
                <Menu className="w-[18px] h-[18px] xs:w-[24px] xs:h-[24px] sm:w-[26px] sm:h-[26px] md:w-[28px] md:h-[28px] stroke-[2]" />
              )}
            </button>
          </div>

          {/* Chat Box Popup (Mascot) */}
          <AnimatePresence>
            {isChatOpen && (
              <motion.div
                key="chat-popup"
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                className="absolute bottom-[-16px] md:bottom-[-24px] left-0 right-0 z-[-1] pointer-events-auto h-[75vh] max-h-[850px]"
              >
                <div className="w-full h-full bg-gradient-to-r from-[#8527bf] via-[#ae44eb] to-[#8d2bcd] rounded-2xl md:rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 flex flex-col">
                  {/* Chat Messages Area */}
                  {chatMessages.length > 0 && (
                    <div ref={chatContainerRef} className="flex-1 overflow-y-auto mb-4 flex flex-col gap-4 scrollbar-hide">
                      {chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${msg.role === 'user' ? 'bg-white text-[#7f26d9]' : 'bg-[#562996] text-white border border-white/20'}`}>
                            {msg.role === 'assistant' && msg.thoughts && (
                              <details className="mb-2 text-xs bg-white/10 rounded-xl p-2.5 border border-white/15 text-white/90">
                                <summary className="cursor-pointer font-semibold flex items-center gap-1.5 select-none hover:text-white transition-colors">
                                  <Brain className="w-3.5 h-3.5 text-purple-200" />
                                  Thinking Process {msg.thinkingTimeMs ? `(${(msg.thinkingTimeMs / 1000).toFixed(1)}s)` : ''}
                                </summary>
                                <div className="mt-2 text-2xs leading-relaxed whitespace-pre-wrap font-mono opacity-90 border-t border-white/10 pt-2">
                                  {msg.thoughts}
                                </div>
                              </details>
                            )}
                            <div className="whitespace-pre-wrap leading-relaxed">{formatFormattedMessage(msg.content)}</div>
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
                              <img src={att.data} alt="preview" loading="lazy" decoding="async" className="w-full h-full object-cover rounded" />
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
                      ref={chatTextareaRef}
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
                    {/* Action Tool Icons */}
                    <div className="flex items-center gap-3.5 xs:gap-4 sm:gap-7 text-white ml-1 md:ml-4">
                      <button onClick={handleNewChat} className="hover:text-white/80 transition-colors" title="New Chat">
                        <MessageSquarePlus className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2]" />
                      </button>
                      <button onClick={handleHistory} className="hover:text-white/80 transition-colors" title="Chat History">
                        <Clock className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2]" />
                      </button>
                      <button onClick={handleShare} className="hover:text-white/80 transition-colors" title="Share Chat">
                        <Share2 className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2]" />
                      </button>
                      <button onClick={handleRegenerate} disabled={isChatLoading || chatMessages.length < 2} className="hover:text-white/80 transition-colors disabled:opacity-50" title="Regenerate Response">
                        <RotateCw className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
                      </button>
                      <button onClick={() => fileInputRef.current?.click()} className="hover:text-white/80 transition-colors" title="Upload File">
                        <Plus className="w-6 h-6 sm:w-7 sm:h-7 stroke-[3]" />
                      </button>
                      <button onClick={handleVoiceInput} className={`transition-colors ${isRecording ? 'text-red-400 animate-pulse' : 'hover:text-white/80'}`} title="Voice Input">
                        <AudioLines className="w-6 h-6 sm:w-8 sm:h-8 stroke-[2]" />
                      </button>
                    </div>

                    {/* Send Button on the right */}
                    <div className="flex items-center text-white mr-1 md:mr-4">
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
                                  className="p-2 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-all"
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
                className="absolute bottom-[-16px] md:bottom-[-24px] left-0 right-0 z-[-2] pointer-events-auto h-[50vh] max-h-[600px]"
              >
                <div className="w-full h-full bg-white rounded-2xl md:rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.1)] border border-gray-100 p-6 sm:p-8 md:p-10 flex flex-col relative overflow-hidden">

                  {/* Subtle pink/purple glow behind the mascot area */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300px] h-[150px] bg-pink-500/10 blur-[50px] pointer-events-none rounded-full" />

                  {/* Chat Box Header / Input Area */}
                  <div className="pb-2 z-10">
                    <textarea
                      ref={searchTextareaRef}
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSearchSubmit();
                        }
                      }}
                      rows={1}
                      placeholder="Start typing ..."
                      className="w-full bg-transparent text-[#562996] text-base sm:text-xl md:text-2xl placeholder-[#a66ee8] outline-none resize-none font-medium"
                    />
                  </div>

                  {/* Live results while typing, like every search box the team
                      is used to - image, name, price. Enter still opens the
                      full results page. */}
                  <div className="flex-1 overflow-y-auto z-10 -mx-2 px-2">
                    {searchInput.trim().length >= 2 && (
                      isSearchLoading ? (
                        <p className="text-sm text-gray-400 px-2 py-3">Searching…</p>
                      ) : searchResults.length === 0 ? (
                        <p className="text-sm text-gray-400 px-2 py-3">
                          Nothing matches “{searchInput.trim()}” yet.
                        </p>
                      ) : (
                        <ul className="divide-y divide-gray-50">
                          {searchResults.map((p: any) => (
                            <li key={p.id}>
                              <button
                                onClick={() => {
                                  track('product_click', { from: 'search', query: searchInput.trim().toLowerCase().slice(0, 100) }, p.id);
                                  router.push(`/products/${p.slug}`);
                                  setIsSearchChatOpen(false);
                                  setSearchInput('');
                                }}
                                className="w-full flex items-center gap-3 py-2.5 px-2 rounded-xl hover:bg-purple-50/60 transition-colors text-left"
                              >
                                <img
                                  src={p.image || 'https://placehold.co/96x96/f3f4f6/9ca3af?text=%20'}
                                  alt={`${p.name ?? ''} - Yukizi`}
                                  className="w-12 h-12 rounded-lg object-cover bg-gray-100 shrink-0"
                                />
                                <span className="flex-1 min-w-0">
                                  <span className="block text-sm font-semibold text-gray-800 truncate">{p.name}</span>
                                  {p.manufacturer && (
                                    <span className="block text-xs text-gray-400 truncate">{p.manufacturer}</span>
                                  )}
                                </span>
                                {(p.price ?? p.mrp) != null && (
                                  <span className="text-sm font-bold text-gray-800 shrink-0">
                                    ₹{Number(p.price ?? p.mrp).toLocaleString('en-IN')}
                                  </span>
                                )}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )
                    )}
                  </div>

                  {/* Search Box Footer */}
                  {/* Four tool icons used to sit on the left here — Search
                      History, Reset Search, Add Filter, Voice Search. None of
                      them had an onClick, so every one was decorative and did
                      nothing when pressed. Removed rather than wired up,
                      because none of those features exist to wire them to. */}
                  <div className="flex items-center justify-end pb-[70px] md:pb-[80px] px-2 md:px-4 z-10">

                    {/* Send Button on the right */}
                    <div className="flex items-center text-gray-700 mr-1 md:mr-4">
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



      {/* Menu Drawer. Mobile: full-screen, bottom-up, sits below the floating
          nav bar's z-[90] so the bar stays visible/usable over it, same
          trick the search panel uses. Desktop (lg+): a fixed-width panel
          docked to the right edge, sliding in from the right instead -
          full-bleed reads wrong once there's a whole desktop viewport
          behind it. */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            key="mobile-menu-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#6342B4]/35 z-[85] backdrop-blur-none"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        {isMobileMenuOpen && (
          <motion.div
            key="mobile-menu-panel"
            initial={isDesktop ? { x: "100%" } : { y: "100%" }}
            animate={isDesktop ? { x: 0 } : { y: 0 }}
            exit={isDesktop ? { x: "100%" } : { y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 lg:inset-y-0 lg:left-auto lg:right-0 lg:w-[420px] lg:max-w-[90vw] bg-white z-[86] shadow-2xl flex flex-col p-6 sm:p-8"
          >
            {/* Hidden Close Button */}
            <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 bg-white/80 rounded-full z-[80] transition-colors">
              <X className="w-5 h-5" />
            </button>
            {/* Header */}
            <div className="flex justify-between items-center mb-10 pt-4">
              <h2 className="text-[22px] font-bold text-[#2d2d2d] tracking-tight">Menu</h2>
              <div className="flex items-center gap-3.5">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsSupportDrawerOpen(true);
                  }}
                  className="text-[#484848] hover:text-black transition-colors flex items-center justify-center"
                  title="Customer Support"
                >
                  <img
                    src="/headphone.png"
                    alt="Customer Support"
                    className="w-[28px] h-[28px] object-contain"
                  />
                </button>
                <div style={{ width: '1.5px', height: '24px', backgroundColor: '#b5b5b5' }} />
                {isAuthenticated ? (
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-[#484848] text-[16px] font-medium hover:text-black transition-colors tracking-wide"
                  >
                    Sign out
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onLoginClick?.();
                    }}
                    className="text-[#484848] text-[16px] font-medium hover:text-black transition-colors tracking-wide"
                  >
                    Sign in
                  </button>
                )}
              </div>
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
            {isAuthenticated && (
              <div className="mt-auto pt-2 pb-24 flex sm:hidden justify-end pr-2 gap-4">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    router.push('/orders');
                  }}
                  className="w-10 h-10 rounded-full bg-[#f3ebfa] flex items-center justify-center text-[#8e44ad] hover:bg-[#ebdcf7] transition-all duration-200 shadow-sm border border-purple-100"
                >
                  <Package className="w-5 h-5 stroke-[2]" />
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsProfileOpen(true);
                  }}
                  className="w-10 h-10 rounded-full bg-[#f3ebfa] flex items-center justify-center text-[#8e44ad] hover:bg-[#ebdcf7] transition-all duration-200 shadow-sm border border-purple-100"
                >
                  <User className="w-5 h-5 stroke-[2]" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drawers */}
      <EditProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

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

      <SupportDrawer
        isOpen={isSupportDrawerOpen}
        onClose={() => setIsSupportDrawerOpen(false)}
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
