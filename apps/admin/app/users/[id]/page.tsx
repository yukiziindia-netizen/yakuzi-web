"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Phone, Mail, Building2, FileText, MapPin, Calendar, Trash2, Ban, Unlock, UserCheck, UserX, ExternalLink, Pencil } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button, Badge, Modal, Skeleton, Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useUserById, useAffirmUserStatus, useDeleteUser, usePresignedUrl, useUpdateSellerProfile } from "@/hooks/useAdmin";
import toast from "react-hot-toast";

const getFullUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/api$/, "");
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
};

function SecureDocViewer({ url, label, number, expiry }: { url: string; label: string; number?: string; expiry?: string }) {
  const { data: presignedUrl, isLoading } = usePresignedUrl(url);
  const displayUrl = (typeof presignedUrl === 'object' && presignedUrl !== null ? (presignedUrl as any).url : presignedUrl) || getFullUrl(url);
  const isImage = /\.(jpe?g|png|webp)$/i.test(url);

  if (isLoading) return <div className="space-y-1"><div className="h-4 w-32 bg-muted/50 animate-pulse rounded" /><div className="h-20 w-32 bg-muted/50 animate-pulse rounded-lg" /></div>;

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase">
          <FileText className="h-3 w-3" /> {label}
        </div>
        <div className="flex flex-col">
          {number && <p className="text-sm font-mono font-bold text-foreground">{number}</p>}
          {expiry && (
            <p className="text-[10px] text-muted-foreground">
              Expires: <span className="font-semibold text-foreground">{new Date(expiry).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
            </p>
          )}
        </div>
      </div>
      {isImage ? (
        <a href={displayUrl} target="_blank" rel="noopener noreferrer" className="inline-block max-w-full">
          <img
            src={displayUrl}
            alt={label}
            className="max-w-full max-h-48 rounded-xl border border-border object-contain hover:border-primary/50 transition-colors"
          />
        </a>
      ) : (
        <a href={displayUrl} target="_blank" rel="noopener noreferrer"
           className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-accent/30 text-sm font-medium text-foreground hover:bg-accent transition-colors">
          <FileText className="h-4 w-4" />View {label}<ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
        </a>
      )}
    </div>
  );
}

