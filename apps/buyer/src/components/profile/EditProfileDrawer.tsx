'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Camera, X, Check, Loader2 } from 'lucide-react';
import { useBuyerProfile, useUpdateBuyerProfile } from '@/hooks/useBuyerProfile';
import { useAuth } from '@yukizi/api-client';
import { useToast } from '@/components/shared/Toast';

interface EditProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditProfileDrawer({ isOpen, onClose }: EditProfileDrawerProps) {
  const {
    data: profile,
    isLoading: isProfileLoading,
    isError: isProfileError,
    error: profileError,
    refetch: refetchProfile,
  } = useBuyerProfile();
  const { user, logout } = useAuth();
  const { mutateAsync: updateProfile, isPending: isUpdating } = useUpdateBuyerProfile();
  const { toast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [photo, setPhoto] = useState<string>('');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    address: '',
    phone: '',
    gender: '',
    dob: '',
  });

  // Load initial data
  useEffect(() => {
    const addr =
      profile && typeof profile.address === 'object' ? profile.address : null;
    const street =
      (addr as any)?.street1 ??
      (typeof profile?.address === 'string' ? profile.address : '');
    const city = profile?.city ?? (addr as any)?.city ?? '';
    const state = profile?.state ?? (addr as any)?.state ?? '';
    const pincode = profile?.pincode ?? (addr as any)?.pincode ?? '';
    const fullAddress = [street, city, state, pincode].filter(Boolean).join(', ');

    // Fall back to the signed-in user, never to invented data. This block used
    // to be gated on `if (profile)`, so until that query resolved every row
    // rendered blank — which is what a new buyer sees straight after signup,
    // even though the session already knows their username, email and phone.
    setFormData({
      name: profile?.legalName || '',
      username: profile?.user?.username || user?.username || '',
      email: profile?.user?.email || user?.email || '',
      address: fullAddress,
      phone: profile?.user?.phone || user?.phone || '',
      gender: (profile?.user as any)?.gender || '',
      // The date input wants yyyy-mm-dd; the API returns a full ISO timestamp.
      dob: ((profile?.user as any)?.dob || '').slice(0, 10),
    });

    // Avatar lives in this browser only — the API has no avatar field on the
    // buyer profile, so there is nothing to load from the server.
    setPhoto(localStorage.getItem('yukizi_avatar') || '');
  }, [profile, user]);

  // A failed profile load used to be indistinguishable from an empty profile:
  // both rendered "Add your name" on every row. Say which one it is.
  const profileStatus = (profileError as any)?.response?.status;
  const serverMessage = (() => {
    const m = (profileError as any)?.response?.data?.message;
    return Array.isArray(m) ? m[0] : m;
  })();
  const loadErrorMessage = profileStatus === 403
    ? 'This account does not have buyer access, so its profile cannot be loaded or edited.'
    : serverMessage || 'We could not load your profile. Check your connection and try again.';

  // What an empty row should say depends on why it is empty.
  const emptyLabel = (prompt: string) =>
    isProfileLoading ? 'Loading…' : isProfileError ? 'Unavailable' : prompt;

  // Shown when no photo has been uploaded. Never invent a stock portrait.
  const initials =
    [formData.name, formData.username, formData.email]
      .find((value) => value && value.trim())
      ?.trim()
      .split(/[\s._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase() || '?';

  if (!isOpen) return null;

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        setPhoto(result);
        localStorage.setItem('yukizi_avatar', result);
        toast('Photo updated successfully!', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  // The number the buyer reached checkout with, when their account has no
  // saved phone (checkout cannot claim a number another account owns).
  const contactPhone = !formData.phone ? ((profile as any)?.contactPhone || '') : '';

  const startEditing = (field: keyof typeof formData, prefill?: string) => {
    // Saving goes to the same endpoint that just refused to load, so offering
    // an editor here would only end in a failed save.
    if (isProfileError) {
      toast(loadErrorMessage, 'error');
      return;
    }
    setEditingField(field);
    setEditValue(formData[field] || prefill || '');
  };

  const GENDER_OPTIONS = [
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
    { value: 'OTHER', label: 'Other' },
    { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
  ];
  const genderLabel = (value: string) =>
    GENDER_OPTIONS.find((o) => o.value === value)?.label ||
    (value ? value.charAt(0) + value.slice(1).toLowerCase() : '');

  const ageFromDob = (iso: string): number | null => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age >= 0 && age < 130 ? age : null;
  };

  const saveField = async (field: keyof typeof formData) => {
    try {
      const updatePayload: any = {};

      if (field === 'name') {
        updatePayload.legalName = editValue;
      } else if (field === 'username') {
        updatePayload.username = editValue;
      } else if (field === 'email') {
        updatePayload.email = editValue;
      } else if (field === 'phone') {
        updatePayload.phone = editValue;
      } else if (field === 'address') {
        const addressObj = profile?.address && typeof profile.address === 'object'
          ? { ...(profile.address as any), street1: editValue }
          : { street1: editValue, city: '', state: '', pincode: '' };
        updatePayload.address = addressObj;
      } else if (field === 'gender') {
        updatePayload.gender = editValue;
      } else if (field === 'dob') {
        updatePayload.dob = editValue;
      }

      await updateProfile(updatePayload);

      // Update local state ONLY on success!
      setFormData((prev) => ({ ...prev, [field]: editValue }));
      setEditingField(null);
      const fieldLabel = field === 'dob' ? 'Age' : field.charAt(0).toUpperCase() + field.slice(1);
      toast(`${fieldLabel} updated successfully!`, 'success');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to save profile changes.';
      toast(errorMsg, 'error');
    }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-[100]"
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed top-0 right-0 bottom-0 w-[92%] sm:w-[500px] md:w-[520px] max-w-full bg-white z-[110] shadow-2xl flex flex-col overflow-hidden rounded-l-3xl p-6 md:p-8 font-sans"
      >
        {/* Header */}
        <div className="flex items-center justify-between mt-2 mb-8 relative">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#f3ebfa] flex items-center justify-center text-[#8e44ad] hover:bg-[#ebdcf7] transition-all duration-200"
          >
            <ChevronLeft className="w-6 h-6 stroke-[3]" />
          </button>
          
          <h2 className="text-xl font-bold text-gray-800 absolute left-1/2 -translate-x-1/2 tracking-tight">
            Edit profile
          </h2>
          <div className="w-10 h-10" /> {/* Spacer */}
        </div>

        {/* Profile Avatar Section */}
        <div className="flex flex-col items-center gap-3 mt-4 mb-8">
          <div 
            onClick={handlePhotoClick}
            className="relative w-28 h-28 rounded-full overflow-hidden border-[3px] border-white shadow-md flex items-center justify-center bg-purple-900 group cursor-pointer hover:scale-105 transition-transform duration-200"
          >
            {photo ? (
              <img
                src={photo}
                alt="Avatar"
                className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
              />
            ) : (
              <span className="text-white text-3xl font-bold tracking-wide select-none group-hover:opacity-75 transition-opacity">
                {initials}
              </span>
            )}
            <div className="absolute inset-0 bg-black/35 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
            {isUpdating && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              </div>
            )}
          </div>
          <button 
            onClick={handlePhotoClick}
            className="text-sm font-semibold text-gray-500 hover:text-purple-600 transition-colors"
          >
            Change photo
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handlePhotoChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto pr-1">
          {isProfileError && (
            <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
              <p className="text-sm font-semibold text-red-700">
                Profile could not be loaded
              </p>
              <p className="mt-1 text-xs leading-relaxed text-red-600">
                {loadErrorMessage}
              </p>
              <button
                type="button"
                onClick={() => refetchProfile()}
                className="mt-2 text-xs font-bold text-red-700 underline underline-offset-2 hover:text-red-800"
              >
                Try again
              </button>
            </div>
          )}

          {/* About You Section */}
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-4">
            About you
          </span>

          <div className="flex flex-col">
            {/* Field Row: Name */}
            <div className="min-h-[52px] py-3.5 border-b border-gray-50 flex items-center justify-between group">
              <span className="text-sm font-semibold text-gray-800">Name</span>
              {editingField === 'name' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="border border-purple-300 rounded-lg px-2.5 py-1 text-sm outline-none focus:ring-2 focus:ring-purple-400 text-gray-800"
                    autoFocus
                  />
                  <button onClick={() => saveField('name')} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>
                  <button onClick={() => setEditingField(null)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => startEditing('name')}
                  className="flex items-center gap-1.5 hover:text-purple-600 transition-colors"
                >
                  {formData.name ? (
                    <span className="text-sm font-semibold text-gray-800">{formData.name}</span>
                  ) : (
                    <span className="text-sm font-semibold text-gray-400 italic">{emptyLabel('Add your name')}</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Field Row: Username */}
            <div className="min-h-[52px] py-3.5 border-b border-gray-50 flex items-center justify-between group">
              <span className="text-sm font-semibold text-gray-800">Username</span>
              {editingField === 'username' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="border border-purple-300 rounded-lg px-2.5 py-1 text-sm outline-none focus:ring-2 focus:ring-purple-400 text-gray-800"
                    autoFocus
                  />
                  <button onClick={() => saveField('username')} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>
                  <button onClick={() => setEditingField(null)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => startEditing('username')}
                  className="flex items-center gap-1.5 hover:text-purple-600 transition-colors"
                >
                  {formData.username ? (
                    <span className="text-sm font-semibold text-gray-800">{formData.username}</span>
                  ) : (
                    <span className="text-sm font-semibold text-gray-400 italic">{emptyLabel('Add a username')}</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Field Row: Email */}
            <div className="min-h-[52px] py-3.5 border-b border-gray-50 flex items-center justify-between group">
              <span className="text-sm font-semibold text-gray-800">Email</span>
              {editingField === 'email' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="border border-purple-300 rounded-lg px-2.5 py-1 text-sm outline-none focus:ring-2 focus:ring-purple-400 text-gray-800"
                    autoFocus
                  />
                  <button onClick={() => saveField('email')} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>
                  <button onClick={() => setEditingField(null)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => startEditing('email')}
                  className="flex items-center gap-1.5 hover:text-purple-600 transition-colors text-right"
                >
                  {formData.email ? (
                    <span className="text-sm font-semibold text-gray-800 truncate max-w-[200px] sm:max-w-[240px] block">{formData.email}</span>
                  ) : (
                    <span className="text-sm font-semibold text-gray-400 italic">{emptyLabel('Add your email')}</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Field Row: Address */}
            <div className="min-h-[52px] py-3.5 border-b border-gray-50 flex items-center justify-between group">
              <span className="text-sm font-semibold text-gray-800">Address</span>
              {editingField === 'address' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="border border-purple-300 rounded-lg px-2.5 py-1 text-sm outline-none focus:ring-2 focus:ring-purple-400 text-gray-800"
                    placeholder="Enter business address"
                    autoFocus
                  />
                  <button onClick={() => saveField('address')} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>
                  <button onClick={() => setEditingField(null)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => startEditing('address')}
                  className="flex items-center gap-1.5 hover:text-purple-600 transition-colors max-w-[260px] text-right"
                >
                  {formData.address ? (
                    <span className="text-sm font-semibold text-gray-800 truncate block max-w-[220px]">{formData.address}</span>
                  ) : (
                    <span className="text-sm font-semibold text-gray-400 italic">{emptyLabel('Add your address')}</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Field Row: Phone */}
            <div className="min-h-[52px] py-3.5 border-b border-gray-50 flex items-center justify-between group">
              <span className="text-sm font-semibold text-gray-800">Phone</span>
              {editingField === 'phone' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="border border-purple-300 rounded-lg px-2.5 py-1 text-sm outline-none focus:ring-2 focus:ring-purple-400 text-gray-800"
                    autoFocus
                  />
                  <button onClick={() => saveField('phone')} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>
                  <button onClick={() => setEditingField(null)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => startEditing('phone', contactPhone)}
                  className="flex items-center gap-1.5 hover:text-purple-600 transition-colors"
                >
                  {formData.phone ? (
                    <span className="text-sm font-semibold text-gray-800">{formData.phone}</span>
                  ) : contactPhone ? (
                    // The number from their latest order - shown so the field is
                    // never blank after a purchase, saved to the account only
                    // when they confirm it (it may belong to another account).
                    <span className="text-right">
                      <span className="text-sm font-semibold text-gray-800 block">{contactPhone}</span>
                      <span className="text-[11px] text-gray-400 block">from your last order — tap to save</span>
                    </span>
                  ) : (
                    <span className="text-sm font-semibold text-gray-400 italic">{emptyLabel('Add your phone')}</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Field Row: Gender */}
            <div className="min-h-[52px] py-3.5 border-b border-gray-50 flex items-center justify-between group">
              <span className="text-sm font-semibold text-gray-800">Gender</span>
              {editingField === 'gender' ? (
                <div className="flex items-center gap-2">
                  <select
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="border border-purple-300 rounded-lg px-2.5 py-1 text-sm outline-none focus:ring-2 focus:ring-purple-400 text-gray-800 bg-white"
                    autoFocus
                  >
                    <option value="">Select…</option>
                    {GENDER_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <button onClick={() => saveField('gender')} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>
                  <button onClick={() => setEditingField(null)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => startEditing('gender')}
                  className="flex items-center gap-1.5 hover:text-purple-600 transition-colors"
                >
                  {formData.gender ? (
                    <span className="text-sm font-semibold text-gray-800">{genderLabel(formData.gender)}</span>
                  ) : (
                    <span className="text-sm font-semibold text-gray-400 italic">{emptyLabel('Add your gender')}</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Field Row: Age (stored as date of birth) */}
            <div className="min-h-[52px] py-3.5 border-b border-gray-50 flex items-center justify-between group">
              <span className="text-sm font-semibold text-gray-800">Age</span>
              {editingField === 'dob' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={editValue}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="border border-purple-300 rounded-lg px-2.5 py-1 text-sm outline-none focus:ring-2 focus:ring-purple-400 text-gray-800 bg-white"
                    autoFocus
                  />
                  <button onClick={() => saveField('dob')} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>
                  <button onClick={() => setEditingField(null)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => startEditing('dob')}
                  className="flex items-center gap-1.5 hover:text-purple-600 transition-colors"
                >
                  {formData.dob && ageFromDob(formData.dob) !== null ? (
                    <span className="text-right">
                      <span className="text-sm font-semibold text-gray-800 block">{ageFromDob(formData.dob)} years</span>
                      <span className="text-[11px] text-gray-400 block">born {formData.dob}</span>
                    </span>
                  ) : (
                    <span className="text-sm font-semibold text-gray-400 italic">{emptyLabel('Add your age')}</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Security Section — headed like About you, so the transition reads
              as structure instead of an empty row between Phone and Password */}
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mt-8 mb-4">
            Security
          </span>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center py-2.5">
              <span className="text-sm font-semibold text-gray-800">Password</span>
              <button 
                onClick={() => toast('Password change feature coming soon!', 'info')}
                className="flex items-center gap-1.5 text-gray-400 hover:text-purple-600 transition-colors text-right"
              >
                <span className="text-sm font-medium text-gray-400">Change your password</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex justify-end items-center py-1">
              <button 
                onClick={() =>
                  // No reset API is wired here yet - never claim a link was
                  // sent when nothing happened. Point at the flow that works.
                  toast('Sign out and tap "Forgot Password ?" on the login screen to reset it.', 'info')
                }
                className="flex items-center gap-1.5 text-gray-400 hover:text-purple-600 transition-colors text-right"
              >
                <span className="text-sm font-medium text-gray-400">Forgot Password</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="h-px bg-gray-100 my-6" />

            <div className="flex justify-center pb-8">
              <button
                onClick={() => {
                  logout();
                  onClose();
                  toast('Logged out successfully', 'success');
                }}
                className="w-full py-3.5 rounded-2xl border border-red-200 text-red-500 hover:bg-red-50 font-bold text-base tracking-wide transition-all duration-200 flex justify-center items-center shadow-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
