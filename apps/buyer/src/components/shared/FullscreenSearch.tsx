'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Clock, Package, ArrowRight, Plus, AudioLines, Play } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@pharmabag/api-client';
import { useRouter } from 'next/navigation';

const RECENT_SEARCHES_KEY = 'pharmabag_recent_searches';
const MAX_RECENT = 6;

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

export default function FullscreenSearch({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 350);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['full-search', debounced],
    queryFn: () => getProducts({ search: debounced, limit: 12 }),
    enabled: debounced.length >= 2,
  });

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const recent = getRecentSearches();

  const handleSelect = (product: any) => {
    if (query.trim()) saveRecentSearch(query.trim());
    onClose();
    router.push(`/products/${product.slug || product.id}`);
  };

  const handleFullSearch = (q: string) => {
    if (!q.trim()) return;
    saveRecentSearch(q.trim());
    onClose();
    router.push(`/products?search=${encodeURIComponent(q.trim())}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col"
        >
          {/* Main Search Area - Large centered */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 pt-16 sm:pt-24">
            <div className="w-full max-w-6xl">
              {/* Input Section */}
              <div className="flex items-center justify-center gap-8 sm:gap-12 mb-16 sm:mb-24">
                {/* Left Clock Icon */}
                <div className="flex-shrink-0">
                  <Clock className="w-8 h-8 sm:w-12 sm:h-12 text-gray-800" strokeWidth={1.5} />
                </div>

                {/* Center Input */}
                <div className="flex-1 relative max-w-2xl">
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleFullSearch(query);
                      if (e.key === 'Escape') onClose();
                    }}
                    placeholder="Start typing ..."
                    className="w-full text-4xl sm:text-5xl md:text-6xl font-light text-[#8b5cf6] placeholder:text-[#c4b5fd] focus:outline-none bg-transparent"
                  />
                </div>

                {/* Right Action Icons */}
                <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600" strokeWidth={1.5} />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600" strokeWidth={1.5} />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <AudioLines className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600" strokeWidth={1.5} />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Play className="w-6 h-6 sm:w-8 sm:h-8 text-[#8b5cf6] fill-[#8b5cf6]" strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              {/* Results Grid */}
              {(debounced.length >= 2 || recent.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[45vh] overflow-auto pb-8"
                >
                  {/* Recent Searches */}
                  {debounced.length < 2 && recent.length > 0 && (
                    <>
                      {recent.map((r) => (
                        <button
                          key={r}
                          onClick={() => handleFullSearch(r)}
                          className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-transparent border border-purple-100 hover:border-purple-300 transition-all"
                        >
                          <div className="flex items-start gap-2 mb-2">
                            <Clock className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                            <span className="text-sm font-medium text-gray-700 text-left line-clamp-2">{r}</span>
                          </div>
                        </button>
                      ))}
                    </>
                  )}

                  {/* Product Results */}
                  {debounced.length >= 2 && (
                    <>
                      {isLoading ? (
                        <>
                          {[1, 2, 3, 4].map(i => (
                            <div key={i} className="p-4 rounded-2xl bg-gray-100 animate-pulse h-48" />
                          ))}
                        </>
                      ) : (data?.data?.length ?? 0) === 0 ? (
                        <div className="col-span-full text-center py-12 text-gray-400">
                          <p className="text-lg font-medium">No products found</p>
                          <p className="text-sm">Try a different search term</p>
                        </div>
                      ) : (
                        (data?.data ?? []).map((p: any) => (
                          <button
                            key={p.id}
                            onClick={() => handleSelect(p)}
                            className="p-4 rounded-2xl bg-white border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all group"
                          >
                            <div className="w-full h-32 bg-gray-50 rounded-xl flex items-center justify-center mb-3 overflow-hidden">
                              {p.images?.[0] ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={typeof p.images[0] === 'string' ? p.images[0] : (p.images[0] as any)?.url || '/products/pharma_bottle.png'}
                                  alt={p.name}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <Package className="w-8 h-8 text-gray-300" />
                              )}
                            </div>
                            <p className="text-sm font-bold text-gray-900 truncate mb-1">{p.name}</p>
                            <p className="text-xs text-gray-500 mb-2">₹{p.price?.toLocaleString?.('en-IN') ?? p.price}</p>
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <ArrowRight className="w-3 h-3 text-purple-500" />
                            </div>
                          </button>
                        ))
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </div>
          </div>

          {/* Close Button - Top Right */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