function SellerEditModal({ open, onClose, userId, sp }: { open: boolean; onClose: () => void; userId: string; sp: any }) {
  const updateSellerProfile = useUpdateSellerProfile();
  const bank = sp?.bankAccount ?? {};
  const [form, setForm] = useState({
    companyName: sp?.companyName ?? "",
    email: sp?.email ?? "",
    gstNumber: sp?.gstNumber ?? "",
    panNumber: sp?.panNumber ?? "",
    aadhaarNumber: sp?.aadhaarNumber ?? "",
    address: sp?.address ?? "",
    city: sp?.city ?? "",
    state: sp?.state ?? "",
    pincode: sp?.pincode ?? "",
    bankName: bank.bankName ?? "",
    accountNumber: bank.accountNumber ?? "",
    accountHolder: bank.accountHolder ?? "",
    ifsc: bank.ifsc ?? "",
  });

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = async () => {
    try {
      await updateSellerProfile.mutateAsync({
        userId,
        data: {
          companyName: form.companyName,
          email: form.email,
          gstNumber: form.gstNumber,
          panNumber: form.panNumber,
          aadhaarNumber: form.aadhaarNumber,
          address: form.address,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          bankAccount: {
            bankName: form.bankName,
            accountNumber: form.accountNumber,
            accountHolder: form.accountHolder,
            ifsc: form.ifsc,
          },
        },
      });
      toast.success("Seller details updated");
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update seller details");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Seller Details" maxWidth="max-w-2xl">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Company" value={form.companyName} onChange={set("companyName")} />
          <Input label="Business Email" value={form.email} onChange={set("email")} />
          <Input label="GST Number" value={form.gstNumber} onChange={set("gstNumber")} />
          <Input label="PAN Number" value={form.panNumber} onChange={set("panNumber")} />
          <Input label="Aadhaar Number" value={form.aadhaarNumber} onChange={set("aadhaarNumber")} />
          <Input label="Pincode" value={form.pincode} onChange={set("pincode")} />
        </div>
        <Input label="Address" value={form.address} onChange={set("address")} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="City" value={form.city} onChange={set("city")} />
          <Input label="State" value={form.state} onChange={set("state")} />
        </div>
        <div className="pt-4 border-t border-border">
          <p className="text-sm font-semibold text-foreground mb-3">Bank Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Bank Name" value={form.bankName} onChange={set("bankName")} />
            <Input label="Account Number" value={form.accountNumber} onChange={set("accountNumber")} />
            <Input label="Account Holder" value={form.accountHolder} onChange={set("accountHolder")} />
            <Input label="IFSC Code" value={form.ifsc} onChange={set("ifsc")} />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} loading={updateSellerProfile.isPending}>Save Changes</Button>
        </div>
      </div>
    </Modal>
  );
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: user, isLoading } = useUserById(id);
  const updateStatus = useAffirmUserStatus();
  const deleteUserMutation = useDeleteUser();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleAction = async (action: "approve" | "reject" | "block" | "unblock") => {
    try {
      await updateStatus.mutateAsync({ userId: id, action });
      toast.success(`User ${action}d successfully`);
    } catch {
      toast.error(`Failed to ${action} user`);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUserMutation.mutateAsync(id);
      toast.success("User deleted");
      router.push("/users");
    } catch {
      toast.error("Failed to delete user");
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64 lg:col-span-2" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold text-foreground">User not found</p>
            <Button variant="ghost" onClick={() => router.push("/users")} className="mt-4">Back to Users</Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const sp = user.sellerProfile;
  const bp = user.buyerProfile;
  const isSeller = user.role === "SELLER";
  const isBuyer = user.role === "BUYER";

  const isBoarded = isSeller ? !!sp?.companyName : !!bp?.legalName;
  const canApprove = (user.status === "PENDING" || user.status === "REJECTED") && isBoarded;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/users")} className="h-9 w-9 rounded-xl bg-accent/60 flex items-center justify-center hover:bg-accent transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="font-semibold text-2xl text-foreground">{sp?.companyName || bp?.legalName || user.businessName || user.name || user.phone}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={user.role === "BUYER" ? "success" : user.role === "SELLER" ? "info" : "orange"}>{user.role}</Badge>
                <Badge variant={user.status === "APPROVED" ? "success" : user.status === "PENDING" ? "warning" : "error"}>{user.status}</Badge>
                {isSeller && user.isOnVacation && <Badge variant="warning">🏖 Vacation</Badge>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canApprove && (
              <>
                <Button size="sm" variant="primary" onClick={() => handleAction("approve")} leftIcon={<UserCheck className="h-4 w-4" />}>Approve</Button>
                <Button size="sm" variant="danger" onClick={() => handleAction("reject")} leftIcon={<UserX className="h-4 w-4" />}>Reject</Button>
              </>
            )}
            {user.status === "APPROVED" && (
              <Button size="sm" variant="warning" onClick={() => handleAction("block")} leftIcon={<Ban className="h-4 w-4" />}>Block</Button>
            )}
            {user.status === "BLOCKED" && (
              <Button size="sm" variant="outline" onClick={() => handleAction("unblock")} leftIcon={<Unlock className="h-4 w-4" />}>Unblock</Button>
            )}
            {isSeller && (
              <Button size="sm" variant="outline" onClick={() => setShowEditModal(true)} leftIcon={<Pencil className="h-4 w-4" />}>Edit</Button>
            )}
            <Button size="sm" variant="danger" onClick={() => setShowDeleteModal(true)} leftIcon={<Trash2 className="h-4 w-4" />}>Delete</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Info Card */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6">
            <h2 className="font-semibold text-foreground mb-4">Contact Information</h2>
            <div className="space-y-4">
              <InfoRow icon={Phone} label="Phone" value={user.phone ?? "—"} />
              <InfoRow icon={Mail} label="Email" value={user.email || sp?.email || bp?.email || "—"} />
              <InfoRow icon={Calendar} label="Joined" value={user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "—"} />
              {user.lastLoginAt && <InfoRow icon={Calendar} label="Last Login" value={new Date(user.lastLoginAt).toLocaleDateString("en-IN")} />}
            </div>
          </motion.div>

          {/* Seller/Buyer Profile */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-6 lg:col-span-2">
            <h2 className="font-semibold text-foreground mb-4">{isSeller ? "Seller Profile" : "Buyer Profile"}</h2>
            {isSeller && sp ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow icon={Building2} label="Company" value={sp.companyName ?? sp.businessName ?? "—"} />
                <InfoRow icon={FileText} label="GST Number" value={sp.gstNumber ?? "—"} mono />
                <InfoRow icon={FileText} label="PAN Number" value={sp.panNumber ?? "—"} mono />
                <InfoRow icon={Mail} label="Business Email" value={sp.email || user.email || "—"} />
                
                <InfoRow icon={MapPin} label="Address" value={[sp.address, sp.city, sp.state, sp.pincode].filter(Boolean).join(", ") || "—"} className="sm:col-span-2" />
                {sp.bankAccount && (
                  <>
                    <InfoRow icon={Building2} label="Bank Detail" value={`${sp.bankAccount.bankName ?? ""} — ${sp.bankAccount.accountNumber ?? ""}`} mono />
                    <InfoRow icon={UserCheck} label="Account Holder" value={sp.bankAccount.accountHolder ?? "—"} />
                    <InfoRow icon={FileText} label="IFSC Code" value={sp.bankAccount.ifsc ?? "—"} mono />
                  </>
                )}
                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                  {sp.cancelCheck && (
                    <SecureDocViewer url={typeof sp.cancelCheck === 'object' ? sp.cancelCheck.url : sp.cancelCheck} label="Cancelled Cheque" />
                  )}
                  {(sp?.drugLicenseUrl ?? user.drugLicenseUrl) && (
                    <SecureDocViewer 
                      url={sp?.drugLicenseUrl ?? user.drugLicenseUrl ?? ''} 
                      label="License 1 (20B)" 
                      number={sp?.drugLicenseNumber ?? user.drugLicenseNumber} 
                      expiry={sp?.drugLicenseExpiry ?? user.drugLicenseExpiry}
                    />
                  )}
                  {(sp?.drugLicenseUrl2 ?? user.drugLicenseUrl2) && (
                    <SecureDocViewer 
                      url={sp?.drugLicenseUrl2 ?? user.drugLicenseUrl2 ?? ''} 
                      label="License 2 (21B)" 
                      number={sp?.drugLicenseNumber2 ?? user.drugLicenseNumber2} 
                      expiry={sp?.drugLicenseExpiry2 ?? user.drugLicenseExpiry2}
                    />
                  )}
                  {(() => {
                    // additionalDocuments may be on sp or at top-level user, and may be a JSON string
                    let docs: any = sp.additionalDocuments ?? (user as any).additionalDocuments;
                    if (typeof docs === 'string') {
                      try { docs = JSON.parse(docs); } catch (e) { docs = [docs]; }
                    }
                    if (!docs || (Array.isArray(docs) && docs.length === 0)) return null;
                    const docsArr = Array.isArray(docs) ? docs : [docs];
                    return docsArr.map((docUrl: string | any, idx: number) => (
                      <SecureDocViewer key={`doc-${idx}`} url={typeof docUrl === 'object' ? (docUrl.url ?? '') : docUrl} label={`Additional Document ${idx + 1}`} />
                    ));
                  })()}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow icon={Building2} label="Legal / Business Name" value={bp?.legalName ?? user.businessName ?? user.name ?? "—"} />
                <InfoRow icon={FileText} label="GST Number" value={bp?.gstNumber ?? user.gstNumber ?? "—"} mono />
                <InfoRow icon={FileText} label="PAN Number" value={bp?.panNumber ?? user.panNumber ?? "—"} mono />
                
                <InfoRow icon={MapPin} label="Address" value={
                  bp?.address
                    ? (typeof bp.address === 'object'
                        ? [bp.address.street1, bp.address.city, bp.address.state, bp.address.pincode].filter(Boolean).join(", ")
                        : [bp.address, bp.city, bp.state, bp.pincode].filter(Boolean).join(", "))
                    : ([user.address, user.city, user.state, user.pincode].filter(Boolean).join(", ") || "—")
                } className="sm:col-span-2" />
                {bp?.email && <InfoRow icon={Mail} label="Email" value={bp.email} />}
                {bp?.phone && <InfoRow icon={Phone} label="Phone" value={bp.phone} mono />}

                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                  {(bp?.drugLicenseUrl ?? user.drugLicenseUrl) && (
                    <SecureDocViewer 
                      url={bp?.drugLicenseUrl ?? user.drugLicenseUrl ?? ''} 
                      label="License 1 (20B)" 
                      number={bp?.drugLicenseNumber ?? user.drugLicenseNumber} 
                      expiry={bp?.drugLicenseExpiry ?? user.drugLicenseExpiry}
                    />
                  )}
                  {(bp?.drugLicenseUrl2 ?? user.drugLicenseUrl2) && (
                    <SecureDocViewer 
                      url={bp?.drugLicenseUrl2 ?? user.drugLicenseUrl2 ?? ''} 
                      label="License 2 (21B)" 
                      number={bp?.drugLicenseNumber2 ?? user.drugLicenseNumber2} 
                      expiry={bp?.drugLicenseExpiry2 ?? user.drugLicenseExpiry2}
                    />
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete User">
        <p className="text-sm text-muted-foreground mb-4">Are you sure you want to delete this user? This action will cascade-delete all associated orders, payments, and data. This cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} loading={deleteUserMutation.isPending}>Delete User</Button>
        </div>
      </Modal>

      {isSeller && (
        <SellerEditModal key={`${sp?.id ?? "new"}-${sp?.updatedAt ?? ""}`} open={showEditModal} onClose={() => setShowEditModal(false)} userId={id} sp={sp} />
      )}
    </AdminLayout>
  );
}

function InfoRow({ icon: Icon, label, value, mono, className }: { icon: React.ElementType; label: string; value: string; mono?: boolean; className?: string }) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase">
        <Icon className="h-3 w-3" />{label}
      </div>
      <p className={cn("text-sm text-foreground", mono && "font-mono")}>{value}</p>
    </div>
  );
}

