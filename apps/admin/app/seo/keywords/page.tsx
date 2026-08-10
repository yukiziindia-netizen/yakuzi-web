"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CornerDownRight, KeyRound, Link2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Badge, Button, EmptyState, Input, Modal, Select, Skeleton, Textarea } from "@/components/ui";
import {
  useCreateSeoKeyword, useDeleteSeoKeyword, useLinkSeoKeyword, useSeoKeywordLinks,
  useSeoKeywords, useUnlinkSeoKeyword, useUpdateSeoKeyword,
} from "@/hooks/useSeo";
import { KEYWORD_TYPES, type KeywordType, type SeoEntityType, type SeoKeyword } from "@/api/seo.api";
import { ChipsInput } from "@/components/seo/chips-input";
import { EntityPicker, ENTITY_TYPE_LABELS } from "@/components/seo/entity-picker";

const TYPE_LABELS: Record<KeywordType, string> = {
  PRIMARY_TOPIC: "Primary topic",
  SECONDARY_TOPIC: "Secondary topic",
  SYNONYM: "Synonym",
  RELATED_ENTITY: "Related entity",
  BRAND_ENTITY: "Brand entity",
  CATEGORY_ENTITY: "Category entity",
  NEGATIVE: "Negative",
  SEASONAL: "Seasonal",
};

const TYPE_VARIANTS: Record<KeywordType, "purple" | "info" | "default" | "orange" | "success" | "error" | "warning"> = {
  PRIMARY_TOPIC: "purple",
  SECONDARY_TOPIC: "info",
  SYNONYM: "default",
  RELATED_ENTITY: "success",
  BRAND_ENTITY: "orange",
  CATEGORY_ENTITY: "info",
  NEGATIVE: "error",
  SEASONAL: "warning",
};

const emptyForm = {
  name: "", type: "PRIMARY_TOPIC" as KeywordType, canonicalName: "", synonyms: [] as string[],
  description: "", parentId: "", seasonStart: "", seasonEnd: "", isActive: true,
};

