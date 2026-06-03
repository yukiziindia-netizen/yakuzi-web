"use client";

import { useRouter } from "next/navigation";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  User,
  ShoppingBag,
  ShoppingCart,
  LogOut,
  ClipboardList,
  HelpCircle,
  ArrowRight,
  Bookmark,
  Menu,
  X,
  LifeBuoy,
  Filter,
  ChevronDown,
  Search,
  Package,
  ChevronUp,
  Share2,
  Clock,
  RotateCw,
  Plus,
  AudioLines,
  Send,
  LayoutGrid,

} from "lucide-react";



import CategoryMegaMenu from "@/components/landing/CategoryMegaMenu";
import CartDrawer from "@/components/cart/CartDrawer";
import WishlistDrawer from "@/components/wishlist/WishlistDrawer";
import NotificationDrawer from "@/components/notifications/NotificationDrawer";
import SearchBar from "@/components/shared/SearchBar";
import { SidebarSheet, type SidebarView } from "@/components/landing/SidebarSheet";

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
  const [isNotificationsOpen, setIsNotificationsOpen] =
    useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] =
    useState(false);
  const [sidebarView, setSidebarView] = useState<SidebarView>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSearchChatOpen, setIsSearchChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

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

    return () => {
      if (scrollContainer) scrollContainer.removeEventListener('wheel', handleWheel);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleChatSubmit = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: chatInput.trim() };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await sendChatMessage(userMessage.content, chatMessages);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error processing your request.' }]);
    } finally {
      setIsChatLoading(false);
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
          <div className="flex items-center bg-white sm:bg-[#562996] rounded-xl sm:rounded-xl md:rounded-xl px-2 xs:px-3 sm:px-4 md:px-6 py-1.5 sm:py-3 md:py-3.5 shadow-md sm:shadow-2xl flex-1 max-w-[480px] justify-between overflow-hidden min-w-0">
            
            {/* DESKTOP VIEW (sm and up) */}
            <div className="hidden sm:flex items-center w-full justify-between">
              <div className="flex items-center h-full">
                <Link href="/" className="font-black text-xl md:text-2xl tracking-tighter uppercase shrink-0 text-white" style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}>
                  YUKIZI
                </Link>
                
                <div className="flex items-center gap-4 ml-6 md:ml-8 lg:ml-10">
                  {isAuthenticated ? (
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
                  ) : (
                    <button onClick={onLoginClick} className="text-white hover:text-purple-300 transition-colors flex items-center">
                      <User className="w-5 h-5 md:w-6 md:h-6 stroke-[2]" />
                    </button>
                  )}

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
                </div>
              </div>

              <div className="relative flex items-center justify-end w-[160px] md:w-[200px] lg:w-[220px]">
                <input
                  type="text"
                  placeholder="Search"
                  readOnly
                  onClick={() => {
                    setIsSearchChatOpen(!isSearchChatOpen);
                    setIsChatOpen(false);
                  }}
                  className="w-full h-8 md:h-[34px] bg-white rounded-md text-gray-800 text-[13px] md:text-[14px] pl-3 md:pl-4 pr-10 focus:outline-none cursor-pointer placeholder-gray-400 shadow-sm font-medium"
                />
                <Search className="w-4 h-4 text-gray-400 absolute right-3 md:right-4 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
              </div>
            </div>

            {/* MOBILE VIEW (below sm) */}
            <div className="flex sm:hidden items-center w-full justify-between gap-1">
              {!isAuthenticated ? (
                // BEFORE LOGIN (Image 3 layout)
                <button onClick={onLoginClick} className="flex items-center gap-1.5 bg-[#562996] text-white rounded-full px-3 py-1.5 shrink-0 hover:bg-[#482080] transition-colors">
                  <span className="font-black text-sm xs:text-base tracking-tighter uppercase" style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}>YUKIZI</span>
                  <span className="text-[10px] xs:text-xs font-semibold whitespace-nowrap">Start Now</span>
                </button>
              ) : (
                // AFTER LOGIN (Image 2 layout)
                <div className="flex items-center gap-1.5 xs:gap-2">
                  <Link href="/" className="font-black text-sm xs:text-base tracking-tighter uppercase shrink-0 text-[#562996]" style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}>
                    YUKIZI
                  </Link>
                  <button onClick={() => setIsNotificationsOpen(true)} className="relative p-1 text-[#562996] hover:text-purple-400 transition-colors shrink-0">
                    <Bell className="w-4 h-4 xs:w-5 xs:h-5" />
                    {unreadNotificationCount > 0 && (
                      <span className="absolute top-0 right-0 w-2 h-2 bg-[#f7941d] rounded-full border border-white" />
                    )}
                  </button>
                </div>
              )}

              <div className="relative shrink-0 flex items-center w-[110px] xs:w-[130px]"
                   onClick={() => {
                     setIsSearchChatOpen(!isSearchChatOpen);
                     setIsChatOpen(false);
                   }}>
                <input
                  type="text"
                  placeholder="Search"
                  readOnly
                  className="w-full h-[30px] bg-white border border-gray-200 rounded-full text-[#333] text-[12px] pl-3 pr-8 focus:outline-none cursor-pointer placeholder-[#a0a0a0] shadow-sm font-medium"
                />
                <Search className="w-[14px] h-[14px] text-[#a0a0a0] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none stroke-2" />
              </div>
            </div>
          </div>

          {/* Center Mascot */}
          <div 
            onClick={() => {
              setIsChatOpen(!isChatOpen);
              setIsSearchChatOpen(false);
            }}
            className="relative -mt-6 sm:-mt-8 md:-mt-10 z-20 w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-[#ffb040] rounded-xl sm:rounded-2xl md:rounded-[1.5rem] flex items-center justify-center shadow-[0_0_15px_rgba(255,176,64,0.4)] sm:shadow-[0_0_20px_rgba(255,176,64,0.5)] hover:-translate-y-1 sm:hover:-translate-y-2 transition-transform cursor-pointer shrink-0 mx-0.5 xs:mx-1 sm:mx-2 md:mx-4"
          >
            <Image src="/yukizi.jpg" alt="Mascot" width={96} height={96} className="w-full h-full object-cover rounded-xl sm:rounded-2xl md:rounded-[1.5rem]" />
          </div>



          {/* Right Segment: Cart, Wishlist, Filter, Menu */}
          <div className="flex items-center justify-between bg-white sm:bg-[#562996] rounded-xl sm:rounded-xl md:rounded-xl px-4 xs:px-6 sm:px-8 md:px-12 lg:px-16 py-2 sm:py-3 md:py-3.5 shadow-md sm:shadow-2xl text-[#562996] sm:text-white shrink-0 flex-1 max-w-[480px] z-10 overflow-hidden min-w-0">

            <button onClick={() => setSidebarView("wishlist")} className="relative hover:text-purple-300 transition-colors">
              <svg xmlns="http://w3.org" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7221c4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 4h16v16H4l4-8Z" />
