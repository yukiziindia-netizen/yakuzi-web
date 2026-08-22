'use client';

import React, { useState, useEffect } from 'react';
import { User, Lock, Eye, EyeOff, Loader2, Phone, KeyRound, X, Undo2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@yukizi/api-client';
import { useToast } from '@/components/shared/Toast';
import { useScrollLock } from '@/hooks/useScrollLock';
import GoogleSignInButton from '@/components/shared/GoogleSignInButton';
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
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [signupStep, setSignupStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [signupUsername, setSignupUsername] = useState('');
  const [signupContact, setSignupContact] = useState('');
  const [signupOtp, setSignupOtp] = useState('');
  const [signupRealName, setSignupRealName] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [signupGender, setSignupGender] = useState('');
  const [signupDate, setSignupDate] = useState<number | null>(6);
  const [signupMonth, setSignupMonth] = useState<number>(9);
  const [signupYear, setSignupYear] = useState<number>(2023);
  
  const [displayMonth, setDisplayMonth] = useState<number>(9);
  const [displayYear, setDisplayYear] = useState<number>(2023);
  const [showMonthSelect, setShowMonthSelect] = useState(false);
  const [showYearSelect, setShowYearSelect] = useState(false);
  
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();
  const { sendOtp, verifyOtp, registerBuyer, loginWithPassword } = useAuth();

  const isOpen = isOpenProp !== undefined ? isOpenProp : isOpenState;
  const onClose = onCloseProp !== undefined ? onCloseProp : () => setIsOpenState(false);
  useScrollLock(isOpen);

  // Lets pages like AuthGuard know the user actively dismissed the modal
  // (cancel, backdrop click, X button) without logging in, so they can stop
  // showing "redirecting to login" forever. Only for true cancels, not the
  // onClose() call inside handleCloseCleanup's success paths below.
  const dismissWithoutLogin = () => {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('login-modal-closed'));
    onClose();
  };

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

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    if (displayMonth === 0) {
      setDisplayMonth(11);
      setDisplayYear(displayYear - 1);
    } else {
      setDisplayMonth(displayMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (displayMonth === 11) {
      setDisplayMonth(0);
      setDisplayYear(displayYear + 1);
    } else {
      setDisplayMonth(displayMonth + 1);
    }
  };

  const daysInMonth = getDaysInMonth(displayYear, displayMonth);
  const firstDay = getFirstDayOfMonth(displayYear, displayMonth);
  const daysInPrevMonth = getDaysInMonth(displayYear, displayMonth - 1);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) { toast('Please enter your username, email, or phone', 'error'); return; }
    if (!password) { toast('Please enter your password', 'error'); return; }
    
    setIsLoading(true);
    try {
      await loginWithPassword({ contact: username, password });
      toast('Login successful!', 'success');
      handleCloseCleanup();
      router.push('/');
    } catch (e: any) {
      toast(e?.response?.data?.message || 'Invalid credentials', 'error');
    } finally {
      setIsLoading(false);
    }
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

  const handleSignupSendOtp = async () => {
    if (!signupContact) { toast('Please enter an email or phone', 'error'); return; }
    setIsLoading(true);
    try {
      await sendOtp(signupContact);
      setSignupStep(3);
      toast('OTP sent successfully!', 'success');
    } catch (e: any) { 
      toast(e?.response?.data?.message || 'Failed to send OTP', 'error'); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleRegisterSubmit = async () => {
    if (!signupOtp) { toast('Please enter the OTP you received', 'error'); return; }
    if (!signupRealName) { toast('Please enter your real name', 'error'); return; }
    if (!signupPassword || signupPassword !== signupConfirmPassword) { toast('Passwords do not match', 'error'); return; }
    if (!signupGender) { toast('Please select your gender', 'error'); return; }

    setIsLoading(true);
    try {
      // Format dob as YYYY-MM-DD
      const monthStr = String(signupMonth + 1).padStart(2, '0');
      const dateStr = String(signupDate).padStart(2, '0');
      const dobStr = `${signupYear}-${monthStr}-${dateStr}`;

      await registerBuyer({
        username: signupUsername,
        contact: signupContact,
        otp: signupOtp,
        realName: signupRealName,
        password: signupPassword,
        dob: dobStr,
        gender: signupGender,
      });

      toast('Account created successfully!', 'success');
      handleCloseCleanup();
      router.push('/');
    } catch (e: any) {
      toast(e?.response?.data?.message || 'Failed to create account', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4"
      onClick={() => { if (!isSignupMode) dismissWithoutLogin(); }}
    >
    <div
      role="dialog"
      onClick={(e) => e.stopPropagation()}
      className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-[28px] bg-white px-6 py-10 shadow-2xl font-sans select-none"
    >
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #b49ce0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #8b65d1;
        }
      `}} />
      {/* Noise Overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(70% 55% at 50% -10%, rgba(161,85,232,0.13) 0%, rgba(89,54,150,0.05) 48%, rgba(255,255,255,0) 78%)' }}></div>

      {/* Close Button */}
      {!isSignupMode && (
        <button onClick={() => dismissWithoutLogin()} className="absolute top-4 right-4 p-2 text-[#64748b] hover:text-[#593696] bg-[#ebe6f5] hover:bg-[#d1c2eb] rounded-full z-[150] shadow-md transition-all">
          <X size={24} strokeWidth={2.5} />
        </button>
      )}

      {/* Back Button for Signup */}
      {isSignupMode && (
        <button 
          onClick={() => {
            if (signupStep === 6) setSignupStep(5);
            else if (signupStep === 5) setSignupStep(4);
            else if (signupStep === 4) setSignupStep(3);
            else if (signupStep === 3) setSignupStep(2);
            else if (signupStep === 2) setSignupStep(1);
            else setIsSignupMode(false);
          }} 
          className="absolute top-4 left-4 p-2 text-[#593696] hover:text-[#3d236b] z-[150] transition-colors"
        >
          <Undo2 size={32} strokeWidth={2.5} />
        </button>
      )}

      <div className="z-10 w-full max-w-sm flex flex-col items-center">
        
        {/* Logo */}
        <div className="mb-6 md:mb-8 flex justify-center w-full max-w-[180px] xs:max-w-[220px] sm:max-w-[240px] md:max-w-[280px] transition-all duration-300">
          <img
            src="/YukiziLogo.png"
            alt="YUKiZi"
            loading="lazy"
            decoding="async"
            className="w-full h-auto object-contain"
          />
        </div>

        {/* Form area */}
        {isSignupMode ? (
          <div className="w-full flex flex-col items-center">
            {signupStep === 1 ? (
              <>
                <h2 className="text-[#0f172a] text-xl mb-20 tracking-wide">
                  How do you want us call you ?
                </h2>
                
                <input
                  type="text"
                  value={signupUsername}
                  onChange={(e) => setSignupUsername(e.target.value)}
                  className="bg-transparent text-[#0f172a] text-center text-xl font-medium outline-none w-full max-w-[240px] mb-[100px] border-b border-[#e2e8f0] focus:border-[#593696] pb-1"
                  autoFocus
                />

                <button
                  type="button"
                  onClick={() => setSignupStep(2)}
                  className="w-full max-w-[280px] py-3.5 rounded-[12px] text-white font-bold text-lg shadow-[0_4px_14px_rgba(89,54,150,0.3)] bg-[#593696] hover:opacity-90 transition-opacity flex justify-center items-center tracking-wide"
                >
                  Continue
                </button>
              </>
            ) : signupStep === 2 ? (
              <>
                <h2 className="text-[#0f172a] text-2xl font-bold mb-10 tracking-wide">
                  Hi, {signupUsername || 'User'}
                </h2>
                
                <div className="w-full flex flex-col items-center mb-[100px] space-y-4">
                  <p className="text-[#0f172a] text-lg tracking-wide">Email or Phone ?</p>
                  <input
                    type="text"
                    value={signupContact}
                    onChange={(e) => setSignupContact(e.target.value)}
                    className="bg-transparent text-[#0f172a] text-center text-xl font-medium outline-none w-full max-w-[240px] border-b border-[#e2e8f0] focus:border-[#593696] pb-1"
                    autoFocus
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSignupSendOtp}
                  disabled={isLoading}
                  className="w-full max-w-[280px] py-3.5 rounded-[12px] text-white font-bold text-lg shadow-[0_4px_14px_rgba(89,54,150,0.3)] bg-[#593696] hover:opacity-90 transition-opacity flex justify-center items-center tracking-wide disabled:opacity-50"
                >
                  {isLoading ? 'Sending...' : 'Continue'}
                </button>
              </>
            ) : signupStep === 3 ? (
              <>
                <h2 className="text-[#0f172a] text-3xl font-bold mb-4 tracking-wide">
                  Verification
                </h2>
                
                <div className="w-full flex flex-col items-center mb-[100px] mt-12 space-y-4">
                  <p className="text-[#0f172a] text-lg tracking-wide text-center">You must have received an OTP</p>
                  <input
                    type="text"
                    value={signupOtp}
                    onChange={(e) => setSignupOtp(e.target.value)}
                    className="bg-transparent text-[#0f172a] text-center text-xl font-medium outline-none w-full max-w-[240px] border-b border-[#e2e8f0] focus:border-[#593696] pb-1"
                    autoFocus
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setSignupStep(4)}
                  className="w-full max-w-[280px] py-3.5 rounded-[12px] text-white font-bold text-lg shadow-[0_4px_14px_rgba(89,54,150,0.3)] bg-[#593696] hover:opacity-90 transition-opacity flex justify-center items-center tracking-wide"
                >
                  Continue
                </button>
              </>
            ) : signupStep === 4 ? (
              <>
                <h2 className="text-[#0f172a] text-3xl font-bold mb-4 tracking-wide">
                  Almost there !!
                </h2>
                
                <h3 className="text-[#0f172a] text-xl font-medium mb-[120px] tracking-wide">
                  What is you name ?
                </h3>
                
                <input
                  type="text"
                  value={signupRealName}
                  onChange={(e) => setSignupRealName(e.target.value)}
                  className="bg-transparent text-[#0f172a] text-center text-xl font-medium outline-none w-full max-w-[240px] mb-20 border-b border-[#e2e8f0] focus:border-[#593696] pb-1"
                  autoFocus
                />

                <button
                  type="button"
                  onClick={() => setSignupStep(5)}
                  className="w-full max-w-[280px] py-3.5 rounded-[12px] text-white font-bold text-lg shadow-[0_4px_14px_rgba(89,54,150,0.3)] bg-[#593696] hover:opacity-90 transition-opacity flex justify-center items-center tracking-wide"
                >
                  Continue
                </button>
              </>
            ) : signupStep === 5 ? (
              <>
                <h2 className="text-[#0f172a] text-3xl font-bold mb-4 tracking-wide">
                  Secure your account
                </h2>
                
                <div className="w-full flex flex-col items-center mb-6 mt-12 space-y-4">
                  <p className="text-[#0f172a] text-lg tracking-wide">Password</p>
                  <div className="relative w-full max-w-[240px]">
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="bg-transparent text-[#0f172a] text-center text-xl font-medium outline-none w-full border-b border-[#e2e8f0] focus:border-[#593696] pb-1 px-7"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword((s) => !s)}
                      aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-0 bottom-1 text-[#94a3b8] hover:text-[#593696]"
                    >
                      {showSignupPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="w-full flex flex-col items-center mb-[70px] space-y-4">
                  <p className="text-[#0f172a] text-lg tracking-wide">Confirm Password</p>
                  <div className="relative w-full max-w-[240px]">
                    <input
                      type={showSignupConfirmPassword ? 'text' : 'password'}
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      className="bg-transparent text-[#0f172a] text-center text-xl font-medium outline-none w-full border-b border-[#e2e8f0] focus:border-[#593696] pb-1 px-7"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupConfirmPassword((s) => !s)}
                      aria-label={showSignupConfirmPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-0 bottom-1 text-[#94a3b8] hover:text-[#593696]"
                    >
                      {showSignupConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSignupStep(6)}
                  className="w-full max-w-[280px] py-3.5 rounded-[12px] text-white font-bold text-lg shadow-[0_4px_14px_rgba(89,54,150,0.3)] bg-[#593696] hover:opacity-90 transition-opacity flex justify-center items-center tracking-wide"
                >
                  Continue
                </button>
              </>
            ) : (
              <>
                <h2 className="text-[#0f172a] text-3xl font-bold mb-2 tracking-wide">
                  One last thing -
                </h2>
                
                <h3 className="text-[#0f172a] text-xl font-medium mb-10 tracking-wide">
                  Your age ?
                </h3>
                
                {/* Calendar UI Mock */}
                <div className="bg-white rounded-[16px] p-5 w-[280px] shadow-[0_10px_30px_rgba(89,54,150,0.12)] mb-10 select-none border border-[#e2e8f0]">
                  <div className="flex justify-between items-center mb-5 px-1">
                    <div className="flex space-x-1">
                      <div className="relative">
                        <button 
                          type="button"
                          onClick={() => { setShowMonthSelect(!showMonthSelect); setShowYearSelect(false); }}
                          className="bg-transparent text-[#64748b] font-medium text-base outline-none hover:text-[#593696] transition-colors"
                        >
                          {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][displayMonth]}
                        </button>
                        {showMonthSelect && (
                          <>
                            <div className="fixed inset-0 z-[1001]" onClick={() => setShowMonthSelect(false)}></div>
                            <div className="absolute top-full left-0 mt-1 bg-white border border-[#e2e8f0] rounded-[10px] shadow-2xl z-[1002] max-h-48 overflow-y-auto w-[120px] custom-scrollbar">
                              {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                                <div 
                                  key={m} 
                                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-[#ebe6f5] transition-colors ${displayMonth === i ? 'text-[#593696] font-bold bg-[#ebe6f5]' : 'text-[#64748b]'}`}
                                  onClick={() => { setDisplayMonth(i); setShowMonthSelect(false); }}
                                >
                                  {m}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                      <div className="relative">
                        <button 
                          type="button"
                          onClick={() => { setShowYearSelect(!showYearSelect); setShowMonthSelect(false); }}
                          className="bg-transparent text-[#64748b] font-medium text-base outline-none hover:text-[#593696] transition-colors"
                        >
                          {displayYear}
                        </button>
                        {showYearSelect && (
                          <>
                            <div className="fixed inset-0 z-[1001]" onClick={() => setShowYearSelect(false)}></div>
                            <div className="absolute top-full left-0 mt-1 bg-white border border-[#e2e8f0] rounded-[10px] shadow-2xl z-[1002] max-h-48 overflow-y-auto w-[80px] custom-scrollbar">
                              {Array.from({length: 100}, (_, i) => new Date().getFullYear() - i).map(y => (
                                <div 
                                  key={y} 
                                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-[#ebe6f5] transition-colors ${displayYear === y ? 'text-[#593696] font-bold bg-[#ebe6f5]' : 'text-[#64748b]'}`}
                                  onClick={() => { setDisplayYear(y); setShowYearSelect(false); }}
                                >
                                  {y}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-4 text-[#94a3b8] font-bold">
                      <button type="button" onClick={handlePrevMonth} className="hover:text-[#593696] transition-colors">&lt;</button>
                      <button type="button" onClick={handleNextMonth} className="hover:text-[#593696] transition-colors">&gt;</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-[#94a3b8] text-xs font-medium mb-4">
                    <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                  </div>
                  <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center text-[#334155] text-sm font-medium">
                    {Array.from({ length: firstDay }, (_, i) => daysInPrevMonth - firstDay + i + 1).map((day, i) => (
                      <span key={`prev-${i}`} className="text-[#cbd5e1] w-6 h-6 flex items-center justify-center mx-auto cursor-default">
                        {day}
                      </span>
                    ))}
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                      const isSelected = signupDate === day && signupMonth === displayMonth && signupYear === displayYear;
                      return (
                        <span 
                          key={`curr-${day}`}
                          onClick={() => { setSignupDate(day); setSignupMonth(displayMonth); setSignupYear(displayYear); }}
                          className={`cursor-pointer ${isSelected ? 'bg-[#593696] text-white rounded-full w-6 h-6 flex items-center justify-center mx-auto shadow-[0_0_10px_rgba(89,54,150,0.45)]' : 'w-6 h-6 flex items-center justify-center mx-auto hover:text-[#593696] transition-colors'}`}
                        >
                          {day}
                        </span>
                      );
                    })}
                    {Array.from({ length: 42 - (firstDay + daysInMonth) }, (_, i) => i + 1).map((day, i) => (
                      <span key={`next-${i}`} className="text-[#cbd5e1] w-6 h-6 flex items-center justify-center mx-auto cursor-default">
                        {day}
                      </span>
                    ))}
                  </div>
                </div>

                <h3 className="text-[#0f172a] text-xl font-medium mb-6 tracking-wide">
                  Gender
                </h3>
                
                <div className="flex space-x-6 mb-12 text-[#0f172a] font-medium text-lg">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <div className={`w-5 h-5 rounded-[6px] border-[1.5px] flex items-center justify-center ${signupGender === 'him' ? 'border-[#593696] bg-[#593696]/10' : 'border-[#cbd5e1]'}`}>
                      {signupGender === 'him' && <div className="w-2.5 h-2.5 rounded-[3px] bg-[#593696]"></div>}
                    </div>
                    <span>Him</span>
                    <input type="radio" className="hidden" name="gender" value="him" onChange={() => setSignupGender('him')} />
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <div className={`w-5 h-5 rounded-[6px] border-[1.5px] flex items-center justify-center ${signupGender === 'her' ? 'border-[#593696] bg-[#593696]/10' : 'border-[#cbd5e1]'}`}>
                      {signupGender === 'her' && <div className="w-2.5 h-2.5 rounded-[3px] bg-[#593696]"></div>}
                    </div>
                    <span>Her</span>
                    <input type="radio" className="hidden" name="gender" value="her" onChange={() => setSignupGender('her')} />
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <div className={`w-5 h-5 rounded-[6px] border-[1.5px] flex items-center justify-center ${signupGender === 'others' ? 'border-[#593696] bg-[#593696]/10' : 'border-[#cbd5e1]'}`}>
                      {signupGender === 'others' && <div className="w-2.5 h-2.5 rounded-[3px] bg-[#593696]"></div>}
                    </div>
                    <span>Others</span>
                    <input type="radio" className="hidden" name="gender" value="others" onChange={() => setSignupGender('others')} />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleRegisterSubmit}
                  disabled={isLoading}
                  className="w-full max-w-[280px] py-[16px] rounded-[16px] text-white font-bold text-xl shadow-[0_8px_24px_rgba(89,54,150,0.28)] bg-gradient-to-b from-[#a155e8] via-[#7b41b0] to-[#512384] hover:opacity-90 transition-opacity flex justify-center items-center tracking-wide disabled:opacity-50"
                >
                  {isLoading ? 'Creating...' : 'Create YUKiZi account'}
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            {!isOtpMode ? (
          <form onSubmit={handleLogin} className="w-full space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <User className="h-[22px] w-[22px] text-[#94a3b8]" strokeWidth={2.5} />
              </div>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-14 pr-4 py-[18px] rounded-full bg-[#f5f3fa] text-[#0f172a] placeholder-[#94a3b8] border border-[#ebe6f5] focus:outline-none focus:ring-2 focus:ring-[#593696] focus:border-transparent shadow-[0_2px_10px_rgba(89,54,150,0.07)] font-bold text-lg"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Lock className="h-[22px] w-[22px] text-[#94a3b8]" strokeWidth={2.5} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-14 pr-14 py-[18px] rounded-full bg-[#f5f3fa] text-[#0f172a] placeholder-[#94a3b8] border border-[#ebe6f5] focus:outline-none focus:ring-2 focus:ring-[#593696] focus:border-transparent shadow-[0_2px_10px_rgba(89,54,150,0.07)] font-bold text-lg"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-5 flex items-center text-[#94a3b8] hover:text-[#593696]"
              >
                {showPassword ? <EyeOff className="h-[22px] w-[22px]" /> : <Eye className="h-[22px] w-[22px]" />}
              </button>
            </div>

            <div className="flex justify-center items-center text-sm md:text-sm mt-5 text-[#64748b] font-semibold tracking-wide">
              <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowForgotPassword(true); }} className="underline underline-offset-2 hover:text-[#593696] transition-colors mr-1">Forgot Password ?</button>
              <span className="opacity-90">Login through </span>
              <button type="button" onClick={() => setIsOtpMode(true)} className="underline underline-offset-2 ml-1 hover:text-[#593696] transition-colors">OTP</button>
            </div>
            
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-full text-white font-bold text-lg shadow-[0_8px_24px_rgba(89,54,150,0.28)] bg-gradient-to-b from-[#a155e8] via-[#7b41b0] to-[#512384] hover:opacity-90 transition-opacity flex justify-center items-center"
              >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Login'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); step === 'phone' ? handleSendOtp() : handleVerifyOtp(); }} className="w-full space-y-4">
            {step === 'phone' ? (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Phone className="h-[22px] w-[22px] text-[#94a3b8]" strokeWidth={2.5} />
                </div>
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-14 pr-4 py-[18px] rounded-full bg-[#f5f3fa] text-[#0f172a] placeholder-[#94a3b8] border border-[#ebe6f5] focus:outline-none focus:ring-2 focus:ring-[#593696] focus:border-transparent shadow-[0_2px_10px_rgba(89,54,150,0.07)] font-bold text-lg"
                />
              </div>
            ) : (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <KeyRound className="h-[22px] w-[22px] text-[#94a3b8]" strokeWidth={2.5} />
                </div>
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  className="w-full pl-14 pr-4 py-[18px] rounded-full bg-[#f5f3fa] text-[#0f172a] placeholder-[#94a3b8] border border-[#ebe6f5] focus:outline-none focus:ring-2 focus:ring-[#593696] focus:border-transparent shadow-[0_2px_10px_rgba(89,54,150,0.07)] font-bold text-lg tracking-[0.2em]"
                />
              </div>
            )}

            <div className="flex justify-center items-center text-sm md:text-sm mt-5 text-[#64748b] font-semibold tracking-wide">
              <button type="button" onClick={() => setIsOtpMode(false)} className="underline underline-offset-2 hover:text-[#593696] transition-colors mr-1">Use Password ?</button>
              {step === 'otp' && (
                <>
                  <span className="opacity-90">or </span>
                  <button type="button" onClick={() => { setStep('phone'); setOtp(''); }} className="underline underline-offset-2 ml-1 hover:text-[#593696] transition-colors">Change Number</button>
                </>
              )}
            </div>
            
            {/* Action button for OTP */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-full text-white font-bold text-lg shadow-[0_8px_24px_rgba(89,54,150,0.28)] bg-gradient-to-b from-[#a155e8] via-[#7b41b0] to-[#512384] hover:opacity-90 transition-opacity flex justify-center items-center"
              >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (step === 'phone' ? 'Send OTP' : 'Verify OTP')}
              </button>
            </div>
          </form>
        )}

        {/* Separator & Social Login - Always visible */}
        <div className="w-full flex flex-col items-center">
          <div className="flex items-center justify-center space-x-4 mt-6 mb-4 w-full">
            <div className="h-px w-12 bg-[#e2e8f0]"></div>
            <span className="text-[#94a3b8] font-medium text-base">or</span>
            <div className="h-px w-12 bg-[#e2e8f0]"></div>
          </div>

          <div className="flex justify-center space-x-6 mb-6">
            {/* Google Icon — Google's own button when configured, so the click
                actually returns an ID token; the static icon otherwise. */}
            <GoogleSignInButton
              active={isOpen}
              onSuccess={handleCloseCleanup}
              onLoadingChange={setIsLoading}
              fallback={
            <button type="button" className="w-11 h-11 rounded-full bg-white border border-[#e2e8f0] shadow-[0_1px_4px_rgba(0,0,0,0.05)] flex items-center justify-center hover:scale-110 transition-transform">
              <svg viewBox="0 0 24 24" width="28" height="28" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                  <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                  <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                  <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                  <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                </g>
              </svg>
            </button>
              }
            />

            {/* Facebook Icon */}
            <button
              type="button"
              disabled
              title="Facebook sign-in is not available yet"
              aria-label="Facebook sign-in is not available yet"
              className="w-11 h-11 rounded-full bg-white border border-[#e2e8f0] shadow-[0_1px_4px_rgba(0,0,0,0.05)] flex items-center justify-center opacity-40 cursor-not-allowed"
            >
              <svg viewBox="0 0 24 24" width="28" height="28" xmlns="http://www.w3.org/2000/svg">
                <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </button>

            {/* Apple Icon */}
            <button
              type="button"
              disabled
              title="Apple sign-in is not available yet"
              aria-label="Apple sign-in is not available yet"
              className="w-11 h-11 rounded-full bg-white border border-[#e2e8f0] shadow-[0_1px_4px_rgba(0,0,0,0.05)] flex items-center justify-center opacity-40 cursor-not-allowed"
            >
              <svg viewBox="0 0 24 24" width="30" height="30" xmlns="http://www.w3.org/2000/svg">
                <path fill="#0f172a" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.19 2.31-.88 3.5-.8 1.55.06 2.85.74 3.65 1.88-3.13 1.82-2.6 5.98.54 7.22-.72 1.76-1.64 3.12-2.77 3.87zm-2.45-13.8c.63-1.64-.17-3.32-1.63-4.15-1.57-.65-3.32.22-3.86 1.95-.57 1.81.4 3.44 1.93 4.04 1.48.59 3.01-.27 3.56-1.84z"/>
              </svg>
            </button>
          </div>

            {!isOtpMode && (
              <div className="w-full">
                <button
                  type="button"
                  onClick={() => setIsSignupMode(true)}
                  className="w-full py-[18px] rounded-full text-white font-bold text-lg shadow-[0_8px_24px_rgba(89,54,150,0.28)] bg-gradient-to-b from-[#a155e8] via-[#7b41b0] to-[#512384] hover:opacity-90 transition-opacity flex justify-center items-center tracking-wide"
                >
                  Create YUKiZi account
                </button>
              </div>
            )}
          </div>
          </>
        )}

      </div>

      {showForgotPassword && (
        <ForgotPasswordFlow onClose={() => setShowForgotPassword(false)} />
      )}
    </div>
    </div>
  );
}
