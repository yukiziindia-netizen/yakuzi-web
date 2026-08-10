"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Pencil, Plus, Route, Search, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Badge, Button, EmptyState, Input, Modal, Pagination, Select, Skeleton, Textarea } from "@/components/ui";
import { useCreateSeoRedirect, useDeleteSeoRedirect, useSeoRedirects, useUpdateSeoRedirect } from "@/hooks/useSeo";
import type { SeoRedirect } from "@/api/seo.api";

const STATUS_CODES = [
  { value: 301, label: "301 — Permanent" },
  { value: 302, label: "302 — Temporary" },
  { value: 308, label: "308 — Permanent (method-safe)" },
  { value: 410, label: "410 — Gone" },
];

const emptyForm = { fromPath: "", toPath: "", statusCode: 301, isActive: true, note: "" };

export default function RedirectsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useSeoRedirects({ search: search || undefined, page, limit: 20 });
  const createRedirect = useCreateSeoRedirect();
  const updateRedirect = useUpdateSeoRedirect();
  const deleteRedirect = useDeleteSeoRedirect();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SeoRedirect | null>(null);
  const [form, setForm] = useState(emptyForm);

  const items = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.limit ?? 20)));
  const isGone = form.statusCode === 410;

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (r: SeoRedirect) => {
    setEditing(r);
    setForm({ fromPath: r.fromPath, toPath: r.toPath, statusCode: r.statusCode, isActive: r.isActive, note: r.note ?? "" });
    setShowModal(true);
  };

  const handleSave = async () => {
    const fromPath = form.fromPath.trim();
    const toPath = form.toPath.trim();
    if (!fromPath.startsWith("/")) { toast.error("The from-path must start with / (e.g. /old-page)."); return; }
    if (!isGone && !toPath) { toast.error("A destination path is required."); return; }
    const payload = { fromPath, toPath: isGone ? "/" : toPath, statusCode: form.statusCode, isActive: form.isActive, note: form.note.trim() || undefined };
    try {
      if (editing) await updateRedirect.mutateAsync({ id: editing.id, payload });
      else await createRedirect.mutateAsync(payload);
      toast.success(editing ? "Redirect updated." : "Redirect created.");
      setShowModal(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Could not save the redirect.");
    }
  };

  const handleDelete = async (r: SeoRedirect) => {
    if (!window.confirm(`Delete the redirect ${r.fromPath} → ${r.toPath}?`)) return;
    try {
      await deleteRedirect.mutateAsync(r.id);
      toast.success("Redirect deleted.");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Could not delete the redirect.");
    }
  };

  const toggleActive = async (r: SeoRedirect) => {
    try {
      await updateRedirect.mutateAsync({ id: r.id, payload: { isActive: !r.isActive } });
      toast.success(r.isActive ? "Redirect disabled." : "Redirect enabled.");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Could not update the redirect.");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Redirects</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isLoading ? "Loading…" : `${data?.total ?? 0} rules · applied by the storefront before rendering`}
            </p>
          </div>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>New redirect</Button>
        </div>

        <div className="max-w-md">
          <Input placeholder="Search paths…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} leftIcon={<Search className="h-4 w-4" />} />
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Rule</th>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Hits</th>
                  <th className="px-4 py-3 font-medium">Last hit</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {isLoading && Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-4 py-3"><Skeleton className="h-6 w-full" /></td></tr>
                ))}
                {!isLoading && items.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState icon={Route} title="No redirects"
                        description="Add a rule when a URL moves or is retired so visitors and search engines land on the right page." />
                    </td>
                  </tr>
                )}
                {items.map((r) => (
                  <tr key={r.id} className="hover:bg-accent/40 transition-colors">
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 font-mono text-xs">
                        <span className="truncate max-w-[12rem]" title={r.fromPath}>{r.fromPath}</span>
                        <ArrowRight className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                        <span className="truncate max-w-[12rem] text-muted-foreground" title={r.toPath}>{r.statusCode === 410 ? "(gone)" : r.toPath}</span>
                      </span>
                      {r.note && <span className="block mt-0.5 text-xs text-muted-foreground truncate max-w-[26rem]">{r.note}</span>}
                    </td>
                    <td className="px-4 py-3"><Badge variant={r.statusCode === 410 ? "error" : "info"}>{r.statusCode}</Badge></td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActive(r)} title="Click to toggle">
                        <Badge variant={r.isActive ? "success" : "outline"}>{r.isActive ? "Active" : "Disabled"}</Badge>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-foreground">{r.hits}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {r.lastHitAt ? new Date(r.lastHitAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(r)} aria-label="Edit redirect"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(r)} aria-label="Delete redirect"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </motion.div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? "Edit redirect" : "New redirect"}>
        <div className="space-y-4">
          <Input label="From path" placeholder="/old-collection" value={form.fromPath} onChange={(e) => setForm((f) => ({ ...f, fromPath: e.target.value }))} />
          <Select label="Status code" value={String(form.statusCode)} onChange={(e) => setForm((f) => ({ ...f, statusCode: Number(e.target.value) }))}>
            {STATUS_CODES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
          {!isGone && (
            <Input label="To path" placeholder="/category/new-collection" value={form.toPath} onChange={(e) => setForm((f) => ({ ...f, toPath: e.target.value }))} />
          )}
          <Textarea label="Note (internal)" rows={2} placeholder="Why this redirect exists" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="h-4 w-4 rounded border-input accent-[var(--primary,#7B2FBE)]" />
            Active
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button loading={createRedirect.isPending || updateRedirect.isPending} onClick={handleSave}>Save</Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
