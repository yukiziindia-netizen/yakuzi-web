"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Check } from "lucide-react";
import { Input, Select, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { getSuggestions, getCategories, getSubCategories, getAdminBrands } from "@/api/admin.api";
import { SEO_ENTITY_TYPES, type SeoEntityType } from "@/api/seo.api";

export const ENTITY_TYPE_LABELS: Record<SeoEntityType, string> = {
  PRODUCT: "Product",
  CATEGORY: "Category",
  SUB_CATEGORY: "Sub-category",
  BRAND: "Brand",
  COLLECTION: "Collection",
  BLOG_POST: "Blog post",
  STATIC_PAGE: "Static page",
  HOMEPAGE: "Homepage",
  LANDING_PAGE: "Landing page",
};

/** Types where entityId is a free path/identifier instead of a picked DB row. */
const FREE_TEXT_TYPES: SeoEntityType[] = ["COLLECTION", "STATIC_PAGE", "LANDING_PAGE"];

function asArray(raw: any): any[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.items)) return raw.items;
  return [];
}

function useEntityOptions(type: SeoEntityType, search: string) {
  return useQuery({
    queryKey: ["admin", "seo", "entity-options", type, search],
    queryFn: async (): Promise<Array<{ id: string; label: string; hint?: string }>> => {
      switch (type) {
        case "PRODUCT": {
          // Catalog products (suggestions), NOT seller offers: SEO records are
          // keyed by the stable catalog id — the same id the buyer PDP and the
          // product form use. Offer ids fragment per listing.
          const raw = await getSuggestions({ search: search || undefined, limit: 20 });
          const rows = asArray(raw?.data ?? raw?.suggestions ?? raw);
          return rows.map((p: any) => ({ id: p.id, label: p.name ?? p.id, hint: p.manufacturer }));
        }
        case "CATEGORY": {
          const raw = await getCategories();
          return asArray(raw).map((c: any) => ({ id: c.id, label: c.name ?? c.id }));
        }
        case "SUB_CATEGORY": {
          const raw = await getSubCategories(undefined);
          return asArray(raw).map((c: any) => ({ id: c.id, label: c.name ?? c.id, hint: c.category?.name }));
        }
        case "BRAND": {
          const raw = await getAdminBrands();
          return asArray(raw).map((b: any) => ({ id: b.id, label: b.name ?? b.id }));
        }
        default:
          return [];
      }
    },
    enabled: !FREE_TEXT_TYPES.includes(type) && type !== "HOMEPAGE",
    staleTime: 60_000,
    retry: 1,
  });
}

/**
 * Pick the entity a SEO record belongs to. entityId must match what the buyer
 * storefront queries with: the DB id for catalog rows, "/" for HOMEPAGE, the
 * URL path for static/landing pages.
 */
export function EntityPicker({ type, entityId, onTypeChange, onSelect, types }: {
  type: SeoEntityType;
  entityId: string;
  onTypeChange: (t: SeoEntityType) => void;
  onSelect: (id: string, label?: string) => void;
  /** Which entity types to offer; defaults to all. */
  types?: SeoEntityType[];
}) {
  const [search, setSearch] = useState("");
  const listMode = !FREE_TEXT_TYPES.includes(type) && type !== "HOMEPAGE";
  const { data: options, isLoading } = useEntityOptions(type, search);

  const filtered = (options ?? []).filter(
    (o) => !search || o.label.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search)
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Select label="Page type" value={type} onChange={(e) => { setSearch(""); onTypeChange(e.target.value as SeoEntityType); onSelect(e.target.value === "HOMEPAGE" ? "/" : ""); }}>
          {(types ?? SEO_ENTITY_TYPES).map((t) => <option key={t} value={t}>{ENTITY_TYPE_LABELS[t]}</option>)}
        </Select>
        {type === "HOMEPAGE" && <Input label="Entity" value="/" disabled />}
        {FREE_TEXT_TYPES.includes(type) && (
          <Input
            label={type === "COLLECTION" ? "Collection id" : "Path"}
            placeholder={type === "COLLECTION" ? "collection id" : "/about"}
            value={entityId}
            onChange={(e) => onSelect(e.target.value)}
          />
        )}
        {listMode && (
          <Input label="Search" placeholder={`Search ${ENTITY_TYPE_LABELS[type].toLowerCase()}s…`} value={search} onChange={(e) => setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4" />} />
        )}
      </div>

      {listMode && (
        <div className="max-h-48 overflow-y-auto rounded-xl border border-border divide-y divide-border/50">
          {isLoading && <div className="p-3 space-y-2"><Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-2/3" /></div>}
          {!isLoading && filtered.length === 0 && (
            <p className="p-3 text-sm text-muted-foreground">No {ENTITY_TYPE_LABELS[type].toLowerCase()}s found.</p>
          )}
          {filtered.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => onSelect(o.id, o.label)}
              className={cn(
                "w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                entityId === o.id && "bg-primary/5 text-primary"
              )}
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{o.label}</span>
                {o.hint && <span className="block truncate text-xs text-muted-foreground">{o.hint}</span>}
              </span>
              {entityId === o.id && <Check className="h-4 w-4 flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
