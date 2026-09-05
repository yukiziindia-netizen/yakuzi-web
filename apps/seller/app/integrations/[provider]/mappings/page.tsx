"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, Link2, Search, X } from "lucide-react";
import toast from "react-hot-toast";
import { Badge, Button, Input, Pagination, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  useIntegrationMappings,
  useMapIntegrationProduct,
  useMappingCandidates,
  useResolveInventoryConflict,
  useSellerIntegration,
} from "@/hooks/useSeller";
import { PROVIDER_META, type ProviderKey } from "@/components/integrations/provider-meta";
import type { IntegrationMappingRow } from "@/api/seller.api";

const PAGE_SIZE = 25;

const FILTERS = [
  { key: "", label: "All" },
  { key: "conflict", label: "Needs a decision" },
  { key: "unmapped", label: "Unmapped" },
  { key: "missing_sku", label: "Missing SKU" },
  { key: "mapped", label: "Mapped" },
] as const;

/** Why automatic matching stopped, in words a seller can act on. */
const CONFLICT_EXPLANATIONS: Record<string, string> = {
  SKU_MATCHES_MULTIPLE_PRODUCTS:
    "This SKU matches more than one of your Yukizi products, so Yukizi can't tell which one it is.",
  SKU_SHARED_BY_EXTERNAL_LISTINGS:
    "Several listings on this channel share this SKU, so Yukizi can't tell them apart.",
  NO_SKU:
    "This listing has no SKU. Add one on the channel, or map it manually here.",
};

function StatusBadge({ row }: { row: IntegrationMappingRow }) {
  switch (row.status) {
    case "MAPPED":
      return <Badge variant="success" size="sm">Mapped</Badge>;
    case "CONFLICT":
      return <Badge variant="error" size="sm">Mapping required</Badge>;
    case "MISSING_SKU":
      return <Badge variant="warning" size="sm">Missing SKU</Badge>;
    default:
      return <Badge variant="default" size="sm">Unmapped</Badge>;
  }
}

