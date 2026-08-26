"use client";
import { useState } from "react";
import { Loader2, Search, Truck } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import toast from "react-hot-toast";
import { useAdminSellers, useSetSellerSelfShip } from "@/hooks/useAdmin";

export default function AdminSelfShipPage() {
  const { data: sellersData, isLoading } = useAdminSellers();
  const setSelfShip = useSetSellerSelfShip();
  const [search, setSearch] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const sellers: any[] = sellersData?.data || [];

  const filtered = sellers.filter((u: any) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (u.sellerProfile?.companyName || "").toLowerCase().includes(q) ||
      (u.phone || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q)
    );
  });

  const handleToggle = async (user: any) => {
    const profileId = user.sellerProfile?.id;
    if (!profileId) return;
    const next = !user.sellerProfile?.selfShipEnabled;
    setPendingId(profileId);
    try {
      await setSelfShip.mutateAsync({ sellerId: profileId, selfShipEnabled: next });
      toast.success(
        next
          ? `Self-ship enabled for ${user.sellerProfile?.companyName || "seller"} — applies to NEW orders only`
          : `Self-ship disabled for ${user.sellerProfile?.companyName || "seller"}`,
      );
    } catch {
      toast.error("Failed to update self-ship setting");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" /> Self Ship
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sellers with self-ship enabled fulfill NEW orders with their own courier and submit a tracking
            link, instead of the platform Shiprocket flow. Toggling never changes existing orders.
          </p>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company, phone or email"
            className="w-full bg-background border border-input rounded-xl pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-left text-xs uppercase text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Seller</th>
                    <th className="px-5 py-3 font-medium">Contact</th>
                    <th className="px-5 py-3 font-medium">Location</th>
                    <th className="px-5 py-3 font-medium text-right">Self Ship</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">
                        No sellers found
                      </td>
                    </tr>
                  )}
                  {filtered.map((user: any) => {
                    const profile = user.sellerProfile || {};
                    const enabled = !!profile.selfShipEnabled;
                    const isPending = pendingId === profile.id;
                    return (
                      <tr key={user.id} className="border-b border-border/30 last:border-0">
                        <td className="px-5 py-3.5 font-medium text-foreground">
                          {profile.companyName || "—"}
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground">
                          <div>{user.phone || "—"}</div>
                          {user.email && <div className="text-xs">{user.email}</div>}
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground">
                          {[profile.city, profile.state].filter(Boolean).join(", ") || "—"}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => handleToggle(user)}
                            disabled={isPending || !profile.id}
                            role="switch"
                            aria-checked={enabled}
                            aria-label={`Self-ship for ${profile.companyName || user.phone}`}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                              enabled ? "bg-primary" : "bg-muted-foreground/30"
                            }`}
                          >
                            {isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto text-white" />
                            ) : (
                              <span
                                className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow transition-transform ${
                                  enabled ? "translate-x-[24px]" : "translate-x-[3px]"
                                }`}
                              />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
