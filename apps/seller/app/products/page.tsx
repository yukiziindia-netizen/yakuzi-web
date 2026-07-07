"use client";
import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import { Button, Input, Badge, ApprovalBadge, Skeleton, Pagination } from "@/components/ui";
import { formatCurrency } from "@yukizi/utils";
import { cn } from "@/lib/utils";
import { useSellerProducts, useDeleteSellerProduct } from "@/hooks/useSeller";
import Link from "next/link";


const EMOJI: Record<string,string> = {"eye-drops":"👁️",capsules:"🔴",tablets:"💊",syrups:"🧪",vitamins:"🌟",default:"💊"};
const PAGE_SIZE = 20;

const renderOffer = (p: any) => {
  const meta = p.discountMeta || {};
  if (!p.discountType) {
    if (meta.discountPercent) {
      return <Badge className="bg-purple-600 hover:bg-purple-700 text-white font-bold">{meta.discountPercent}% Discount</Badge>;
    }
    return <span className="text-xs text-muted-foreground">No offer</span>;
  }
  if (p.discountType === "PTR_DISCOUNT") {
    return <Badge className="bg-purple-600 hover:bg-purple-700 text-white font-bold">{meta.discountPercent || 0}% Discount</Badge>;
  }
  if (p.discountType === "SAME_PRODUCT_BONUS") {
    return <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-bold">Buy {meta.buy || 0} Get {meta.get || 0} Free</Badge>;
  }
  if (p.discountType === "PTR_PLUS_SAME_PRODUCT_BONUS") {
    return <div className="flex flex-col gap-1"><Badge className="bg-purple-600 hover:bg-purple-700 text-white font-bold">{meta.discountPercent || 0}% Discount</Badge><Badge className="bg-blue-600 hover:bg-blue-700 text-white font-bold">Buy {meta.buy || 0} Get {meta.get || 0} Free</Badge></div>;
  }
  if (p.discountType === "DIFFERENT_PRODUCT_BONUS") {
    return <Badge className="bg-amber-600 hover:bg-amber-700 text-white font-bold">Buy {meta.buy || 0} Get {meta.get || 0} {meta.bonusProductName}</Badge>;
  }
  if (p.discountType === "PTR_PLUS_DIFFERENT_PRODUCT_BONUS") {
    return <div className="flex flex-col gap-1"><Badge className="bg-purple-600 hover:bg-purple-700 text-white font-bold">{meta.discountPercent || 0}% Discount</Badge><Badge className="bg-amber-600 hover:bg-amber-700 text-white font-bold">Buy {meta.buy || 0} Get {meta.get || 0} {meta.bonusProductName}</Badge></div>;
  }
  if (p.discountType === "SPECIAL_PRICE") {
    return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">Special Price: {formatCurrency(meta.specialPrice || 0)}</Badge>;
  }
  return <Badge className="bg-purple-600 hover:bg-purple-700 text-white font-bold">{p.discountType.replace(/_/g, ' ')}</Badge>;
};

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<"all"|"approved"|"pending"|"rejected">("all");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [filter, debouncedSearch]);

  const { data: productsData, isLoading } = useSellerProducts({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch,
    status: filter === "all" ? undefined : filter
  });

  const deleteProduct = useDeleteSellerProduct();
  
  const products = (productsData as any)?.data ?? [];
  const total = (productsData as any)?.meta?.total ?? 0;
  const totalPages = (productsData as any)?.meta?.totalPages ?? 1;

  return (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div><h1 className="font-semibold text-2xl text-foreground">Products</h1><p className="text-sm text-muted-foreground mt-0.5">Manage your product listings</p></div>
            <div className="flex items-center gap-3">
              <Link href="/products/new">
                <Button leftIcon={<Plus className="h-4 w-4"/>}>Add Product</Button>
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1"><Input placeholder="Search products…" value={search} onChange={e=>setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4"/>}/></div>
            <div className="flex gap-1.5" role="group">
              {(["all","approved","pending","rejected"] as const).map(f=>(
                <button key={f} onClick={()=>setFilter(f)}
                  className={cn("px-3 py-2 rounded-xl text-xs font-medium border transition-all capitalize", filter===f?"bg-primary text-white border-primary":"border-border text-muted-foreground hover:bg-accent/60")}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="glass-card rounded-2xl p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : (
          <>
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full" aria-label="Products">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/20">
                      {["Product","Category","SKU","Price","Stock","GST","Offer","Actions"].map(h=>(
                        <th key={h} scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {products.length===0 ? (
                      <tr><td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">No products found</td></tr>
                    ) : products.map((p: any, i: number)=>{
                      console.log("PRODUCT_DUMP", JSON.stringify(p, null, 2));
                      return (
                      <motion.tr key={p.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}} className="hover:bg-accent/30 transition-colors">
                        <td className="px-5 py-4">
                          <div>
                            <div className="text-sm font-semibold text-foreground">
                              {p.variant?.name && p.name !== p.variant.name && !p.name.includes(p.variant.name) 
                                ? `${p.name} - ${p.variant.name}` 
                                : p.variantName && p.name !== p.variantName && !p.name.includes(p.variantName) 
                                ? `${p.name} - ${p.variantName}` 
                                : p.name}
                            </div>
                            {p.genericName && <div className="text-xs text-muted-foreground font-mono">{p.genericName}</div>}
                          </div>
                        </td>
                        <td className="px-5 py-4"><Badge className="capitalize">{p.category}</Badge></td>
                        <td className="px-5 py-4"><span className="font-mono text-xs text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">{p.variant?.sku || p.sku || "—"}</span></td>
                        <td className="px-5 py-4">
                          <div className="text-sm font-semibold text-foreground">{formatCurrency(p.mrp ?? p.price ?? 0)}</div>
                          {p.sellingPrice != null && p.sellingPrice !== p.mrp && <div className="text-xs text-muted-foreground">Sell: {formatCurrency(p.sellingPrice)}</div>}
                        </td>

                        <td className="px-5 py-4">
                          <span className={`text-sm font-medium ${(p.available ?? p.variant?.available ?? p.stock ?? 0)>100?"text-green-600":(p.available ?? p.variant?.available ?? p.stock ?? 0)>0?"text-yellow-600":"text-red-500"}`}>
                            {p.available ?? p.variant?.available ?? p.stock} units
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm font-medium text-muted-foreground">{p.gstPercent ?? p.gst ?? 0}%</td>
                        <td className="px-5 py-4">{renderOffer(p)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            <Link href={`/products/${p.id}`} aria-label={`View ${p.name}`} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"><Eye className="h-3.5 w-3.5"/></Link>
                            <Link href={`/products/${p.id}/edit`} aria-label={`Edit ${p.name}`} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"><Edit className="h-3.5 w-3.5"/></Link>
                            <button onClick={() => deleteProduct.mutate(p.id)} aria-label={`Delete ${p.name}`} className="h-7 w-7 rounded-lg flex items-center justify-center text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="h-3.5 w-3.5"/></button>
                          </div>
                        </td>
                      </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="flex justify-between items-center bg-muted/10 px-6 py-4 rounded-2xl border border-border/50">
              <p className="text-xs text-muted-foreground">Showing {products.length} of {total} products</p>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </>
          )}
        </div>
  );
}

