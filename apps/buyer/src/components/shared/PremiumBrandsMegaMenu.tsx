'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, ArrowRight } from 'lucide-react';

interface PremiumBrandsMegaMenuProps {
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export default function PremiumBrandsMegaMenu({ isOpen, onMouseEnter, onMouseLeave }: PremiumBrandsMegaMenuProps) {
  const brandGroups = [
    {
      title: 'Global Pharma Giants',
      headerCls: 'text-rose-600 bg-rose-50',
      subgroups: [
        {
          name: 'Multinationals',
          links: ['ABBOTT LABORATORIES', 'PFIZER LTD.', 'SANOFI', 'MSD PHARMA', 'ALLERGAN', 'ALCON']
        },
        {
          name: 'Specialized Care',
          links: ['MODI MUNDI', 'HETERO HEALTHCARE', 'INSULIN']
        }
      ]
    },
    {
      title: 'Indian Market Leaders',
      headerCls: 'text-indigo-600 bg-indigo-50',
      subgroups: [
        {
          name: 'Tier 1 Manufacturers',
          links: ['SUN PHARMACEUTICALS', 'CIPLA INDIA LTD.', 'DR REDDY\'S', 'LUPIN LTD.', 'ALKEM']
        },
        {
          name: 'Rapid Integration',
          links: ['MANKIND PHARMA', 'ZYDUS CADILA', 'INTAS LABS.', 'GLENMARK']
        }
      ]
    },
    {
      title: 'Strategic Partners',
      headerCls: 'text-emerald-600 bg-emerald-50',
      subgroups: [
        {
          name: 'General Formulations',
          links: ['ALEMBIC', 'ARISTO PHARMA', 'MACLEODS', 'IPCA LABS', 'AJANTA PHARMA']
        },
        {
          name: 'Niche Biologicals',
          links: ['U.S.V. LIMITED', 'ZUVENTUS', 'EMCURE', 'EASTINDIA PHARMA']
        }
      ]
    }
  ];

  const featuredSections = [
    {
      title: 'Protocol Clusters',
      icon: Sparkles,
      links: ['New Arrivals', 'Summer Essentials', 'Immunity Boosters']
    },
    {
      title: 'Signal Registry',
      icon: TrendingUp,
      links: ['Best Sellers', 'Top Rated', 'Expert Picks']
    }
  ];

  const highlights = [
    { name: 'Foliyer', price: '₹545', image: '/products/pharma_bottle.png', tag: 'New' },
    { name: 'Foliyer', price: '₹545', image: '/products/pharma_bottle.png', tag: 'Hot' },
    { name: 'Foliyer', price: '₹545', image: '/products/pharma_bottle.png', tag: 'Limit' },
    { name: 'Foliyer', price: '₹545', image: '/products/pharma_bottle.png', tag: 'Bio' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 15, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.99 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          className="fixed top-[96px] left-0 right-0 z-40 flex justify-center px-6"
        >
          <div className="w-[92vw] bg-white/80 backdrop-blur-3xl rounded-[48px] shadow-[0_48px_96px_-24px_rgba(0,0,0,0.18)] border border-white/60 overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 -z-10" />
             
            <div className="flex p-16 gap-20 relative z-10">
              {/* Brand Navigation Matrix */}
              <div className="flex-1 grid grid-cols-3 gap-16">
                {brandGroups.map((group, idx) => (
                  <div key={idx} className="space-y-12">
                    <div>
                      <div className={`inline-flex items-center px-4 py-2 rounded-2xl mb-10 border border-current/10 ${group.headerCls}`}>
                         <span className="text-[10px] font-black uppercase tracking-[0.2em]">{group.title}</span>
                      </div>
                      <div className="space-y-12">
                        {group.subgroups.map((sub, sIdx) => (
                          <div key={sIdx} className="group/item">
                            <h4 className="text-[14px] font-black text-gray-900 mb-6 flex items-center justify-between group-hover/item:text-black transition-colors uppercase tracking-widest">
                              {sub.name}
                              <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover/item:translate-x-1 group-hover/item:text-gray-950 transition-all" />
                            </h4>
                            <ul className="grid grid-cols-1 gap-3.5">
                              {sub.links.map((link, lIdx) => (
                                <li key={lIdx}>
                                  <a href="#" className="text-[13px] font-bold text-gray-400 hover:text-gray-950 transition-all duration-300 flex items-center gap-3">
                                    <div className="w-1 h-1 rounded-full bg-gray-200 group-hover/item:bg-lime-400 transition-colors" />
                                    {link}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Curated Signals & Visual Highlights */}
              <div className="w-[520px] flex gap-12 border-l border-white/60 pl-20">
                <div className="w-[180px] space-y-14">
                  {featuredSections.map((section, idx) => (
                    <div key={idx} className="space-y-6">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-gray-950 rounded-2xl flex items-center justify-center text-white shadow-xl">
                            <section.icon className="w-5 h-5" />
                         </div>
                         <h3 className="text-[13px] font-black text-gray-900 uppercase tracking-widest">{section.title}</h3>
                      </div>
                      <ul className="space-y-4">
                        {section.links.map((link, lIdx) => (
                          <li key={lIdx}>
                            <a href="#" className="text-[13px] font-black text-gray-400 hover:text-gray-950 flex items-center group/link">
                              {link}
                              <ArrowRight className="w-3 h-3 ml-2 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all" />
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* Intelligent Product Grid */}
                <div className="flex-1 grid grid-cols-2 gap-6">
                  {highlights.map((product, idx) => (
                    <motion.div 
                      key={idx} 
                      whileHover={{ y: -5 }}
                      className="bg-white rounded-[32px] p-6 flex flex-col items-center group/card cursor-pointer shadow-xl hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.1)] transition-all duration-500 border border-gray-50 relative overflow-hidden"
                    >
                      <span className="absolute top-4 right-4 text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 bg-lime-400 rounded-lg shadow-sm z-10">{product.tag}</span>
                      <div className="relative w-full aspect-[1/1] mb-6 overflow-hidden rounded-2xl bg-gray-50 border border-gray-100/50 p-4">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-contain transform group-hover/card:scale-110 transition-transform duration-700"
                        />
                      </div>
                      <div className="text-center">
                         <p className="text-[13px] font-black text-gray-900 mb-1 uppercase tracking-tight">{product.name}</p>
                         <p className="text-[12px] font-black text-lime-600">{product.price}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Global Footer Banner */}
            <div className="bg-gray-950 p-6 flex items-center justify-center gap-8">
               <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Official Fulfillment Partner for 12,000+ Pharmacies</p>
               <div className="h-1 w-1 rounded-full bg-white/20" />
               <p className="text-[10px] font-black text-lime-400 uppercase tracking-[0.4em]">99.8% SLA COMPLIANCE</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
