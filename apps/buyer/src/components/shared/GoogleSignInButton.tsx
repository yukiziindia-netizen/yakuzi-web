'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@yukizi/api-client';
import { useToast } from '@/components/shared/Toast';

interface GoogleSignInButtonProps {
  /**
   * Only initialise while the control is actually on screen. The modal passes
   * its open state; a page that always renders the button can leave this true.
   */
  active?: boolean;
  /** Runs after a successful sign-in, before navigation. */
  onSuccess?: () => void;
  /** Reports the in-flight state so the parent can disable its own controls. */
  onLoadingChange?: (loading: boolean) => void;
  /**
   * Rendered when NEXT_PUBLIC_GOOGLE_CLIENT_ID is absent. Google's script only
   * returns an ID token through a button it rendered itself, so with no client
   * id there is nothing to render and the caller supplies a plain icon.
   */
  fallback: React.ReactNode;
}

/**
 * Google's own rendered button, which is the only way their Identity Services
 * script hands back an ID token. Extracted from LoginModal so the /login route
 * gets the same behaviour instead of a static icon that never did anything.
 */
export default function GoogleSignInButton({
  active = true,
  onSuccess,
  onLoadingChange,
  fallback,
}: GoogleSignInButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { loginWithGoogle } = useAuth();

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const handleGoogleCredential = useCallback(
    async (credential: string) => {
      onLoadingChange?.(true);
      try {
        await loginWithGoogle(credential);
        toast('Login successful!', 'success');
        onSuccess?.();
        router.push('/');
      } catch (e: any) {
        toast(
          e?.response?.data?.message || 'Google sign-in failed. Please try again.',
          'error',
        );
      } finally {
        onLoadingChange?.(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loginWithGoogle, router],
  );

  useEffect(() => {
    if (!active || !googleClientId) return;

    let cancelled = false;

    const renderGoogleButton = () => {
      const google = (window as any).google;
      if (cancelled || !google?.accounts?.id || !googleButtonRef.current) return;

      google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response: any) => {
          if (response?.credential) handleGoogleCredential(response.credential);
        },
      });

      // The circular icon variant matches the row it sits in.
      googleButtonRef.current.innerHTML = '';
      google.accounts.id.renderButton(googleButtonRef.current, {
        type: 'icon',
        shape: 'circle',
        theme: 'outline',
        size: 'large',
      });
    };

    if ((window as any).google?.accounts?.id) {
      renderGoogleButton();
      return () => {
        cancelled = true;
      };
    }

    const existing = document.getElementById(
      'google-identity-services',
    ) as HTMLScriptElement | null;

    if (existing) {
      existing.addEventListener('load', renderGoogleButton);
      return () => {
        cancelled = true;
        existing.removeEventListener('load', renderGoogleButton);
      };
    }

    const script = document.createElement('script');
    script.id = 'google-identity-services';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    document.head.appendChild(script);

    return () => {
      cancelled = true;
      script.onload = null;
    };
  }, [active, googleClientId, handleGoogleCredential]);

  if (!googleClientId) return <>{fallback}</>;

  return (
    <div
      ref={googleButtonRef}
      className="w-11 h-11 flex items-center justify-center [color-scheme:light]"
      aria-label="Sign in with Google"
    />
  );
}
