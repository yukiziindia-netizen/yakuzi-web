"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
    if (!shippingFiles.lengthImg || !shippingFiles.breadthImg || !shippingFiles.heightImg || !shippingFiles.weightImg) {
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
          lengthImage: urls.lengthImg,
          breadthImage: urls.breadthImg,
          heightImage: urls.heightImg,
          weightImage: urls.weightImg,
        }
      });
      toast.success("Shipping details saved successfully", { id: toastId });
    } catch (e: any) {
      toast.error(e?.message || "Failed to save shipping details", { id: toastId });
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
              {items.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-4 p-5">
                  <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                    {item.product?.images?.[0]?.url || item.image || item.sellerOffer?.images?.[0] || item.sellerOffer?.variant?.catalogProduct?.images?.[0]?.url ? (
                      <img src={item.product?.images?.[0]?.url || item.image || item.sellerOffer?.images?.[0] || item.sellerOffer?.variant?.catalogProduct?.images?.[0]?.url} alt={item.product?.name || item.name || item.productName || item.sellerOffer?.name} className="h-14 w-14 rounded-xl object-cover" />
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
                    {item.discount && <p className="text-xs text-green-600">Discount: {item.discount}</p>}
                  </div>
                  <p className="text-sm font-semibold text-foreground">{formatCurrency((item.quantity || 1) * (item.unitPrice || item.price || 0))}</p>
                </div>
              ))}
              {items.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">No items found</div>
              )}
            </div>
            {/* Totals */}
            <div className="p-5 border-t border-border/50 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="text-foreground">{formatCurrency(items.reduce((sum, item) => sum + (item.quantity || 1) * (item.unitPrice || item.price || 0), 0))}</span></div>
              {mainOrder.gstAmount != null && <div className="flex justify-between text-sm"><span className="text-muted-foreground">GST</span><span className="text-foreground">{formatCurrency(mainOrder.gstAmount)}</span></div>}
              <div className="flex justify-between text-base font-semibold pt-2 border-t border-border/30"><span>Total</span><span>{formatCurrency(items.reduce((sum, item) => sum + (item.quantity || 1) * (item.unitPrice || item.price || 0), 0) + (mainOrder.gstAmount || 0))}</span></div>
            </div>
          </motion.div>

          {/* Shipping & Fulfillment */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl overflow-hidden p-5 space-y-4">
            <div className="border-b border-border/50 pb-4">
              <h2 className="font-semibold text-foreground flex items-center gap-2"><Package className="h-4 w-4 text-primary" />Shipping & Fulfillment</h2>
              <p className="text-sm text-muted-foreground mt-1">Enter dimensions and upload mandatory images before marking the order as shipped.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Length (cm)</label>
                <input type="number" step="0.01" className="w-full bg-background border border-input rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none" value={shippingData.length} onChange={(e) => setShippingData({...shippingData, length: e.target.value})} disabled={!!mainOrder.packageLength} placeholder={mainOrder.packageLength?.toString() || "0"} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Breadth (cm)</label>
                <input type="number" step="0.01" className="w-full bg-background border border-input rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none" value={shippingData.breadth} onChange={(e) => setShippingData({...shippingData, breadth: e.target.value})} disabled={!!mainOrder.packageBreadth} placeholder={mainOrder.packageBreadth?.toString() || "0"} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Height (cm)</label>
                <input type="number" step="0.01" className="w-full bg-background border border-input rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none" value={shippingData.height} onChange={(e) => setShippingData({...shippingData, height: e.target.value})} disabled={!!mainOrder.packageHeight} placeholder={mainOrder.packageHeight?.toString() || "0"} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Weight (kg)</label>
                <input type="number" step="0.01" className="w-full bg-background border border-input rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none" value={shippingData.weight} onChange={(e) => setShippingData({...shippingData, weight: e.target.value})} disabled={!!mainOrder.packageWeight} placeholder={mainOrder.packageWeight?.toString() || "0"} />
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
                    {(mainOrder as any)[f.key.replace('Img', 'Image')] ? (
                       <a href={(mainOrder as any)[f.key.replace('Img', 'Image')]} target="_blank" className="text-xs text-primary underline">View Uploaded</a>
                    ) : (
                      <input type="file" accept="image/*" onChange={(e) => setShippingFiles(p => ({...p, [f.key]: e.target.files?.[0] || null}))} className="text-xs block w-full file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                    )}
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
                    <span className="text-xs text-muted-foreground">Pending from admin</span>
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

            {(!mainOrder.packageLength || !mainOrder.lengthImage) && (
              <div className="pt-4 flex justify-end">
                <Button size="sm" onClick={handleShippingSubmit} loading={updateShipping.isPending}>
                  Save Shipping Details
                </Button>
              </div>
            )}
          </motion.div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">

          {/* Estimated Calculation */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card rounded-2xl p-5 space-y-3">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              Estimated Payout Breakdown
            </h3>
            
            {(() => {
              const firstItem = items[0] || {};
              const displayProductGstPercent = firstItem.sellerOffer?.gstPercent !== undefined ? Number(firstItem.sellerOffer.gstPercent) : 0;
              const displayCommissionPercent = firstItem.sellerOffer?.variant?.catalogProduct?.commissionPercent ? Number(firstItem.sellerOffer.variant.catalogProduct.commissionPercent) : 5;
              const displayCommissionGstPercent = firstItem.sellerOffer?.variant?.catalogProduct?.commissionGstPercent ? Number(firstItem.sellerOffer.variant.catalogProduct.commissionGstPercent) : 18;

              const est = items.reduce((acc, item) => {
                const qty = item.quantity || 1;
                
                const mrp = item.sellerOffer?.mrp ? Number(item.sellerOffer.mrp) : 0;
                const gstPercent = item.sellerOffer?.gstPercent !== undefined ? Number(item.sellerOffer.gstPercent) : 0;
                const shippingCharges = item.sellerOffer?.finalShippingPrice ? Number(item.sellerOffer.finalShippingPrice) : (item.sellerOffer?.shippingCharges ? Number(item.sellerOffer.shippingCharges) : 0);
                
                const discountDetails = item.sellerOffer?.discountMeta || {};
                const mappedDiscount = {
                  ...discountDetails,
                  type: item.sellerOffer?.discountType || discountDetails.type || 'none',
                  isTaxIncluded: item.sellerOffer?.isTaxIncluded || false,
                  shippingCharges,
                  shippingGstPercent: 0
                };
                
                const platformFees = {
                  commissionPercent: item.sellerOffer?.variant?.catalogProduct?.commissionPercent ? Number(item.sellerOffer.variant.catalogProduct.commissionPercent) : 5, // fallback to 5% if missing for display
                  commissionGstPercent: item.sellerOffer?.variant?.catalogProduct?.commissionGstPercent ? Number(item.sellerOffer.variant.catalogProduct.commissionGstPercent) : 18
                };
                
                const pricing = calculatePricing(mrp, gstPercent, mappedDiscount, platformFees);

                return {
                  customerFinalPrice: acc.customerFinalPrice + (pricing.finalCustomerPayable * qty),
                  commission: acc.commission + (pricing.commissionAmount * qty),
                  commissionGst: acc.commissionGst + (pricing.commissionGstAmount * qty),
                  productGst: acc.productGst + (pricing.productGstAmount * qty),
                  shipping: acc.shipping + (shippingCharges * qty),
                  netPayout: acc.netPayout + (pricing.sellerPayout * qty)
                };
              }, { customerFinalPrice: 0, commission: 0, commissionGst: 0, productGst: 0, shipping: 0, netPayout: 0 });

              return (
                <div className="space-y-2 mt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Customer Final Price</span>
                    <span className="text-foreground">{formatCurrency(est.customerFinalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Platform Commission ({displayCommissionPercent}%)</span>
                    <span className="text-red-500">-{formatCurrency(est.commission)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">GST on Fees ({displayCommissionGstPercent}%)</span>
                    <span className="text-red-500">-{formatCurrency(est.commissionGst)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Product GST (to remit) ({displayProductGstPercent}%)</span>
                    <span className="text-red-500">-{formatCurrency(est.productGst)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping (Deducted)</span>
                    <span className="text-red-500">-{formatCurrency(est.shipping)}</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold pt-2 border-t border-border/30">
                    <span className="text-primary">Estimated Payout</span>
                    <span className="text-primary">{formatCurrency(est.netPayout)}</span>
                  </div>
                </div>
              );
            })()}
          </motion.div>

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
