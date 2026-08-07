'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Menu, ChevronDown, Bell, User, Search } from 'lucide-react';
import PremiumBrandsMegaMenu from '@/components/shared/PremiumBrandsMegaMenu';
import PremiumCategoriesMegaMenu from '@/components/shared/PremiumCategoriesMegaMenu';
import CartDrawer from '@/components/cart/CartDrawer';
import { OrderDrawer } from '@/components/orders/OrderDrawer';
import { useScrollLock } from '@/hooks/useScrollLock';
import { useCart } from '@/hooks/useCart';
import { useNotifications } from '@/hooks/useNotifications';

import { useAuth, getCategories, Category } from '@yukizi/api-client';

interface PremiumNavbarProps {
  onLoginClick?: () => void;
}

export default function PremiumNavbar({ onLoginClick }: PremiumNavbarProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [isBrandsMenuOpen, setIsBrandsMenuOpen] = useState(false);
  const [isCategoriesMenuOpen, setIsCategoriesMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrderDrawerOpen, setIsOrderDrawerOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: cart } = useCart();
  const cartItemCount = cart?.items?.length || 0;

  const { data: notifData } = useNotifications();
  const hasUnread = (notifData as any)?.unreadCount > 0 || ((notifData as any)?.data || []).some((n: any) => !n.isRead && !n.read);

  const navItems = [
    { label: 'Brands', href: '#', type: 'menu' },
    { label: 'Categories', href: '#', type: 'category' },
    ...(categories.length > 0
      ? categories.map(c => ({
        label: c.label || c.name,
        href: `/?category=${c.id}`,
        type: 'link',
        categoryId: c.id,
        subCategories: c.subCategories || (c as any).subcategories || [],
      }))
      : []
    ),
  ];

  useEffect(() => {
    setIsMounted(true);
    getCategories().then(setCategories).catch(err => console.error('Failed to fetch categories:', err));
  }, []);

  const isAnyOpen = isMobileMenuOpen || isCartOpen || isOrderDrawerOpen;
  useScrollLock(isAnyOpen);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseEnter = (type: 'brands' | 'categories') => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (type === 'brands') {
      setIsBrandsMenuOpen(true);
      setIsCategoriesMenuOpen(false);
    } else {
      setIsCategoriesMenuOpen(true);
      setIsBrandsMenuOpen(false);
    }
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsBrandsMenuOpen(false);
      setIsCategoriesMenuOpen(false);
    }, 150);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Open cart drawer from anywhere via event
  useEffect(() => {
    const handleOpenCart = () => setIsCartOpen(true);
    window.addEventListener('open-cart', handleOpenCart);
    return () => window.removeEventListener('open-cart', handleOpenCart);
  }, []);

  return (
    <>
      {/* ── DESKTOP NAVBAR ─────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{ background: '#7B2FBE' }}
      >
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 flex items-center h-[64px] gap-6">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center" style={{ textDecoration: 'none' }}>
            <span
              style={{
                fontFamily: "'Outfit', 'Inter', sans-serif",
                fontWeight: 700,
                fontSize: 28,
                color: '#fff',
                letterSpacing: '-1px',
                fontStyle: 'italic',
                textTransform: 'uppercase',
                lineHeight: 1,
              }}
            >
              YUK<span style={{ color: '#FFD700' }}>i</span>Zi
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-7 ml-4">
            {navItems.map((item) =>
              item.type === 'menu' ? (
                <div
                  key={item.label}
                  onMouseEnter={() => handleMouseEnter('brands')}
                  onMouseLeave={handleMouseLeave}
                  className="relative cursor-pointer py-2"
                >
                  <span className="text-sm font-semibold text-white/90 hover:text-white transition-colors">
                    {item.label}
                  </span>
                </div>
              ) : item.type === 'category' ? (
                <div
                  key={item.label}
                  onMouseEnter={() => handleMouseEnter('categories')}
                  onMouseLeave={handleMouseLeave}
                  className="relative cursor-pointer py-2"
                >
                  <span className="text-sm font-semibold text-white/90 hover:text-white transition-colors">
                    {item.label}
                  </span>
                </div>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-sm font-semibold text-white/90 hover:text-white transition-colors py-2"
                >
                  {item.label}
                </Link>
              )
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* ── Right section (authenticated desktop) ── */}
          {isMounted && isAuthenticated ? (
            <div className="hidden lg:flex items-center gap-4">
              {/* Profile icon */}
              <Link href="/profile" title="Profile" className="flex items-center justify-center">
                <User className="w-6 h-6 text-white" strokeWidth={1.6} />
              </Link>

              {/* Divider */}
              <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.3)' }} />

              {/* Bell icon with notification dot */}
              <button
                onClick={() => setIsOrderDrawerOpen(true)}
                className="relative flex items-center justify-center"
                title="Notifications"
              >
                <Bell className="w-6 h-6 text-white" strokeWidth={1.6} />
                <span
                  className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
                  style={{ background: '#FF8C00', border: '2px solid #7B2FBE' }}
                />
              </button>

              {/* Divider */}
              <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.3)' }} />

              {/* Search bar */}
              <form onSubmit={handleSearch} className="flex items-center">
                <div
                  className="flex items-center gap-2 px-4 py-2 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.95)', minWidth: 200 }}
                >
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm text-gray-500 placeholder-gray-400 flex-1 min-w-0"
                    style={{ color: '#7B2FBE' }}
                  />
                  <button type="submit" className="flex-shrink-0">
                    <Search className="w-4 h-4" style={{ color: '#7B2FBE' }} />
                  </button>
                </div>
              </form>
            </div>
          ) : isMounted && !isAuthenticated ? (
            <div className="hidden lg:flex items-center gap-4">
              {/* Search bar even when not authenticated */}
              <form onSubmit={handleSearch} className="flex items-center">
                <div
                  className="flex items-center gap-2 px-4 py-2 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.95)', minWidth: 200 }}
                >
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm placeholder-gray-400 flex-1 min-w-0"
                    style={{ color: '#7B2FBE' }}
                  />
                  <button type="submit" className="flex-shrink-0">
                    <Search className="w-4 h-4" style={{ color: '#7B2FBE' }} />
                  </button>
                </div>
              </form>

              <button
                onClick={onLoginClick}
                className="px-5 py-2 rounded-full font-semibold text-sm transition-all"
                style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)' }}
              >
                Sign In
              </button>
            </div>
          ) : null}

          {/* Mobile: cart + hamburger */}
          <div className="flex lg:hidden items-center gap-3 ml-auto">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-lime-300 text-2xs font-bold text-black border-2 border-white">
                  {cartItemCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 rounded-lg"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen
                ? <X className="w-5 h-5 text-white" />
                : <Menu className="w-5 h-5 text-white" />
              }
            </button>
          </div>
        </div>
      </nav>

      {/* ── MOBILE MENU DRAWER ─────────────────────────────────────── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#6342B4]/35 z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-[92%] sm:w-[500px] md:w-[520px] max-w-full bg-white z-50 shadow-2xl lg:hidden overflow-y-auto"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100" style={{ background: '#7B2FBE' }}>
                <span style={{ fontWeight: 700, fontSize: 24, color: '#fff', fontStyle: 'italic', letterSpacing: '-0.5px', textTransform: 'uppercase' }}>
                  YUK<span style={{ color: '#FFD700' }}>i</span>Zi
                </span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Mobile search */}
              <div className="p-4 border-b border-gray-100">
                <form onSubmit={handleSearch} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm flex-1 min-w-0 text-gray-700 placeholder-gray-400"
                  />
                </form>
              </div>

              <div className="p-4 space-y-1">
                {navItems.map((item) => {
                  const hasSubCategories = (item as any).subCategories && (item as any).subCategories.length > 0;
                  const isExpanded = expandedMobileCategory === item.label;
                  return (
                    <div key={item.label} className="border-b border-gray-50 last:border-0 relative">
                      {hasSubCategories ? (
                        <div className="flex flex-col">
                          <div className="flex items-center justify-between">
                            <Link
                              href={item.href}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="flex-1 block px-4 py-3 text-sm font-semibold text-gray-800 hover:text-black transition-colors"
                            >
                              {item.label}
                            </Link>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setExpandedMobileCategory(isExpanded ? null : item.label);
                              }}
                              className="p-3 text-gray-500 hover:text-black transition-colors flex items-center justify-center cursor-pointer"
                            >
                              <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          </div>
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden bg-gray-50 rounded-xl mx-2 mb-2"
                              >
                                <div className="py-2">
                                  <Link
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="block px-6 py-2.5 text-sm font-bold text-black hover:bg-gray-100"
                                  >
                                    Show all {item.label}
                                  </Link>
                                  {(item as any).subCategories.map((sub: any) => (
                                    <Link
                                      key={sub.id}
                                      href={`/?category=${(item as any).categoryId}&subCategory=${sub.id}`}
                                      onClick={() => setIsMobileMenuOpen(false)}
                                      className="block px-6 py-2 text-sm text-gray-600 hover:text-black hover:bg-gray-100"
                                    >
                                      - {sub.name}
                                    </Link>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <Link
                          href={item.type === 'menu' || item.type === 'category' ? '/products' : item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors rounded-xl"
                        >
                          {item.label}
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>

              {isMounted && (
                <div className="p-4 border-t border-gray-100">
                  {!isAuthenticated ? (
                    <button
                      onClick={() => { setIsMobileMenuOpen(false); onLoginClick?.(); }}
                      className="w-full px-5 py-3 rounded-full font-semibold text-sm transition-all text-white"
                      style={{ background: '#7B2FBE' }}
                    >
                      Sign In
                    </button>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-xs font-bold text-gray-900">{user?.phone}</span>
                      </div>
                      <button
                        onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                        className="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-sm font-medium transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <PremiumBrandsMegaMenu
        isOpen={isBrandsMenuOpen}
        onMouseEnter={() => handleMouseEnter('brands')}
        onMouseLeave={handleMouseLeave}
      />

      <PremiumCategoriesMegaMenu
        isOpen={isCategoriesMenuOpen}
        onMouseEnter={() => handleMouseEnter('categories')}
        onMouseLeave={handleMouseLeave}
        categories={categories}
      />

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <OrderDrawer isOpen={isOrderDrawerOpen} onClose={() => setIsOrderDrawerOpen(false)} />
    </>
  );
}
