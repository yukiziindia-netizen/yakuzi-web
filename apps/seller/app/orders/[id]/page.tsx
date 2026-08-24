"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft, Package,
  Upload, FileText, CreditCard, AlertTriangle, Calculator
} from "lucide-react";
import { Button, Badge, OrderStatusBadge } from "@/components/ui";
import { formatCurrency, formatDate, calculatePricing } from "@yukizi/utils";
import {
  useSellerOrder, useAcceptSellerOrder, useRejectSellerOrder, useUpdateSellerOrderStatus,
  useUploadOrderDocument, useUpdateShippingDetails
} from "@/hooks/useSeller";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";



export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: order, isLoading } = useSellerOrder(id);
  const acceptOrder = useAcceptSellerOrder();
  const rejectOrder = useRejectSellerOrder();
  const uploadDoc = useUploadOrderDocument();
  const updateShipping = useUpdateShippingDetails();
  const updateStatus = useUpdateSellerOrderStatus();
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  const [shippingData, setShippingData] = useState({
    length: "", breadth: "", height: "", weight: "",
  });
  const [shippingFiles, setShippingFiles] = useState<Record<string, File | null>>({
    lengthImg: null, breadthImg: null, heightImg: null, weightImg: null
  });
  const [finalDocs, setFinalDocs] = useState<{ manifest: File | null; packedPicture: File | null }>({ manifest: null, packedPicture: null });
  const [isUploadingFinalDocs, setIsUploadingDocs] = useState(false);

  useEffect(() => {
    if (order) {
      const main = order.order || order.data || order;
      setShippingData({
        length: main.packageLength?.toString() || "",
        breadth: main.packageBreadth?.toString() || "",
        height: main.packageHeight?.toString() || "",
        weight: main.packageWeight?.toString() || "",
      });
    }
  }, [order]);

  if (isLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading order details...</div>;
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
        <p className="text-muted-foreground mb-4">Order not found</p>
        <button onClick={() => router.push("/orders")} className="text-sm text-primary underline">Back to Orders</button>
      </div>
    );
  }

  const mainOrder = order.order || order.data || order;
  const items: any[] = mainOrder.items ?? mainOrder.products ?? [];

  // Unpaid orders are visible to sellers (product decision, 2026-08-24) but
  // cannot be accepted/shipped — the backend rejects the shipping save too;
  // this just keeps the form honest instead of surfacing a server error.
  const paymentState = String(mainOrder.paymentStatus || "").toUpperCase();
  const isUnpaid = paymentState === "PENDING" || paymentState === "FAILED";

  const handleAccept = () => {
    acceptOrder.mutate(id, {
      onSuccess: () => toast.success("Order accepted"),
      onError: () => toast.error("Failed to accept order"),
    });
  };

  const handleReject = () => {
    if (!rejectReason.trim()) { toast.error("Please provide a reason"); return; }
    rejectOrder.mutate({ orderId: id, reason: rejectReason.trim() }, {
      onSuccess: () => { toast.success("Order rejected"); setShowRejectModal(false); },
      onError: () => toast.error("Failed to reject order"),
    });
  };

  const handleShippingSubmit = async () => {
    if (!shippingData.length || !shippingData.breadth || !shippingData.height || !shippingData.weight) {
      toast.error("Please enter all dimensions"); return;
    }
    const hasLengthImg = shippingFiles.lengthImg || mainOrder.lengthImage;
    const hasBreadthImg = shippingFiles.breadthImg || mainOrder.breadthImage;
    const hasHeightImg = shippingFiles.heightImg || mainOrder.heightImage;
    const hasWeightImg = shippingFiles.weightImg || mainOrder.weightImage;

    if (!hasLengthImg || !hasBreadthImg || !hasHeightImg || !hasWeightImg) {
      toast.error("All 4 dimension images are mandatory"); return;
    }

    const toastId = toast.loading("Uploading documents...");
    try {
      const urls: Record<string, string> = {};
      for (const [key, file] of Object.entries(shippingFiles)) {
        if (file) {
          const fd = new FormData();
          fd.append("file", file);
          const url = await uploadDoc.mutateAsync(fd);
          urls[key] = url;
        }
      }

      toast.loading("Saving shipping details...", { id: toastId });
      await updateShipping.mutateAsync({
        orderId: id,
        payload: {
          packageLength: parseFloat(shippingData.length),
          packageBreadth: parseFloat(shippingData.breadth),
          packageHeight: parseFloat(shippingData.height),
          packageWeight: parseFloat(shippingData.weight),
          ...(urls.lengthImg && { lengthImage: urls.lengthImg }),
          ...(urls.breadthImg && { breadthImage: urls.breadthImg }),
          ...(urls.heightImg && { heightImage: urls.heightImg }),
          ...(urls.weightImg && { weightImage: urls.weightImg }),
        }
      });
      toast.success("Shipping details saved successfully", { id: toastId });
    } catch (e: any) {
      toast.error(e?.message || "Failed to save shipping details", { id: toastId });
    }
  };

  const handleFinalDocsSubmit = async () => {
    if (!finalDocs.manifest && !mainOrder.manifestUrl) {
      toast.error("Manifest is required");
      return;
    }
    if (!finalDocs.packedPicture && !mainOrder.packedPictureUrl) {
      toast.error("Packed Picture is required");
      return;
    }
    setIsUploadingDocs(true);
    try {
      let finalManifestUrl = mainOrder.manifestUrl;
      if (finalDocs.manifest) {
        const manifestFd = new FormData();
        manifestFd.append("file", finalDocs.manifest);
        finalManifestUrl = await uploadDoc.mutateAsync(manifestFd);
      }

      let finalPackedPictureUrl = mainOrder.packedPictureUrl;
      if (finalDocs.packedPicture) {
        const packedFd = new FormData();
        packedFd.append("file", finalDocs.packedPicture);
        finalPackedPictureUrl = await uploadDoc.mutateAsync(packedFd);
      }

      await updateShipping.mutateAsync({
        orderId: id,
        payload: {
          manifestUrl: finalManifestUrl,
          packedPictureUrl: finalPackedPictureUrl
        }
      });
      toast.success("Final shipping documents uploaded successfully");
    } catch (e: any) {
      toast.error("Failed to upload documents");
    } finally {
      setIsUploadingDocs(false);
    }
  };

  const handleMarkAsShipped = () => {
    updateStatus.mutate({ orderId: id, status: "SHIPPED" }, {
      onSuccess: () => toast.success("Order marked as shipped"),
      onError: () => toast.error("Failed to update order status"),
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back */}
      <button onClick={() => router.push("/orders")} className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders
      </button>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Order #{mainOrder.orderNumber || id?.slice(0, 8).toUpperCase()}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Placed {formatDate(mainOrder.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          {/* Action buttons removed/moved */}
        </div>
      </motion.div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-border/50">
              <h2 className="font-semibold text-foreground">Items ({items.length})</h2>
            </div>
            <div className="divide-y divide-border/30">
              {items.map((item: any, i: number) => {
                const itemImage = 
                  (typeof item.image === 'string' ? item.image : item.image?.url) ||
                  (typeof item.product?.images?.[0] === 'string' ? item.product.images[0] : item.product?.images?.[0]?.url) ||
                  (typeof item.sellerOffer?.variant?.catalogProduct?.images?.[0] === 'string' ? item.sellerOffer.variant.catalogProduct.images[0] : item.sellerOffer?.variant?.catalogProduct?.images?.[0]?.url) ||
                  (typeof item.sellerOffer?.images?.[0] === 'string' ? item.sellerOffer.images[0] : item.sellerOffer?.images?.[0]?.url);

                const offer = item.sellerOffer || {};
                const product = offer.catalogProduct || item.product || {};
                
                const baseSellingPrice = Number(item.unitPrice || item.price || (offer.mrp ? Number(offer.mrp) - Number(offer.discount || 0) : 0));
                const finalShippingPrice = Number(offer.finalShippingPrice ?? offer.shippingCharges ?? 0);
                const itemQty = Number(item.quantity) || 1;
                const perUnitShipping = finalShippingPrice / itemQty;
                
                const productGstPercent = offer.gstPercent !== undefined ? Number(offer.gstPercent) : 0;
                const fallbackCommPct = Number(product.commissionPercent ?? product.category?.commissionPercent ?? offer.commissionPercent ?? 5);
                const fallbackCommGstPct = Number(product.commissionGstPercent ?? product.category?.commissionGstPercent ?? offer.commissionGstPercent ?? 18);

                const pricing = calculatePricing(
                  baseSellingPrice,
                  productGstPercent,
                  {
                    type: 'none',
                    isTaxIncluded: true,
                    shippingCharges: perUnitShipping,
                    shippingGstPercent: 0,
                    buy: 1
                  },
                  {
                    commissionPercent: fallbackCommPct,
                    commissionGstPercent: fallbackCommGstPct,
                    fixedFee: 0,
                    fixedFeeGstPercent: 18,
                    shippingGstPercent: 0
                  }
                );

                const totalItemPrice = Number(item.totalPrice ?? ((item.unitPrice || item.price || 0) * itemQty));

                const payout = item.estimatedPayout || (item.settlement ? {
                  grossAmount: Number(item.settlement.grossAmount || totalItemPrice),
                  commission: Number(item.settlement.commission || 0),
                  commissionGst: Number(item.settlement.commissionGst || 0),
                  finalShippingPrice: perUnitShipping * itemQty,
                  netPayout: Number(item.settlement.netPayout || item.settlement.amount || 0),
                  commissionPercent: Number(product.commissionPercent ?? 0),
                  commissionGstPercent: Number(product.commissionGstPercent ?? 18),
                } : null);

                const itemCommission = payout ? payout.commission : (pricing.commissionAmount * itemQty);
                const itemCommissionGst = payout ? payout.commissionGst : (pricing.commissionGstAmount * itemQty);
                const itemShipping = payout ? payout.finalShippingPrice : (perUnitShipping * itemQty);
                const itemNetPayout = payout ? payout.netPayout : (pricing.sellerPayout * itemQty);
                const commissionPercent = payout?.commissionPercent ?? fallbackCommPct;
                const commissionGstPercent = payout?.commissionGstPercent ?? fallbackCommGstPct;

                return (
                <div key={i} className="p-5 space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                      {itemImage ? (
                        <img src={itemImage} alt={item.product?.name || item.name || item.productName || item.sellerOffer?.name} className="h-14 w-14 rounded-xl object-cover" />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.product?.name || item.name || item.productName || item.sellerOffer?.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.sellerOffer?.variant?.name && <span>Variant: {item.sellerOffer.variant.name} </span>}
                        {(item.sellerOffer?.variant?.sku || item.sellerOffer?.sku) && <span>(SKU: {item.sellerOffer.variant?.sku || item.sellerOffer?.sku})</span>}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">Qty: {item.quantity} × {formatCurrency(item.unitPrice || item.price || 0)}</p>
                      {item.discount > 0 && <p className="text-xs text-green-600">Discount: {item.discount}%</p>}
                    </div>
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(totalItemPrice)}</p>
                  </div>

                  {/* Estimated Payout Section for Product */}
                  <div className="pt-3 border-t border-border/40 bg-accent/20 dark:bg-accent/10 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                        <Calculator className="h-3.5 w-3.5 text-primary" />
                        <span>Estimated Payout Breakdown</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/40">
                        Net Payout: {formatCurrency(itemNetPayout)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs pt-1">
                      <div className="bg-background/80 p-2 rounded-lg border border-border/30">
                        <span className="text-[10px] text-muted-foreground block font-medium">Selling Price</span>
                        <span className="font-semibold text-foreground">{formatCurrency(totalItemPrice)}</span>
                      </div>
                      <div className="bg-background/80 p-2 rounded-lg border border-border/30">
                        <span className="text-[10px] text-muted-foreground block font-medium">Platform Fee ({commissionPercent}%)</span>
                        <span className="font-semibold text-red-500">-{formatCurrency(itemCommission)}</span>
                      </div>
                      <div className="bg-background/80 p-2 rounded-lg border border-border/30">
                        <span className="text-[10px] text-muted-foreground block font-medium">GST on Fee ({commissionGstPercent}%)</span>
                        <span className="font-semibold text-red-500">-{formatCurrency(itemCommissionGst)}</span>
                      </div>
                      <div className="bg-background/80 p-2 rounded-lg border border-border/30">
                        <span className="text-[10px] text-muted-foreground block font-medium">Shipping</span>
                        <span className="font-semibold text-red-500">-{formatCurrency(itemShipping)}</span>
                      </div>
                      <div className="bg-emerald-50/80 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-200/60 dark:border-emerald-800/40 col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block font-bold">Est. Payout</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(itemNetPayout)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
              {items.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">No items found</div>
              )}
            </div>
            {/* Totals */}
            {(() => {
              let totalCommission = 0;
              let totalCommissionGst = 0;
              let totalShipping = 0;
              let totalNetPayout = 0;

              items.forEach((item: any) => {
                const offer = item.sellerOffer || {};
                const product = offer.catalogProduct || item.product || {};
                const baseSellingPrice = Number(item.unitPrice || item.price || (offer.mrp ? Number(offer.mrp) - Number(offer.discount || 0) : 0));
                const itemQty = Number(item.quantity) || 1;
                const perUnitShipping = Number(offer.finalShippingPrice ?? offer.shippingCharges ?? 0) / itemQty;

                const payout = item.estimatedPayout || (item.settlement ? {
                  commission: Number(item.settlement.commission || 0),
                  commissionGst: Number(item.settlement.commissionGst || 0),
                  finalShippingPrice: Number(offer.finalShippingPrice ?? offer.shippingCharges ?? 0),
                  netPayout: Number(item.settlement.netPayout || item.settlement.amount || 0),
                } : null);

                if (payout) {
                  totalCommission += payout.commission;
                  totalCommissionGst += payout.commissionGst;
                  totalShipping += payout.finalShippingPrice;
                  totalNetPayout += payout.netPayout;
                } else {
                  const productGstPercent = offer.gstPercent !== undefined ? Number(offer.gstPercent) : 0;
                  const commissionPercent = Number(product.commissionPercent ?? product.category?.commissionPercent ?? offer.commissionPercent ?? 5);
                  const commissionGstPercent = Number(product.commissionGstPercent ?? product.category?.commissionGstPercent ?? offer.commissionGstPercent ?? 18);
                  const fixedFee = Number(product.fixedFee ?? product.category?.fixedFee ?? 0);
                  const fixedFeeGstPercent = Number(product.fixedFeeGstPercent ?? product.category?.fixedFeeGstPercent ?? 18);

                  const pricing = calculatePricing(
                    baseSellingPrice,
                    productGstPercent,
                    { type: 'none', isTaxIncluded: true, shippingCharges: perUnitShipping, shippingGstPercent: 0, buy: 1 },
                    { commissionPercent, commissionGstPercent, fixedFee, fixedFeeGstPercent, shippingGstPercent: 0 }
                  );

                  totalCommission += pricing.commissionAmount * itemQty;
                  totalCommissionGst += pricing.commissionGstAmount * itemQty;
                  totalShipping += perUnitShipping * itemQty;
                  totalNetPayout += pricing.sellerPayout * itemQty;
                }
              });

              const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 1) * (Number(item.unitPrice) || Number(item.price) || 0), 0);
              const grandTotal = subtotal + (Number(mainOrder.gstAmount) || 0);

              return (
                <div className="p-5 border-t border-border/50 space-y-2 bg-muted/10">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="text-foreground">{formatCurrency(subtotal)}</span></div>
                  {mainOrder.gstAmount != null && <div className="flex justify-between text-sm"><span className="text-muted-foreground">GST</span><span className="text-foreground">{formatCurrency(Number(mainOrder.gstAmount))}</span></div>}
                  <div className="flex justify-between text-sm text-red-500"><span>Platform Fees & Taxes</span><span>-{formatCurrency(totalCommission + totalCommissionGst)}</span></div>
                  <div className="flex justify-between text-sm text-red-500"><span>Total Shipping (Deducted)</span><span>-{formatCurrency(totalShipping)}</span></div>
                  <div className="flex justify-between text-sm font-semibold text-emerald-600 dark:text-emerald-400"><span>Total Estimated Payout</span><span className="font-bold">{formatCurrency(totalNetPayout)}</span></div>
                  <div className="flex justify-between text-base font-semibold pt-2 border-t border-border/30"><span>Total Order Amount</span><span>{formatCurrency(grandTotal)}</span></div>
                </div>
              );
            })()}
          </motion.div>

          {/* Shipping & Fulfillment */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl overflow-hidden p-5 space-y-4">
            <div className="border-b border-border/50 pb-4">
              <h2 className="font-semibold text-foreground flex items-center gap-2"><Package className="h-4 w-4 text-primary" />Shipping & Fulfillment</h2>
              <p className="text-sm text-muted-foreground mt-1">Enter dimensions and upload mandatory images before marking the order as shipped.</p>
            </div>

            {/* The admin lock hides every input in this card. Without this notice the
                section just renders blank and the seller has no way to tell whether
                something is missing or whether they are simply not allowed to edit. */}
            {isUnpaid && (
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-3">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Awaiting payment</p>
                  <p className="text-xs text-amber-700/80 dark:text-amber-400/80">
                    The buyer hasn't completed payment for this order yet. Shipping details unlock automatically once payment is received — do not pack or ship before then.
                  </p>
                </div>
              </div>
            )}

            {mainOrder.isShippingLocked && (
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-3">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Shipping is locked by the admin</p>
                  <p className="text-xs text-amber-700/80 dark:text-amber-400/80">
                    Package dimensions and their proof images are read-only, so the shipping label stays valid. You can still upload your final manifest and packed picture below.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Length (cm)</label>
                <input type="number" step="0.01" className="w-full bg-background border border-input rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none disabled:opacity-50" value={shippingData.length} onChange={(e) => setShippingData({...shippingData, length: e.target.value})} disabled={mainOrder.isShippingLocked || isUnpaid} placeholder={mainOrder.packageLength?.toString() || "0"} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Breadth (cm)</label>
                <input type="number" step="0.01" className="w-full bg-background border border-input rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none disabled:opacity-50" value={shippingData.breadth} onChange={(e) => setShippingData({...shippingData, breadth: e.target.value})} disabled={mainOrder.isShippingLocked || isUnpaid} placeholder={mainOrder.packageBreadth?.toString() || "0"} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Height (cm)</label>
                <input type="number" step="0.01" className="w-full bg-background border border-input rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none disabled:opacity-50" value={shippingData.height} onChange={(e) => setShippingData({...shippingData, height: e.target.value})} disabled={mainOrder.isShippingLocked || isUnpaid} placeholder={mainOrder.packageHeight?.toString() || "0"} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Weight (kg)</label>
                <input type="number" step="0.01" className="w-full bg-background border border-input rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none disabled:opacity-50" value={shippingData.weight} onChange={(e) => setShippingData({...shippingData, weight: e.target.value})} disabled={mainOrder.isShippingLocked || isUnpaid} placeholder={mainOrder.packageWeight?.toString() || "0"} />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-medium text-foreground">Dimension Proofs (Mandatory)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { key: 'lengthImg', label: 'Length Proof' },
                  { key: 'breadthImg', label: 'Breadth Proof' },
                  { key: 'heightImg', label: 'Height Proof' },
                  { key: 'weightImg', label: 'Weight Proof' }
                ].map(f => (
                  <div key={f.key} className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground block">{f.label}</label>
                    <div className="space-y-2">
                      {(mainOrder as any)[f.key.replace('Img', 'Image')] ? (
                         <a href={(mainOrder as any)[f.key.replace('Img', 'Image')]} target="_blank" className="text-xs text-primary underline block">View Uploaded</a>
                      ) : (
                         <span className="text-xs text-muted-foreground block">Not uploaded</span>
                      )}
                      {!mainOrder.isShippingLocked && !isUnpaid && (
                        <input type="file" accept="image/*" onChange={(e) => setShippingFiles(p => ({...p, [f.key]: e.target.files?.[0] || null}))} className="text-xs block w-full file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-primary/10 file:text-primary hover:file:bg-primary/20 disabled:opacity-50" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-medium text-foreground">Shipping Documents</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground block">Shipping Label</label>
                  {mainOrder.adminShippingLabelUrl ? (
                     <a href={mainOrder.adminShippingLabelUrl} target="_blank" className="text-xs text-primary underline">Download Label</a>
                  ) : (
                    <span className="text-xs text-muted-foreground">Pending from admin</span>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground block">Admin Invoice</label>
                  {mainOrder.adminInvoiceUrl ? (
                     <a href={mainOrder.adminInvoiceUrl} target="_blank" className="text-xs text-primary underline">Download Admin Invoice</a>
                  ) : (
                    <span className="text-xs text-muted-foreground">Pending from admin</span>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground block">Manifest</label>
                  {mainOrder.manifestUrl ? (
                     <a href={mainOrder.manifestUrl} target="_blank" className="text-xs text-primary underline">Download Manifest</a>
                  ) : (
                    <span className="text-xs text-muted-foreground">Uploaded with Final Docs</span>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground block">Seller Invoice</label>
                  {mainOrder.invoiceUrl ? (
                     <a href={mainOrder.invoiceUrl} target="_blank" className="text-xs text-primary underline">Download Seller Invoice</a>
                  ) : (
                    <span className="text-xs text-muted-foreground">Pending from admin</span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-6 border-t border-border/50">
              <h3 className="text-sm font-medium text-foreground">Tax Invoice</h3>
              <p className="text-xs text-muted-foreground">
                The GST tax invoice generated for the customer on this order — separate from the shipping documents above.
              </p>
              <Link
                href={`/orders/${id}/invoice`}
                className="text-xs font-semibold text-primary underline underline-offset-2"
              >
                View / download tax invoice
              </Link>
            </div>

            {!mainOrder.isShippingLocked && !isUnpaid && (
              <div className="pt-4 flex justify-end">
                <Button size="sm" onClick={handleShippingSubmit} loading={updateShipping.isPending}>
                  Save Shipping Details
                </Button>
              </div>
            )}

            {/* Final Shipping Documents */}
            <div className="space-y-3 pt-6 border-t border-border/50">
              <h3 className="text-sm font-medium text-foreground">Final Shipping Documents</h3>
              <p className="text-xs text-muted-foreground">Upload the final manifest and a picture of the packed box. These will be visible to the admin.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground block">Manifest</label>
                  <div className="space-y-2">
                    {/* NOTE: manifestUrl is a single shared column also written by the
                        admin document upload, so this link is not necessarily the
                        seller's own file. Labelled neutrally until the two are split. */}
                    {mainOrder.manifestUrl ? (
                      <a href={mainOrder.manifestUrl} target="_blank" className="text-xs text-primary underline block">View current manifest</a>
                    ) : (
                      <span className="text-xs text-muted-foreground block">Not uploaded</span>
                    )}
                    {/* Deliberately NOT gated on isShippingLocked: the manifest is
                        produced after the admin locks and issues the label. */}
                    <input type="file" accept="application/pdf,image/*" onChange={(e) => setFinalDocs(p => ({...p, manifest: e.target.files?.[0] || null}))} className="text-xs block w-full file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground block">Packed Picture</label>
                  <div className="space-y-2">
                    {mainOrder.packedPictureUrl ? (
                      <a href={mainOrder.packedPictureUrl} target="_blank" className="text-xs text-primary underline block">View Uploaded Picture</a>
                    ) : (
                      <span className="text-xs text-muted-foreground block">Not uploaded</span>
                    )}
                    {/* Deliberately NOT gated on isShippingLocked: the box is packed
                        and photographed after the admin locks and issues the label. */}
                    <input type="file" accept="image/*" onChange={(e) => setFinalDocs(p => ({...p, packedPicture: e.target.files?.[0] || null}))} className="text-xs block w-full file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                  </div>
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <Button size="sm" variant="outline" onClick={handleFinalDocsSubmit} loading={isUploadingFinalDocs}>
                  Upload Final Documents
                </Button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          {/* Payment Info */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-2xl p-5 space-y-3">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" />Payment</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                {items.some(it => it.settlement?.paymentProofUrl) ? (
                  <Badge variant="success">PAID</Badge>
                ) : (
                  <Badge variant={String(mainOrder.paymentStatus || "PENDING").toUpperCase() === "PAID" || String(mainOrder.paymentStatus).toUpperCase() === "SUCCESS" ? "success" : String(mainOrder.paymentStatus).toUpperCase() === "PENDING" ? "warning" : "error"}>
                    {mainOrder.paymentStatus || "PENDING"}
                  </Badge>
                )}
              </div>

              {mainOrder.payments?.[0]?.proofUrl && (
                <div className="pt-2 border-t border-border/10 mt-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 leading-none font-sans">Verification Proof</p>
                  <a 
                    href={mainOrder.payments[0].proofUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-primary underline hover:text-primary/80 flex items-center gap-1.5 font-medium"
                  >
                    <FileText className="h-3 w-3" />
                    View Buyer's Proof
                  </a>
                </div>
              )}

              {/* Admin Payout Proof */}
              {items.find(it => it.settlement?.paymentProofUrl) && (
                <div className="pt-2 border-t border-border/10 mt-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 leading-none font-sans text-green-600">Admin Payout Proof</p>
                  <a 
                    href={items.find(it => it.settlement?.paymentProofUrl).settlement.paymentProofUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-green-600 underline hover:text-green-700 flex items-center gap-1.5 font-medium"
                  >
                    <Upload className="h-3 w-3" />
                    View Admin's Payout Proof
                  </a>
                </div>
              )}
              {mainOrder.paymentMethod && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Method</span>
                  <span className="text-foreground">{mainOrder.paymentMethod}</span>
                </div>
              )}
              {mainOrder.paidAmount != null && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="text-foreground font-medium">{formatCurrency(mainOrder.paidAmount)}</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowRejectModal(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md glass-card rounded-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-red-500" /></div>
              <div><h3 className="font-semibold text-foreground">Reject Order</h3><p className="text-xs text-muted-foreground">This action cannot be undone</p></div>
            </div>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowRejectModal(false)}>Cancel</Button>
              <Button variant="danger" size="sm" loading={rejectOrder.isPending} onClick={handleReject}>Reject Order</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
