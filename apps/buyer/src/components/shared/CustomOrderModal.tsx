'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, CheckCircle2, Loader2, MessageSquare } from 'lucide-react';
import { useToast } from '@/components/shared/Toast';
import { createCustomOrder } from '@pharmabag/api-client';

interface CustomOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName?: string;
  productId?: string;
}

export function CustomOrderModal({ isOpen, onClose, productName, productId }: CustomOrderModalProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsLoading(true);
    try {
      await createCustomOrder({
        message: productName ? `Request for ${productName}: ${message}` : message,
        productId,
      });
      setIsSuccess(true);
      toast('Custom order request sent successfully!', 'success');
      setTimeout(() => {
        setIsSuccess(false);
        setMessage('');
        onClose();
      }, 3000);
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to send request. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="custom-order-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
        >
          <motion.div
            key="custom-order-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
          />
          
          <motion.div
            key="custom-order-modal"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden border border-white/20"
          >
            {/* Header */}
            <div className="px-8 pt-8 pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="h-12 w-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-emerald-600" />
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none">Custom Order Request</h2>
              <p className="text-sm text-gray-500 font-medium mt-2">
                {productName ? `Inquiring about ${productName}` : 'Tell us what you are looking for'}
              </p>
            </div>

            <div className="px-8 pb-8">
              {isSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-12 flex flex-col items-center text-center"
                >
                  <div className="h-20 w-20 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-200">
                    <CheckCircle2 className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Request Received!</h3>
                  <p className="text-gray-500 mt-2 font-medium">Our team will review your order and get back to you shortly.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600 ml-1">Your Requirements</label>
                    <textarea
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="e.g. I need 20 units with a special packaging or I need a better rate for bulk order..."
                      rows={5}
                      className="w-full px-5 py-4 rounded-3xl bg-gray-50 border-transparent focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none resize-none font-medium text-gray-800"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !message.trim()}
                    className="w-full h-14 bg-gray-900 text-white rounded-[20px] font-black text-lg flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 shadow-xl shadow-black/10"
                  >
                    {isLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <>
                        <span>Submit Request</span>
                        <Send className="h-5 w-5" />
                      </>
                    )}
                  </button>
                  
                  <p className="text-[11px] text-center text-gray-400 font-bold uppercase tracking-tighter">
                    Typically responds within 24 hours
                  </p>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
