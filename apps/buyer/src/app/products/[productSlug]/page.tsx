'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Plus, Star, Truck, ChevronDown, ChevronUp, Bell, RotateCcw, Minus, Search, User, Bookmark, ShoppingCart, Package, Filter, Menu, UploadCloud } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// Mock data
const PRODUCT = {
  id: 'leon-action-figure',
  name: 'Resident Evil Leon Action Figure',
  price: 3345.53,
  originalPrice: 3800.25,
  discount: 25,
  rating: 4.6,
  deliveryDays: 3,
  images: [
    'https://images.unsplash.com/photo-1542451313056-b7c8e626645f?w=800&q=80',
    'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&q=80',
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&q=80'
  ],
  description: 'Resident Evil Leon Action Figure is a must-have for any fan of the iconic video game series. This highly detailed collectible captures Leon S. Kennedy in his classic attire.',
};

const VARIATIONS = [
  { id: 1, type: 'qty', qty: 2 },
  { id: 2, type: 'add' },
  { id: 3, type: 'notify' },
  { id: 4, type: 'qty', qty: 2 },
  { id: 5, type: 'qty', qty: 2 },
  { id: 6, type: 'add' },
  { id: 7, type: 'notify' },
  { id: 8, type: 'qty', qty: 2 },
];

const RELATED_PRODUCTS = [
  { id: 'spiderman', name: 'Spider Man Fri...', price: 3345.53, originalPrice: 3800.25, image: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?w=300&q=80', rating: 4.5 },
  { id: 'leon', name: 'Resident Evil le...', price: 3345.53, originalPrice: 3800.25, image: 'https://images.unsplash.com/photo-1542451313056-b7c8e626645f?w=300&q=80', rating: 4.5 }
];

function Accordion({ title, content, defaultOpen = false }: { title: string, content?: string, defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 py-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left text-[11px] sm:text-xs font-bold text-gray-600 uppercase tracking-widest"
      >
        {title}
        {isOpen ? <Minus size={14} className="text-gray-400" /> : <Plus size={14} className="text-gray-400" />}
      </button>
      <AnimatePresence>
        {isOpen && content && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="pt-3 text-sm text-gray-400 font-medium leading-relaxed">
              {content}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FloatingBottomBar() {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl z-50">
      <div className="bg-[#6b3c9b] rounded-2xl h-[60px] flex items-center justify-between px-6 shadow-2xl border border-white/10 relative overflow-hidden">
        <div className="flex items-center gap-6">
          <div className="text-white font-black text-xl tracking-tighter hidden sm:block">YUKIZI</div>
          <div className="flex items-center gap-4">
             <button className="text-white/80 hover:text-white transition-colors"><User size={20} /></button>
             <button className="text-white/80 hover:text-white transition-colors"><Bell size={20} /></button>
          </div>
          <div className="relative hidden md:block">
            <input 
              type="text" 
              placeholder="Search" 
              className="bg-white rounded-md pl-3 pr-8 py-1.5 text-xs text-gray-900 w-48 outline-none border-none focus:ring-2 focus:ring-purple-400"
            />
            <Search size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 ml-auto">
           <button className="text-white/80 hover:text-white transition-colors"><Bookmark size={20} /></button>
           <button className="text-white/80 hover:text-white transition-colors"><ShoppingCart size={20} /></button>
           <button className="text-white/80 hover:text-white transition-colors"><Package size={20} /></button>
           <button className="text-white/80 hover:text-white transition-colors"><Filter size={20} /></button>
           <button className="text-white/80 hover:text-white transition-colors"><Menu size={20} /></button>
        </div>
      </div>
    </div>
  );
}

export default function AnimeProductPage() {
  const [activeImage, setActiveImage] = useState(0);

  return (
    <main className="min-h-screen bg-white pb-32">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8">
        
        {/* Responsive Grid/Flex layout */}
        <div className="flex flex-col lg:grid lg:grid-cols-2 lg:gap-x-20 gap-y-6">
          
          {/* 1. Main Image Block (Mobile: 1, Desktop: Left) */}
          <div className="order-1 lg:col-start-1 lg:row-start-1 lg:row-end-3">
             <div className="relative bg-[#ebdcff] rounded-3xl overflow-hidden flex h-[350px] sm:h-[450px]">
                {/* Purple dashed pattern background */}
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#854cbc 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-transparent pointer-events-none"></div>

                {/* Top Share Icon */}
                <div className="absolute top-4 left-4 z-20 bg-white/80 backdrop-blur-sm p-1.5 rounded-full cursor-pointer hover:bg-white transition-colors">
                   <Share2 size={16} className="text-gray-600" />
                </div>

                {/* Special Offer Ribbon */}
                <div className="absolute top-12 left-0 z-20">
                   <div className="bg-orange-500 text-white text-xs font-black uppercase italic px-4 py-1.5 transform -skew-x-12 shadow-lg -ml-2">
                      Special<br/>Offer
                   </div>
                </div>

                {/* Thumbnails */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
                  {PRODUCT.images.map((img, i) => (
                    <button 
                      key={i} 
                      onClick={() => setActiveImage(i)}
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden border-2 transition-all ${activeImage === i ? 'border-[#854cbc] scale-110' : 'border-transparent hover:border-purple-300'}`}
                    >
                      <img src={img} alt="thumb" className="w-full h-full object-cover bg-white" />
                    </button>
                  ))}
                </div>

                {/* Main Image display */}
                <div className="w-full h-full flex items-center justify-center p-8 pl-16 relative z-0">
                   <img src={PRODUCT.images[activeImage]} alt="Main Product" className="max-h-full object-contain mix-blend-multiply drop-shadow-2xl hover:scale-105 transition-transform duration-500" />
                </div>
                
                {/* Right Arrow hint */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/50 backdrop-blur-sm px-1 py-2 rounded-l-md text-gray-500">
                  <ChevronDown size={16} className="-rotate-90" />
                </div>
             </div>
          </div>

          {/* 2. Title Block (Mobile: 2, Desktop: Right) */}
          <div className="order-2 lg:col-start-2 lg:row-start-1">
             <h1 className="text-lg sm:text-2xl font-bold text-gray-600 tracking-tight leading-tight border-b border-gray-100 pb-2">
               {PRODUCT.name}
             </h1>
          </div>

          {/* 3. Variations List (Mobile: 3, Desktop: Right) */}
          <div className="order-3 lg:col-start-2 lg:row-start-2">
             <div className="space-y-1.5 sm:space-y-2">
                {VARIATIONS.map((v, i) => (
                  <div key={i} className="flex items-center bg-gray-50 hover:bg-gray-100 transition-colors rounded-xl p-2 sm:p-3 px-3 gap-2 sm:gap-4 border border-gray-100/50">
                    <div className="bg-[#854cbc] text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm shrink-0">
                      1.99% off
                    </div>
                    
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-[11px] sm:text-sm font-black text-gray-900 leading-none truncate">₹{PRODUCT.price}</span>
                      <span className="text-[7px] sm:text-[8px] font-bold text-gray-400 truncate mt-0.5">25% off on purchase of 3</span>
                    </div>

                    <div className="flex items-center gap-0.5 text-[#854cbc] w-8 sm:w-12 shrink-0">
                       <Star size={10} fill="currentColor" className="sm:w-3 sm:h-3" />
                       <span className="text-[10px] sm:text-xs font-extrabold">{PRODUCT.rating}</span>
                    </div>

                    <div className="flex items-center gap-0.5 text-gray-400 w-10 sm:w-16 justify-center shrink-0">
                       <Truck size={12} className="sm:w-3.5 sm:h-3.5" />
                    </div>

                    <div className="flex items-center justify-end gap-1 sm:gap-2 w-[70px] sm:w-[100px] shrink-0">
                      {v.type === 'qty' && (
                        <>
                          <button className="text-gray-400 hover:text-gray-600 p-0.5"><RotateCcw size={10} className="sm:w-3 sm:h-3" strokeWidth={2.5}/></button>
                          <div className="flex items-center bg-[#462d64] text-white rounded-md h-5 sm:h-6 w-14 sm:w-16">
                            <button className="px-1.5 sm:px-2 font-bold hover:bg-white/10 rounded-l-md h-full text-[10px] sm:text-xs">-</button>
                            <span className="flex-1 text-center text-[9px] sm:text-[10px] font-bold">0{v.qty}</span>
                            <button className="px-1.5 sm:px-2 font-bold hover:bg-white/10 rounded-r-md h-full text-[10px] sm:text-xs">+</button>
                          </div>
                        </>
                      )}
                      {v.type === 'add' && (
                        <button className="text-orange-400 w-full flex justify-center py-0.5">
                          <Plus size={14} className="sm:w-4 sm:h-4" strokeWidth={3} />
                        </button>
                      )}
                      {v.type === 'notify' && (
                        <button className="text-rose-400 w-full flex justify-center py-0.5">
                          <Bell size={12} className="sm:w-3.5 sm:h-3.5" strokeWidth={2.5} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
             </div>
          </div>

          {/* 4. Accordions (Mobile: 4, Desktop: Left) */}
          <div className="order-4 lg:col-start-1 lg:row-start-3 lg:pr-4">
             <Accordion title="OFFERS" />
             <Accordion title="DESCRIPTION" content={PRODUCT.description} defaultOpen={true} />
             <Accordion title="SHIPPING & RETURN INFO" />
             <Accordion title="ADDITIONAL INFO" />
          </div>

        </div>

        {/* Bottom Section */}
        <div className="mt-8 lg:mt-16 grid grid-cols-1 gap-8 lg:gap-12 max-w-2xl mx-auto lg:max-w-none">
          
          {/* Related Products */}
          <div>
             <h2 className="text-sm font-semibold text-gray-600 mb-4 tracking-tight">Related Products</h2>
             <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:flex lg:flex-row lg:overflow-x-auto hide-scrollbar">
                {RELATED_PRODUCTS.map((prod, idx) => (
                   <div key={idx} className="relative bg-white rounded-[1rem] border border-gray-100 p-2 sm:p-3 flex flex-col hover:shadow-lg transition-all shadow-sm lg:min-w-[200px]">
                      <div className="flex justify-between items-start mb-2 relative z-10">
                         {idx === 0 && <div className="text-[7px] sm:text-[8px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full tracking-tight bg-[#854cbc] text-white">Yukizi Choice</div>}
                         <div className="flex flex-col items-end gap-0.5 ml-auto">
                            <span className="text-[7px] sm:text-[8px] text-gray-400 font-medium">Ad</span>
                            {idx === 0 ? <Plus size={10} className="text-orange-400 sm:w-3 sm:h-3" strokeWidth={3} /> : null}
                         </div>
                      </div>
                      <div className="absolute top-6 sm:top-8 left-2 z-10"><Share2 size={10} className="text-gray-300 sm:w-3 sm:h-3" /></div>
                      {idx === 0 && <div className="absolute top-2 right-2 z-10"><Bookmark size={12} className="text-gray-300" /></div>}
                      {idx === 1 && <div className="absolute top-2 right-2 z-10"><Bookmark size={12} className="text-gray-300" /></div>}
                      
                      <div className="h-20 sm:h-28 flex items-center justify-center mb-2 sm:mb-3 group relative">
                         <img src={prod.image} alt={prod.name} className="max-h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform" />
                      </div>
                      
                      <div className="mt-auto">
                         <div className="flex justify-between items-center mb-0.5 sm:mb-1">
                            <h3 className="text-[9px] sm:text-[10px] font-semibold text-gray-800 truncate">{prod.name}</h3>
                            <button><Plus size={10} className="text-gray-400 sm:w-3 sm:h-3" /></button>
                         </div>
                         <div className="flex justify-between items-center">
                            <div className="flex flex-col">
                               <span className="text-[10px] sm:text-[11px] font-black text-gray-900 leading-none">₹{prod.price}</span>
                               <span className="text-[7px] sm:text-[8px] text-gray-400 line-through leading-none mt-0.5">₹{prod.originalPrice}</span>
                            </div>
                            <div className="flex items-center gap-0.5 text-[#854cbc]">
                               <Star size={8} className="sm:w-2.5 sm:h-2.5" fill="currentColor" />
                               <span className="text-[8px] sm:text-[9px] font-extrabold text-gray-700">{prod.rating}</span>
                            </div>
                         </div>
                         <div className="text-[6px] sm:text-[7px] font-bold text-gray-400 mt-1">25% off</div>
                      </div>
                   </div>
                ))}
             </div>
          </div>

          {/* Reviews Block */}
          <div>
            <h2 className="text-sm font-semibold text-gray-600 mb-4 tracking-tight">Reviews</h2>
            <div className="flex items-end gap-2 mb-2">
              <div className="flex text-[#854cbc] gap-0.5">
                {[1,2,3,4].map(i => <Star key={i} size={16} fill="currentColor" />)}
                <div className="relative overflow-hidden w-4 h-4">
                  <Star size={16} fill="none" stroke="currentColor" className="absolute text-[#854cbc]" />
                  <div className="absolute inset-0 overflow-hidden w-1/2">
                    <Star size={16} fill="currentColor" className="text-[#854cbc]" />
                  </div>
                </div>
              </div>
              <span className="text-lg sm:text-2xl font-black text-gray-800 leading-none">4.6</span>
            </div>
            
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <p className="text-[10px] sm:text-xs text-gray-500 font-medium">4.6 out of 5 stars (based on 6 reviews)</p>
              <button className="bg-[#854cbc] hover:bg-purple-800 text-white font-bold text-[10px] sm:text-xs px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-md sm:rounded-lg transition-colors">
                See all reviews
              </button>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
              {/* Review Card 1 */}
              <div className="min-w-[200px] sm:min-w-[280px] border border-gray-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm bg-white">
                 <p className="text-[10px] sm:text-xs text-gray-500 mb-3 sm:mb-4 h-10 sm:h-16 leading-relaxed">I gifted this shirt to my friend and he love it so much ! Thank you CS 💖?</p>
                 <div className="flex text-[#854cbc] mb-1.5 sm:mb-2 gap-0.5">
                   {[1,2,3,4,5].map(i => <Star key={i} size={8} className="sm:w-2.5 sm:h-2.5" fill="currentColor" />)}
                 </div>
                 <p className="text-[8px] sm:text-[9px] text-gray-400 font-semibold">- Kshitij, January 24, 2024</p>
              </div>

              {/* Review Card 2 */}
              <div className="min-w-[240px] sm:min-w-[280px] border border-gray-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm bg-white flex gap-3">
                 <div className="flex-1 flex flex-col">
                   <p className="text-[10px] sm:text-xs text-gray-500 mb-3 sm:mb-4 h-10 sm:h-16 leading-relaxed">nice printing excellent product, but fade as get washed ... <span className="font-bold text-gray-800 cursor-pointer">See more</span></p>
                   <div className="flex text-[#854cbc] mb-1.5 sm:mb-2 gap-0.5">
                     {[1,2,3,4,5].map(i => <Star key={i} size={8} className="sm:w-2.5 sm:h-2.5" fill="currentColor" />)}
                   </div>
                   <p className="text-[8px] sm:text-[9px] text-gray-400 font-semibold">- DJD, April 29, 2023</p>
                 </div>
                 <div className="w-12 h-16 sm:w-16 sm:h-24 rounded-md overflow-hidden shrink-0">
                   <img src="https://images.unsplash.com/photo-1542451313056-b7c8e626645f?w=150&q=80" alt="review" className="w-full h-full object-cover" />
                 </div>
              </div>
            </div>

            {/* Write Review Form */}
            <div className="mt-8 border border-gray-200 rounded-2xl p-5 shadow-sm bg-white">
              <h3 className="text-gray-500 font-semibold text-sm mb-3 tracking-tight">Your overall rating</h3>
              <div className="flex gap-1.5 text-gray-300 mb-6">
                {[1,2,3,4,5].map(i => <Star key={i} size={24} fill="currentColor" className="cursor-pointer hover:text-yellow-400 transition-colors" />)}
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-800 mb-1.5">Title of your review</label>
                  <input type="text" placeholder="Summarize your experience or highlight an interesting detail" className="w-full text-xs p-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-purple-400 placeholder:text-gray-300 font-medium" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-800 mb-1.5">Your review</label>
                  <textarea rows={3} placeholder="Tell us how you liked the product. What did you like or dislike?" className="w-full text-xs p-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-purple-400 resize-none placeholder:text-gray-300 font-medium"></textarea>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-800 mb-1.5">Do you have photos to share?</label>
                  <button className="w-full py-4 bg-[#a5a5a5] hover:bg-gray-500 transition-colors text-white text-xs font-bold rounded-lg flex flex-col items-center justify-center gap-1">
                    Drag & Drop your photos or Browse
                  </button>
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-8 h-4 bg-[#d8c5ea] rounded-full relative cursor-pointer flex items-center shadow-inner">
                    <div className="w-4 h-4 bg-[#854cbc] rounded-full absolute right-0 shadow-sm border border-white"></div>
                  </div>
                  <span className="text-[9px] text-gray-800 font-bold tracking-tight">This review is based on my own experience and is my genuine opinion.</span>
                </div>
                
                <button className="bg-[#854cbc] hover:bg-purple-800 transition-colors text-white font-bold text-xs px-6 py-2.5 rounded-lg mt-2">
                  Submit review
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
      
      <FloatingBottomBar />
    </main>
  );
}
