"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Package, Trash2, PencilLine } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button, Badge, Skeleton, Modal } from "@/components/ui";
import { formatCurrency } from "@yukizi/utils";
import { cn } from "@/lib/utils";
import { useProductById, useDeleteProduct } from "@/hooks/useAdmin";
import toast from "react-hot-toast";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: product, isLoading } = useProductById(id);
  const deleteProduct = useDeleteProduct();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteProduct.mutateAsync(id);
      toast.success("Product deleted");
      router.push("/products");
    } catch {
      toast.error("Failed to delete product");
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-64 lg:col-span-2" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!product) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold">Product not found</p>
            <Button variant="ghost" onClick={() => router.push("/products")} className="mt-4">Back to Products</Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const batches: any[] = product.batches ?? [];
  const totalStock = batches.reduce((s: number, b: any) => s + (b.stock ?? 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/products")} className="h-9 w-9 rounded-xl bg-accent/60 flex items-center justify-center hover:bg-accent transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="font-semibold text-2xl text-foreground">{product.name}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{product.manufacturer ?? "Unknown manufacturer"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Products is a read-only overview of what sellers have listed —
                the catalog itself (details, SEO, URL, images) is edited in
                Suggestions, the single authoring surface. */}
            <Button variant="outline" leftIcon={<PencilLine className="h-4 w-4" />} onClick={() => router.push("/suggestions")}>
              Edit in Suggestions
            </Button>
            <Button variant="danger" size="icon" onClick={() => setShowDeleteModal(true)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Details */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6 lg:col-span-2 space-y-6">
            <h2 className="font-semibold text-foreground">Product Information</h2>

            {(
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                <InfoRow label="Name" value={product.name} />
                <InfoRow label="Manufacturer" value={product.manufacturer} />
                <InfoRow label="Chemical Composition" value={product.chemicalComposition} />
                <InfoRow label="MRP" value={formatCurrency(product.mrp ?? 0)} />
                <InfoRow label="PTR" value={product.ptr ? formatCurrency(product.ptr) : "—"} />
                <InfoRow label="Category" value={product.category?.name ?? "—"} />
                <InfoRow label="HSN Code" value={product.hsnCode ?? "—"} />
                <InfoRow label="GST" value={product.gstPercent ? `${product.gstPercent}%` : "—"} />
                <InfoRow label="Min Order Qty" value={String(product.minimumOrderQuantity ?? 1)} />
                <InfoRow label="Max Order Qty" value={String(product.maximumOrderQuantity ?? "—")} />
                <div className="sm:col-span-2">
                  <InfoRow label="Description" value={product.description ?? "No description"} />
                </div>
              </div>
            )}
          </motion.div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Images */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass-card rounded-2xl p-6">
              <h2 className="font-semibold text-foreground mb-4">Images</h2>
              {product.images && product.images.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {product.images.map((img: string, i: number) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt={`${product.name} - ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No images uploaded</p>
              )}
            </motion.div>

            {/* Status */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-6">
              <h2 className="font-semibold text-foreground mb-4">Status</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active</span>
                  <Badge variant={product.isActive ? "success" : "error"}>{product.isActive ? "Active" : "Disabled"}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Stock</span>
                  <span className="text-sm font-semibold text-foreground">{totalStock}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Batches</span>
                  <span className="text-sm font-semibold text-foreground">{batches.length}</span>
                </div>
              </div>
            </motion.div>

            {/* Badges */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="glass-card rounded-2xl p-6">
              <h2 className="font-semibold text-foreground mb-4">Badges</h2>
              <div className="space-y-3">
                {(
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Yukizi Choice</span>
                      <Badge variant={product.isYukiziChoice ? "success" : "default"}>{product.isYukiziChoice ? "Yes" : "No"}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Best Seller</span>
                      <Badge variant={product.isBestSeller ? "success" : "default"}>{product.isBestSeller ? "Yes" : "No"}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Ad</span>
                      <Badge variant={product.isAd ? "success" : "default"}>{product.isAd ? "Yes" : "No"}</Badge>
                    </div>
                  </>
                )}
              </div>
            </motion.div>


            {/* Seller */}
            {product.seller && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-2xl p-6">
                <h2 className="font-semibold text-foreground mb-4">Listed By</h2>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">{product.seller?.sellerProfile?.companyName ?? product.seller?.name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{product.seller?.phone ?? "—"}</p>
                </div>
              </motion.div>
            )}

            {/* Discount */}
            {product.discountType && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl p-6">
                <h2 className="font-semibold text-foreground mb-4">Discount</h2>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Type</span>
                    <Badge variant="purple">{product.discountType}</Badge>
                  </div>
                  {product.discountValue && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Value</span>
                      <span className="text-sm font-semibold text-foreground">{product.discountValue}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Batches */}
        {batches.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-border/50">
              <h2 className="font-semibold text-foreground">Batches ({batches.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/20">
                    {["Batch No", "Stock", "MRP", "PTR", "Expiry", "Mfg Date"].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {batches.map((b: any, i: number) => {
                    const expiry = b.expiryDate ? new Date(b.expiryDate) : null;
                    const isExpired = expiry && expiry < new Date();
                    return (
                      <tr key={b.id || i} className="hover:bg-accent/30 transition-colors">
                        <td className="px-5 py-4 text-sm font-mono font-medium text-foreground">{b.batchNumber ?? "—"}</td>
                        <td className="px-5 py-4 text-sm text-foreground">{b.stock ?? 0}</td>
                        <td className="px-5 py-4 text-sm text-foreground">{formatCurrency(b.mrp ?? 0)}</td>
                        <td className="px-5 py-4 text-sm text-foreground">{b.ptr ? formatCurrency(b.ptr) : "—"}</td>
                        <td className={cn("px-5 py-4 text-sm", isExpired ? "text-red-500 font-medium" : "text-muted-foreground")}>
                          {expiry ? expiry.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                          {isExpired && " ⚠"}
                        </td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">
                          {b.mfgDate ? new Date(b.mfgDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>

      {/* Delete Modal */}
      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Product">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Are you sure you want to permanently delete <strong>{product.name}</strong>? This cannot be undone.</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} loading={deleteProduct.isPending}>Delete Product</Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground mt-0.5">{value || "—"}</dd>
    </div>
  );
}
