'use client';

import React, { useState, useEffect } from 'react';
import { User, Lock, Eye, EyeOff, Loader2, Phone, KeyRound, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@yukizi/api-client';
import { useToast } from '@/components/shared/Toast';
import { useScrollLock } from '@/hooks/useScrollLock';
import ForgotPasswordFlow from '@/app/login/ForgotPasswordFlow';

interface LoginModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function LoginModal({ isOpen: isOpenProp, onClose: onCloseProp }: LoginModalProps = {}) {
  const [isOpenState, setIsOpenState] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();
  const { sendOtp, verifyOtp } = useAuth();

  const isOpen = isOpenProp !== undefined ? isOpenProp : isOpenState;
  const onClose = onCloseProp !== undefined ? onCloseProp : () => setIsOpenState(false);
  useScrollLock(isOpen);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedPhone = sessionStorage.getItem('loginModal_phone');
    const savedStep = sessionStorage.getItem('loginModal_step') as 'phone' | 'otp';
    if (savedPhone) { setPhone(savedPhone); setStep(savedStep || 'phone'); }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (phone) { sessionStorage.setItem('loginModal_phone', phone); }
    sessionStorage.setItem('loginModal_step', step);
  }, [phone, step]);

  const handleCloseCleanup = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('loginModal_phone');
      sessionStorage.removeItem('loginModal_step');
    }
    onClose();
  };

  useEffect(() => {
    const handleOpen = () => { if (isOpenProp === undefined) setIsOpenState(true); };
    window.addEventListener('open-login', handleOpen);
    return () => window.removeEventListener('open-login', handleOpen);
  }, [isOpenProp]);

  const sanitizePhone = (input: string) => {
    let cleaned = input.replace(/\D/g, '');
    if (cleaned.length === 12 && cleaned.startsWith('91')) cleaned = cleaned.substring(2);
    return cleaned;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast('Password login not available yet. Please use OTP.', 'error');
    }, 1000);
  };

  const handleSendOtp = async () => {
    const cleanPhone = sanitizePhone(phone);
    if (cleanPhone.length !== 10) { toast('Please enter 10 digits', 'error'); return; }
    setIsLoading(true);
    try {
      await sendOtp(cleanPhone);
      setStep('otp');
      toast('OTP sent!', 'success');
    } catch (e: any) { toast('Failed to send OTP', 'error'); } finally { setIsLoading(false); }
  };

  const handleVerifyOtp = async () => {
    const cleanPhone = sanitizePhone(phone);
    if (otp.length !== 6) { toast('Enter 6-digit OTP', 'error'); return; }
    setIsLoading(true);
    try {
      await verifyOtp(cleanPhone, otp);
      toast('Login successful!', 'success');
      handleCloseCleanup();
      router.push('/');
    } catch (e: any) { toast('Invalid OTP', 'error'); } finally { setIsLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div role="dialog" className="fixed inset-0 z-[1000] h-screen w-screen overflow-hidden flex flex-col items-center justify-center bg-gradient-to-b from-[#e4e4e4] via-[#757575] to-[#252525] px-6 py-12 font-sans select-none">
      {/* Noise Overlay */}
      <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

      {/* Close Button */}
      <button onClick={() => onClose()} className="fixed top-6 right-6 p-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full z-[150] shadow-xl backdrop-blur-sm transition-all">
        <X size={24} strokeWidth={2.5} />
      </button>

      <div className="z-10 w-full max-w-sm flex flex-col items-center mt-[-10vh]">
        
        {/* Logo */}
        <h1 className="text-[60px] font-black tracking-tighter text-[#8e44ad] mb-20 uppercase" style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}>
          YUKiZi
        </h1>

        {/* Form */}
        {!isOtpMode ? (
          <form onSubmit={handleLogin} className="w-full space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <User className="h-[22px] w-[22px] text-gray-400" strokeWidth={2.5} />
              </div>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-14 pr-4 py-[18px] rounded-full bg-white text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#8e44ad] shadow-lg font-bold text-lg"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Lock className="h-[22px] w-[22px] text-gray-400" strokeWidth={2.5} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-14 pr-14 py-[18px] rounded-full bg-white text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#8e44ad] shadow-lg font-bold text-lg"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-5 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-[22px] w-[22px]" /> : <Eye className="h-[22px] w-[22px]" />}
              </button>
            </div>

            <div className="flex justify-center items-center text-[13px] md:text-sm mt-5 text-[#d1d5db] font-semibold tracking-wide">
              <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowForgotPassword(true); }} className="underline underline-offset-2 hover:text-white transition-colors mr-1">Forgot Password ?</button>
              <span className="opacity-90">Login through </span>
              <button type="button" onClick={() => setIsOtpMode(true)} className="underline underline-offset-2 ml-1 hover:text-white transition-colors">OTP</button>
            </div>
          </form>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); step === 'phone' ? handleSendOtp() : handleVerifyOtp(); }} className="w-full space-y-4">
            {step === 'phone' ? (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Phone className="h-[22px] w-[22px] text-gray-400" strokeWidth={2.5} />
                </div>
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-14 pr-4 py-[18px] rounded-full bg-white text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#8e44ad] shadow-lg font-bold text-lg"
                />
              </div>
            ) : (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <KeyRound className="h-[22px] w-[22px] text-gray-400" strokeWidth={2.5} />
                </div>
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  className="w-full pl-14 pr-4 py-[18px] rounded-full bg-white text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#8e44ad] shadow-lg font-bold text-lg tracking-[0.2em]"
                />
              </div>
            )}

            <div className="flex justify-center items-center text-[13px] md:text-sm mt-5 text-[#d1d5db] font-semibold tracking-wide">
              <button type="button" onClick={() => setIsOtpMode(false)} className="underline underline-offset-2 hover:text-white transition-colors mr-1">Use Password ?</button>
              {step === 'otp' && (
                <>
                  <span className="opacity-90">or </span>
                  <button type="button" onClick={() => { setStep('phone'); setOtp(''); }} className="underline underline-offset-2 ml-1 hover:text-white transition-colors">Change Number</button>
                </>
              )}
            </div>
            
            {/* Action button for OTP */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-full text-white font-bold text-lg shadow-[0_0_25px_rgba(232,160,223,0.5)] bg-gradient-to-r from-[#b98df2] to-[#f4aae2] hover:opacity-90 transition-opacity flex justify-center items-center"
              >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (step === 'phone' ? 'Send OTP' : 'Verify OTP')}
              </button>
            </div>
          </form>
        )}

        {/* Separator & Social Login - Always visible */}
        <div className="w-full flex flex-col items-center">
          <div className="flex items-center justify-center space-x-4 mt-8 mb-6 w-full">
            <div className="h-px w-12 bg-gray-400/60"></div>
            <span className="text-gray-400 font-medium text-lg">or</span>
            <div className="h-px w-12 bg-gray-400/60"></div>
          </div>

          <div className="flex justify-center space-x-6 mb-12">
            {/* Google Icon */}
            <button type="button" className="w-11 h-11 rounded-full bg-transparent flex items-center justify-center hover:scale-110 transition-transform">
              <svg viewBox="0 0 24 24" width="28" height="28" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                  <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                  <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                  <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                  <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                </g>
              </svg>
            </button>

            {/* Facebook Icon */}
            <button type="button" className="w-11 h-11 rounded-full bg-transparent flex items-center justify-center hover:scale-110 transition-transform">
              <svg viewBox="0 0 24 24" width="28" height="28" xmlns="http://www.w3.org/2000/svg">
                <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </button>

            {/* Apple Icon */}
            <button type="button" className="w-11 h-11 rounded-full bg-transparent flex items-center justify-center hover:scale-110 transition-transform">
              <svg viewBox="0 0 24 24" width="30" height="30" xmlns="http://www.w3.org/2000/svg">
                <path fill="#a3a3a3" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.19 2.31-.88 3.5-.8 1.55.06 2.85.74 3.65 1.88-3.13 1.82-2.6 5.98.54 7.22-.72 1.76-1.64 3.12-2.77 3.87zm-2.45-13.8c.63-1.64-.17-3.32-1.63-4.15-1.57-.65-3.32.22-3.86 1.95-.57 1.81.4 3.44 1.93 4.04 1.48.59 3.01-.27 3.56-1.84z"/>
              </svg>
            </button>
          </div>

          {!isOtpMode && (
            <div className="w-full">
              <button
                type="button"
                className="w-full py-[18px] rounded-full text-white font-bold text-lg shadow-[0_0_30px_rgba(232,160,223,0.4)] bg-gradient-to-r from-[#b98df2] to-[#f4aae2] hover:opacity-90 transition-opacity flex justify-center items-center tracking-wide"
              >
                Create YUKiZi account
              </button>
            </div>
          )}
        </div>

      </div>

      {showForgotPassword && (
        <ForgotPasswordFlow onClose={() => setShowForgotPassword(false)} />
      )}
    </div>
  );
}
