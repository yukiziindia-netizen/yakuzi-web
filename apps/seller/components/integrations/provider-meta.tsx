"use client";
import { ShoppingBag, Store, Package } from "lucide-react";
import { Badge } from "@/components/ui";

/**
 * Per-provider presentation. Kept in one place so the overview cards, the
 * detail page and the connect modals cannot drift apart.
 *
 * Logos are inline SVG/lucide marks rather than remote images: the seller app
 * ships no third-party asset host, and an <img> to a CDN would be the only
 * external request on the page.
 */

export type ProviderKey = "SHOPIFY" | "WOOCOMMERCE" | "AMAZON";

export const PROVIDER_META: Record<
  ProviderKey,
  {
    name: string;
    slug: string;
    description: string;
    /** Brand-ish tint that still works in both themes. */
    iconClass: string;
    Icon: React.ElementType;
    connectLabel: string;
  }
> = {
  SHOPIFY: {
    name: "Shopify",
    slug: "shopify",
    description:
      "Connect your Shopify store and synchronize products and inventory with Yukizi.",
    iconClass: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
    Icon: ShoppingBag,
    connectLabel: "Connect Shopify",
  },
  WOOCOMMERCE: {
    name: "WooCommerce",
    slug: "woocommerce",
    description:
      "Connect your WooCommerce store and synchronize products and inventory with Yukizi.",
    iconClass: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
    Icon: Store,
    connectLabel: "Connect WooCommerce",
  },
  AMAZON: {
    name: "Amazon",
    slug: "amazon",
    description:
      "Connect your Amazon Seller account and synchronize listings and inventory with Yukizi.",
    iconClass: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
    Icon: Package,
    connectLabel: "Connect Amazon",
  },
};

/**
 * The five connection states, mapped onto the existing Badge variants. Note
 * Badge has no "outline" variant in this app — do not reach for one.
 */
export function ConnectionStatusBadge({
  health,
  syncing,
}: {
  health?: string;
  syncing?: boolean;
}) {
  if (syncing) return <Badge variant="info">Syncing</Badge>;
  switch (health) {
    case "CONNECTED":
      return <Badge variant="success">Connected</Badge>;
    case "PAUSED":
      return <Badge variant="warning">Sync paused</Badge>;
    case "ACTION_REQUIRED":
      return <Badge variant="error">Connection issue</Badge>;
    default:
      return <Badge variant="default">Not connected</Badge>;
  }
}

/** "2 minutes ago" without pulling in a date library. */
export function timeAgo(value: string | null | undefined): string {
  if (!value) return "Never";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "Never";

  const seconds = Math.floor((Date.now() - then) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(value).toLocaleDateString();
}
