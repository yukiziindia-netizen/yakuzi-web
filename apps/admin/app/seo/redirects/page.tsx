"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight, CheckCircle2, Download, EyeOff, Pencil, Plus, Route, Search,
  TriangleAlert, Trash2, Upload, Wand2,
} from "lucide-react";
import toast from "react-hot-toast";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  Badge, Button, EmptyState, Input, Modal, Pagination, Select, Skeleton, Tabs, Textarea,
} from "@/components/ui";
import {
  useCreateSeoRedirect, useDeleteSeoRedirect, useSeoRedirects, useUpdateSeoRedirect,
  useBulkCreateSeoRedirects, useBulkDeleteSeoRedirects, useBulkSetSeoRedirectActive,
  useExportSeoRedirects, useResolveSeoRedirect,
  useSeoNotFound, useSeoNotFoundSummary, useSetSeoNotFoundStatus,
  useDeleteSeoNotFound, useClearResolvedSeoNotFound,
} from "@/hooks/useSeo";
import type { SeoRedirect, SeoNotFound, BulkImportResult } from "@/api/seo.api";

const STATUS_CODES = [
  { value: 301, label: "301 — Permanent" },
  { value: 302, label: "302 — Temporary" },
  { value: 308, label: "308 — Permanent (method-safe)" },
  { value: 410, label: "410 — Gone" },
];

const emptyForm = { fromPath: "", toPath: "", statusCode: 301, isActive: true, note: "" };

/**
 * Parse pasted CSV: `from,to[,code][,note]`, one per line.
 *
 * Deliberately forgiving — people paste exports from Screaming Frog, from a
 * spreadsheet, or type rows by hand. A header line is skipped, blank lines and
 * `#` comments are ignored, and quotes are stripped. Anything the server then
 * rejects comes back per-row rather than failing the whole import.
 */
function parseCsv(text: string) {
  const rows: { fromPath: string; toPath: string; statusCode?: number; note?: string }[] = [];
  const bad: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const cells = line.split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
    if (/^from/i.test(cells[0]) && /^to/i.test(cells[1] ?? "")) continue; // header
    const [fromPath, toPath, code, ...noteParts] = cells;
    if (!fromPath || !toPath) { bad.push(line); continue; }
    const statusCode = code ? Number(code) : undefined;
    rows.push({
      fromPath,
      toPath,
      statusCode: Number.isFinite(statusCode) && statusCode ? statusCode : undefined,
      note: noteParts.join(",").trim() || undefined,
    });
  }
  return { rows, bad };
}

