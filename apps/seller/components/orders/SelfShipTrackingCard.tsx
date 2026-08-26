"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Truck, ExternalLink, Pencil } from "lucide-react";
import { Button } from "@/components/ui";
import { useSubmitSelfShipTracking } from "@/hooks/useSeller";
import toast from "react-hot-toast";

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Rendered on the seller order page instead of the measurements/photos/
 * Shiprocket-documents card when the order's fulfillmentMode is 'self_ship'.
 * Submitting marks the order shipped; the link stays editable afterwards.
 */
export function SelfShipTrackingCard({ order, orderId, isUnpaid }: { order: any; orderId: string; isUnpaid: boolean }) {
  const submitTracking = useSubmitSelfShipTracking();
  const alreadySubmitted = !!order.trackingUrl;
  const [isEditing, setIsEditing] = useState(!alreadySubmitted);
  const [trackingUrl, setTrackingUrl] = useState(order.trackingUrl || "");
  const [courierName, setCourierName] = useState(order.courierName || "");

  const handleSubmit = async () => {
    const trimmed = trackingUrl.trim();
    if (!isValidHttpUrl(trimmed)) {
      toast.error("Enter a valid tracking link starting with http:// or https://");
      return;
    }
    try {
      await submitTracking.mutateAsync({
        orderId,
        payload: {
          trackingUrl: trimmed,
          ...(courierName.trim() ? { courierName: courierName.trim() } : {}),
        },
      });
      toast.success(alreadySubmitted ? "Tracking link updated" : "Order marked as shipped");
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save tracking link");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl overflow-hidden p-5 space-y-4">
      <div className="border-b border-border/50 pb-4">
        <h2 className="font-semibold text-foreground flex items-center gap-2"><Truck className="h-4 w-4 text-primary" />Self-Ship Fulfillment</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Self-ship is enabled for your account: ship this order with your own courier and share the
          tracking link with the buyer. The platform shipping flow (dimensions, proofs and Shiprocket
          documents) does not apply to this order.
        </p>
      </div>

      {isUnpaid ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-3">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            The buyer hasn&apos;t completed payment for this order yet. The tracking link unlocks
            automatically once payment is received — do not ship before then.
          </p>
        </div>
      ) : !isEditing ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Tracking Link</p>
            <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline break-all flex items-center gap-1.5">
              {order.trackingUrl} <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          </div>
          {order.courierName && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Courier</p>
              <p className="text-sm text-foreground">{order.courierName}</p>
            </div>
          )}
          <div className="pt-2 flex justify-end">
            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} leftIcon={<Pencil className="h-3.5 w-3.5" />}>
              Edit Tracking Link
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Tracking Link <span className="text-red-500">*</span></label>
            <input
              type="url"
              value={trackingUrl}
              onChange={(e) => setTrackingUrl(e.target.value)}
              placeholder="https://your-courier.example/track/123456"
              className="w-full bg-background border border-input rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Courier Name (optional)</label>
            <input
              type="text"
              value={courierName}
              onChange={(e) => setCourierName(e.target.value)}
              placeholder="e.g. BlueDart, Delhivery"
              className="w-full bg-background border border-input rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
            />
          </div>
          {!alreadySubmitted && (
            <p className="text-xs text-muted-foreground">
              Submitting the tracking link marks this order as <span className="font-semibold">Shipped</span> and
              notifies the buyer.
            </p>
          )}
          <div className="pt-1 flex justify-end gap-2">
            {alreadySubmitted && (
              <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setTrackingUrl(order.trackingUrl || ""); setCourierName(order.courierName || ""); }}>
                Cancel
              </Button>
            )}
            <Button size="sm" onClick={handleSubmit} loading={submitTracking.isPending}>
              {alreadySubmitted ? "Save Changes" : "Submit & Mark as Shipped"}
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
