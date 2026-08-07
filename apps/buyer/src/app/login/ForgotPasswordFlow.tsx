'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Loader2, Mail, User } from 'lucide-react';
import { sendOtp, resetPassword } from '@yukizi/api-client';
import { useToast } from '@/components/shared/Toast';

// ─── Types ────────────────────────────────────────────────────────────────────
type FlowStep =
  | 'INITIAL'
  | 'RESTORE_EMAIL'
  | 'RESTORE_OTP'
  | 'RESTORE_NEW_PWD'
  | 'RECOVER_INPUTS'
  | 'RECOVER_PWD'
  | 'SUCCESS';

interface ForgotPasswordFlowProps {
  onClose: () => void;
}

// ─── SVG Icon: Orange Padlock (rounded cartoon style) ────────────────────────
function OrangeLock({ size = 56 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shackle (U-shaped arc) */}
      <path
        d="M24 38 V26 C24 13.85 33.85 4 46 4 C58.15 4 68 13.85 68 26 V38"
        stroke="#f5a623"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />
      {/* Lock body */}
      <rect x="10" y="36" width="72" height="50" rx="12" fill="#f5a623" />
      {/* Highlight on body top */}
      <rect x="18" y="42" width="24" height="6" rx="3" fill="#f9c46b" opacity="0.5" />
      {/* Keyhole oval */}
      <ellipse cx="46" cy="57" rx="7" ry="8" fill="#c47d0a" />
      {/* Keyhole notch */}
      <rect x="42.5" y="62" width="7" height="10" rx="3" fill="#c47d0a" />
    </svg>
  );
}

// ─── SVG Icon: Circular Refresh Arrow (gray badge) ────────────────────────────
function RefreshBadge({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 26 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Gray circle background */}
      <circle cx="13" cy="13" r="13" fill="#9ca3af" />
      {/* Refresh arrow path */}
      <path
        d="M8 13 A5 5 0 1 1 10.5 17.5"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Arrowhead */}
      <polyline
        points="8,10 8,13.5 11.5,13.5"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

// ─── Screen 1 icon: password text-field outline + small orange lock ───────────
function PasswordBoxIcon() {
  return (
    <div className="relative inline-flex items-center justify-center mb-5 mt-2">
      {/* Outlined input-like box */}
      <div
        style={{
          width: 86,
          height: 50,
          borderRadius: 10,
          border: '2.5px solid #c8c8c8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          gap: 6,
          paddingLeft: 8,
          paddingRight: 16,
        }}
      >
        <span style={{ color: '#9ca3af', fontWeight: 700, fontSize: 24, letterSpacing: 4 }}>**</span>
      </div>
      {/* Small orange lock badge — overlaps bottom-right corner */}
      <div style={{ position: 'absolute', bottom: -10, right: -14 }}>
        <OrangeLock size={30} />
      </div>
    </div>
  );
}

// ─── Screens 2–4 icon: large orange lock + refresh badge ─────────────────────
function OrangeLockWithRefresh() {
  return (
    <div style={{ position: 'relative', display: 'inline-flex', marginBottom: 16, marginTop: 4 }}>
      <OrangeLock size={62} />
      {/* Refresh badge — bottom-right of lock */}
      <div style={{ position: 'absolute', bottom: -4, right: -10 }}>
        <RefreshBadge size={26} />
      </div>
    </div>
  );
}

// ─── Step Progress Dots ───────────────────────────────────────────────────────
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === current ? 10 : 8,
            height: i === current ? 10 : 8,
            borderRadius: '50%',
            background: i === current ? '#f5a623' : i < current ? '#8e44ad' : '#c8b8d8',
            transition: 'all 0.3s',
          }}
        />
      ))}
    </div>
  );
}

// ── Shared button ─────────────────────────────────────────────────────────
const PurpleButton = ({
  label,
  onClick,
  disabled = false,
  isLoading = false,
}: {
  label: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled || isLoading}
    style={{
      width: '100%',
      padding: '14px 0',
      borderRadius: 14,
      background: disabled || isLoading
        ? 'linear-gradient(135deg,#a97ec4,#9b6db5)'
        : 'linear-gradient(135deg,#7b3fa3,#6a2d91)',
      color: '#fff',
      fontWeight: 700,
      fontSize: 14,
      letterSpacing: '0.12em',
      border: 'none',
      cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      boxShadow: '0 4px 14px rgba(107,45,145,0.35)',
      transition: 'all 0.15s',
      opacity: disabled || isLoading ? 0.72 : 1,
    }}
  >
    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : label}
  </button>
);