function toCsv(items: SeoRedirect[]) {
  const esc = (v: string) => (/[",]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const head = "fromPath,toPath,statusCode,isActive,note,hits";
  const body = items.map((r) =>
    [r.fromPath, r.toPath, String(r.statusCode), String(r.isActive), r.note ?? "", String(r.hits)]
      .map(esc).join(","),
  );
  return [head, ...body].join("\n");
}

export default function RedirectsPage() {
  const [tab, setTab] = useState<"rules" | "broken" | "tester" | "import">("rules");

  // ── rules tab state
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<"recent" | "hits" | "path">("recent");
  const [activeFilter, setActiveFilter] = useState<"all" | "true" | "false">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data, isLoading } = useSeoRedirects({
    search: search || undefined,
    page,
    limit: 20,
    sort,
    isActive: activeFilter === "all" ? undefined : activeFilter === "true",
  });
  const createRedirect = useCreateSeoRedirect();
  const updateRedirect = useUpdateSeoRedirect();
  const deleteRedirect = useDeleteSeoRedirect();
  const bulkActive = useBulkSetSeoRedirectActive();
  const bulkDelete = useBulkDeleteSeoRedirects();
  const exportRules = useExportSeoRedirects();

  // ── 404 tab state
  const [nfStatus, setNfStatus] = useState<"NEW" | "FIXED" | "IGNORED">("NEW");
  const [nfSort, setNfSort] = useState<"hits" | "recent" | "oldest">("hits");
  const [nfPage, setNfPage] = useState(1);
  const { data: nfData, isLoading: nfLoading } = useSeoNotFound({
    status: nfStatus, sort: nfSort, page: nfPage, limit: 20,
  });
  const { data: nfSummary } = useSeoNotFoundSummary();
  const setNfState = useSetSeoNotFoundStatus();
  const deleteNf = useDeleteSeoNotFound();
  const clearResolved = useClearResolvedSeoNotFound();

  // ── tester state
  const [testPath, setTestPath] = useState("");
  const [testRun, setTestRun] = useState(false);
  const { data: resolution, isFetching: testing, error: testError } =
    useResolveSeoRedirect(testPath, testRun);

  // ── import state
  const [csv, setCsv] = useState("");
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
  const bulkCreate = useBulkCreateSeoRedirects();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SeoRedirect | null>(null);
  const [form, setForm] = useState(emptyForm);

  const items = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.limit ?? 20)));
  const nfItems = nfData?.items ?? [];
  const nfTotalPages = Math.max(1, Math.ceil((nfData?.total ?? 0) / (nfData?.limit ?? 20)));
  const isGone = form.statusCode === 410;
  const allOnPageSelected = items.length > 0 && items.every((r) => selected.has(r.id));

  const openCreate = (prefillFrom?: string) => {
    setEditing(null);
    setForm({ ...emptyForm, fromPath: prefillFrom ?? "" });
    setShowModal(true);
  };
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

  const toggleSelected = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const runBulk = async (kind: "enable" | "disable" | "delete") => {
    const ids = [...selected];
    if (!ids.length) return;
    if (kind === "delete" && !window.confirm(`Delete ${ids.length} redirect(s)? This cannot be undone.`)) return;
    try {
      if (kind === "delete") {
        const res = await bulkDelete.mutateAsync(ids);
        toast.success(`Deleted ${res.deleted} redirect(s).`);
      } else {
        const res = await bulkActive.mutateAsync({ ids, isActive: kind === "enable" });
        toast.success(`${kind === "enable" ? "Enabled" : "Disabled"} ${res.updated} redirect(s).`);
      }
      setSelected(new Set());
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Bulk action failed.");
    }
  };

  const handleExport = async () => {
    try {
      const all = await exportRules.mutateAsync();
      const blob = new Blob([toCsv(all)], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `yukizi-redirects-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${all.length} redirect(s).`);
    } catch {
      toast.error("Could not export the redirects.");
    }
  };

  const parsed = useMemo(() => parseCsv(csv), [csv]);

  const handleImport = async () => {
    if (!parsed.rows.length) { toast.error("Nothing to import — add rows as from,to per line."); return; }
    try {
      const res = await bulkCreate.mutateAsync(parsed.rows);
      setImportResult(res);
      toast.success(`Imported ${res.created} of ${parsed.rows.length} row(s).`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Import failed.");
    }
  };

  const fixNotFound = (nf: SeoNotFound) => {
    setTab("rules");
    openCreate(nf.path);
  };

  const ignoreNotFound = async (nf: SeoNotFound) => {
    try {
      await setNfState.mutateAsync({ id: nf.id, status: "IGNORED" });
      toast.success("Marked as ignored — it will stay a 404.");
    } catch {
      toast.error("Could not update that entry.");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Redirects &amp; broken links</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Rules are applied by the storefront before a page renders. Broken links are recorded as visitors hit them.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={handleExport} loading={exportRules.isPending}>
              Export CSV
            </Button>
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => openCreate()}>New redirect</Button>
          </div>
        </div>

        {/* An unresolved-404 count is the thing worth interrupting for: every
            hit is a visitor or a crawler landing on nothing. */}
        {(nfSummary?.unresolved ?? 0) > 0 && tab !== "broken" && (
          <button
            type="button"
            onClick={() => setTab("broken")}
            className="w-full flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left transition-colors hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-900/20 dark:hover:bg-amber-900/30"
          >
            <TriangleAlert className="h-4 w-4 flex-shrink-0 text-amber-600" />
            <span className="text-sm text-amber-800 dark:text-amber-300">
              <strong>{nfSummary?.unresolved}</strong> broken URL{(nfSummary?.unresolved ?? 0) === 1 ? "" : "s"} not dealt with
              {(nfSummary?.unresolvedHits ?? 0) > 0 && <> — <strong>{nfSummary?.unresolvedHits}</strong> visit{(nfSummary?.unresolvedHits ?? 0) === 1 ? "" : "s"} landed on nothing</>}.
              <span className="ml-1 underline">Review them</span>
            </span>
          </button>
        )}

        <Tabs
          active={tab}
          onChange={(v) => setTab(v as typeof tab)}
          tabs={[
            { label: "Rules", value: "rules", count: data?.total },
            { label: "Broken links", value: "broken", count: nfSummary?.unresolved },
            { label: "Tester", value: "tester" },
            { label: "Import", value: "import" },
          ]}
        />

        {/* ── RULES ───────────────────────────────────────── */}
        {tab === "rules" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[16rem] flex-1">
                <Input placeholder="Search paths…" value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  leftIcon={<Search className="h-4 w-4" />} />
              </div>
              <Select label="Sort" value={sort} onChange={(e) => { setSort(e.target.value as typeof sort); setPage(1); }}>
                <option value="recent">Newest first</option>
                <option value="hits">Most used</option>
                <option value="path">Path A–Z</option>
              </Select>
              <Select label="Status" value={activeFilter} onChange={(e) => { setActiveFilter(e.target.value as typeof activeFilter); setPage(1); }}>
                <option value="all">All</option>
                <option value="true">Active only</option>
                <option value="false">Disabled only</option>
              </Select>
            </div>

            {selected.size > 0 && (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-accent/40 px-4 py-2.5">
                <span className="text-sm text-foreground">{selected.size} selected</span>
                <div className="ml-auto flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => runBulk("enable")} loading={bulkActive.isPending}>Enable</Button>
                  <Button size="sm" variant="outline" onClick={() => runBulk("disable")} loading={bulkActive.isPending}>Disable</Button>
                  <Button size="sm" variant="outline" onClick={() => runBulk("delete")} loading={bulkDelete.isPending}>Delete</Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
                </div>
              </div>
            )}

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
              className="glass-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 text-left text-xs uppercase text-muted-foreground">
                      <th className="px-4 py-3 w-10">
                        <input type="checkbox" aria-label="Select all on this page"
                          className="h-4 w-4 rounded border-input accent-[var(--primary,#7B2FBE)]"
                          checked={allOnPageSelected}
                          onChange={(e) => setSelected(e.target.checked ? new Set(items.map((r) => r.id)) : new Set())} />
                      </th>
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
                      <tr key={i}><td colSpan={7} className="px-4 py-3"><Skeleton className="h-6 w-full" /></td></tr>
                    ))}
                    {!isLoading && items.length === 0 && (
                      <tr>
                        <td colSpan={7}>
                          <EmptyState icon={Route} title="No redirects"
                            description="Add a rule when a URL moves or is retired so visitors and search engines land on the right page." />
                        </td>
                      </tr>
                    )}
                    {items.map((r) => (
                      <tr key={r.id} className="hover:bg-accent/40 transition-colors">
                        <td className="px-4 py-3">
                          <input type="checkbox" aria-label={`Select ${r.fromPath}`}
                            className="h-4 w-4 rounded border-input accent-[var(--primary,#7B2FBE)]"
                            checked={selected.has(r.id)} onChange={() => toggleSelected(r.id)} />
                        </td>
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
                          <button type="button" onClick={() => toggleActive(r)} title="Click to toggle">
                            <Badge variant={r.isActive ? "success" : "outline"}>{r.isActive ? "Active" : "Disabled"}</Badge>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-foreground tabular-nums">{r.hits}</td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {r.lastHitAt ? new Date(r.lastHitAt).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => { setTab("tester"); setTestPath(r.fromPath); setTestRun(true); }} aria-label="Test this rule"><Wand2 className="h-4 w-4" /></Button>
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
        )}

        {/* ── BROKEN LINKS ────────────────────────────────── */}
        {tab === "broken" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Every URL a visitor or crawler asked for that did not exist, most-requested first. Fixing one creates a
              redirect and clears it from this list automatically.
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <Select label="Show" value={nfStatus} onChange={(e) => { setNfStatus(e.target.value as typeof nfStatus); setNfPage(1); }}>
                <option value="NEW">Not dealt with ({nfSummary?.unresolved ?? 0})</option>
                <option value="FIXED">Fixed ({nfSummary?.fixed ?? 0})</option>
                <option value="IGNORED">Ignored ({nfSummary?.ignored ?? 0})</option>
              </Select>
              <Select label="Sort" value={nfSort} onChange={(e) => { setNfSort(e.target.value as typeof nfSort); setNfPage(1); }}>
                <option value="hits">Most requested</option>
                <option value="recent">Most recent</option>
                <option value="oldest">Oldest</option>
              </Select>
              {nfStatus !== "NEW" && (
                <Button variant="outline" loading={clearResolved.isPending}
                  onClick={async () => {
                    if (!window.confirm("Remove every fixed and ignored entry from this log?")) return;
                    const res = await clearResolved.mutateAsync();
                    toast.success(`Cleared ${res.deleted} entr${res.deleted === 1 ? "y" : "ies"}.`);
                  }}>
                  Clear fixed &amp; ignored
                </Button>
              )}
            </div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
              className="glass-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 text-left text-xs uppercase text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Broken URL</th>
                      <th className="px-4 py-3 font-medium">Hits</th>
                      <th className="px-4 py-3 font-medium">Came from</th>
                      <th className="px-4 py-3 font-medium">Last seen</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {nfLoading && Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i}><td colSpan={5} className="px-4 py-3"><Skeleton className="h-6 w-full" /></td></tr>
                    ))}
                    {!nfLoading && nfItems.length === 0 && (
                      <tr>
                        <td colSpan={5}>
                          <EmptyState icon={CheckCircle2} title="Nothing here"
                            description={nfStatus === "NEW"
                              ? "No broken URLs are waiting. New ones appear as soon as a visitor hits one."
                              : "No entries with this status."} />
                        </td>
                      </tr>
                    )}
                    {nfItems.map((nf) => (
                      <tr key={nf.id} className="hover:bg-accent/40 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs truncate block max-w-[22rem]" title={nf.path}>{nf.path}</span>
                        </td>
                        <td className="px-4 py-3 text-foreground tabular-nums">{nf.hits}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {nf.lastReferrer
                            ? <span className="truncate block max-w-[16rem] text-xs" title={nf.lastReferrer}>{nf.lastReferrer}</span>
                            : <span className="text-xs">Typed or unknown</span>}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                          {new Date(nf.lastSeenAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            {nf.status === "NEW" && (
                              <>
                                <Button size="sm" onClick={() => fixNotFound(nf)}>Create redirect</Button>
                                <Button variant="ghost" size="icon" aria-label="Ignore" title="Leave this as a 404"
                                  onClick={() => ignoreNotFound(nf)}><EyeOff className="h-4 w-4" /></Button>
                              </>
                            )}
                            <Button variant="ghost" size="icon" aria-label="Remove from log"
                              onClick={() => deleteNf.mutate(nf.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={nfPage} totalPages={nfTotalPages} onPageChange={setNfPage} />
            </motion.div>
          </div>
        )}

        {/* ── TESTER ──────────────────────────────────────── */}
        {tab === "tester" && (
          <div className="space-y-4 max-w-2xl">
            <p className="text-sm text-muted-foreground">
              Check what actually happens to a URL — including whether it passes through more than one rule before
              arriving, which search engines dislike.
            </p>
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setTestRun(true); }}>
              <Input placeholder="/old-page" value={testPath}
                onChange={(e) => { setTestPath(e.target.value); setTestRun(false); }} />
              <Button type="submit" loading={testing} leftIcon={<Wand2 className="h-4 w-4" />}>Test</Button>
            </form>

            {testRun && testError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
                {(testError as any)?.response?.data?.message ?? "Could not test that path."}
              </div>
            )}

            {testRun && resolution && !testing && (
              <div className="glass-card rounded-2xl p-5 space-y-3">
                {resolution.outcome === "no-redirect" && (
                  <p className="text-sm text-foreground">
                    <Badge variant="outline">No rule</Badge>{" "}
                    <span className="ml-1">Nothing redirects <code className="font-mono text-xs">{resolution.path}</code>. It is served directly, or 404s if no page exists.</span>
                  </p>
                )}
                {resolution.outcome === "inactive" && (
                  <p className="text-sm text-foreground">
                    <Badge variant="warning">Disabled</Badge>
                    <span className="ml-2">{resolution.note}</span>
                  </p>
                )}
                {resolution.outcome === "loop" && (
                  <p className="text-sm text-foreground">
                    <Badge variant="error">Loop</Badge>
                    <span className="ml-2">These rules point back at each other, so the browser gives up and the page never loads.</span>
                  </p>
                )}
                {(resolution.outcome === "redirect" || resolution.outcome === "chain") && (
                  <p className="text-sm text-foreground">
                    <Badge variant={resolution.outcome === "chain" ? "warning" : "success"}>
                      {resolution.outcome === "chain" ? `${resolution.chain.length} hops` : "1 hop"}
                    </Badge>
                    <span className="ml-2">
                      Ends at <code className="font-mono text-xs">{resolution.finalPath}</code>.
                      {resolution.outcome === "chain" && " Point the first rule straight at the final destination — every extra hop is slower for visitors and dilutes ranking signals."}
                    </span>
                  </p>
                )}
                {resolution.chain.length > 0 && (
                  <ol className="space-y-1.5 border-t border-border/50 pt-3">
                    {resolution.chain.map((hop, i) => (
                      <li key={`${hop.from}-${i}`} className="flex items-center gap-2 font-mono text-xs">
                        <span className="text-muted-foreground w-5 tabular-nums">{i + 1}.</span>
                        <span>{hop.from}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{hop.to}</span>
                        <Badge variant="info" size="sm">{hop.statusCode}</Badge>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── IMPORT ──────────────────────────────────────── */}
        {tab === "import" && (
          <div className="space-y-4 max-w-2xl">
            <p className="text-sm text-muted-foreground">
              One rule per line as <code className="font-mono text-xs">from,to</code>, optionally followed by a status
              code and a note. A header row, blank lines and <code className="font-mono text-xs">#</code> comments are
              ignored. Rows that fail are reported individually — the rest still import.
            </p>
            <Textarea
              rows={10}
              className="font-mono text-xs"
              placeholder={"/old-figures,/category/figurines\n/naruto-old,/category/naruto,301,Renamed collection\n/dead-page,/,410"}
              value={csv}
              onChange={(e) => { setCsv(e.target.value); setImportResult(null); }}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button leftIcon={<Upload className="h-4 w-4" />} onClick={handleImport} loading={bulkCreate.isPending}
                disabled={!parsed.rows.length}>
                Import {parsed.rows.length > 0 ? `${parsed.rows.length} rule(s)` : ""}
              </Button>
              {parsed.bad.length > 0 && (
                <span className="text-sm text-amber-600">
                  {parsed.bad.length} line(s) skipped — each needs both a from and a to path.
                </span>
              )}
            </div>

            {importResult && (
              <div className="glass-card rounded-2xl p-5 space-y-3">
                <p className="text-sm text-foreground">
                  <Badge variant="success">{importResult.created} created</Badge>
                  {importResult.failed.length > 0 && (
                    <Badge variant="error" className="ml-2">{importResult.failed.length} failed</Badge>
                  )}
                </p>
                {importResult.failed.length > 0 && (
                  <ul className="space-y-1 border-t border-border/50 pt-3">
                    {importResult.failed.map((f, i) => (
                      <li key={`${f.fromPath}-${i}`} className="text-xs">
                        <code className="font-mono">{f.fromPath}</code>
                        <span className="text-muted-foreground"> — {f.reason}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
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
