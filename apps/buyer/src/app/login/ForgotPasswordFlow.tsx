'use client';

import React, { useState } from 'react';
import { Mail, User, Lock, KeyRound, Loader2, ArrowLeft } from 'lucide-react';

type FlowStep = 
  | 'INITIAL' 
  | 'RESTORE_EMAIL' 
  | 'RESTORE_OTP' 
  | 'RESTORE_NEW_PWD' 
  | 'RECOVER_INPUTS' 
  | 'RECOVER_PWD';

interface ForgotPasswordFlowProps {
  onClose: () => void;
}

export default function ForgotPasswordFlow({ onClose }: ForgotPasswordFlowProps) {
  const [step, setStep] = useState<FlowStep>('INITIAL');
  const [isLoading, setIsLoading] = useState(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSimulateLoading = (nextStep: FlowStep) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep(nextStep);
    }, 1000);
  };

  const renderInitial = () => (
    <div className="flex flex-col items-center">
      <div className="mb-6 flex justify-center">
        <div className="relative">
          <div className="w-16 h-10 border-2 border-gray-300 rounded-md flex items-center justify-center font-mono text-gray-400 font-bold tracking-widest text-lg">***</div>
          <Lock className="absolute -bottom-2 -right-2 w-6 h-6 text-[#f39c12] bg-white rounded-full p-0.5" />
        </div>
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-8">Forgot Password?</h2>
      <div className="w-full space-y-3">
        <button 
          onClick={() => setStep('RESTORE_EMAIL')}
          className="w-full py-3 rounded-md text-white font-bold shadow-md bg-[#8e44ad] hover:bg-[#7d3c98] transition-colors"
        >
          RESTORE
        </button>
        <button 
          onClick={() => setStep('RECOVER_INPUTS')}
          className="w-full py-3 rounded-md text-white font-bold shadow-md bg-[#8e44ad] hover:bg-[#7d3c98] transition-colors"
        >
          RECOVER
        </button>
      </div>
    </div>
  );

  const renderRestoreEmail = () => (
    <div className="flex flex-col items-center">
      <div className="mb-6 flex justify-center">
        <div className="w-12 h-12 rounded-full flex items-center justify-center">
          <Lock className="w-10 h-10 text-[#f39c12]" />
        </div>
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Restore Password</h2>
      <p className="text-sm text-gray-500 mb-6">Confirm your email</p>
      
      <div className="w-full space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-md bg-white border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8e44ad]"
          />
        </div>
        
        <button 
          onClick={() => handleSimulateLoading('RESTORE_OTP')}
          disabled={isLoading || !email}
          className="w-full py-3 rounded-md text-white font-bold shadow-md bg-[#8e44ad] hover:bg-[#7d3c98] transition-colors flex justify-center items-center"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'SEND CODE'}
        </button>
        
        <div className="text-center mt-4">
          <button onClick={() => setStep('INITIAL')} className="text-xs text-gray-500 hover:text-gray-800">
            Try another way
          </button>
        </div>
      </div>
    </div>
  );

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // limit to 1 char
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    // Auto-focus next input could be added here
  };

  const renderRestoreOtp = () => (
    <div className="flex flex-col items-center">
      <div className="mb-6 flex justify-center">
        <div className="w-12 h-12 rounded-full flex items-center justify-center">
          <Lock className="w-10 h-10 text-[#f39c12]" />
        </div>
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-8">Restore Password</h2>
      
      <div className="w-full space-y-6">
        <div className="flex justify-between gap-2">
          {otp.map((digit, i) => (
            <input
              key={i}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              className="w-12 h-12 text-center text-xl font-bold rounded-md bg-white border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8e44ad]"
            />
          ))}
        </div>
        
        <button 
          onClick={() => handleSimulateLoading('RESTORE_NEW_PWD')}
          disabled={isLoading || otp.some(d => !d)}
          className="w-full py-3 rounded-md text-white font-bold shadow-md bg-[#8e44ad] hover:bg-[#7d3c98] transition-colors flex justify-center items-center"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'ENTER CODE'}
        </button>
      </div>
    </div>
  );

  const renderRestoreNewPwd = () => (
    <div className="flex flex-col items-center">
      <div className="mb-6 flex justify-center">
        <div className="w-12 h-12 rounded-full flex items-center justify-center">
          <Lock className="w-10 h-10 text-[#f39c12]" />
        </div>
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Restore Password</h2>
      <p className="text-sm text-gray-500 mb-6">Set your new password</p>
      
      <div className="w-full space-y-4">
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-md bg-white border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8e44ad]"
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-md bg-white border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8e44ad]"
        />
        
        <button 
          onClick={() => {
            setIsLoading(true);
            setTimeout(() => { onClose(); }, 1500); // Close on success
          }}
          disabled={isLoading || !newPassword || newPassword !== confirmPassword}
          className="w-full py-3 rounded-md text-white font-bold shadow-md bg-[#8e44ad] hover:bg-[#7d3c98] transition-colors flex justify-center items-center"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'CONFIRM'}
        </button>
      </div>
    </div>
  );

  const renderRecoverInputs = () => (
    <div className="flex flex-col items-center">
      <div className="mb-6 flex justify-center">
        <div className="w-12 h-12 rounded-full flex items-center justify-center">
          <Lock className="w-10 h-10 text-[#f39c12]" />
        </div>
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-8">Recover Password</h2>
      
      <div className="w-full space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-md bg-white border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8e44ad]"
          />
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-md bg-white border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8e44ad]"
          />
        </div>
        
        <button 
          onClick={() => handleSimulateLoading('RECOVER_PWD')}
          disabled={isLoading || !username || !email}
          className="w-full py-3 rounded-md text-white font-bold shadow-md bg-[#8e44ad] hover:bg-[#7d3c98] transition-colors flex justify-center items-center"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'SEND CODE'}
        </button>
        
        <div className="text-center mt-4">
          <button onClick={() => setStep('INITIAL')} className="text-xs text-gray-500 hover:text-gray-800">
            Try another way
          </button>
        </div>
      </div>
    </div>
  );

  const renderRecoverPwd = () => (
    <div className="flex flex-col items-center">
      <div className="mb-6 flex justify-center">
        <div className="w-12 h-12 rounded-full flex items-center justify-center">
          <Lock className="w-10 h-10 text-[#f39c12]" />
        </div>
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-8">Recover Password</h2>
      
      <div className="w-full space-y-4">
        <input
          type="password"
          placeholder="Enter Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-md bg-white border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8e44ad]"
        />
        
        <button 
          onClick={() => {
            setIsLoading(true);
            setTimeout(() => { onClose(); }, 1500); // Close on success
          }}
          disabled={isLoading || !newPassword}
          className="w-full py-3 rounded-md text-white font-bold shadow-md bg-[#8e44ad] hover:bg-[#7d3c98] transition-colors flex justify-center items-center"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'CONFIRM'}
        </button>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 'INITIAL': return renderInitial();
      case 'RESTORE_EMAIL': return renderRestoreEmail();
      case 'RESTORE_OTP': return renderRestoreOtp();
      case 'RESTORE_NEW_PWD': return renderRestoreNewPwd();
      case 'RECOVER_INPUTS': return renderRecoverInputs();
      case 'RECOVER_PWD': return renderRecoverPwd();
      default: return renderInitial();
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-[320px] bg-[#f2f2f2] rounded-[30px] p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
        >
          ✕
        </button>
        {step !== 'INITIAL' && (
          <button 
            onClick={() => setStep('INITIAL')}
            className="absolute top-4 left-4 text-gray-400 hover:text-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        
        {renderStep()}
      </div>
    </div>
  );
}