function LinksModal({ keyword, onClose }: { keyword: SeoKeyword; onClose: () => void }) {
  const { data: links, isLoading } = useSeoKeywordLinks(keyword.id);
  const linkKeyword = useLinkSeoKeyword();
  const unlinkKeyword = useUnlinkSeoKeyword();

  const [pickType, setPickType] = useState<SeoEntityType>("PRODUCT");
  const [pickId, setPickId] = useState("");
  const [pickLabel, setPickLabel] = useState("");
  const [weight, setWeight] = useState("1");

  const handleAdd = async () => {
    if (!pickId.trim()) { toast.error("Pick an entity to link first."); return; }
    try {
      await linkKeyword.mutateAsync({
        id: keyword.id,
        payload: { entityType: pickType, entityId: pickId.trim(), weight: Math.max(1, Number(weight) || 1) },
      });
      toast.success(`Linked "${keyword.name}" to ${pickLabel || pickId}.`);
      setPickId(""); setPickLabel("");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Could not create the link.");
    }
  };

  const handleUnlink = async (entityType: SeoEntityType, entityId: string) => {
    try {
      await unlinkKeyword.mutateAsync({ id: keyword.id, entityType, entityId });
      toast.success("Link removed.");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Could not remove the link.");
    }
  };

  return (
    <Modal open onClose={onClose} title={`Entity links — ${keyword.name}`} maxWidth="max-w-2xl">
      <div className="space-y-5">
        <div>
          <h3 className="text-sm font-medium text-foreground mb-2">Linked entities</h3>
          {isLoading && <Skeleton className="h-16 w-full" />}
          {!isLoading && links === null && (
            <p className="text-sm text-muted-foreground rounded-xl border border-dashed border-border p-3">
              Link listing needs the latest API deploy (yakuzi-api#37). You can still add and remove links —
              the list will appear once the API updates.
            </p>
          )}
          {!isLoading && Array.isArray(links) && links.length === 0 && (
            <p className="text-sm text-muted-foreground">Not linked to any entity yet.</p>
          )}
          {Array.isArray(links) && links.length > 0 && (
            <div className="rounded-xl border border-border divide-y divide-border/40 max-h-48 overflow-y-auto">
              {links.map((l) => (
                <div key={l.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                  <Badge variant="purple">{ENTITY_TYPE_LABELS[l.entityType]}</Badge>
                  <code className="text-xs text-muted-foreground truncate flex-1">{l.entityId}</code>
                  <Badge variant="outline">w{l.weight}</Badge>
                  <Button variant="ghost" size="icon" loading={unlinkKeyword.isPending}
                    onClick={() => handleUnlink(l.entityType, l.entityId)} aria-label="Remove link">
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border/50 pt-4 space-y-3">
          <h3 className="text-sm font-medium text-foreground">Add a link</h3>
          <EntityPicker type={pickType} entityId={pickId} onTypeChange={setPickType}
            onSelect={(id, label) => { setPickId(id); if (label) setPickLabel(label); }} />
          <div className="flex items-end gap-3">
            <div className="w-28">
              <Input label="Weight" type="number" min={1} value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
            <Button leftIcon={<Link2 className="h-4 w-4" />} loading={linkKeyword.isPending} onClick={handleAdd}>Link</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function KeywordsPage() {
  const [type, setType] = useState<KeywordType | "">("");
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);

  const { data: keywords, isLoading } = useSeoKeywords({
    type: type || undefined, search: search || undefined, includeInactive,
  });
  const createKeyword = useCreateSeoKeyword();
  const updateKeyword = useUpdateSeoKeyword();
  const deleteKeyword = useDeleteSeoKeyword();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SeoKeyword | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [linksFor, setLinksFor] = useState<SeoKeyword | null>(null);

  const list = keywords ?? [];

  // Cluster tree: roots first, children indented under their parent when both are in view.
  const { roots, childrenOf } = useMemo(() => {
    const ids = new Set(list.map((k) => k.id));
    const childrenOf = new Map<string, SeoKeyword[]>();
    const roots: SeoKeyword[] = [];
    for (const k of list) {
      if (k.parentId && ids.has(k.parentId)) {
        childrenOf.set(k.parentId, [...(childrenOf.get(k.parentId) ?? []), k]);
      } else {
        roots.push(k);
      }
    }
    return { roots, childrenOf };
  }, [list]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (k: SeoKeyword) => {
    setEditing(k);
    setForm({
      name: k.name, type: k.type, canonicalName: k.canonicalName ?? "", synonyms: k.synonyms ?? [],
      description: k.description ?? "", parentId: k.parentId ?? "",
      seasonStart: k.seasonStart ? k.seasonStart.slice(0, 10) : "",
      seasonEnd: k.seasonEnd ? k.seasonEnd.slice(0, 10) : "",
      isActive: k.isActive,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("The keyword needs a name."); return; }
    const payload = {
      name: form.name.trim(),
      type: form.type,
      canonicalName: form.canonicalName.trim() || undefined,
      synonyms: form.synonyms,
      description: form.description.trim() || undefined,
      parentId: form.parentId || undefined,
      seasonStart: form.seasonStart || undefined,
      seasonEnd: form.seasonEnd || undefined,
      isActive: form.isActive,
    };
    try {
      if (editing) await updateKeyword.mutateAsync({ id: editing.id, payload });
      else await createKeyword.mutateAsync(payload);
      toast.success(editing ? "Keyword updated." : "Keyword created.");
      setShowModal(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Could not save the keyword.");
    }
  };

  const handleDelete = async (k: SeoKeyword) => {
    if (!window.confirm(`Delete "${k.name}"? Its entity links are removed too.`)) return;
    try {
      await deleteKeyword.mutateAsync(k.id);
      toast.success("Keyword deleted.");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Could not delete the keyword.");
    }
  };

  const Row = ({ k, depth }: { k: SeoKeyword; depth: number }) => (
    <div className={`flex items-center gap-2 px-4 py-2.5 hover:bg-accent/40 transition-colors ${depth ? "pl-10" : ""}`}>
      {depth > 0 && <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-foreground truncate">{k.name}</span>
          <Badge variant={TYPE_VARIANTS[k.type]}>{TYPE_LABELS[k.type]}</Badge>
          {!k.isActive && <Badge variant="outline">Inactive</Badge>}
        </div>
        {(k.synonyms?.length || k.canonicalName) ? (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {k.canonicalName ? `canonical: ${k.canonicalName}` : ""}
            {k.canonicalName && k.synonyms?.length ? " · " : ""}
            {k.synonyms?.length ? `synonyms: ${k.synonyms.join(", ")}` : ""}
          </p>
        ) : null}
      </div>
      <button onClick={() => setLinksFor(k)}
        className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
        title="Manage entity links">
        <Link2 className="h-3 w-3" /> {k._count?.links ?? 0}
      </button>
      <Button variant="ghost" size="icon" onClick={() => openEdit(k)} aria-label={`Edit ${k.name}`}><Pencil className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" onClick={() => handleDelete(k)} aria-label={`Delete ${k.name}`}><Trash2 className="h-4 w-4 text-red-500" /></Button>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Keywords & entities</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isLoading ? "Loading…" : `${list.length} keywords · topic clusters used for semantic optimization, never stuffing`}
            </p>
          </div>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>New keyword</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          <Input placeholder="Search names and synonyms…" value={search} onChange={(e) => setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4" />} />
          <Select value={type} onChange={(e) => setType(e.target.value as KeywordType | "")}>
            <option value="">All types</option>
            {KEYWORD_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </Select>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} className="h-4 w-4 rounded border-input" />
            Show inactive
          </label>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="glass-card rounded-2xl overflow-hidden">
          {isLoading && <div className="p-4 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>}
          {!isLoading && list.length === 0 && (
            <EmptyState icon={KeyRound} title="No keywords yet"
              description="Define strategic topics (e.g. Anime Collectibles, Scale Figures, Trading Cards) and link them to products, categories and articles." />
          )}
          <div className="divide-y divide-border/40">
            {roots.map((k) => (
              <div key={k.id}>
                <Row k={k} depth={0} />
                {(childrenOf.get(k.id) ?? []).map((c) => <Row key={c.id} k={c} depth={1} />)}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? `Edit — ${editing.name}` : "New keyword"} maxWidth="max-w-2xl">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Name" placeholder="Anime Collectibles" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <Select label="Type" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as KeywordType }))}>
              {KEYWORD_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Canonical name" placeholder="Consistent entity name used across the site" value={form.canonicalName} onChange={(e) => setForm((f) => ({ ...f, canonicalName: e.target.value }))} />
            <Select label="Parent topic (cluster)" value={form.parentId} onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}>
              <option value="">None (root topic)</option>
              {list.filter((k) => k.id !== editing?.id).map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
            </Select>
          </div>
          <ChipsInput label="Synonyms" values={form.synonyms} onChange={(v) => setForm((f) => ({ ...f, synonyms: v }))} placeholder="Type a synonym and press Enter" />
          <Textarea label="Description" rows={2} placeholder="What this topic covers (internal)" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          {form.type === "SEASONAL" && (
            <div className="grid grid-cols-2 gap-4">
              <Input label="Season start" type="date" value={form.seasonStart} onChange={(e) => setForm((f) => ({ ...f, seasonStart: e.target.value }))} />
              <Input label="Season end" type="date" value={form.seasonEnd} onChange={(e) => setForm((f) => ({ ...f, seasonEnd: e.target.value }))} />
            </div>
          )}
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="h-4 w-4 rounded border-input" />
            Active
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button loading={createKeyword.isPending || updateKeyword.isPending} onClick={handleSave}>Save</Button>
          </div>
        </div>
      </Modal>

      {linksFor && <LinksModal keyword={linksFor} onClose={() => setLinksFor(null)} />}
    </AdminLayout>
  );
}
