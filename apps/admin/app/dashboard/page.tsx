"use client";
import React, { useState } from "react";
import { AnalyticsNav } from "@/components/analytics/analytics-nav";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, Package, ShoppingBag, TrendingUp, AlertTriangle, CheckCircle, Clock, Flag, Bell, Search } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { StatCard, Badge, StatusBadge, Button } from "@/components/ui";
import { formatCurrency, formatCompact } from "@yukizi/utils";
import { useAdminDashboard, usePlatformSettings, useUpdatePlatformSettings } from "@/hooks/useAdmin";
import toast from "react-hot-toast";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { subDays } from "date-fns";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { data: settingsData } = usePlatformSettings();
  const updateSettings = useUpdatePlatformSettings();
  const comingSoonActive = settingsData?.comingSoonMode ?? true;

  const handleToggleComingSoon = async () => {
    try {
      const nextState = !comingSoonActive;
      await updateSettings.mutateAsync({
        ...(settingsData || {}),
        comingSoonMode: nextState,
      });
      toast.success(nextState ? "Buyer Coming Soon mode ACTIVATED" : "Buyer Coming Soon mode DISABLED");
    } catch {
      toast.error("Failed to update Coming Soon status");
    }
  };

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });


  const { data: d, isLoading } = useAdminDashboard({
    dateFrom: dateRange?.from?.toISOString(),
    dateTo: dateRange?.to?.toISOString(),
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Loading dashboard…</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const stats = {
    totalUsers: d?.totalUsers ?? 0,
    totalBuyers: d?.totalBuyers ?? 0,
    totalSellers: d?.totalSellers ?? 0,
    totalOrders: d?.totalOrders ?? 0,
    totalRevenue: d?.totalRevenue ?? 0,
    totalProducts: d?.totalProducts ?? 0,
    pendingOrders: d?.pendingOrders ?? 0,
    pendingPayments: d?.pendingPayments ?? 0,
    pendingSettlements: d?.pendingSettlements ?? 0,
    openTickets: d?.openTickets ?? 0,
    blockedUsers: d?.blockedUsers ?? 0,
    referralCount: d?.referralCount ?? 0,
    referralRevenue: d?.referralRevenue ?? 0,
    pendingProductRequests: d?.pendingProductRequests ?? 0,
  };
  const recentOrders = d?.recentOrders ?? [];

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-semibold text-2xl text-foreground">Platform Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Monitor the entire Yukizi ecosystem</p>
        </div>
        {/* Analytics lives here now — this page IS the Business view, with the
            deeper sections one click away. */}
        <AnalyticsNav />
        <div className="flex items-center gap-3">
          <DateRangePicker value={dateRange} onChange={setDateRange} align="end" />
        </div>
      </div>

      {/* Coming Soon Banner Toggle Widget */}
      <div className="mb-6 p-4 rounded-2xl glass-card bg-gradient-to-r from-purple-500/10 via-primary/10 to-indigo-500/10 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground text-sm">Buyer App "Coming Soon" Screen</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${comingSoonActive ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30" : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"}`}>
                {comingSoonActive ? "ACTIVE (COMING SOON DISPLAYED)" : "DISABLED (FULL STORE LIVE)"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {comingSoonActive
                ? "Buyers currently see the Coming Soon landing screen. Toggle OFF to reveal the live store."
                : "Buyers can browse and order normally. Toggle ON to activate the Coming Soon screen."}
            </p>
          </div>
        </div>
        <button
          onClick={handleToggleComingSoon}
          disabled={updateSettings.isPending}
          className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${comingSoonActive ? "bg-primary" : "bg-muted"}`}
          role="switch"
          aria-checked={comingSoonActive}
          title="Toggle Coming Soon Mode"
        >
          <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${comingSoonActive ? "translate-x-5" : "translate-x-0"}`} />
        </button>
      </div>


      {/* Critical alerts */}
      {(stats.pendingOrders > 0 || stats.openTickets > 0 || stats.pendingProductRequests > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {stats.pendingOrders > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0" aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-400">{stats.pendingOrders} Pending Orders</p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-500">Orders awaiting processing</p>
                </div>
              </div>
              <Link href="/orders"><Button size="xs" variant="warning">Review</Button></Link>
            </motion.div>
          )}
          {stats.openTickets > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="flex items-center justify-between p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-3">
                <Flag className="h-5 w-5 text-red-500 flex-shrink-0" aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400">{stats.openTickets} Open Tickets</p>
                  <p className="text-xs text-red-500">Support tickets need attention</p>
                </div>
              </div>
              <Link href="/tickets"><Button size="xs" variant="danger">Review</Button></Link>
            </motion.div>
          )}
          {stats.pendingProductRequests > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="flex items-center justify-between p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-blue-500 flex-shrink-0" aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">{stats.pendingProductRequests} Product Requests</p>
                  <p className="text-xs text-blue-500">Sellers requesting new items</p>
                </div>
              </div>
              <Link href="/product-requests"><Button size="xs" variant="primary">Review</Button></Link>
            </motion.div>
          )}
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard title="Total Users" value={formatCompact(stats.totalUsers)} change={`${stats.totalBuyers} buyers · ${stats.totalSellers} sellers`} icon={Users} iconClass="bg-blue-50 text-blue-600 dark:bg-blue-900/20" delay={0} href="/users" />
        <StatCard title="Total Buyers" value={String(stats.totalBuyers)} change="Verified buyers" icon={Users} iconClass="bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20" delay={0.05} href="/users" />
        <StatCard title="Total Sellers" value={String(stats.totalSellers)} change={`${stats.blockedUsers} blocked`} icon={CheckCircle} iconClass="bg-green-50 text-green-600 dark:bg-green-900/20" delay={0.1} href="/users" />
        <StatCard title="Total Orders" value={formatCompact(stats.totalOrders)} change={`${stats.pendingOrders} pending`} icon={ShoppingBag} iconClass="bg-purple-50 text-purple-600 dark:bg-purple-900/20" delay={0.15} href="/orders" />
        <StatCard title="Platform Revenue" value={`₹${formatCompact(stats.totalRevenue)}`} change={`${stats.pendingPayments} pending payments`} icon={TrendingUp} iconClass="bg-orange-50 text-orange-600 dark:bg-orange-900/20" delay={0.2} href="/settlements" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Products" value={formatCompact(stats.totalProducts)} icon={Package} iconClass="bg-teal-50 text-teal-600 dark:bg-teal-900/20" delay={0.28} href="/products" />
        <StatCard title="Pending Orders" value={String(stats.pendingOrders)} change="Need processing" icon={Clock} iconClass="bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20" alert delay={0.35} href="/orders" />
        <StatCard title="Pending Payments" value={String(stats.pendingPayments)} change="Awaiting verification" icon={AlertTriangle} iconClass="bg-red-50 text-red-500 dark:bg-red-900/20" alert delay={0.42} href="/settlements" />
        <StatCard title="Open Tickets" value={String(stats.openTickets)} change="Unresolved" icon={Flag} iconClass="bg-pink-50 text-pink-600 dark:bg-pink-900/20" alert delay={0.49} href="/tickets" />
      </div>

      {/* Referral Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Successful Referrals" value={String(stats.referralCount)} change="Delivered" icon={TrendingUp} iconClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20" delay={0.56} href="/referrals" />
        <StatCard title="Referral Revenue" value={`₹${formatCompact(stats.referralRevenue)}`} change="Total value" icon={ShoppingBag} iconClass="bg-rose-50 text-rose-600 dark:bg-rose-900/20" delay={0.63} href="/referrals" />
      </div>

      {/* Recent orders table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <div><h2 className="font-semibold text-foreground">Recent Platform Orders</h2><p className="text-xs text-muted-foreground mt-0.5">Latest orders across the platform</p></div>
          <Link href="/orders"><Button variant="ghost" size="sm">View all</Button></Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" aria-label="Platform orders">
            <thead>
              <tr className="border-b border-border/50 bg-muted/20">
                {["Order ID", "Buyer", "Amount", "Payment", "Date"].map(h => (
                  <th key={h} scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {recentOrders.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">No orders yet</td></tr>
              ) : recentOrders.map((o: any, i: number) => (
                <motion.tr 
                  key={o.id} 
                  initial={{ opacity: 0, y: 6 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: i * 0.06 }} 
                  className="hover:bg-accent/30 transition-colors cursor-pointer group"
                  onClick={() => router.push(`/orders/${o.id}`)}
                >
                  <td className="px-5 py-4"><span className="font-mono text-xs font-medium text-foreground group-hover:text-primary transition-colors">{o.id?.slice(0, 8)}…</span></td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-foreground truncate">{o.buyer?.name ?? o.buyer?.legalName ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{o.buyer?.phone ?? ""}</p>
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-foreground">{formatCurrency(o.totalAmount ?? 0)}</td>
                  <td className="px-5 py-4"><Badge variant={o.paymentStatus === "PAID" ? "success" : o.paymentStatus === "PENDING" ? "warning" : "error"}>{o.paymentStatus ?? "—"}</Badge></td>
                  <td className="px-5 py-4 text-xs text-muted-foreground whitespace-nowrap">{o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-IN") : "—"}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </AdminLayout>
  );
}
