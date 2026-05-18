"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Plus, Search, Trash2, Calendar, Users, Activity, Copy, Check, Filter, X } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button, Input, Badge, Pagination } from "@/components/ui";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { useReferralCodes, useCreateReferralCode, useDeleteReferralCode } from "@/hooks/useAdmin";

import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { subDays } from "date-fns";

export default function ReferralsPage() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const { data: referrals, isLoading } = useReferralCodes({
    dateFrom: dateRange?.from?.toISOString(),
    dateTo: dateRange?.to?.toISOString(),
  });

  const createCode = useCreateReferralCode();
  const deleteCode = useDeleteReferralCode();

  const [formData, setFormData] = useState({
    code: "",
    description: ""
  });

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
    toast.success("Code copied to clipboard!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code) {
      toast.error("Code is required");
      return;
    }
    try {
      await createCode.mutateAsync(formData);
      toast.success(`Referral code ${formData.code} generated!`);
      setIsModalOpen(false);
      setFormData({ code: "", description: "" });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to generate code");
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete the referral code "${code}"?`)) return;
    try {
      await deleteCode.mutateAsync(id);
      toast.success("Code deleted successfully");
    } catch {
      toast.error("Failed to delete code");
    }
  };

  const codes: any[] = Array.isArray(referrals) ? referrals : (referrals?.data ?? []);
  const filtered = codes.filter((c: any) => 
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    (c.description || "").toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { 
      label: "Total Codes", 
      value: codes.length, 
      icon: Gift, 
      color: "text-blue-500", 
      bg: "bg-blue-500/10",
      description: "Total referral programs created"
    },
    { 
      label: "Total Revenue", 
      value: `₹${codes.reduce((acc: number, c: any) => acc + (c.totalRevenue || 0), 0).toLocaleString()}`, 
      icon: Activity, 
      color: "text-emerald-500", 
      bg: "bg-emerald-500/10",
      description: "Total sales attributed to referrals"
    },
    { 
      label: "Order Count", 
      value: codes.reduce((acc: number, c: any) => acc + (c.orderCount || 0), 0), 
      icon: Users, 
      color: "text-purple-500", 
      bg: "bg-purple-500/10",
      description: "Successful referred purchases"
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-bold text-3xl text-foreground tracking-tight">Referral Revenue</h1>
            <p className="text-sm text-muted-foreground mt-1 font-medium">Track sales attribution and monitor referral program performance.</p>
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)} 
            className="rounded-2xl h-12 px-6 shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 transition-all active:scale-95 font-semibold"
          >
            <Plus className="h-5 w-5 mr-1.5" /> Generate Tracking Code
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <motion.div 
              key={stat.label} 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.1 }}
              className="glass p-6 rounded-3xl border border-white/20 shadow-sm hover:border-white/40 transition-colors group"
            >
              <div className="flex items-center gap-5">
                <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-110 duration-300", stat.bg)}>
                  <stat.icon className={cn("h-7 w-7", stat.color)} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">{stat.label}</p>
                  <p className="text-3xl font-black text-foreground mt-0.5">{stat.value}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4 font-medium">{stat.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search by code or campaign..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="pl-12 h-12 rounded-2xl border-white/20 bg-white/5 backdrop-blur-sm focus:ring-primary/20 transition-all font-medium" 
            />
          </div>
          <DateRangePicker value={dateRange} onChange={setDateRange} align="end" />

        </div>

        {/* Main Records Table */}
        <div className="glass rounded-[2rem] overflow-hidden border border-white/20 shadow-2xl shadow-black/5">
          <div className="overflow-x-auto overflow-y-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/10 backdrop-blur-md border-b border-white/10">
                  <th className="px-8 py-5 text-xs font-bold text-muted-foreground uppercase tracking-widest">Tracking Identity</th>
                  <th className="px-8 py-5 text-xs font-bold text-muted-foreground uppercase tracking-widest text-center">Transaction Volume (₹)</th>
                  <th className="px-8 py-5 text-xs font-bold text-muted-foreground uppercase tracking-widest text-center">Order Count</th>
                  <th className="px-8 py-5 text-xs font-bold text-muted-foreground uppercase tracking-widest text-center">Condition</th>
                  <th className="px-8 py-5 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm font-semibold text-muted-foreground animate-pulse">Aggregating revenue data...</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-32 text-center">
                      <div className="max-w-xs mx-auto space-y-3">
                        <div className="h-16 w-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto opacity-50">
                          <Gift className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-bold text-lg text-foreground">No tracking codes</h3>
                        <p className="text-sm text-muted-foreground">Start by generating a code to track purchase attribution.</p>
                        <Button onClick={() => setIsModalOpen(true)} variant="ghost" className="text-primary font-bold hover:bg-primary/5">Generate your first code</Button>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map((c: any, i: number) => (
                  <motion.tr 
                    key={c.id} 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: i * 0.04 }} 
                    className="hover:bg-white/5 group transition-colors"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="font-mono text-lg font-black text-primary bg-primary/10 px-4 py-2 rounded-xl border-2 border-primary/20 shadow-inner group-hover:border-primary/40 transition-all">
                            {c.code}
                          </div>
                          <button 
                            onClick={() => handleCopy(c.code)} 
                            className="absolute -right-3 -top-3 h-8 w-8 bg-white dark:bg-zinc-800 rounded-full shadow-lg border border-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-90"
                            title="Copy Code"
                          >
                            {copied === c.code ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                          </button>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground">{(c.description || "General Campaign")}</span>
                          <span className="text-[10px] uppercase tracking-tighter text-muted-foreground font-bold mt-0.5">CREATED: {new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="inline-flex flex-col">
                         <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">₹{(c.totalRevenue || 0).toLocaleString()}</span>
                         <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Attributed Sales</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-lg font-bold text-foreground">{c.orderCount || 0}</span>
                        <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Checkouts</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <Badge variant={c.isActive ? "success" : "warning"} className="rounded-lg px-3 py-1 font-bold">
                        {c.isActive ? "TRACKING" : "DISABLED"}
                      </Badge>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => handleDelete(c.id, c.code)} 
                        className="p-3 rounded-2xl text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all active:scale-95"
                        title="Delete Permanently"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-6 bg-white/5 backdrop-blur-sm border-t border-white/10 flex justify-between items-center">
             <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Monitoring {filtered.length} tracking segments</p>
             <Pagination page={1} totalPages={1} onPageChange={() => {}} />
          </div>
        </div>

        {/* Create Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)} 
                className="absolute inset-0 bg-zinc-950/40 backdrop-blur-md" 
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-[2.5rem] border border-white/40 dark:border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.25)] overflow-hidden"
              >
                {/* Decorative Top Accent */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary/30 via-primary to-primary/30 rounded-t-[2.5rem]" />
                
                <button onClick={() => setIsModalOpen(false)} className="absolute right-8 top-8 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors group z-10">
                  <X className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                </button>

                <div className="px-8 pt-10 pb-8">
                  <div className="flex items-center gap-5 mb-8">
                    <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20 shadow-inner">
                      <Gift className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-foreground tracking-tight leading-none">Generate Tracker</h2>
                      <p className="text-sm text-muted-foreground font-semibold mt-1.5">Create a new unique code for attribution.</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Referral Identity Code</label>
                      <div className="relative">
                         <Input 
                          placeholder="e.g. SUMMER_SALE_24" 
                          value={formData.code} 
                          onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} 
                          className="h-14 text-xl font-mono font-black rounded-2xl bg-black/5 dark:bg-white/5 border-transparent focus:border-primary/50 focus:bg-white dark:focus:bg-zinc-950 transition-all pl-6 shadow-inner"
                          required 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Campaign Source / Description</label>
                      <Input 
                        placeholder="e.g. Instagram Influencer Campaign" 
                        value={formData.description} 
                        onChange={(e) => setFormData({...formData, description: e.target.value})} 
                        className="h-12 rounded-xl bg-black/5 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-zinc-950"
                      />
                    </div>

                    <div className="flex gap-4 pt-6">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={() => setIsModalOpen(false)} 
                        className="flex-1 h-14 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 font-bold text-muted-foreground"
                      >
                        Dismiss
                      </Button>
                      <Button 
                        type="submit" 
                        className="flex-1 h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 transition-all active:scale-[0.98] font-bold text-lg" 
                        loading={createCode.isPending}
                      >
                        Authorize & Create
                      </Button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}
