"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Store, Building2, FileText, CheckCircle2, AlertCircle, MapPin, 
  ArrowRight, ArrowLeft, Loader2, Upload, Shield, Phone, Mail, CreditCard, X
} from "lucide-react";
import { Button, Input } from "@/components/ui";
import { 
  useUpdateSellerProfile, 
  useUploadKycDocument,
  useSellerMe,
  useSellerProfile
} from "@/hooks/useSeller";
import { useSellerAuth } from "@/store";
import toast from "react-hot-toast";



const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Delhi", "Chandigarh", "Puducherry",
];

export default function SellerOnboardingPage() {
  const router = useRouter();
  const { user, logout } = useSellerAuth();
  const { data: serverUser, isLoading: isUserLoading } = useSellerMe(true);
  const { data: existingProfile, isLoading: isProfileLoading } = useSellerProfile(true);
  
  const updateProfile = useUpdateSellerProfile();
  const uploadKyc = useUploadKycDocument();
  const checkInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    companyName: "",
    gstNumber: "",
    panNumber: "",
    drugLicenseNumber: "",
    drugLicenseUrl: "",
    drugLicenseExpiry: "",
    drugLicenseNumber2: "",
    drugLicenseUrl2: "",
    drugLicenseExpiry2: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    bankAccountNumber: "",
    bankName: "",
    bankIfsc: "",
    bankAccountHolder: "",
    cancelCheck: "",
    additionalDocuments: [] as string[],
    email: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [uploadingCheck, setUploadingCheck] = useState(false);
  const [uploadedCheckName, setUploadedCheckName] = useState("");
  const [uploadingAdditional, setUploadingAdditional] = useState(false);
  const additionalDocRef = useRef<HTMLInputElement>(null);
  const [isFetchingPincode, setIsFetchingPincode] = useState(false);

  // Auto-fill City/State from Pincode
  const lastPincodeRef = useRef("");
  useEffect(() => {
    const pc = formData.pincode.trim();
    if (pc.length === 6 && pc !== lastPincodeRef.current) {
      lastPincodeRef.current = pc;
      const fetchAddress = async () => {
        setIsFetchingPincode(true);
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${pc}`);
          const data = await res.json();
          if (data?.[0]?.Status === "Success") {
            const po = data[0].PostOffice[0];
            const city = po.District || po.Name;
            const state = po.State;
            setFormData(prev => ({ 
              ...prev, 
              city: prev.city || city || "", 
              state: prev.state || state || "" 
            }));
          }
        } catch (e) {
          console.error("Pincode fetch failed", e);
        } finally {
          setIsFetchingPincode(false);
        }
      };
      fetchAddress();
    }
  }, [formData.pincode]);

  // Sync existing data if any (for resuming)
  useEffect(() => {
    if (existingProfile) {
      setFormData(prev => ({
        ...prev,
        companyName: (existingProfile.companyName === 'My Store' ? '' : existingProfile.companyName) || (existingProfile.businessName === 'My Store' ? '' : existingProfile.businessName) || prev.companyName,
        gstNumber: existingProfile.gstNumber || prev.gstNumber,
        panNumber: existingProfile.panNumber || prev.panNumber,
        drugLicenseNumber: existingProfile.drugLicenseNumber || prev.drugLicenseNumber,
        drugLicenseUrl: existingProfile.drugLicenseUrl || prev.drugLicenseUrl,
        drugLicenseExpiry: existingProfile.drugLicenseExpiry ? new Date(existingProfile.drugLicenseExpiry).toISOString().split('T')[0] : prev.drugLicenseExpiry,
        drugLicenseNumber2: existingProfile.drugLicenseNumber2 || prev.drugLicenseNumber2,
        drugLicenseUrl2: existingProfile.drugLicenseUrl2 || prev.drugLicenseUrl2,
        drugLicenseExpiry2: existingProfile.drugLicenseExpiry2 ? new Date(existingProfile.drugLicenseExpiry2).toISOString().split('T')[0] : prev.drugLicenseExpiry2,
        address: existingProfile.address || prev.address,
        city: existingProfile.city || prev.city,
        state: existingProfile.state || prev.state,
        pincode: existingProfile.pincode || prev.pincode,
        bankAccountNumber: existingProfile.bankAccount?.accountNumber || prev.bankAccountNumber,
        bankName: existingProfile.bankAccount?.bankName || prev.bankName,
        bankIfsc: existingProfile.bankAccount?.ifsc || prev.bankIfsc,
        bankAccountHolder: existingProfile.bankAccount?.accountHolder || prev.bankAccountHolder,
        cancelCheck: existingProfile.cancelCheck || prev.cancelCheck,
        additionalDocuments: existingProfile.additionalDocuments || prev.additionalDocuments,
        email: existingProfile.email || prev.email,
      }));
      // GST and PAN verification removed
    }
  }, [existingProfile]);

  const updateField = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };


  const handleCheckUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }
    
    const kycFormData = new FormData();
    kycFormData.append("file", file);
    
    setUploadingCheck(true);
    uploadKyc.mutate(kycFormData, {
      onSuccess: (res: any) => {
        const urlOrKey = res.url || res.key || (typeof res === 'string' ? res : '');
        updateField("cancelCheck", urlOrKey);
        setUploadedCheckName(file.name);
        toast.success("Cancelled cheque uploaded");
      },
      onError: () => toast.error("Upload failed"),
      onSettled: () => setUploadingCheck(false),
    });
  };

  const handleAdditionalDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }
    
    const kycFormData = new FormData();
    kycFormData.append("file", file);
    
    setUploadingAdditional(true);
    uploadKyc.mutate(kycFormData, {
      onSuccess: (res: any) => {
        const urlOrKey = res.url || res.key || (typeof res === 'string' ? res : '');
        setFormData(prev => ({ ...prev, additionalDocuments: [...prev.additionalDocuments, urlOrKey] }));
        toast.success("Document uploaded");
        if (additionalDocRef.current) additionalDocRef.current.value = '';
      },
      onError: () => toast.error("Upload failed"),
      onSettled: () => setUploadingAdditional(false),
    });
  };

  const removeAdditionalDoc = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additionalDocuments: prev.additionalDocuments.filter((_, i) => i !== index)
    }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.companyName.trim()) e.companyName = "Business name is required";
    
    if (!formData.gstNumber.trim()) e.gstNumber = "GST number is required";
    if (!formData.panNumber.trim()) e.panNumber = "PAN number is required";
    
    if (!formData.address.trim()) e.address = "Address is required";
    if (!formData.city.trim()) e.city = "City is required";
    if (!formData.state) e.state = "State is required";
    if (!formData.pincode.trim()) e.pincode = "Pincode is required";
    else if (!/^\d{6}$/.test(formData.pincode.trim())) e.pincode = "Invalid pincode";
    
    if (!formData.bankAccountNumber.trim()) e.bankAccountNumber = "Account number is required";
    if (!formData.bankName.trim()) e.bankName = "Bank name is required";
    if (!formData.bankIfsc.trim()) e.bankIfsc = "IFSC code is required";
    if (!formData.bankAccountHolder.trim()) e.bankAccountHolder = "Account holder name is required";
    if (!formData.email.trim()) e.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) e.email = "Invalid email format";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error("Please fill all required fields correctly");
      return;
    }

    const payload: any = {
      companyName: formData.companyName,
      drugLicenseNumber: formData.drugLicenseNumber || "",
      drugLicenseUrl: formData.drugLicenseUrl || "",
      address: formData.address,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
      bankAccount: {
        accountNumber: formData.bankAccountNumber.trim(),
        bankName: formData.bankName.trim(),
        ifsc: formData.bankIfsc.trim().toUpperCase(),
        accountHolder: formData.bankAccountHolder.trim(),
      },
      cancelCheck: formData.cancelCheck,
      additionalDocuments: formData.additionalDocuments,
      email: formData.email.trim().toLowerCase(),
    };

    if (formData.gstNumber?.trim()) {
      payload.gstNumber = formData.gstNumber.trim().toUpperCase();
    }
    
    if (formData.panNumber?.trim()) {
      payload.panNumber = formData.panNumber.trim().toUpperCase();
    }

    try {
      await updateProfile.mutateAsync(payload);
      toast.success("Application submitted successfully");
    } catch (error: any) {
      const msg = error?.response?.data?.message;
      const displayMsg = Array.isArray(msg) ? msg.join(", ") : msg;
      toast.error(displayMsg || "Failed to submit application");
    }
  };

  // ──── RENDER: APPLICATION UNDER REVIEW ────────
  const effectiveUser = serverUser || user;
  const profile = existingProfile;
  
  const isPending = effectiveUser?.status === "PENDING" && (
    (effectiveUser.businessName && effectiveUser.businessName !== 'My Store') || 
    (effectiveUser.companyName && effectiveUser.companyName !== 'My Store') || 
    (profile?.businessName && profile.businessName !== 'My Store') || 
    (profile?.companyName && profile.companyName !== 'My Store') ||
    profile?.gstNumber ||
    profile?.panNumber
  );
  const isRejected = effectiveUser?.status === "REJECTED" || profile?.verificationStatus === "REJECTED";

  if (isPending) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center">
         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full bg-white rounded-3xl p-10 shadow-xl shadow-indigo-100/50 border border-indigo-50/50">
            <div className="mx-auto w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-8">
              <Shield className="w-10 h-10 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-4">Application Under Review</h1>
            <p className="text-slate-600 font-medium mb-8 leading-relaxed">
              Your seller profile has been submitted and is currently being reviewed by our team. You will be able to access the dashboard once verified.
            </p>
            <div className="bg-indigo-50/50 rounded-2xl p-4 mb-8">
              <p className="text-sm text-indigo-700 font-semibold flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Verification in progress
              </p>
              <p className="text-xs text-indigo-600/70 mt-1">Usually takes 24–48 hours</p>
            </div>
            <Button variant="ghost" className="w-full text-slate-500 hover:text-indigo-600" onClick={() => logout()}>
              Sign Out
            </Button>
          </motion.div>
      </div>
    );
  }

  // ──── RENDER: ONBOARDING FORM ────────
  return (
    <div className="min-h-screen bg-[#f8fafc] relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-indigo-100 rounded-full mix-blend-multiply filter blur-[120px] opacity-40 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[35vw] h-[35vw] bg-blue-100 rounded-full mix-blend-multiply filter blur-[150px] opacity-30 pointer-events-none" />

      <nav className="relative z-20 px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Store className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">Yukizi <span className="text-primary">Seller</span></span>
        </div>
        <Button variant="outline" size="sm" onClick={() => logout()} className="rounded-xl border-slate-200">Sign Out</Button>
      </nav>

      <div className="relative z-10 pt-8 pb-20 px-4 w-full max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-slate-900 mb-2">Complete Your Profile</h1>
          <p className="text-slate-500 font-medium">Verify your business to start selling</p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-[32px] border border-white shadow-xl shadow-slate-200/50 overflow-hidden p-8 md:p-12">
        {isRejected && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-5 bg-red-50 border border-red-100 rounded-2xl flex gap-3 mb-6">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-black text-red-900 uppercase tracking-wider">Application Needs Correction</h3>
                  <p className="text-xs text-red-700 font-medium leading-relaxed mt-1">
                    Your previous application was not approved. Please review your business details and documents, then resubmit for verification.
                  </p>
                </div>
              </motion.div>
            )}

            <div className="space-y-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-50 rounded-lg"><Building2 className="w-5 h-5 text-indigo-600" /></div>
                <h2 className="text-xl font-bold text-slate-900">Business Information</h2>
              </div>

              {/* GST and PAN Numbers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="GST Number" value={formData.gstNumber} onChange={(e) => updateField("gstNumber", e.target.value.toUpperCase())} placeholder="e.g. 27AABCU9603R1ZM" maxLength={15} required className="uppercase h-14 rounded-2xl" error={errors.gstNumber} />
                <Input label="PAN Number" value={formData.panNumber} onChange={(e) => updateField("panNumber", e.target.value.toUpperCase())} placeholder="e.g. ABCDE1234F" maxLength={10} required className="uppercase h-14 rounded-2xl" error={errors.panNumber} />
              </div>

              <Input label="Business Legal Name" value={formData.companyName} onChange={(e) => updateField("companyName", e.target.value)} placeholder="Full registered company name" required className="h-14 rounded-2xl" error={errors.companyName} />
              
              <div className="grid grid-cols-1 gap-4">
                <Input label="Business Email" value={formData.email} onChange={(e) => updateField("email", e.target.value)} placeholder="contact@business.com" type="email" required className="h-14 rounded-2xl" error={errors.email} />
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-3 mb-2">
                   <div className="p-2 bg-indigo-50 rounded-lg"><MapPin className="w-5 h-5 text-indigo-600" /></div>
                   <h2 className="text-xl font-bold text-slate-900">Registered Address</h2>
                </div>
                <Input label="Street Address" value={formData.address} onChange={(e) => updateField("address", e.target.value)} placeholder="Building No, Street, Landmark" className="h-14 rounded-2xl" error={errors.address} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="City" value={formData.city} onChange={(e) => updateField("city", e.target.value)} placeholder="City" className="h-14 rounded-2xl" error={errors.city} />
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">State</label>
                    <select value={formData.state} onChange={(e) => updateField("state", e.target.value)} className="w-full h-14 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-medium focus:border-primary outline-none transition-all">
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {errors.state && <p className="text-xs text-red-500">{errors.state}</p>}
                  </div>
                </div>
                <Input label="Pincode" value={formData.pincode} onChange={(e) => updateField("pincode", e.target.value.replace(/\D/g, "").slice(0,6))} placeholder="400001" maxLength={6} className="h-14 rounded-2xl" error={errors.pincode} />
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-3 mb-2">
                   <div className="p-2 bg-indigo-50 rounded-lg"><CreditCard className="w-5 h-5 text-indigo-600" /></div>
                   <h2 className="text-xl font-bold text-slate-900">Bank Details</h2>
                </div>
                <Input label="Account Holder Name" value={formData.bankAccountHolder} onChange={(e) => updateField("bankAccountHolder", e.target.value)} placeholder="As per bank records" className="h-14 rounded-2xl" error={errors.bankAccountHolder} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Account Number" value={formData.bankAccountNumber} onChange={(e) => updateField("bankAccountNumber", e.target.value)} placeholder="000000000000" className="h-14 rounded-2xl" error={errors.bankAccountNumber} />
                  <Input label="IFSC Code" value={formData.bankIfsc} onChange={(e) => updateField("bankIfsc", e.target.value.toUpperCase())} placeholder="HDFC0001234" className="h-14 rounded-2xl uppercase" error={errors.bankIfsc} />
                </div>
                <Input label="Bank Name" value={formData.bankName} onChange={(e) => updateField("bankName", e.target.value)} placeholder="e.g. HDFC Bank" className="h-14 rounded-2xl" error={errors.bankName} />
                
                <div className="mt-4">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Upload Cancelled Cheque</label>
                  <input ref={checkInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleCheckUpload} className="hidden" />
                  <button type="button" onClick={() => checkInputRef.current?.click()} disabled={uploadingCheck} className={`w-full flex flex-col items-center justify-center p-6 border-2 border-dashed ${errors.cancelCheck ? 'border-red-400 bg-red-50' : 'border-slate-200'} rounded-[24px] hover:border-primary/50 hover:bg-slate-50 transition-all text-slate-500 group`}>
                    {uploadingCheck ? (
                      <><Loader2 className="w-6 h-6 animate-spin mb-1 text-primary" /> <span className="font-bold text-xs">Uploading...</span></>
                    ) : uploadedCheckName || formData.cancelCheck ? (
                      <><CheckCircle2 className="w-6 h-6 text-emerald-500 mb-1" /> <span className="font-bold text-xs text-slate-900 line-clamp-1">{uploadedCheckName || "Cheque Uploaded"}</span></>
                    ) : (
                      <><Upload className="w-6 h-6 mb-1 group-hover:text-primary transition-colors" /> <span className="font-bold text-xs group-hover:text-slate-900 text-center">Click to upload cancelled cheque</span></>
                    )}
                  </button>
                  {errors.cancelCheck && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.cancelCheck}</p>}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-3 mb-2">
                   <div className="p-2 bg-indigo-50 rounded-lg"><FileText className="w-5 h-5 text-indigo-600" /></div>
                   <h2 className="text-xl font-bold text-slate-900">Further Documents</h2>
                </div>
                <p className="text-sm text-slate-500 mb-4">Upload any other relevant business documents (optional).</p>
                
                <div className="space-y-3">
                  {formData.additionalDocuments.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-slate-50">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        <span className="text-sm font-medium text-slate-700 truncate">Document {idx + 1}</span>
                      </div>
                      <button type="button" onClick={() => removeAdditionalDoc(idx)} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-red-500 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  <input ref={additionalDocRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleAdditionalDocUpload} className="hidden" />
                  <button type="button" onClick={() => additionalDocRef.current?.click()} disabled={uploadingAdditional} className={`w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 rounded-xl hover:border-primary/50 hover:bg-slate-50 transition-all text-slate-500 group`}>
                    {uploadingAdditional ? (
                      <><Loader2 className="w-5 h-5 animate-spin text-primary" /> <span className="font-bold text-sm">Uploading...</span></>
                    ) : (
                      <><Upload className="w-5 h-5 group-hover:text-primary transition-colors" /> <span className="font-bold text-sm group-hover:text-slate-900">Upload Document</span></>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100">
               <div className="p-5 bg-blue-50 border border-blue-100 rounded-3xl flex gap-4 mb-8">
                <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700 font-medium leading-relaxed">
                  By submitting, you agree that the information provided is correct. Your profile will be verified by our compliance team. If any details are incorrect, your application may be rejected.
                </p>
              </div>
              <Button size="lg" className="w-full h-16 rounded-2xl font-black text-xl shadow-xl shadow-primary/25" onClick={handleSubmit} loading={updateProfile.isPending}>
                Submit Application <CheckCircle2 className="ml-2 w-6 h-6" />
              </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
