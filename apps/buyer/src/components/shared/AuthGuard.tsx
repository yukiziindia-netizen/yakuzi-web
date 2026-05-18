'use client';

import { useAuth } from '@pharmabag/api-client';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Shield, Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/shared/Toast';
import { useQueryClient } from '@tanstack/react-query';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, refresh } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [showRedirect, setShowRedirect] = useState(false);
  const prevStatusRef = useRef<string | undefined>(user?.status || user?.verificationStatus);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setShowRedirect(true);
      const timeout = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('open-login'));
      }, 1500);
      return () => clearTimeout(timeout);
    }

    if (!isLoading && isAuthenticated && user) {
      // Check if buyer is verified: admin sets user.status = 'APPROVED' and buyerProfile.verificationStatus = 'VERIFIED'
      const bp = user.buyerProfile as any;
      const isApproved = user.status === 'APPROVED';
      const isBuyerProfileVerified = bp?.verificationStatus === 'VERIFIED';
      const isLegacyVerified = user.verificationStatus === 'VERIFIED';
      const isVerified = isApproved || isBuyerProfileVerified || isLegacyVerified;

      const allowedPaths = ['/onboarding', '/profile', '/support', '/products', '/cart', '/blogs', '/notifications', '/wishlist'];
      if (!isVerified && !allowedPaths.some(p => pathname.startsWith(p))) {
        router.push('/onboarding');
      }
    }
  }, [isLoading, isAuthenticated, user, router, pathname]);

  // Status Polling — poll every 10s while buyer is pending so approval reflects automatically
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const bp = user.buyerProfile as any;
    const isApproved = user.status === 'APPROVED' || user.verificationStatus === 'VERIFIED' || bp?.verificationStatus === 'VERIFIED';
    const isRejected = user.status === 'REJECTED' || user.verificationStatus === 'REJECTED' || bp?.verificationStatus === 'REJECTED';
    
    // Notify if status changed to approved
    const currentStatus = user.status || user.verificationStatus || bp?.verificationStatus;
    if (isApproved && prevStatusRef.current !== currentStatus && (prevStatusRef.current === 'PENDING' || !prevStatusRef.current)) {
      toast('Your account has been verified! You can now start ordering.', 'success');
      // Force refresh profile data
      queryClient.invalidateQueries({ queryKey: ['buyerProfile'] });
      
      // If on onboarding, redirect to products
      if (pathname === '/onboarding') {
        router.push('/products');
      }
    }
    prevStatusRef.current = currentStatus;

    if (isApproved || isRejected) return;

    const interval = setInterval(() => {
      console.log('[AuthGuard] Polling status...');
      refresh();
    }, 10000);
    return () => clearInterval(interval);
  }, [user, isAuthenticated, refresh, toast, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f2fcf6]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (showRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f2fcf6]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          < Shield className="w-12 h-12 text-emerald-500 mx-auto" />
          <p className="text-gray-600 font-medium">Please log in to continue</p>
          <p className="text-sm text-gray-400">Redirecting to login...</p>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // If pending approval and not on onboarding, show pending view?
  // User wants "Disable orders until status=1+".
  // For now, redirecting to onboarding is fine, as onboarding can show "Awaiting approval".

  return <>{children}</>;
}
