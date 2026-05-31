'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Package, Clock, ArrowRight, RotateCw, Plus, AudioLines, Send } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@yukizi/api-client';

const RECENT_SEARCHES_KEY = 'yukizi_recent_searches';
const MAX_RECENT = 5;

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  const recent = getRecentSearches().filter((s) => s !== query);
  recent.unshift(query);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

interface SearchBarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function SearchBar({ isOpen = false, onClose }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 400);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: results, isLoading } = useQuery({
    queryKey: ['product-search', debouncedQuery],
    queryFn: () => getProducts({ search: debouncedQuery, limit: 5 }),
    enabled: debouncedQuery.length >= 2,
  });

  const products = results?.data ?? [];
  const recentSearches = getRecentSearches();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSelect = (product: any) => {
    if (query.trim()) saveRecentSearch(query.trim());
    setQuery('');
    onClose?.();
    router.push(`/products/${product.slug || product.id}`);
  };

  const handleFullSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    saveRecentSearch(searchQuery.trim());
    setQuery('');
    onClose?.();
    router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/10 backdrop-blur-[1px]"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-[85px] sm:bottom-[100px] md:bottom-[110px] left-1/2 -translate-x-1/2 w-[90%] max-w-[600px] z-[70] bg-white rounded-3xl shadow-2xl p-4 sm:p-6 flex flex-col shadow-purple-900/10"
          >
            {/* Input Area */}
            <div className="relative mb-2 sm:mb-4">
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleFullSearch(query);
                  }
                }}
                placeholder="Start typing ..."
                className="w-full bg-transparent text-xl sm:text-2xl font-medium text-gray-800 placeholder:text-[#b096c4] focus:outline-none"
              />
            </div>

            {/* Results Area */}
            <div className="flex-1 max-h-[40vh] overflow-y-auto scrollbar-hide">
              {/* Recent Searches (Show when no query) */}
              {query.length < 2 && recentSearches.length > 0 && (
                <div className="py-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Recent</p>
                  {recentSearches.map((search) => (
                    <button
                      key={search}
                      onClick={() => handleFullSearch(search)}
                      className="flex items-center gap-3 w-full px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-600">{search}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Search Results */}
              {debouncedQuery.length >= 2 && (
                <div className="py-2">
                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3 animate-pulse px-2 py-1">
                          <div className="w-10 h-10 bg-gray-100 rounded-xl" />
                          <div className="flex-1 space-y-1.5">
                            <div className="h-3.5 bg-gray-100 rounded-full w-3/4" />
                            <div className="h-3 bg-gray-100 rounded-full w-1/3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : products.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-sm font-bold text-gray-400">No products found</p>
                      <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Products</p>
                      {products.map((product: any) => (
                        <button
                          key={product.id}
                          onClick={() => handleSelect(product)}
                          className="flex items-center gap-3 w-full px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors group"
                        >
                          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                            {product.images?.[0] ? (
                              <img 
                                src={typeof product.images[0] === 'string' ? product.images[0] : (product.images[0] as any)?.url || '/products/pharma_bottle.png'} 
                                alt="" 
                                className="w-full h-full object-contain rounded-xl" 
                              />
                            ) : (
                              <Package className="w-4 h-4 text-gray-300" />
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-bold text-gray-900 truncate">{product.name}</p>
                            <p className="text-xs text-gray-400 font-medium">₹{product.price.toLocaleString('en-IN')}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Toolbar */}
            <div className="flex justify-between items-center pt-3 mt-2 border-t border-gray-100/50">
              <button className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" />
              </button>
              
              <div className="flex items-center gap-1 sm:gap-2">
                <button onClick={() => setQuery('')} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                  <RotateCw className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" />
                </button>
                <button className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                  <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" />
                </button>
                <button className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                  <AudioLines className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" />
                </button>
                <button 
                  onClick={() => handleFullSearch(query)}
                  className="p-2 hover:bg-gray-50 rounded-full transition-colors ml-1"
                >
                  <Send className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