// ── Text input ───────────────────────────────────────────────────────────
const TextInput = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  icon,
}: {
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  icon?: React.ReactNode;
}) => (
  <div style={{ position: 'relative' }}>
    {icon && (
      <div style={{
        position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
        color: '#9ca3af', pointerEvents: 'none', display: 'flex', alignItems: 'center',
      }}>
        {icon}
      </div>
    )}
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: icon ? '12px 14px 12px 36px' : '12px 14px',
        borderRadius: 12,
        border: '1.5px solid #e2e2e2',
        background: '#fff',
        color: '#374151',
        fontSize: 14,
        outline: 'none',
        boxSizing: 'border-box',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
      onFocus={(e) => { e.target.style.borderColor = '#8e44ad'; e.target.style.boxShadow = '0 0 0 3px rgba(142,68,173,0.15)'; }}
      onBlur={(e) => { e.target.style.borderColor = '#e2e2e2'; e.target.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; }}
    />
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ForgotPasswordFlow({ onClose }: ForgotPasswordFlowProps) {
  const [step, setStep] = useState<FlowStep>('INITIAL');
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step === 'RESTORE_OTP') {
      setTimeout(() => otpRefs.current[0]?.focus(), 120);
    }
  }, [step]);

  const { toast } = useToast();

  const go = (next: FlowStep) => {
    setIsLoading(true);
    setTimeout(() => { setIsLoading(false); setStep(next); }, 700);
  };

  const handleSendOtp = async (contact: string, nextStep: FlowStep) => {
    setIsLoading(true);
    try {
      await sendOtp(contact);
      toast('OTP sent successfully!', 'success');
      setStep(nextStep);
    } catch (error: any) {
      console.error('Send OTP Error:', error);
      let msg = 'Failed to send OTP';
      if (error?.response?.data?.message) {
        const dataMsg = error.response.data.message;
        msg = Array.isArray(dataMsg) ? dataMsg[0] : dataMsg;
      } else if (error?.message) {
        msg = error.message;
      }
      toast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (contact: string, newPwd: string) => {
    setIsLoading(true);
    try {
      await resetPassword({ contact, otp: otp.join(''), newPassword: newPwd });
      toast('Password reset successfully!', 'success');
      setStep('SUCCESS');
    } catch (error: any) {
      console.error('Reset Password Error:', error);
      let msg = 'Failed to reset password';
      if (error?.response?.data?.message) {
        const dataMsg = error.response.data.message;
        msg = Array.isArray(dataMsg) ? dataMsg[0] : dataMsg;
      } else if (error?.message) {
        msg = error.message;
      }
      toast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const char = value.replace(/\D/, '').slice(-1);
    const next = [...otp];
    next[index] = char;
    setOtp(next);
    if (char && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 0 — Initial: RESTORE / RECOVER choice
  // ═══════════════════════════════════════════════════════════════════════════
  const renderInitial = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <PasswordBoxIcon />
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#4b4b4b', marginBottom: 24, marginTop: 8 }}>
        Forgot Password?
      </h2>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <PurpleButton isLoading={isLoading} label="RESTORE" onClick={() => setStep('RESTORE_EMAIL')} />
        <PurpleButton isLoading={isLoading} label="RECOVER" onClick={() => setStep('RECOVER_INPUTS')} />
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1 — Restore: enter email
  // ═══════════════════════════════════════════════════════════════════════════
  const renderRestoreEmail = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <OrangeLockWithRefresh />
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#4b4b4b', marginBottom: 4, marginTop: 2 }}>
        Restore Password
      </h2>
      <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 18 }}>Confirm your email</p>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <TextInput
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={setEmail}
          icon={<Mail className="w-4 h-4" />}
        />
        <PurpleButton isLoading={isLoading} label="SEND CODE" onClick={() => handleSendOtp(email, 'RESTORE_OTP')} disabled={!email.trim()} />
        <div style={{ textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => setStep('INITIAL')}
            style={{ fontSize: 12, color: '#9ca3af', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Try another way
          </button>
        </div>
      </div>
      <StepDots current={0} total={3} />
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 2 — Restore: OTP input (5 boxes showing * placeholder)
  // ═══════════════════════════════════════════════════════════════════════════
  const renderRestoreOtp = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <OrangeLockWithRefresh />
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#4b4b4b', marginBottom: 22, marginTop: 2 }}>
        Restore Password
      </h2>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* ── 5 OTP Boxes ── */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          {otp.map((digit, i) => (
            <div key={i} style={{ position: 'relative', flex: 1 }}>
              <input
                ref={(el) => { otpRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                placeholder="*"
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                style={{
                  width: '100%',
                  aspectRatio: '1 / 1',
                  textAlign: 'center',
                  fontSize: digit ? 22 : 20,
                  fontWeight: 700,
                  borderRadius: 12,
                  border: '1.5px solid #e2e2e2',
                  background: '#ffffff',
                  color: digit ? '#374151' : '#c0c0c0',
                  outline: 'none',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#8e44ad';
                  e.target.style.boxShadow = '0 0 0 3px rgba(142,68,173,0.18)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e2e2';
                  e.target.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)';
                }}
              />
            </div>
          ))}
        </div>

        <PurpleButton
          isLoading={isLoading}
          label="ENTER CODE"
          onClick={() => go('RESTORE_NEW_PWD')}
          disabled={otp.some((d) => !d)}
        />
      </div>
      <StepDots current={1} total={3} />
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 3 — Restore: set new password
  // ═══════════════════════════════════════════════════════════════════════════
  const renderRestoreNewPwd = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <OrangeLockWithRefresh />
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#4b4b4b', marginBottom: 18, marginTop: 2 }}>
        Restore Password
      </h2>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <TextInput
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={setNewPassword}
        />
        <TextInput
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
        />
        <PurpleButton
          isLoading={isLoading}
          label="CONFIRM"
          onClick={() => handleResetPassword(email, newPassword)}
          disabled={!newPassword || newPassword !== confirmPassword}
        />
      </div>
      <StepDots current={2} total={3} />
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // RECOVER STEPS
  // ═══════════════════════════════════════════════════════════════════════════
  const renderRecoverInputs = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <OrangeLockWithRefresh />
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#4b4b4b', marginBottom: 18, marginTop: 2 }}>
        Recover Password
      </h2>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <TextInput
          placeholder="Username"
          value={username}
          onChange={setUsername}
          icon={<User className="w-4 h-4" />}
        />
        <TextInput
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={setEmail}
          icon={<Mail className="w-4 h-4" />}
        />
        <PurpleButton
          isLoading={isLoading}
          label="SEND CODE"
          onClick={() => handleSendOtp(email, 'RECOVER_PWD')}
          disabled={!username.trim() || !email.trim()}
        />
        <div style={{ textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => setStep('INITIAL')}
            style={{ fontSize: 12, color: '#9ca3af', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Try another way
          </button>
        </div>
      </div>
    </div>
  );

  const renderRecoverPwd = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <OrangeLockWithRefresh />
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#4b4b4b', marginBottom: 18, marginTop: 2 }}>
        Recover Password
      </h2>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <TextInput
          type="password"
          placeholder="Enter New Password"
          value={newPassword}
          onChange={setNewPassword}
        />
        <PurpleButton
          isLoading={isLoading}
          label="CONFIRM"
          onClick={() => handleResetPassword(email, newPassword)}
          disabled={!newPassword}
        />
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // SUCCESS
  // ═══════════════════════════════════════════════════════════════════════════
  const renderSuccess = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%', background: '#4CAF50',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#4b4b4b', marginBottom: 12 }}>
        Password Updated!
      </h2>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 28, textAlign: 'center', lineHeight: 1.5 }}>
        Your password has been changed successfully. You can now log in with your new credentials.
      </p>
      <PurpleButton label="CONTINUE TO LOGIN" onClick={onClose} />
    </div>
  );

  // ─── Step router ────────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      case 'INITIAL':         return renderInitial();
      case 'RESTORE_EMAIL':   return renderRestoreEmail();
      case 'RESTORE_OTP':     return renderRestoreOtp();
      case 'RESTORE_NEW_PWD': return renderRestoreNewPwd();
      case 'RECOVER_INPUTS':  return renderRecoverInputs();
      case 'RECOVER_PWD':     return renderRecoverPwd();
      case 'SUCCESS':         return renderSuccess();
      default:                return renderInitial();
    }
  };

  // ─── Modal shell ─────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center px-4"
      style={{ background: 'rgba(90,50,130,0.52)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 330,
          background: '#ededed',
          borderRadius: 26,
          padding: '32px 28px 28px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          animation: 'fpPop 0.24s cubic-bezier(0.34,1.56,0.64,1) both',
        }}
      >
        {/* ✕ Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute', top: 14, right: 14,
            width: 28, height: 28,
            background: 'rgba(0,0,0,0.06)',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#6b7280', fontSize: 14, fontWeight: 700,
            transition: 'background 0.15s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.12)')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.06)')}
        >
          ✕
        </button>

        {/* ← Back button (non-initial steps) */}
        {step !== 'INITIAL' && step !== 'SUCCESS' && (
          <button
            type="button"
            onClick={() => setStep('INITIAL')}
            aria-label="Back"
            style={{
              position: 'absolute', top: 14, left: 14,
              width: 28, height: 28,
              background: 'rgba(0,0,0,0.06)',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#6b7280',
              transition: 'background 0.15s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.12)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.06)')}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}

        {renderStep()}
      </div>

      <style>{`
        @keyframes fpPop {
          from { opacity: 0; transform: scale(0.86) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
