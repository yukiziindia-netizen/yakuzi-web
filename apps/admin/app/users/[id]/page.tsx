"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Phone, Mail, Building2, FileText, MapPin, Calendar, Trash2, Ban, Unlock, UserCheck, UserX, ExternalLink } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button, Badge, Modal, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useUserById, useAffirmUserStatus, useDeleteUser, usePresignedUrl } from "@/hooks/useAdmin";
import toast from "react-hot-toast";

const getFullUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/api$/, "");
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
};

function SecureDocViewer({ url, label, number, expiry }: { url: string; label: string; number?: string; expiry?: string }) {
  const { data: presignedUrl, isLoading } = usePresignedUrl(url);
  const displayUrl = presignedUrl || getFullUrl(url);
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
        <a href={displayUrl} target="_blank" rel="noopener noreferrer" className="block w-fit">
          <img
            src={displayUrl}
            alt={label}
            className="max-w-xs max-h-48 rounded-xl border border-border object-contain hover:border-primary/50 transition-colors"
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

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: user, isLoading } = useUserById(id);
  const updateStatus = useAffirmUserStatus();
  const deleteUserMutation = useDeleteUser();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
            <Button size="sm" variant="danger" onClick={() => setShowDeleteModal(true)} leftIcon={<Trash2 className="h-4 w-4" />}>Delete</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Info Card */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6">
            <h2 className="font-semibold text-foreground mb-4">Contact Information</h2>
            <div className="space-y-4">
              <InfoRow icon={Phone} label="Phone" value={user.phone ?? "—"} />
              <InfoRow icon={Mail} label="Email" value={user.email ?? "—"} />
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
                {sp.email && <InfoRow icon={Mail} label="Business Email" value={sp.email} />}
                
                {sp.drugLicenseUrl && (
                  <SecureDocViewer url={sp.drugLicenseUrl} label="License 1 (20B)" number={sp.drugLicenseNumber} expiry={sp.drugLicenseExpiry} />
                )}
                {sp.drugLicenseUrl2 && (
                  <SecureDocViewer url={sp.drugLicenseUrl2} label="License 2 (21B)" number={sp.drugLicenseNumber2} expiry={sp.drugLicenseExpiry2} />
                )}
                <InfoRow icon={MapPin} label="Address" value={[sp.address, sp.city, sp.state, sp.pincode].filter(Boolean).join(", ") || "—"} className="sm:col-span-2" />
                {sp.bankAccount && (
                  <>
                    <InfoRow icon={Building2} label="Bank Detail" value={`${sp.bankAccount.bankName ?? ""} — ${sp.bankAccount.accountNumber ?? ""}`} mono />
                    <InfoRow icon={UserCheck} label="Account Holder" value={sp.bankAccount.accountHolder ?? "—"} />
                    <InfoRow icon={FileText} label="IFSC Code" value={sp.bankAccount.ifsc ?? "—"} mono />
                  </>
                )}
                {sp.cancelCheck && (
                  <SecureDocViewer url={sp.cancelCheck} label="Cancelled Cheque" />
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow icon={Building2} label="Legal / Business Name" value={bp?.legalName ?? user.businessName ?? user.name ?? "—"} />
                <InfoRow icon={FileText} label="GST Number" value={bp?.gstNumber ?? user.gstNumber ?? "—"} mono />
                <InfoRow icon={FileText} label="PAN Number" value={bp?.panNumber ?? user.panNumber ?? "—"} mono />
                
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
                <InfoRow icon={MapPin} label="Address" value={
                  bp?.address
                    ? (typeof bp.address === 'object'
                        ? [bp.address.street1, bp.address.city, bp.address.state, bp.address.pincode].filter(Boolean).join(", ")
                        : [bp.address, bp.city, bp.state, bp.pincode].filter(Boolean).join(", "))
                    : ([user.address, user.city, user.state, user.pincode].filter(Boolean).join(", ") || "—")
                } className="sm:col-span-2" />
                {bp?.email && <InfoRow icon={Mail} label="Email" value={bp.email} />}
                {bp?.phone && <InfoRow icon={Phone} label="Phone" value={bp.phone} mono />}
              </div>
            )}
          </motion.div>
        </div>

        {/* KYC Documents - Seller */}
        {isSeller && sp && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-2xl p-6">
            <h2 className="font-semibold text-foreground mb-4">KYC Verification</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <KycCard label="PAN Verification" status={sp.panVerified ? "verified" : "pending"} value={sp.panNumber} />
              <KycCard label="GST Verification" status={sp.gstVerified ? "verified" : "pending"} value={sp.gstNumber} />
              <KycCard label="Drug License" status={sp.drugLicenseVerified ? "verified" : "pending"} value={sp.drugLicenseNumber} />
            </div>
            {canApprove && (
              <div className="mt-6 pt-6 border-t border-border flex gap-3">
                <Button variant="primary" onClick={() => handleAction("approve")} leftIcon={<UserCheck className="h-4 w-4" />}>Approve Seller</Button>
                <Button variant="danger" onClick={() => handleAction("reject")} leftIcon={<UserX className="h-4 w-4" />}>Reject Seller</Button>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete User">
        <p className="text-sm text-muted-foreground mb-4">Are you sure you want to delete this user? This action will cascade-delete all associated orders, payments, and data. This cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} loading={deleteUserMutation.isPending}>Delete User</Button>
        </div>
      </Modal>
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

function KycCard({ label, status, value }: { label: string; status: "verified" | "pending"; value?: string }) {
  return (
    <div className={cn("p-4 rounded-xl border", status === "verified" ? "border-green-200 bg-green-50/50 dark:bg-green-900/10 dark:border-green-800" : "border-yellow-200 bg-yellow-50/50 dark:bg-yellow-900/10 dark:border-yellow-800")}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <Badge variant={status === "verified" ? "success" : "warning"}>{status === "verified" ? "Verified" : "Pending"}</Badge>
      </div>
      {value && <p className="text-xs font-mono text-muted-foreground">{value}</p>}
    </div>
  );
}
