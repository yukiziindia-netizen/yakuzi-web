"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Package, ShoppingBag, TrendingUp, CreditCard, AlertTriangle, Bell, Palmtree } from "lucide-react";
import { StatCard, Button } from "@/components/ui";
import { formatCurrency } from "@yukizi/utils";
import { useSellerDashboard, useToggleVacationMode, useSellerProfile, useSellerNotifications } from "@/hooks/useSeller";
import { useSellerAuth } from "@/store";
import toast from "react-hot-toast";

import React, { useState } from "react";
import { subDays } from "date-fns";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";

export default function SellerDashboard() {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const { data: dashboardDataRaw, isLoading } = useSellerDashboard({
    dateFrom: dateRange?.from?.toISOString(),
    dateTo: dateRange?.to?.toISOString(),
  });
  const dashboardData = dashboardDataRaw as any;
  const { user } = useSellerAuth();
  const { data: profile } = useSellerProfile();
  const toggleVacation = useToggleVacationMode();
  const { data: notificationsRaw } = useSellerNotifications();
  const notifications: any[] = Array.isArray(notificationsRaw) ? notificationsRaw : (notificationsRaw?.notifications ?? []);
  const unreadCount = notifications.filter((n: any) => !n.read && !n.isRead).length;
  const isVacation = user?.isVacation || profile?.isVacation || false;
  const sellerOrders: any[] = dashboardData?.overview?.orders || dashboardData?.recentOrders || dashboardData?.orders || [];
  const stats = dashboardData?.stats || {
    totalProducts: 0,
    activeListings: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    pendingPayouts: 0,
    avgRating: 0,
    lowStockItems: 0,
  };
  // Listings that exist but aren't live — the only "pending" figure the
  // dashboard payload actually supports.
  const notLiveListings = Math.max(0, (stats.totalProducts ?? 0) - (stats.activeListings ?? 0));

  if (isLoading) {
    return <div className="min-h-screen p-6">Loading seller dashboard...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Vacation Mode Banner */}
      {isVacation && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-3">
            <Palmtree className="h-5 w-5 text-amber-600 flex-shrink-0" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Vacation Mode is ON</p>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">Your store is currently hidden from buyers. Turn off vacation mode to resume selling.</p>
            </div>
          </div>
          <Button size="sm" variant="outline" loading={toggleVacation.isPending} onClick={() => { toggleVacation.mutate(false, { onSuccess: () => toast.success("Vacation mode turned off. Your store is now visible!"), onError: () => toast.error("Failed to update vacation mode") }); }}>
            Deactivate
          </Button>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl text-foreground">Seller Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{user?.businessName || user?.name || "Seller"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateRangePicker value={dateRange} onChange={setDateRange} align="end" />

          <Link href="/notifications" aria-label="Notifications" className="relative h-9 w-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:bg-accent/60 transition-colors">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center" aria-hidden>
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
          <Link href="/products"><Button size="sm" leftIcon={<Package className="h-3.5 w-3.5" />}>Add Product</Button></Link>
        </div>
      </div>

      {/* Stats grid.
          The sub-labels used to be hardcoded strings: Total Revenue always
          read "+0% this month" (with an up arrow), Active Listings always
          "0 pending approval", Pending Payouts always "Scheduled" — none of
          them derived from anything. The dashboard payload carries no
          period-over-period figures, so rather than invent a trend, a card
          now shows a sub-label only when there is a real number behind it.
          `change` is already optional on StatCard. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={TrendingUp} iconClass="bg-green-50 text-green-600 dark:bg-green-900/20" delay={0} href="/payouts" />
        <StatCard title="Active Listings" value={`${stats.activeListings}/${stats.totalProducts}`} change={notLiveListings > 0 ? `${notLiveListings} not live` : undefined} icon={Package} iconClass="bg-blue-50 text-blue-600 dark:bg-blue-900/20" delay={0.07} href="/products" />
        <StatCard title="Orders" value={String(stats.totalOrders)} change={`${stats.pendingOrders} pending`} icon={ShoppingBag} iconClass="bg-purple-50 text-purple-600 dark:bg-purple-900/20" delay={0.14} href="/orders" />
        <StatCard title="Pending Payouts" value={formatCurrency(stats.pendingPayouts)} icon={CreditCard} iconClass="bg-orange-50 text-orange-600 dark:bg-orange-900/20" delay={0.21} href="/payouts" />
      </div>

      {/* Low stock alert */}
      {stats.lowStockItems > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" aria-hidden />
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            <span className="font-semibold">{stats.lowStockItems} products</span> are running low on stock.{" "}
            <Link href="/inventory" className="underline font-medium">Update inventory →</Link>
          </p>
        </motion.div>
      )}


    </div>
  );
}