export default function ProductMappingPage() {
  const params = useParams();
  const providerSlug = String(params?.provider ?? "");
  const provider = providerSlug.toUpperCase() as ProviderKey;
  const meta = PROVIDER_META[provider];

  const { data: detail } = useSellerIntegration(providerSlug);
  const integrationId: string | undefined = detail?.integration?.id;

  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [mappingRow, setMappingRow] = useState<IntegrationMappingRow | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => { setPage(1); }, [status, debounced]);

  const query = useMemo(
    () => ({ page, limit: PAGE_SIZE, ...(status && { status }), ...(debounced && { search: debounced }) }),
    [page, status, debounced],
  );
  const { data, isLoading } = useIntegrationMappings(integrationId ?? "", query);

  const rows: IntegrationMappingRow[] = data?.data ?? [];
  const counts = data?.counts;
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  if (!meta) {
    return <div className="max-w-6xl mx-auto text-sm text-muted-foreground">Unknown channel.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Link
        href={`/integrations/${providerSlug}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        {meta.name}
      </Link>

      <div>
        <h1 className="font-semibold text-2xl text-foreground">Product mapping</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Match {meta.name} listings to your Yukizi products. Yukizi matches by SKU and
          never guesses from product names.
        </p>
      </div>

      {counts && counts.inventoryConflicts > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" aria-hidden />
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            <span className="font-semibold">
              {counts.inventoryConflicts} inventory difference
              {counts.inventoryConflicts === 1 ? "" : "s"}
            </span>{" "}
            found between Yukizi and {meta.name}. Nothing has been changed — choose which
            quantity is correct below.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="flex gap-2 overflow-x-auto no-sb pb-1">
          {FILTERS.map((f) => {
            const count =
              f.key === "conflict" ? counts?.conflict
              : f.key === "unmapped" ? counts?.unmapped
              : f.key === "missing_sku" ? counts?.missingSku
              : f.key === "mapped" ? counts?.mapped
              : counts?.total;
            return (
              <button
                key={f.key || "all"}
                onClick={() => setStatus(f.key)}
                className={cn(
                  "px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap",
                  status === f.key
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground hover:bg-accent",
                )}
              >
                {f.label}
                {typeof count === "number" && (
                  <span className={cn(
                    "ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]",
                    status === f.key ? "bg-white/20 text-white" : "bg-background/60",
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64 flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search SKU or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
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
              <table className="w-full" aria-label="Product mapping">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/20">
                    {["Yukizi product", "Yukizi SKU", `${meta.name} listing`, "Channel SKU", "Status", ""].map((h) => (
                      <th
                        key={h}
                        scope="col"
                        className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground text-sm">
                        {status || debounced
                          ? "No listings match this filter."
                          : "No listings imported yet. Run a sync to import this channel's catalogue."}
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, i) => (
                      <MappingRow
                        key={row.id}
                        row={row}
                        index={i}
                        integrationId={integrationId as string}
                        providerName={meta.name}
                        onMap={() => setMappingRow(row)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {(data?.total ?? 0) > PAGE_SIZE && (
            <div className="flex justify-center">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </>
      )}

      {mappingRow && integrationId && (
        <MapProductModal
          row={mappingRow}
          integrationId={integrationId}
          onClose={() => setMappingRow(null)}
        />
      )}
    </div>
  );
}

function MappingRow({
  row,
  index,
  integrationId,
  providerName,
  onMap,
}: {
  row: IntegrationMappingRow;
  index: number;
  integrationId: string;
  providerName: string;
  onMap: () => void;
}) {
  const resolve = useResolveInventoryConflict();

  return (
    <>
      <motion.tr
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        className="hover:bg-accent/30 transition-colors"
      >
        <td className="px-5 py-4 text-sm text-foreground">
          {row.yukiziProductName ?? <span className="text-muted-foreground">—</span>}
          {row.mappedManually && (
            <span className="block text-[10px] text-muted-foreground mt-0.5">
              mapped manually
            </span>
          )}
        </td>
        <td className="px-5 py-4">
          {row.yukiziSku ? (
            <span className="font-mono text-xs text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">
              {row.yukiziSku}
            </span>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          )}
        </td>
        <td className="px-5 py-4 text-sm text-foreground">
          {row.externalTitle ?? <span className="text-muted-foreground">—</span>}
          {row.fulfillmentChannel === "AMAZON_FBA" && (
            <Badge variant="info" size="sm" className="ml-2">FBA</Badge>
          )}
          {row.asin && (
            <span className="block font-mono text-[10px] text-muted-foreground mt-0.5">
              {row.asin}
            </span>
          )}
        </td>
        <td className="px-5 py-4">
          {row.externalSku ? (
            <span className="font-mono text-xs text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">
              {row.externalSku}
            </span>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          )}
        </td>
        <td className="px-5 py-4"><StatusBadge row={row} /></td>
        <td className="px-5 py-4 text-right">
          <Button
            size="xs"
            variant="outline"
            leftIcon={<Link2 className="h-3 w-3" />}
            onClick={onMap}
          >
            {row.status === "MAPPED" ? "Change" : "Map"}
          </Button>
        </td>
      </motion.tr>

      {/* Why matching stopped — shown inline so the seller doesn't have to guess. */}
      {row.conflictReason && CONFLICT_EXPLANATIONS[row.conflictReason] && (
        <tr className="bg-muted/10">
          <td colSpan={6} className="px-5 pb-3 pt-0">
            <p className="text-xs text-muted-foreground">
              {CONFLICT_EXPLANATIONS[row.conflictReason]}
            </p>
          </td>
        </tr>
      )}

      {/* An unresolved inventory difference. Nothing was overwritten. */}
      {row.inventoryConflict && (
        <tr className="bg-yellow-50/50 dark:bg-yellow-900/10">
          <td colSpan={6} className="px-5 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs">
                <span className="font-medium text-foreground">
                  Inventory difference detected.
                </span>{" "}
                <span className="text-muted-foreground">
                  Yukizi: <strong>{row.inventoryConflict.yukiziQuantity ?? "—"}</strong> ·{" "}
                  {providerName}: <strong>{row.inventoryConflict.externalQuantity ?? "—"}</strong>
                </span>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  size="xs"
                  variant="outline"
                  loading={resolve.isPending}
                  onClick={() =>
                    resolve.mutate(
                      { integrationId, mappingId: row.id, choice: "YUKIZI" },
                      {
                        onSuccess: () => toast.success("Kept the Yukizi quantity."),
                        onError: (err: any) =>
                          toast.error(err?.response?.data?.message || "Couldn't resolve."),
                      },
                    )
                  }
                >
                  Keep Yukizi ({row.inventoryConflict.yukiziQuantity ?? "—"})
                </Button>
                <Button
                  size="xs"
                  loading={resolve.isPending}
                  onClick={() =>
                    resolve.mutate(
                      { integrationId, mappingId: row.id, choice: "EXTERNAL" },
                      {
                        onSuccess: () =>
                          toast.success(`Yukizi updated to the ${providerName} quantity.`),
                        onError: (err: any) =>
                          toast.error(err?.response?.data?.message || "Couldn't resolve."),
                      },
                    )
                  }
                >
                  Use {providerName} ({row.inventoryConflict.externalQuantity ?? "—"})
                </Button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/** Manual mapping. Search is server-side so a large catalogue stays usable. */
function MapProductModal({
  row,
  integrationId,
  onClose,
}: {
  row: IntegrationMappingRow;
  integrationId: string;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const mapProduct = useMapIntegrationProduct();

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: candidates, isLoading } = useMappingCandidates(debounced, true);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg glass-card rounded-2xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-lg text-foreground">Map this listing</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {row.externalTitle ?? row.externalProductId}
              {row.externalSku && (
                <span className="font-mono text-xs bg-muted/30 px-1.5 py-0.5 rounded ml-2">
                  {row.externalSku}
                </span>
              )}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <Input
          placeholder="Search your products by name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />

        <div className="max-h-72 overflow-y-auto space-y-1">
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
          ) : (candidates ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No products found.
            </p>
          ) : (
            (candidates ?? []).map((candidate) => (
              <button
                key={candidate.id}
                disabled={mapProduct.isPending}
                onClick={() =>
                  mapProduct.mutate(
                    { id: integrationId, mappingId: row.id, sellerOfferId: candidate.id },
                    {
                      onSuccess: () => {
                        toast.success("Product mapped.");
                        onClose();
                      },
                      onError: (err: any) =>
                        toast.error(err?.response?.data?.message || "Couldn't map that product."),
                    },
                  )
                }
                className="w-full text-left rounded-xl border border-border p-3 hover:bg-accent/40 transition-colors disabled:opacity-50"
              >
                <p className="text-sm font-medium text-foreground">{candidate.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {candidate.sku ? (
                    <span className="font-mono bg-muted/30 px-1.5 py-0.5 rounded">
                      {candidate.sku}
                    </span>
                  ) : (
                    "No SKU"
                  )}
                </p>
              </button>
            ))
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        </div>
      </motion.div>
    </div>
  );
}
