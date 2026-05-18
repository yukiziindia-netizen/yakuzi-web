"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Search, CheckCircle, XCircle, CreditCard, ExternalLink, Loader2 } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button, Input, Badge, Pagination } from "@/components/ui";
import { formatCurrency, formatDate } from "@pharmabag/utils";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { usePayments, useConfirmPayment, useRejectPayment, usePresignedUrl } from "@/hooks/useAdmin";

function SecureLink({ url, className, children, title }: { url: string; className?: string; children: React.ReactNode; title?: string }) {
  const { data: presignedUrl } = usePresignedUrl(url);
  const displayUrl = presignedUrl || (url.startsWith("http") ? url : "");
  if (!displayUrl) return null;
  return (
    <a href={displayUrl} target="_blank" rel="noopener noreferrer" title={title} className={className}>
      {children}
    </a>
  );
}

export default function AdminPaymentsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "CONFIRMED" | "REJECTED">("ALL");
  const [page, setPage] = useState(1);
  const limit = 20;
  const { data: paymentsData, isLoading } = usePayments(page, limit);
  const confirmPayment = useConfirmPayment();
  const rejectPayment = useRejectPayment();

  const payments = Array.isArray(paymentsData) ? paymentsData : (paymentsData?.data ?? []);
  const totalPayments = paymentsData?.total ?? payments.length;
  const totalPages = Math.max(1, Math.ceil(totalPayments / limit));

  const filtered = payments.filter((p: any) =>
    (filter === "ALL" || p.verificationStatus === filter) &&
    (!search || 
      (p.id || "").toLowerCase().includes(search.toLowerCase()) || 
      (p.referenceNumber || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.order?.buyer?.phone || "").includes(search)
    )
  );

  const handleConfirm = async (id: string) => {
    if (!window.confirm("Mark this payment as confirmed?")) return;
    try {
      await confirmPayment.mutateAsync(id);
      toast.success("Payment confirmed");
    } catch {
      toast.error("Failed to confirm payment");
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm("Reject this payment?")) return;
    try {
      await rejectPayment.mutateAsync(id);
      toast.success("Payment rejected");
    } catch {
      toast.error("Failed to reject payment");
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center space-y-2">
            <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Loading payments…</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-semibold text-2xl text-foreground flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-primary" />
              Payment Management
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Verify and manage incoming payments from buyers
            </p>
          </div>
          <div className="text-right">
            <p className="font-medium text-xl text-foreground">{payments.length}</p>
            <p className="text-xs text-muted-foreground">Total Payments</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input placeholder="Search by payment ID or buyer phone…" value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4" />} />
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-sb pb-1 sm:pb-0" role="group" aria-label="Filter by status">
            {(["ALL", "PENDING", "CONFIRMED", "REJECTED"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn("px-3 py-2 rounded-xl text-xs font-medium border transition-all whitespace-nowrap", filter === f ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:bg-accent/60")}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" aria-label="Payments">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Date</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Payment Details</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Order ID</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Amount</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">No payments found</td></tr>
                ) : filtered.map((p: any, i: number) => (
                  <motion.tr key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="hover:bg-accent/30 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground">{formatDate(p.createdAt, { year: "numeric", month: "short", day: "numeric" })}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(p.createdAt, { hour: "numeric", minute: "2-digit", hour12: true })}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm font-medium text-foreground capitalize">{p.method?.replace(/_/g, " ")}</div>
                      {p.referenceNumber ? <div className="text-xs text-muted-foreground font-mono mt-0.5">Ref: {p.referenceNumber}</div> : <div className="text-xs text-muted-foreground mt-0.5">No reference</div>}
                    </td>
                    <td className="px-5 py-4">
                      {p.orderId ? (
                        <Link href={`/orders/${p.orderId}`} className="text-sm font-mono text-primary hover:underline truncate w-24 block" title={p.orderId}>
                          {p.orderId.substring(0, 8)}...
                        </Link>
                      ) : (
                        <div className="text-sm font-mono text-muted-foreground">—</div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-foreground">
                      {formatCurrency(p.amount ?? 0)}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={p.verificationStatus === "CONFIRMED" ? "success" : p.verificationStatus === "REJECTED" ? "error" : "warning"}>
                        {p.verificationStatus}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        {p.proofUrl && (
                          <SecureLink url={p.proofUrl} title="View Proof"
                            className="h-8 w-8 rounded-lg flex items-center justify-center bg-accent/50 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                            <ExternalLink className="h-4 w-4" />
                          </SecureLink>
                        )}
                        {p.verificationStatus === "PENDING" && (
                          <>
                            <Button size="icon" variant="ghost" onClick={() => handleConfirm(p.id)} title="Confirm Payment" loading={confirmPayment.isPending}
                              className="text-green-600 bg-green-50 hover:bg-green-100 hover:text-green-700 dark:bg-green-900/20 dark:hover:bg-green-900/40">
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleReject(p.id)} title="Reject Payment" loading={rejectPayment.isPending}
                              className="text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 dark:bg-red-900/20 dark:hover:bg-red-900/40">
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
      </div>
    </AdminLayout>
  );
}
