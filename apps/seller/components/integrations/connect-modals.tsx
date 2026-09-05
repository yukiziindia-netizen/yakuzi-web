"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Plug, X } from "lucide-react";
import { Button, Input, Select } from "@/components/ui";
import {
  useAmazonMarketplaces,
  useCheckWooCommerceStore,
  useConnectAmazon,
  useConnectShopify,
  useConnectWooCommerce,
} from "@/hooks/useSeller";

/**
 * Connect dialogs.
 *
 * The seller app has no Modal component, so these follow the existing
 * hand-rolled overlay pattern used by the order reject dialog
 * (app/orders/[id]/page.tsx): fixed inset overlay, click-outside to close,
 * stopPropagation on the panel, framer-motion entry.
 *
 * None of these dialogs ever ask for a platform password. Each one only
 * collects the minimum needed to build an authorization URL, then hands the
 * browser to the platform.
 */

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass-card rounded-2xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-lg text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

/** Shared error line. Server messages are already seller-readable. */
function ErrorNote({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
      <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" aria-hidden />
      <p className="text-xs text-red-700 dark:text-red-400">{message}</p>
    </div>
  );
}

const readError = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
  fallback;

export function ShopifyConnectModal({ onClose }: { onClose: () => void }) {
  const [shopDomain, setShopDomain] = useState("");
  const [error, setError] = useState("");
  const connect = useConnectShopify();

  const submit = () => {
    setError("");
    if (!shopDomain.trim()) {
      setError("Enter your Shopify store domain.");
      return;
    }
    connect.mutate(shopDomain.trim(), {
      // Full navigation, not router.push: the next stop is Shopify's own
      // consent screen on a different origin.
      onSuccess: (data) => {
        window.location.href = data.authorizationUrl;
      },
      onError: (err) =>
        setError(readError(err, "We couldn't start the Shopify connection. Please try again.")),
    });
  };

  return (
    <ModalShell
      title="Connect Shopify"
      subtitle="You'll approve Yukizi on Shopify — we never ask for your Shopify password."
      onClose={onClose}
    >
      <Input
        label="Shopify store domain"
        placeholder="storename.myshopify.com"
        value={shopDomain}
        onChange={(e) => setShopDomain(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        autoFocus
      />
      <p className="text-xs text-muted-foreground">
        Yukizi will request read access to products and inventory, and permission to update
        inventory. No customer or order data is requested.
      </p>
      {error && <ErrorNote message={error} />}
      <div className="flex gap-2 justify-end pt-1">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          size="sm"
          loading={connect.isPending}
          leftIcon={<Plug className="h-3.5 w-3.5" />}
          onClick={submit}
        >
          Continue to Shopify
        </Button>
      </div>
    </ModalShell>
  );
}

export function WooCommerceConnectModal({ onClose }: { onClose: () => void }) {
  const [storeUrl, setStoreUrl] = useState("");
  const [error, setError] = useState("");
  const [checked, setChecked] = useState(false);
  const check = useCheckWooCommerceStore();
  const connect = useConnectWooCommerce();

  // Two steps on purpose: a store that fails the probe gets a specific,
  // actionable message here rather than a WordPress error page after redirect.
  const runCheck = () => {
    setError("");
    if (!storeUrl.trim()) {
      setError("Enter your WooCommerce store URL.");
      return;
    }
    check.mutate(storeUrl.trim(), {
      onSuccess: (result) => {
        if (result.reachable && result.isWooCommerce) {
          setChecked(true);
        } else {
          setError(
            result.message ??
              "We couldn't connect to this WooCommerce store. Check the store URL and try again.",
          );
        }
      },
      onError: (err) =>
        setError(readError(err, "We couldn't reach that store. Check the store URL and try again.")),
    });
  };

  const submit = () => {
    setError("");
    connect.mutate(storeUrl.trim(), {
      onSuccess: (data) => {
        window.location.href = data.authorizationUrl;
      },
      onError: (err) =>
        setError(readError(err, "We couldn't start the WooCommerce connection. Please try again.")),
    });
  };

  return (
    <ModalShell
      title="Connect WooCommerce"
      subtitle="You'll approve Yukizi inside your own WordPress admin."
      onClose={onClose}
    >
      <Input
        label="WooCommerce store URL"
        placeholder="https://mystore.com"
        value={storeUrl}
        onChange={(e) => {
          setStoreUrl(e.target.value);
          setChecked(false);
        }}
        onKeyDown={(e) => e.key === "Enter" && (checked ? submit() : runCheck())}
        autoFocus
      />
      {checked && !error && (
        <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3">
          <p className="text-xs text-green-700 dark:text-green-400">
            WooCommerce found on this store. Continue to approve Yukizi.
          </p>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Your store must be reachable over HTTPS with WordPress permalinks enabled. Yukizi
        receives API keys generated by your store — never your WordPress password.
      </p>
      {error && <ErrorNote message={error} />}
      <div className="flex gap-2 justify-end pt-1">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        {checked ? (
          <Button
            size="sm"
            loading={connect.isPending}
            leftIcon={<Plug className="h-3.5 w-3.5" />}
            onClick={submit}
          >
            Continue to store
          </Button>
        ) : (
          <Button size="sm" loading={check.isPending} onClick={runCheck}>
            Check store
          </Button>
        )}
      </div>
    </ModalShell>
  );
}

export function AmazonConnectModal({ onClose }: { onClose: () => void }) {
  const [marketplaceId, setMarketplaceId] = useState("");
  const [error, setError] = useState("");
  const { data, isLoading } = useAmazonMarketplaces(true);
  const connect = useConnectAmazon();

  const marketplaces: Array<{ country: string; marketplaceId: string }> =
    data?.marketplaces ?? [];
  // Default comes from the seller's own details, but stays changeable.
  const selected = marketplaceId || data?.defaultMarketplaceId || "";

  const submit = () => {
    setError("");
    if (!selected) {
      setError("Choose the Amazon marketplace you sell on.");
      return;
    }
    connect.mutate(selected, {
      onSuccess: (result) => {
        window.location.href = result.authorizationUrl;
      },
      onError: (err) =>
        setError(readError(err, "We couldn't start the Amazon connection. Please try again.")),
    });
  };

  return (
    <ModalShell
      title="Connect Amazon"
      subtitle="You'll approve Yukizi in Amazon Seller Central."
      onClose={onClose}
    >
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading marketplaces...</p>
      ) : (
        <Select
          label="Amazon marketplace"
          value={selected}
          onChange={(e) => setMarketplaceId(e.target.value)}
          options={marketplaces.map((m) => ({
            label: m.country,
            value: m.marketplaceId,
          }))}
        />
      )}
      <p className="text-xs text-muted-foreground">
        Amazon connects through the Selling Partner API. Seller-fulfilled stock syncs
        normally; stock held in Amazon&apos;s fulfilment centres (FBA) is shown for
        reference and never overwritten by Yukizi.
      </p>
      {error && <ErrorNote message={error} />}
      <div className="flex gap-2 justify-end pt-1">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          size="sm"
          loading={connect.isPending}
          leftIcon={<Plug className="h-3.5 w-3.5" />}
          onClick={submit}
        >
          Continue to Amazon
        </Button>
      </div>
    </ModalShell>
  );
}