</svg>

              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-[#f7941d] text-white text-[9px] sm:text-[10px] font-bold rounded-full flex items-center justify-center border border-white sm:border-[#562996]">
                  {wishlistCount}
                </span>
              )}
            </button>

            <button onClick={() => setSidebarView("cart")} className="relative hover:text-purple-300 transition-colors">
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
              {cartData?.items && cartData.items.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-[#f7941d] text-white text-[9px] sm:text-[10px] font-bold rounded-full flex items-center justify-center border border-white sm:border-[#562996]">
                  {cartData.items.length}
                </span>
              )}
            </button>

            <button className="hidden sm:block hover:text-purple-300 transition-colors">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
            </button>

            <button onClick={() => {
              setSidebarView("filters");
              onFilterClick?.();
            }} className="hover:text-purple-300 transition-colors">
              <Filter className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
            </button>

            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="hover:text-purple-300 transition-colors">
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
              ) : (
                <Menu className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
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
                  <div className="flex-1 overflow-y-auto mb-4 flex flex-col gap-4 scrollbar-hide">
                    {chatMessages.length === 0 ? (
                      <div className="flex-1 flex flex-col justify-end">
                         {/* Placeholder space when empty */}
                      </div>
                    ) : (
                      chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${msg.role === 'user' ? 'bg-white text-[#7f26d9]' : 'bg-[#562996] text-white border border-white/20'}`}>
                            {msg.content}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {/* Chat Box Header / Input Area */}
                  <div className={`${chatMessages.length > 0 ? 'h-16 shrink-0' : 'flex-1'} transition-all duration-300 pb-4`}>
                    <textarea 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleChatSubmit();
                        }
                      }}
                      placeholder="Start typing ..."
                      className="w-full h-full bg-transparent text-white text-base sm:text-xl md:text-2xl placeholder-white/70 outline-none resize-none font-medium"
                      disabled={isChatLoading}
                    />
                  </div>
                  
                  {/* Chat Box Footer (Positioned above the navbar) */}
                  <div className="flex items-center justify-between pb-[70px] md:pb-[80px] px-2 md:px-4">
                    {/* Left Icons */}
                    <div className="flex items-center gap-5 sm:gap-7 text-white ml-2 md:ml-4">
                      <button className="hover:text-white/80 transition-colors">
                        <Share2 className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2]" />
                      </button>
                      <button className="hover:text-white/80 transition-colors">
                        <Clock className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2]" />
                      </button>
                    </div>
                    
                    {/* Right Icons */}
                    <div className="flex items-center gap-5 sm:gap-7 text-white mr-2 md:mr-4">
                      <button className="hover:text-white/80 transition-colors">
                        <RotateCw className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
                      </button>
                      <button className="hover:text-white/80 transition-colors">
                        <Plus className="w-6 h-6 sm:w-7 sm:h-7 stroke-[3]" />
                      </button>
                      <button className="hover:text-white/80 transition-colors">
                        <AudioLines className="w-6 h-6 sm:w-8 sm:h-8 stroke-[2]" />
                      </button>
                      <button 
                        onClick={handleChatSubmit}
                        disabled={isChatLoading}
                        className={`w-12 h-10 sm:w-16 sm:h-12 bg-white rounded-xl flex items-center justify-center transition-colors shadow-lg ml-2 ${isChatLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                      >
                        {isChatLoading ? (
                           <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-[#562996] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send className="w-5 h-5 sm:w-6 sm:h-6 text-[#562996] fill-[#562996]" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
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
                  <div className="flex items-center justify-end pb-[70px] md:pb-[80px] px-2 md:px-4 z-10">
                    <button 
                      onClick={handleSearchSubmit}
                      className="w-12 h-10 sm:w-16 sm:h-12 bg-white rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors shadow-md border border-gray-100"
                    >
                      <Send className="w-5 h-5 sm:w-6 sm:h-6 text-[#562996] fill-[#562996]" />
                    </button>
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
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
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
            className="fixed top-0 right-0 bottom-0 w-[85%] max-w-[400px] bg-white z-50 shadow-2xl rounded-l-3xl flex flex-col p-6 sm:p-8"
          >
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
            <div className="flex-1 overflow-y-auto space-y-6 scrollbar-hide mt-16 sm:mt-24 pb-24">
              {categories.map((category: Category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug || category.id}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex justify-between items-center text-gray-700 hover:text-black transition-colors group"
                >
                  <span className="text-[15px] font-medium tracking-wide">{category.name}</span>
                  <ChevronUp className="w-6 h-6 text-gray-400 group-hover:text-gray-600 transition-colors" strokeWidth={2.5} />
                </Link>
              ))}
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

      <SidebarSheet
        view={sidebarView}
        onClose={() => setSidebarView(null)}
        onViewChange={setSidebarView}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() =>
          setIsNotificationsOpen(false)
        }
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