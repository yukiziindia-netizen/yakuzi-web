"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Trash2, Layout, Star } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button, Input, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { 
  useSuggestions,
  useUpdateSuggestion,
} from "@/hooks/useAdmin";

type BadgeType = "YUKIZI_CHOICE" | "BEST_SELLER" | "AD";

export default function MarketingPage() {
  const [slot, setSlot] = useState<BadgeType>("YUKIZI_CHOICE");
  const [showAddModal, setShowAddModal] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  const { data: suggestionsData, isLoading: loadingMarketing } = useSuggestions({ badgeType: slot, limit: 100 });
  const updateSuggestion = useUpdateSuggestion();
  
  // For searching products to add
  const { data: productsData } = useSuggestions({ 
    search: productSearch, 
    limit: 10
  });

  const featuredList = suggestionsData?.data ?? [];
  const searchResults = productsData?.data ?? [];

  const handleToggleBadge = async (productId: string, isAdding: boolean) => {
    try {
      const payload: any = {};
      if (slot === "YUKIZI_CHOICE") payload.isYukiziChoice = isAdding;
      if (slot === "BEST_SELLER") payload.isBestSeller = isAdding;
      if (slot === "AD") payload.isAd = isAdding;

      await updateSuggestion.mutateAsync({ id: productId, payload });
      toast.success(isAdding ? "Product added to section" : "Product removed from section");
      if (isAdding) {
        setProductSearch("");
        setShowAddModal(false);
      }
    } catch {
      toast.error("Failed to update product");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-semibold text-2xl text-foreground flex items-center gap-2">
              <Layout className="h-6 w-6 text-primary" />
              Marketing Management
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage products with special marketing badges</p>
          </div>
          <Button onClick={() => setShowAddModal(true)} leftIcon={<Plus className="h-4 w-4" />}>
            Add Featured Product
          </Button>
        </div>

        <div className="flex gap-1.5 overflow-x-auto no-sb pb-1" role="group">
          {(["YUKIZI_CHOICE", "BEST_SELLER", "AD"] as const).map(f => (
            <button key={f} onClick={() => setSlot(f)}
              className={cn("px-4 py-2 rounded-xl text-sm font-medium border transition-all whitespace-nowrap", 
                slot === f ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "border-border text-muted-foreground hover:bg-accent/60")}>
              {f.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Manufacturer</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {loadingMarketing ? (
                  <tr><td colSpan={3} className="py-12 text-center text-sm text-muted-foreground">Loading...</td></tr>
                ) : featuredList.length === 0 ? (
                  <tr><td colSpan={3} className="py-12 text-center text-sm text-muted-foreground">No featured products in this slot</td></tr>
                ) : featuredList.map((item: any, i: number) => (
                  <motion.tr key={item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="hover:bg-accent/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{item.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {item.manufacturer ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleToggleBadge(item.id, false)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} 
            className="relative w-full max-w-4xl bg-card glass-card rounded-2xl shadow-xl p-6 border border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Star className="h-5 w-5 text-[#f5a623] fill-[#f5a623]" />
                Add Product to {slot.replace("_", " ")}
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground transition-colors text-xl">&times;</button>
            </div>
            
            <div className="space-y-4">
              <div className="max-w-md">
                <Input 
                  placeholder="Search catalog products by name or manufacturer..." 
                  value={productSearch} 
                  onChange={e => setProductSearch(e.target.value)}
                  leftIcon={<Search className="h-4 w-4" />}
                  autoFocus
                />
              </div>

              <div className="glass-card rounded-xl overflow-hidden border border-border/50">
                <div className="max-h-[400px] overflow-y-auto no-sb">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted/90 backdrop-blur-md z-10">
                      <tr className="border-b border-border/50 text-left">
                        <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product</th>
                        <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Manufacturer</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {searchResults.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-12 text-center text-muted-foreground">
                            {productSearch.length < 2 ? "Type at least 2 characters to search" : "No products found"}
                          </td>
                        </tr>
                      ) : searchResults.map((p: any) => {
                        return (
                          <tr key={p.id} className="hover:bg-accent/30 transition-colors group">
                            <td className="px-4 py-3">
                              <div className="font-medium text-foreground">{p.name}</div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{p.manufacturer ?? "—"}</td>
                            <td className="px-4 py-3 text-right">
                              <Button 
                                size="xs" 
                                onClick={() => handleToggleBadge(p.id, true)} 
                                loading={updateSuggestion.isPending}
                              >
                                Add
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <p className="text-xs text-muted-foreground">Products added here will be shown in the selected section.</p>
                <Button variant="ghost" onClick={() => setShowAddModal(false)}>Close</Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AdminLayout>
  );
}
