"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Plug,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import toast from "react-hot-toast";
import { Badge, Button, Skeleton } from "@/components/ui";
import { useExternalOrders, useSellerIntegrations } from "@/hooks/useSeller";
import type { ExternalOrderRow } from "@/api/seller.api";
import {
  ConnectionStatusBadge,
  PROVIDER_META,
  timeAgo,
  type ProviderKey,
} from "@/components/integrations/provider-meta";
import {
  AmazonConnectModal,
  ShopifyConnectModal,
  WooCommerceConnectModal,
} from "@/components/integrations/connect-modals";

/** Messages for the ?status= the OAuth callbacks redirect back with. */
const RETURN_MESSAGES: Record<string, string> = {
  cancelled: "Connection was cancelled. Your Yukizi account was not changed.",
  invalid_signature: "We couldn't verify that response. Please start the connection again.",
  expired_state: "That connection link expired. Please start again.",
  store_mismatch: "The store that responded didn't match the one you entered.",
  exchange_failed: "We couldn't complete the connection. Please try again.",
  start_from_yukizi: "Start the connection from this page so we know which account to link.",
};

export default function IntegrationsPage() {
  const { data, isLoading } = useSellerIntegrations();
  const [openModal, setOpenModal] = useState<ProviderKey | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  // The provider callbacks land back here with a status. Show it once, then
  // strip it so a refresh doesn't repeat the toast.
  const status = searchParams.get("status");
  const reason = searchParams.get("reason");
  useEffect(() => {
    if (!status) return;
    if (status === "connected") {
      toast.success("Channel connected.");
    } else {
      toast.error(RETURN_MESSAGES[reason ?? ""] ?? RETURN_MESSAGES.exchange_failed);
    }
    router.replace("/integrations");
  }, [status, reason, router]);

  const providers = data?.providers ?? [];
  const summary = data?.summary;
  const connectedCount = providers.filter((p) => p.integration).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-semibold text-2xl text-foreground">Integrations</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Connect your sales channels and keep your Yukizi inventory synchronized.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Channel cards */}
          <div className="space-y-4">
            {providers.map(({ provider, available, integration }, index) => {
              const meta = PROVIDER_META[provider as ProviderKey];
              if (!meta) return null;
              const { Icon } = meta;

              return (
                <motion.div
                  key={provider}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card rounded-2xl p-5 sm:p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div
                      className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.iconClass}`}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-semibold text-foreground">{meta.name}</h2>
                        <ConnectionStatusBadge health={integration?.health} />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {meta.description}
                      </p>

                      {integration && (
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {integration.storeName && (
                            <span className="font-mono bg-muted/30 px-1.5 py-0.5 rounded">
                              {integration.storeName}
                            </span>
                          )}
                          <span>Last sync {timeAgo(integration.lastSuccessfulSyncAt)}</span>
                        </div>
                      )}

                      {integration?.lastError && (
                        <div className="mt-2 flex items-start gap-2">
                          <AlertTriangle
                            className="h-3.5 w-3.5 text-red-500 flex-shrink-0 mt-0.5"
                            aria-hidden
                          />
                          <p className="text-xs text-red-600 dark:text-red-400">
                            {integration.lastError}
                          </p>
                        </div>
                      )}

                      {!available && !integration && (
                        <p className="text-xs text-muted-foreground mt-2">
                          This channel isn&apos;t available yet. Contact Yukizi support.
                        </p>
                      )}
                    </div>

                    <div className="flex-shrink-0">
                      {integration ? (
                        <Link href={`/integrations/${meta.slug}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                          >
                            Manage
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          size="sm"
                          disabled={!available}
                          leftIcon={<Plug className="h-3.5 w-3.5" />}
                          onClick={() => setOpenModal(provider as ProviderKey)}
                        >
                          {meta.connectLabel}
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Inventory sync overview — only once something is connected, so a
              brand-new seller isn't shown a wall of zeroes. */}
          {connectedCount > 0 && summary && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card rounded-2xl p-6"
            >
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="font-semibold text-foreground">Inventory sync</h2>
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <RefreshCw className="h-3 w-3" aria-hidden />
                  Last sync {timeAgo(summary.lastSyncAt)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SummaryTile
                  label="Products monitored"
                  value={summary.productsMonitored}
                />
                <SummaryTile label="Products mapped" value={summary.productsMapped} />
                <SummaryTile
                  label="Requiring attention"
                  value={summary.productsNeedingAttention}
                  tone={summary.productsNeedingAttention > 0 ? "warning" : "default"}
                />
              </div>

              {summary.productsMonitored === 0 && (
                <p className="text-xs text-muted-foreground mt-4">
                  Product import runs after you finish setting up a connected channel.
                </p>
              )}
            </motion.div>
          )}

          {connectedCount > 0 && <ChannelOrders />}

          {connectedCount === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center">
              <CheckCircle2
                className="h-8 w-8 mx-auto text-muted-foreground/40"
                aria-hidden
              />
              <p className="mt-3 font-medium text-foreground">No channels connected yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Connect a channel above to start synchronizing products and inventory.
              </p>
            </div>
          )}
        </>
      )}

      {openModal === "SHOPIFY" && <ShopifyConnectModal onClose={() => setOpenModal(null)} />}
      {openModal === "WOOCOMMERCE" && (
        <WooCommerceConnectModal onClose={() => setOpenModal(null)} />
      )}
      {openModal === "AMAZON" && <AmazonConnectModal onClose={() => setOpenModal(null)} />}
    </div>
  );
}

/**
 * Sales that happened on connected channels.
 *
 * Shown separately from Yukizi orders on purpose: these are not Yukizi orders,
 * carry no customer details, and are not part of payouts. The empty state says
 * so rather than leaving a seller to wonder why the list is blank.
 */
function ChannelOrders() {
  const { data, isLoading } = useExternalOrders({ limit: 10 });
  const orders: ExternalOrderRow[] = data?.data ?? [];

  if (isLoading) return <Skeleton className="h-40 w-full rounded-2xl" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="glass-card rounded-2xl p-6"
    >
      <div className="flex items-center justify-between gap-3 mb-1">
        <h2 className="font-semibold text-foreground">Channel orders</h2>
        {orders.length > 0 && (
          <span className="text-xs text-muted-foreground">
            Showing the {orders.length} most recent
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Sales from your connected channels. These are not Yukizi orders and are
        not included in your Yukizi payouts.
      </p>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <ShoppingBag className="h-7 w-7 mx-auto text-muted-foreground/40" aria-hidden />
          <p className="mt-3 text-sm text-muted-foreground">
            No channel orders yet. Turn on Orders for a channel to import them.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full" aria-label="Channel orders">
            <thead>
              <tr className="border-b border-border/50 bg-muted/20">
                {["Order", "Channel", "Placed", "Items", "Total", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {orders.map((order, i) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="hover:bg-accent/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">
                      {order.orderNumber}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {PROVIDER_META[order.provider as ProviderKey]?.name ?? order.provider}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                    {timeAgo(order.placedAt)}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {order.itemCount}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
                    {order.currency ? `${order.currency} ` : ""}
                    {order.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={order.cancelled ? "error" : "default"}
                      size="sm"
                    >
                      {order.cancelled ? "cancelled" : (order.status ?? "—")}
                    </Badge>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}

function SummaryTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "warning";
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/10 p-4">
      <p
        className={`text-2xl font-semibold ${
          tone === "warning" && value > 0
            ? "text-yellow-600 dark:text-yellow-500"
            : "text-foreground"
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
