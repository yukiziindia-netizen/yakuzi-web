"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Package, Truck, CheckCircle, XCircle, Clock, CreditCard, FileText, User, MapPin, Phone, Building2, Mail, ExternalLink, Navigation, Calculator, RefreshCw, Loader2 } from "lucide-react";


import { AdminLayout } from "@/components/layout/admin-layout";
import { Button, Badge, Modal, Input, Skeleton } from "@/components/ui";
import { formatCurrency, calculatePricing } from "@yukizi/utils";
import { cn } from "@/lib/utils";
import { useOrderById, useUpdateAdminOrderStatus, useCancelOrder, useUpdateAdminShippingDocs, useUploadAdminOrderDocument, useOrderTracking } from "@/hooks/useAdmin";
import toast from "react-hot-toast";

const ORDER_STATUSES = [
  { key: "PLACED", label: "Placed", icon: Clock, color: "bg-yellow-500" },
  { key: "ACCEPTED", label: "Accepted", icon: CheckCircle, color: "bg-blue-500" },
  { key: "READY_TO_SHIP", label: "Ready to Ship", icon: Package, color: "bg-cyan-500" },
  { key: "DISPATCHED_FROM_SELLER", label: "Dispatched", icon: Package, color: "bg-orange-500" },
  { key: "SHIPPED", label: "Shipped", icon: Truck, color: "bg-indigo-500" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: Package, color: "bg-purple-500" },
  { key: "DELIVERED", label: "Delivered", icon: CheckCircle, color: "bg-green-500" },
];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: order, isLoading } = useOrderById(id);
  const { data: tracking, isLoading: isTrackingLoading, isFetching: isTrackingFetching, isError: isTrackingError, refetch: refetchTracking } = useOrderTracking(id, !!order?.shiprocketOrderId);
  const updateStatus = useUpdateAdminOrderStatus();
  const cancelOrder = useCancelOrder();
  
  const updateShippingDocs = useUpdateAdminShippingDocs();
  const uploadDoc = useUploadAdminOrderDocument();
  
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [adminFiles, setAdminFiles] = useState<Record<string, {
    label: File | null;
    invoice: File | null;
    manifest: File | null;
    sellerInvoice: File | null;
  }>>({});
  const [isUploadingDocs, setIsUploadingDocs] = useState(false);

  const handleStatusUpdate = async (status: string) => {
    try {
      await updateStatus.mutateAsync({ orderId: id, status });
      toast.success(`Order updated to ${status}`);
    } catch {
      toast.error("Failed to update order status");
    }
  };

  const handleCancel = async () => {
    try {
      await cancelOrder.mutateAsync({ orderId: id, reason: cancelReason });
      toast.success("Order cancelled");
      setShowCancelModal(false);
    } catch {
      toast.error("Failed to cancel order");
    }
  };

  const handleAdminDocsSubmit = async (sellerId: string, sellerGroup: any) => {
    try {
      setIsUploadingDocs(true);
      const filesForSeller = adminFiles[sellerId] || { label: null, invoice: null, manifest: null, sellerInvoice: null };
      let labelUrl = sellerGroup.adminShippingLabelUrl;
      let invoiceUrl = sellerGroup.adminInvoiceUrl;
      let manifestUrl = sellerGroup.manifestUrl;
      let sellerInvoiceUrl = sellerGroup.invoiceUrl;

      if (filesForSeller.label) {
        labelUrl = await uploadDoc.mutateAsync(filesForSeller.label);
      }
      if (filesForSeller.invoice) {
        invoiceUrl = await uploadDoc.mutateAsync(filesForSeller.invoice);
      }
      if (filesForSeller.manifest) {
        manifestUrl = await uploadDoc.mutateAsync(filesForSeller.manifest);
      }
      if (filesForSeller.sellerInvoice) {
        sellerInvoiceUrl = await uploadDoc.mutateAsync(filesForSeller.sellerInvoice);
      }

      await updateShippingDocs.mutateAsync({
        orderId: id,
        payload: { 
          adminShippingLabelUrl: labelUrl, 
          adminInvoiceUrl: invoiceUrl,
          manifestUrl,
          invoiceUrl: sellerInvoiceUrl,
          sellerId
        }
      });

      toast.success("Shipping documents uploaded successfully");
      setAdminFiles(prev => ({
        ...prev,
        [sellerId]: { label: null, invoice: null, manifest: null, sellerInvoice: null }
      }));
    } catch {
      toast.error("Failed to upload shipping documents");
    } finally {
      setIsUploadingDocs(false);
    }
  };

  const handleShippingLockToggle = async (sellerId: string, currentLockStatus: boolean) => {
    try {
      await updateShippingDocs.mutateAsync({
        orderId: id,
        payload: { 
          isShippingLocked: !currentLockStatus,
          sellerId
        }
      });
      toast.success(currentLockStatus ? "Shipping details unlocked" : "Shipping details locked");
    } catch {
      toast.error("Failed to toggle shipping lock");
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-48 lg:col-span-2" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold">Order not found</p>
            <Button variant="ghost" onClick={() => router.push("/orders")} className="mt-4">Back to Orders</Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Normalize legacy status values from backend
  const normalizeStatus = (s: string) => {
    // PAYMENT_RECEIVED ("Paid") and RECEIVED_AT_WAREHOUSE ("At Warehouse")
    // were removed from the pipeline; legacy orders still in them render at
    // the nearest surviving step.
    const map: Record<string, string> = {
      CONFIRMED: "ACCEPTED",
      PROCESSING: "ACCEPTED",
      TRANSIT: "SHIPPED",
      PAYMENT_RECEIVED: "ACCEPTED",
      RECEIVED_AT_WAREHOUSE: "DISPATCHED_FROM_SELLER",
    };
    return map[s] ?? s;
  };
  const normalizedStatus = normalizeStatus(order.orderStatus);
  const currentStatusIdx = ORDER_STATUSES.findIndex(s => s.key === normalizedStatus);
  const items: any[] = order.items ?? order.orderItems ?? [];
  const isCancelled = order.orderStatus === "CANCELLED";
  // Self-ship orders are fulfilled by the seller's own courier: no Shiprocket
  // push, no label/manifest/invoice uploads — just the seller's tracking link.
  const isSelfShip = order.fulfillmentMode === "self_ship";

  const itemsBySeller = order ? order.items.reduce((acc: any, item: any) => {
    const sId = item.sellerId;
    if (!acc[sId]) {
      acc[sId] = {
        seller: item.seller,
        items: [],
        packageLength: item.packageLength,
        packageBreadth: item.packageBreadth,
        packageHeight: item.packageHeight,
        packageWeight: item.packageWeight,
        lengthImage: item.lengthImage,
        breadthImage: item.breadthImage,
        heightImage: item.heightImage,
        weightImage: item.weightImage,
        invoiceUrl: item.invoiceUrl,
        manifestUrl: item.manifestUrl,
        adminShippingLabelUrl: item.adminShippingLabelUrl,
        adminInvoiceUrl: item.adminInvoiceUrl,
        packedPictureUrl: item.packedPictureUrl,
        isShippingLocked: item.isShippingLocked,
      };
    }
    acc[sId].items.push(item);
    if (item.packageLength && !acc[sId].packageLength) {
      acc[sId].packageLength = item.packageLength;
      acc[sId].packageBreadth = item.packageBreadth;
      acc[sId].packageHeight = item.packageHeight;
      acc[sId].packageWeight = item.packageWeight;
      acc[sId].lengthImage = item.lengthImage;
      acc[sId].breadthImage = item.breadthImage;
      acc[sId].heightImage = item.heightImage;
      acc[sId].weightImage = item.weightImage;
      acc[sId].invoiceUrl = item.invoiceUrl;
      acc[sId].manifestUrl = item.manifestUrl;
      acc[sId].adminShippingLabelUrl = item.adminShippingLabelUrl;
      acc[sId].adminInvoiceUrl = item.adminInvoiceUrl;
      acc[sId].packedPictureUrl = item.packedPictureUrl;
      acc[sId].isShippingLocked = item.isShippingLocked;
    }
    return acc;
  }, {}) : {};

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/orders")} className="h-9 w-9 rounded-xl bg-accent/60 flex items-center justify-center hover:bg-accent transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="font-semibold text-2xl text-foreground flex items-center gap-2.5">
                Order #{order.id?.slice(0, 8).toUpperCase()}
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                  isSelfShip
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    : "bg-primary/10 text-primary border-primary/30",
                )}>
                  {isSelfShip ? "Self Ship" : "Shiprocket"}
                </span>
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Placed on {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isCancelled && order.orderStatus !== "DELIVERED" && (
              <Button size="sm" variant="danger" onClick={() => setShowCancelModal(true)} leftIcon={<XCircle className="h-4 w-4" />}>Cancel Order</Button>
            )}
          </div>
        </div>

        {/* Status Timeline */}
        {!isCancelled && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6">
            <h2 className="font-semibold text-foreground mb-6">Order Status</h2>
            <div className="flex items-center justify-between relative">
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-border" />
              <div className="absolute top-4 left-0 h-0.5 bg-primary transition-all" style={{ width: `${(currentStatusIdx / (ORDER_STATUSES.length - 1)) * 100}%` }} />
              {ORDER_STATUSES.map(({ key, label, icon: Icon, color }, idx) => {
                const done = idx <= currentStatusIdx;
                const isCurrent = idx === currentStatusIdx;
                const isNext = idx === currentStatusIdx + 1;
                return (
                  <div key={key} className="relative flex flex-col items-center z-10">
                    <div className={cn("h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all",
                      done ? `${color} border-transparent text-white` : "bg-background border-border text-muted-foreground",
                      isNext && "cursor-pointer hover:border-primary hover:text-primary")}
                      onClick={isNext ? () => handleStatusUpdate(key) : undefined}
                      title={isNext ? `Advance to ${label}` : undefined}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className={cn("text-xs mt-2 font-medium", done ? "text-foreground" : "text-muted-foreground")}>{label}</span>
                    {isCurrent && <span className="text-[10px] text-primary font-semibold mt-0.5">Current</span>}
                    {isNext && <span className="text-[10px] text-primary font-semibold mt-0.5 cursor-pointer" onClick={() => handleStatusUpdate(key)}>Click to advance →</span>}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {isCancelled && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-6 border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3">
              <XCircle className="h-6 w-6 text-red-500" />
              <div>
                <h2 className="font-semibold text-red-600 dark:text-red-400">Order Cancelled</h2>
                {order.cancelReason && <p className="text-sm text-muted-foreground mt-1">Reason: {order.cancelReason}</p>}
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Items */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl overflow-hidden lg:col-span-2">
            <div className="p-6 border-b border-border/50">
              <h2 className="font-semibold text-foreground">Items ({items.length})</h2>
            </div>
            <div className="divide-y divide-border/30">
              {items.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">No items</div>
              ) : items.map((item: any, i: number) => {
                const itemImage = 
                  (typeof item.image === 'string' ? item.image : item.image?.url) ||
                  (typeof item.product?.images?.[0] === 'string' ? item.product.images[0] : item.product?.images?.[0]?.url) ||
                  (typeof item.sellerOffer?.catalogProduct?.images?.[0] === 'string' ? item.sellerOffer.catalogProduct.images[0] : item.sellerOffer?.catalogProduct?.images?.[0]?.url) ||
                  (typeof item.sellerOffer?.variant?.catalogProduct?.images?.[0] === 'string' ? item.sellerOffer.variant.catalogProduct.images[0] : item.sellerOffer?.variant?.catalogProduct?.images?.[0]?.url) ||
                  (typeof item.sellerOffer?.images?.[0] === 'string' ? item.sellerOffer.images[0] : item.sellerOffer?.images?.[0]?.url);
                const itemName = item.sellerOffer?.name ?? item.product?.name ?? item.productName ?? "Product";
                const itemManufacturer = item.sellerOffer?.manufacturer ?? item.product?.manufacturer ?? item.manufacturer ?? "—";
                
                // Calculate seller estimated payout matching platform calculation formula
                const offer = item.sellerOffer || {};
                const product = offer.catalogProduct || item.product || {};
                
                const baseSellingPrice = Number(item.unitPrice || item.price || (offer.mrp ? Number(offer.mrp) - Number(offer.discount || 0) : 0));
                const finalShippingPrice = Number(offer.finalShippingPrice ?? offer.shippingCharges ?? item.shippingFee ?? item.shippingCharges ?? (order.shippingFee ? Number(order.shippingFee) / items.length : 0));
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

                const totalItemPrice = Number(item.totalPrice ?? item.price ?? (baseSellingPrice * itemQty));

                const payout = item.estimatedPayout || (item.settlement ? {
                  grossAmount: Number(item.settlement.grossAmount || totalItemPrice),
                  commission: Number(item.settlement.commission || 0),
                  commissionGst: Number(item.settlement.commissionGst || 0),
                  finalShippingPrice: finalShippingPrice,
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
                <div key={item.id || i} className="px-6 py-4 space-y-3">
                  <div className="flex items-center gap-4">
                    {itemImage ? (
                      <div className="h-12 w-12 rounded-xl overflow-hidden border border-border flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={itemImage} alt={itemName} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-lg flex-shrink-0">💊</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{itemName}</p>
                      <p className="text-xs text-muted-foreground">{itemManufacturer} · Qty: {item.quantity ?? 1}</p>
                      {item.discountType && <p className="text-xs text-primary mt-0.5">Discount: {item.discountType} {item.discountValue ? `(${item.discountValue})` : ""}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-foreground">{formatCurrency(totalItemPrice)}</p>
                      {item.mrp && item.totalPrice && item.mrp * (item.quantity ?? 1) > item.totalPrice && (
                        <p className="text-xs text-muted-foreground line-through">{formatCurrency(item.mrp * (item.quantity ?? 1))}</p>
                      )}
                    </div>
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
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block font-bold">Est. Seller Payout</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(itemNetPayout)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>

            {/* Order Totals Summary */}
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
                const perUnitShipping = Number(offer.finalShippingPrice ?? offer.shippingCharges ?? item.shippingFee ?? item.shippingCharges ?? (order.shippingFee ? Number(order.shippingFee) / items.length : 0)) / itemQty;

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

              return (
                <div className="p-6 border-t border-border/50 bg-muted/10 space-y-3">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Platform Commission & Taxes</span>
                    <span className="font-semibold text-red-500">-{formatCurrency(totalCommission + totalCommissionGst)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Total Shipping (Deducted)</span>
                    <span className="font-semibold text-red-500">-{formatCurrency(totalShipping)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    <span>Total Estimated Seller Payout</span>
                    <span className="font-bold">{formatCurrency(totalNetPayout)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border/30">
                    <span className="font-bold text-foreground text-base">Total Order Value</span>
                    <span className="text-xl font-bold text-foreground">{formatCurrency(order.totalAmount ?? 0)}</span>
                  </div>
                </div>
              );
            })()}
          </motion.div>

          {/* Sidebar - Buyer + Payment Info */}
          <div className="space-y-6">
            {/* Buyer Info */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-2xl p-6">
              <h2 className="font-semibold text-foreground mb-4">Buyer</h2>
              <div className="space-y-4">
                {/* Business Details */}
                <div className="pb-3 border-b border-border/30">
                  <div className="flex items-start gap-2 mb-2">
                    <Building2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{order.buyer?.buyerProfile?.legalName ?? order.buyer?.name ?? "—"}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">Legal Business Name</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {order.buyer?.buyerProfile?.gstNumber && (
                      <div className="bg-accent/30 rounded-lg p-2">
                        <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">GST</p>
                        <p className="text-xs font-mono font-bold text-foreground">{order.buyer.buyerProfile.gstNumber}</p>
                      </div>
                    )}
                    {order.buyer?.buyerProfile?.panNumber && (
                      <div className="bg-accent/30 rounded-lg p-2">
                        <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">PAN</p>
                        <p className="text-xs font-mono font-bold text-foreground">{order.buyer.buyerProfile.panNumber}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="pb-3 border-b border-border/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-medium text-foreground">{order.buyer?.phone ?? "—"}</span>
                  </div>
                  {order.buyer?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm font-medium text-foreground truncate">{order.buyer.email}</span>
                    </div>
                  )}
                </div>

                {/* Drug Licenses */}
                {(order.buyer?.buyerProfile?.drugLicenseNumber || order.buyer?.buyerProfile?.drugLicenseNumber2) && (
                  <div className="pb-3 border-b border-border/30">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs font-bold text-foreground">Drug Licenses</span>
                    </div>
                    
                    <div className="space-y-3">
                      {order.buyer?.buyerProfile?.drugLicenseNumber && (
                        <div className="flex justify-between items-end gap-2 bg-muted/30 rounded-lg p-2">
                          <div>
                            <p className="text-[9px] text-muted-foreground uppercase font-bold">License 1 (20B)</p>
                            <p className="text-xs font-bold text-foreground">{order.buyer.buyerProfile.drugLicenseNumber}</p>
                          </div>
                          {order.buyer.buyerProfile.drugLicenseExpiry && (
                            <div className="text-right">
                              <p className="text-[8px] text-muted-foreground uppercase font-bold">Expiry</p>
                              <p className={cn("text-[10px] font-bold", 
                                new Date(order.buyer.buyerProfile.drugLicenseExpiry) < new Date() ? "text-red-500" : "text-emerald-500"
                              )}>
                                {new Date(order.buyer.buyerProfile.drugLicenseExpiry).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {order.buyer?.buyerProfile?.drugLicenseNumber2 && (
                        <div className="flex justify-between items-end gap-2 bg-muted/30 rounded-lg p-2">
                          <div>
                            <p className="text-[9px] text-muted-foreground uppercase font-bold">License 2 (21B)</p>
                            <p className="text-xs font-bold text-foreground">{order.buyer.buyerProfile.drugLicenseNumber2}</p>
                          </div>
                          {order.buyer.buyerProfile.drugLicenseExpiry2 && (
                            <div className="text-right">
                              <p className="text-[8px] text-muted-foreground uppercase font-bold">Expiry</p>
                              <p className={cn("text-[10px] font-bold", 
                                new Date(order.buyer.buyerProfile.drugLicenseExpiry2) < new Date() ? "text-red-500" : "text-emerald-500"
                              )}>
                                {new Date(order.buyer.buyerProfile.drugLicenseExpiry2).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Verification Documents */}
                {(order.buyer?.buyerProfile?.document || order.buyer?.buyerProfile?.cancelCheck || order.buyer?.buyerProfile?.drugLicenseUrl || order.buyer?.buyerProfile?.drugLicenseUrl2) && (
                  <div className="pb-3 border-b border-border/30">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs font-bold text-foreground">Verification Documents</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {order.buyer?.buyerProfile?.document && (
                        <a href={order.buyer.buyerProfile.document} target="_blank" rel="noopener noreferrer" 
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-lg text-[10px] font-bold text-primary transition-colors">
                          GST/PAN <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {order.buyer?.buyerProfile?.drugLicenseUrl && (
                        <a href={order.buyer.buyerProfile.drugLicenseUrl} target="_blank" rel="noopener noreferrer" 
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-lg text-[10px] font-bold text-primary transition-colors">
                          DL 1 <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {order.buyer?.buyerProfile?.drugLicenseUrl2 && (
                        <a href={order.buyer.buyerProfile.drugLicenseUrl2} target="_blank" rel="noopener noreferrer" 
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-lg text-[10px] font-bold text-primary transition-colors">
                          DL 2 <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {order.buyer?.buyerProfile?.cancelCheck && (
                        <a href={order.buyer.buyerProfile.cancelCheck} target="_blank" rel="noopener noreferrer" 
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-lg text-[10px] font-bold text-primary transition-colors">
                          Cheque <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Shipping Address */}
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">Shipping Address</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {order.address 
                        ? [order.address.address, order.address.city, order.address.state, order.address.pincode].filter(Boolean).join(", ")
                        : [
                            typeof order.buyer?.buyerProfile?.address === "object" && order.buyer.buyerProfile.address
                              ? (order.buyer.buyerProfile.address.street1 || order.buyer.buyerProfile.address.address || JSON.stringify(order.buyer.buyerProfile.address))
                              : order.buyer?.buyerProfile?.address,
                            order.buyer?.buyerProfile?.city,
                            order.buyer?.buyerProfile?.state,
                            order.buyer?.buyerProfile?.pincode
                          ].filter(Boolean).join(", ") || "—"
                      }
                    </p>

                  </div>
                </div>
              </div>
            </motion.div>


            {/* Payment Info */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl p-6">
              <h2 className="font-semibold text-foreground mb-4">Payment</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={order.paymentStatus === "PAID" ? "success" : order.paymentStatus === "PENDING" ? "warning" : "error"}>{order.paymentStatus ?? "—"}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Method</span>
                  <span className="text-sm font-medium text-foreground capitalize">{order.paymentMethod?.replace(/_/g, " ") ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="text-sm font-semibold text-foreground">{formatCurrency(order.totalAmount ?? 0)}</span>
                </div>
              </div>
            </motion.div>

            {/* Tracking Info */}
            {order.shiprocketOrderId && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-primary" /> Shiprocket Tracking
                  </h2>
                  <div className="flex items-center gap-2">
                    {tracking?.current_status && (
                      <Badge variant="info" className="capitalize">{String(tracking.current_status).toLowerCase().replace(/_/g, " ")}</Badge>
                    )}
                    <button
                      onClick={() => refetchTracking()}
                      disabled={isTrackingFetching}
                      title="Refresh live status"
                      className="p-1.5 rounded-lg hover:bg-accent/10 text-muted-foreground disabled:opacity-50"
                    >
                      <RefreshCw className={cn("h-3.5 w-3.5", isTrackingFetching && "animate-spin")} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Order ID</span>
                    <span className="text-sm font-semibold text-foreground">{order.shiprocketOrderId}</span>
                  </div>
                  {(tracking?.awb_code || order.awbCode) && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">AWB</span>
                      <span className="text-sm font-semibold text-primary">{tracking?.awb_code || order.awbCode}</span>
                    </div>
                  )}
                  {(tracking?.courier || order.courierName) && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Courier</span>
                      <span className="text-sm font-semibold text-foreground">{tracking?.courier || order.courierName}</span>
                    </div>
                  )}
                  {tracking?.estimated_delivery && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Estimated Delivery</span>
                      <span className="text-sm font-semibold text-foreground">{tracking.estimated_delivery}</span>
                    </div>
                  )}
                  {tracking?.delivered_date && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Delivered</span>
                      <span className="text-sm font-semibold text-green-600">{tracking.delivered_date}</span>
                    </div>
                  )}
                  {tracking?.track_url && (
                    <a href={tracking.track_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                      View on Shiprocket <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                {isTrackingLoading && (
                  <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Fetching live status from Shiprocket…
                  </div>
                )}

                {isTrackingError && (
                  <p className="mt-4 text-xs text-muted-foreground">Live tracking is temporarily unavailable — showing last known details above.</p>
                )}

                {!!tracking?.activities?.length && (
                  <div className="mt-5 pt-4 border-t border-border/30">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-3">Activity Timeline</p>
                    <div className="space-y-3">
                      {tracking.activities.map((activity: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className={cn("h-2 w-2 rounded-full mt-1.5 shrink-0", idx === 0 ? "bg-primary" : "bg-muted-foreground/30")} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{activity.activity || activity.status || activity["sr-status-label"]}</p>
                            <p className="text-xs text-muted-foreground">
                              {[activity.location, activity.date].filter(Boolean).join(" · ")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Self-ship: read-only tracking supplied by the seller — no
                Shiprocket push, no label/manifest/invoice uploads apply. */}
            {isSelfShip && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="glass-card rounded-2xl p-6">
                <h2 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                  <Navigation className="h-4 w-4 text-primary" /> Self-Ship Tracking
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">Courier</span>
                    <span className="text-sm font-semibold text-foreground">{order.courierName || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">Shipped At</span>
                    <span className="text-sm font-semibold text-foreground">
                      {order.shippedAt ? new Date(order.shippedAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                    </span>
                  </div>
                  {order.trackingUrl ? (
                    <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline break-all">
                      {order.trackingUrl} <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  ) : (
                    <p className="text-xs text-muted-foreground">The seller has not submitted a tracking link yet.</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Shipping & Fulfillment Details (Grouped by Seller) */}
            {!isSelfShip && Object.values(itemsBySeller).map((sellerGroup: any) => {
              const sellerId = sellerGroup.seller.id;
              const sellerName = sellerGroup.seller.companyName || sellerGroup.seller.name || "Seller";
              const filesForSeller = adminFiles[sellerId] || { label: null, invoice: null, manifest: null, sellerInvoice: null };

              return (
                <div key={sellerId} className="space-y-4 border border-border/40 p-4 rounded-2xl bg-accent/5">
                  <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Seller: {sellerName}</p>

                  {(sellerGroup.packageLength || sellerGroup.invoiceUrl) ? (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.23 }} className="glass-card rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-foreground flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> Shipping Details</h2>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">{sellerGroup.isShippingLocked ? "Locked" : "Unlocked"}</span>
                          <button 
                            onClick={() => handleShippingLockToggle(sellerId, sellerGroup.isShippingLocked)}
                            className={cn("relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors duration-200", sellerGroup.isShippingLocked ? "bg-red-500" : "bg-muted-foreground/40")}
                          >
                            <span className={cn("pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out", sellerGroup.isShippingLocked ? "translate-x-2" : "-translate-x-2")} />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {sellerGroup.packageLength && (
                          <div className="grid grid-cols-2 gap-3 pb-3 border-b border-border/30">
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Dimensions (L×B×H)</p>
                              <p className="text-sm font-semibold text-foreground">{sellerGroup.packageLength} × {sellerGroup.packageBreadth} × {sellerGroup.packageHeight} cm</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Weight</p>
                              <p className="text-sm font-semibold text-foreground">{sellerGroup.packageWeight} kg</p>
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Documents</p>
                          <div className="flex flex-wrap gap-2">
                            {sellerGroup.invoiceUrl && (
                              <a href={sellerGroup.invoiceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-lg text-[10px] font-bold text-primary transition-colors">
                                <FileText className="h-3 w-3" /> Invoice
                              </a>
                            )}
                            {sellerGroup.manifestUrl && (
                              <a href={sellerGroup.manifestUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-lg text-[10px] font-bold text-primary transition-colors">
                                <FileText className="h-3 w-3" /> Manifest
                              </a>
                            )}
                            {sellerGroup.lengthImage && (
                              <a href={sellerGroup.lengthImage} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-lg text-[10px] font-bold text-primary transition-colors">
                                Length Proof <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            {sellerGroup.breadthImage && (
                              <a href={sellerGroup.breadthImage} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-lg text-[10px] font-bold text-primary transition-colors">
                                Breadth Proof <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            {sellerGroup.heightImage && (
                              <a href={sellerGroup.heightImage} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-lg text-[10px] font-bold text-primary transition-colors">
                                Height Proof <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            {sellerGroup.weightImage && (
                              <a href={sellerGroup.weightImage} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-lg text-[10px] font-bold text-primary transition-colors">
                                Weight Proof <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            {sellerGroup.packedPictureUrl && (
                              <a href={sellerGroup.packedPictureUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-lg text-[10px] font-bold text-primary transition-colors">
                                <FileText className="h-3 w-3" /> Packed Picture
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="glass-card rounded-2xl p-6 text-center text-xs text-muted-foreground">
                      No shipping details provided by this seller yet.
                    </div>
                  )}

                  {sellerGroup.packageLength && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} className="glass-card rounded-2xl p-6">
                      <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Admin Documents</h2>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground block">Shipping Label</label>
                            {sellerGroup.adminShippingLabelUrl ? (
                              <a href={sellerGroup.adminShippingLabelUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">View Uploaded Label</a>
                            ) : (
                              <input type="file" accept=".pdf,image/*" onChange={(e) => setAdminFiles(p => ({...p, [sellerId]: { ...filesForSeller, label: e.target.files?.[0] || null }}))} className="text-xs block w-full file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground block">Admin Invoice</label>
                            {sellerGroup.adminInvoiceUrl ? (
                              <a href={sellerGroup.adminInvoiceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">View Uploaded Admin Invoice</a>
                            ) : (
                              <input type="file" accept=".pdf,image/*" onChange={(e) => setAdminFiles(p => ({...p, [sellerId]: { ...filesForSeller, invoice: e.target.files?.[0] || null }}))} className="text-xs block w-full file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground block">Manifest</label>
                            {sellerGroup.manifestUrl ? (
                              <a href={sellerGroup.manifestUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">View Uploaded Manifest</a>
                            ) : (
                              <input type="file" accept=".pdf,image/*" onChange={(e) => setAdminFiles(p => ({...p, [sellerId]: { ...filesForSeller, manifest: e.target.files?.[0] || null }}))} className="text-xs block w-full file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground block">Seller Invoice</label>
                            {sellerGroup.invoiceUrl ? (
                              <a href={sellerGroup.invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">View Uploaded Seller Invoice</a>
                            ) : (
                              <input type="file" accept=".pdf,image/*" onChange={(e) => setAdminFiles(p => ({...p, [sellerId]: { ...filesForSeller, sellerInvoice: e.target.files?.[0] || null }}))} className="text-xs block w-full file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                            )}
                          </div>
                        </div>

                        {(!sellerGroup.adminShippingLabelUrl || !sellerGroup.adminInvoiceUrl || !sellerGroup.manifestUrl || !sellerGroup.invoiceUrl) && (
                          <div className="pt-2 flex justify-end">
                            <Button size="sm" onClick={() => handleAdminDocsSubmit(sellerId, sellerGroup)} loading={isUploadingDocs} disabled={!filesForSeller.label && !filesForSeller.invoice && !filesForSeller.manifest && !filesForSeller.sellerInvoice}>
                              Upload Documents
                            </Button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}

            {/* Seller Info */}
            {order.seller && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card rounded-2xl p-6">
                <h2 className="font-semibold text-foreground mb-4">Seller</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{order.seller?.sellerProfile?.companyName ?? order.seller?.name ?? "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-mono text-foreground">{order.seller?.phone ?? "—"}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      <Modal open={showCancelModal} onClose={() => setShowCancelModal(false)} title="Cancel Order">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Are you sure you want to cancel this order? This action cannot be undone.</p>
          <Input label="Reason (optional)" value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="e.g. Customer requested cancellation" />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowCancelModal(false)}>Keep Order</Button>
            <Button variant="danger" onClick={handleCancel} loading={cancelOrder.isPending}>Cancel Order</Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
