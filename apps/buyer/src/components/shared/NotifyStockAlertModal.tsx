'use client';

import { X, Bell, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useAuth } from '@pharmabag/api-client';
import { useToast } from './Toast';

interface NotifyStockAlertModalProps {
  isOpen: boolean;
  productName: string;
  productId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function NotifyStockAlertModal({
  isOpen,
  productName,
  productId,
  onClose,
  onSuccess,
}: NotifyStockAlertModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState(user?.email || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast('Please enter your email', 'error');
      return;
    }

    if (!email.includes('@')) {
      toast('Please enter a valid email', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Call API to register stock alert
      // POST /notifications/stock-alert
      const response = await fetch(`http://0.0.0.0:3000/api/notifications/stock-alert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('pb_access_token') : ''}`,
        },
        body: JSON.stringify({
          productId,
          email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to register stock alert');
      }

      toast(`We'll notify you when "${productName}" is back in stock!`, 'success');
      setEmail('');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('[Stock Alert] Error:', err);
      toast(err?.message || 'Failed to set up stock alert. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="stock-alert-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Glassmorphism Backdrop */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-xl" />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[420px] bg-white rounded-3xl shadow-2xl border border-white/50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-50 rounded-2xl">
                  <Bell className="w-6 h-6 text-amber-600" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Stock Alert</h2>
                  <p className="text-xs text-gray-500 font-medium">Get notified when back in stock</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" strokeWidth={2} />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <p className="text-gray-700 font-medium mb-2">
                  <strong>"{productName}"</strong> is currently out of stock.
                </p>
                <p className="text-sm text-gray-600">
                  We'll send you an email notification as soon as it's available again.
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  disabled={isSubmitting}
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 font-bold text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !email.trim()}
                  className="flex-1 px-4 py-3 rounded-2xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSubmitting ? 'Setting...' : 'Notify Me'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
