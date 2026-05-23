"use client";

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
} from "lucide-react";

import CategoryMegaMenu from "@/components/landing/CategoryMegaMenu";
import CartDrawer from "@/components/cart/CartDrawer";
import WishlistDrawer from "@/components/wishlist/WishlistDrawer";
import NotificationDrawer from "@/components/notifications/NotificationDrawer";
import SearchBar from "@/components/shared/SearchBar";
import { SidebarSheet, type SidebarView } from "@/components/landing/SidebarSheet";

import { useAuth, type Category } from "@pharmabag/api-client";
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
        <div className="flex items-center gap-2 sm:gap-6 md:gap-2 pointer-events-auto flex-wrap sm:flex-nowrap justify-center w-full max-w-[1200px] px-1 sm:px-4 relative">

          {/* Left Segment: Logo, Profile, Notifications, Search */}
          <div className="flex items-center bg-[#562996] rounded-[1.25rem] md:rounded-[1.5rem] px-3 xs:px-4 sm:px-6 md:px-8 py-2 sm:py-3.5 md:py-4 gap-2 xs:gap-3 sm:gap-5 md:gap-8 shadow-2xl text-white flex-1 justify-between max-w-[800px]">
            {/* Logo */}
            <Link href="/" className="font-black text-sm xs:text-lg sm:text-2xl tracking-tighter uppercase shrink-0" style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}>
              YUKIZI
            </Link>

            <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 border-l border-white/20 pl-1.5 xs:pl-2 sm:pl-3 shrink-0">
              {/* Profile / Start Now */}
              {isAuthenticated ? (
                <div className="hidden md:block relative" ref={profileDropdownRef}>
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="p-1 text-white hover:text-sky-300 transition-colors"
                  >
                    <User className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>

                  <AnimatePresence>
                    {isProfileDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute left-0 bottom-full mb-3 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-[60]"
                      >
                        <Link
                          href="/profile"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-sky-600 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          My Profile
                        </Link>
                        <Link
                          href="/orders"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-sky-600 transition-colors"
                        >
                          <ClipboardList className="w-4 h-4" />
                          My Orders
                        </Link>
                        <div className="h-px bg-gray-50 my-1 mx-2" />
                        <button
                          onClick={() => {
                            handleLogout();
                            setIsProfileDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  {/* Start Now on mobile */}
                  <button onClick={onLoginClick} className="md:hidden bg-white/20 hover:bg-white/30 px-1.5 xs:px-2 py-0.5 rounded text-[9px] xs:text-[10px] font-bold text-white transition-colors shrink-0">
                    Start Now
                  </button>
                  {/* User icon on desktop */}
                  <button onClick={onLoginClick} className="hidden md:block p-1 hover:text-sky-300 transition-colors">
                    <User className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </>
              )}

              {/* Notification: Always visible */}
              <button onClick={() => setIsNotificationsOpen(true)} className="relative p-0.5 sm:p-1 hover:text-sky-300 transition-colors shrink-0">
                <Bell className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute top-0 right-0 w-2 h-2 xs:w-2.5 xs:h-2.5 bg-[#f7941d] rounded-full border-2 border-[#562996]" />
                )}
              </button>
            </div>

            {/* Search Box - Visible everywhere, smaller on mobile */}
            <div className="relative ml-0.5 xs:ml-1 shrink-0 flex-1 md:flex-none">
              <input
                type="text"
                placeholder="Search"
                readOnly
                onClick={() => {
                  setIsSearchChatOpen(!isSearchChatOpen);
                  setIsChatOpen(false);
                }}
                className="pl-2 pr-5 py-0.5 sm:pl-3 sm:pr-8 sm:py-1.5 md:py-2 rounded-[4px] sm:rounded-lg text-black text-[9px] sm:text-sm w-[60px] xs:w-[80px] sm:w-[150px] md:w-[280px] focus:outline-none placeholder-gray-400 cursor-pointer"
              />
              <Search className="w-2.5 h-2.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-400 absolute right-1 sm:right-2.5 top-1 sm:top-2 md:top-2.5" />
            </div>
          </div>

          {/* Center Mascot */}
          <div 
            onClick={() => {
              setIsChatOpen(!isChatOpen);
              setIsSearchChatOpen(false);
            }}
            className="relative -mt-6 sm:-mt-8 md:-mt-10 z-20 w-14 h-14 xs:w-16 xs:h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-[#ffb040] rounded-xl sm:rounded-2xl md:rounded-[1.5rem] flex items-center justify-center shadow-lg hover:-translate-y-2 transition-transform cursor-pointer border-2 sm:border-4 border-white shrink-0 mx-1 sm:mx-2 md:mx-4"
          >
            <Image src="/yukizi.jpg" alt="Mascot" width={96} height={96} className="w-full h-full object-cover rounded-xl sm:rounded-2xl md:rounded-[1.25rem] drop-shadow-lg" />
          </div>

          {/* Right Segment: Cart, Wishlist, Filter, Menu */}
          <div className="flex items-center justify-end bg-[#562996] rounded-[1.25rem] md:rounded-[1.5rem] px-3 xs:px-4 sm:px-6 md:px-8 py-2 sm:py-3.5 md:py-4 gap-2 xs:gap-3 sm:gap-6 md:gap-8 shadow-2xl text-white shrink-0 flex-1 max-w-[800px] z-10">

            {/* Wishlist */}
            <button onClick={() => setIsWishlistOpen(true)} className="relative p-0.5 sm:p-1 hover:text-sky-300 transition-colors">
              <Bookmark className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Cart */}
            <button onClick={() => setIsCartOpen(true)} className="relative p-0.5 sm:p-1 hover:text-sky-300 transition-colors">
              <ShoppingCart className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
              {cartData?.items && cartData.items.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-[#f7941d] text-white text-[8px] sm:text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartData.items.length}
                </span>
              )}
            </button>

            {/* Box / Orders - Hidden on mobile */}
            <Link href="/orders" className="p-0.5 sm:p-1 hover:text-sky-300 transition-colors hidden md:block">
              <Package className="w-5 h-5 sm:w-6 sm:h-6" />
            </Link>

            {/* Filter - Visible everywhere */}
            <button onClick={() => {
              setSidebarView("filters");
              onFilterClick?.();
            }} className="p-0.5 sm:p-1 md:p-1.5 hover:text-sky-300 transition-colors">
              <Filter className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
            </button>

            {/* Menu */}
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-0.5 sm:p-1 md:p-1.5 hover:text-sky-300 transition-colors">
              {isMobileMenuOpen ? (
                <X className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
              ) : (
                <Menu className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
              )}
            </button>
          </div>
          
          {/* Chat Box Popup (Mascot) */}
          <AnimatePresence>
            {isChatOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="absolute bottom-full mb-4 left-2 right-2 sm:left-6 sm:right-6 md:left-4 md:right-4 z-0 pointer-events-auto"
              >
                <div className="w-full bg-gradient-to-br from-[#a656f2] to-[#8d3ce1] rounded-[1.5rem] md:rounded-[2rem] shadow-2xl p-6 sm:p-8 flex flex-col h-[250px] sm:h-[300px] md:h-[400px]">
                  {/* Chat Box Header / Input Area */}
                  <div className="flex-1">
                    <textarea 
                      placeholder="Start typing ..."
                      className="w-full h-full bg-transparent text-white text-lg sm:text-2xl placeholder-white/70 outline-none resize-none font-medium"
                    />
                  </div>
                  
                  {/* Chat Box Footer */}
                  <div className="flex items-center justify-between mt-4">
                    {/* Left Icons */}
                    <div className="flex items-center gap-4 text-white">
                      <button className="hover:text-white/80 transition-colors">
                        <Share2 className="w-6 h-6" />
                      </button>
                      <button className="hover:text-white/80 transition-colors">
                        <Clock className="w-6 h-6" />
                      </button>
                    </div>
                    
                    {/* Right Icons */}
                    <div className="flex items-center gap-4 text-white">
                      <button className="hover:text-white/80 transition-colors">
                        <RotateCw className="w-6 h-6" />
                      </button>
                      <button className="hover:text-white/80 transition-colors">
                        <Plus className="w-6 h-6" />
                      </button>
                      <button className="hover:text-white/80 transition-colors">
                        <AudioLines className="w-6 h-6" />
                      </button>
                      <button className="w-12 h-12 bg-white rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors shadow-sm ml-2">
                        <Send className="w-6 h-6 text-black -ml-1" />
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
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="absolute bottom-full mb-6 left-0 right-0 w-full z-0 pointer-events-auto px-1 sm:px-4"
              >
                <div className="w-full bg-white rounded-2xl md:rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 p-4 sm:p-6 flex flex-col h-[180px] sm:h-[220px] md:h-[250px]">
                  {/* Chat Box Header / Input Area */}
                  <div className="flex-1">
                    <textarea 
                      placeholder="Start typing ..."
                      className="w-full h-full bg-transparent text-gray-800 text-sm sm:text-base placeholder-gray-400 outline-none resize-none font-medium"
                    />
                  </div>
                  
                  {/* Chat Box Footer */}
                  <div className="flex items-center justify-between mt-2">
                    {/* Left Icons */}
                    <div className="flex items-center text-gray-600">
                      <button className="p-2 hover:text-black hover:bg-gray-50 rounded-lg transition-colors">
                        <Clock className="w-5 h-5" />
                      </button>
                    </div>
                    
                    {/* Right Icons */}
                    <div className="flex items-center gap-1 sm:gap-2 text-gray-600">
                      <button className="p-2 hover:text-black hover:bg-gray-50 rounded-lg transition-colors">
                        <RotateCw className="w-5 h-5" />
                      </button>
                      <button className="p-2 hover:text-black hover:bg-gray-50 rounded-lg transition-colors">
                        <Plus className="w-5 h-5" />
                      </button>
                      <button className="p-2 hover:text-black hover:bg-gray-50 rounded-lg transition-colors">
                        <AudioLines className="w-5 h-5" />
                      </button>
                      <button className="ml-1 sm:ml-2 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors p-2.5 sm:p-3">
                        <Send className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-900" />
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
              {[
                'Comic Books',
                'Manga',
                'Merch',
                'Events',
                'Cosplay',
                'Bookstores',
                'Animation',
                'Art institutes',
                'Others',
              ].map((item, i) => (
                <Link
                  key={i}
                  href="#"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex justify-between items-center text-gray-700 hover:text-black transition-colors group"
                >
                  <span className="text-[15px] font-medium tracking-wide">{item}</span>
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