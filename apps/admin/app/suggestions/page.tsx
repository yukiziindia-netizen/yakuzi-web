"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button, Badge, Input, Pagination } from "@/components/ui";
import toast from "react-hot-toast";
import { useSuggestions, useDeleteSuggestion } from "@/hooks/useAdmin";
import { SuggestionForm } from "@/components/suggestions/suggestion-form";

export default function MasterCatalogPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft">("all");
  const limit = 25;
  const { data: suggestionsData, isLoading } = useSuggestions({ page, limit, search: search || undefined });
  const deleteSuggestion = useDeleteSuggestion();
  
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editing, setEditing] = useState<any>(null);

  const allSuggestions: any[] = Array.isArray(suggestionsData) ? suggestionsData : (suggestionsData?.data ?? []);
  const total = suggestionsData?.total ?? allSuggestions.length;

  const suggestions = allSuggestions.filter((s: any) => {
    if (statusFilter === "active") return s.isActive !== false;
    if (statusFilter === "draft")  return s.isActive === false;
    return true;
  });

  const activeCount = allSuggestions.filter((s: any) => s.isActive !== false).length;
  const draftCount  = allSuggestions.filter((s: any) => s.isActive === false).length;

  const openCreate = () => {
    setEditing(null);
    setView('form');
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setView('form');
  };

  const handleDelete = async (item: any) => {
    if (!window.confirm(`Delete "${item.name}" from catalog?`)) return;
    try {
      await deleteSuggestion.mutateAsync(item.id);
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Loading master catalog…</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (view === 'form') {
    return (
      <AdminLayout>
        <SuggestionForm 
          initialData={editing} 
          onClose={() => setView('list')} 
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-semibold text-2xl text-foreground">Master Product Catalog</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage standardized products for seller lookup</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>Add Product</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="max-w-md">
              <Input placeholder="Search catalog…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} leftIcon={<Search className="h-4 w-4" />} />
            </div>

            <div className="flex gap-1.5">
              {([
                { key: "all",    label: "All",    count: allSuggestions.length },
                { key: "active", label: "Active", count: activeCount },
                { key: "draft",  label: "Draft",  count: draftCount },
              ] as const).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => { setStatusFilter(tab.key); setPage(1); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                    statusFilter === tab.key
                      ? tab.key === "draft"
                        ? "bg-muted text-foreground border-border shadow-sm"
                        : "bg-primary text-white border-primary"
                      : "border-border text-muted-foreground hover:bg-accent/60"
                  }`}
                >
                  {tab.label}
                  <span className="ml-1.5 opacity-70">({tab.count})</span>
                </button>
              ))}
            </div>

            <div className="glass-card rounded-2xl overflow-hidden border border-border/50">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/20">
                      {["Product Details", "MRP", "Category", "Status", "Actions"].map(h => (
                        <th key={h} className="px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {suggestions.length === 0 ? (
                      <tr><td colSpan={5} className="py-20 text-center text-sm text-muted-foreground">No catalog entries found.</td></tr>
                    ) : suggestions.map((s: any, i: number) => (
                      <motion.tr key={s.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className="hover:bg-accent/30 transition-colors group">
                        <td className="px-5 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{s.name}</span>
                            <span className="text-xs text-muted-foreground">{s.manufacturer}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-foreground">{s.mrp ? `₹${s.mrp}` : "—"}</td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1">
                            <Badge variant="outline" className="text-[10px] w-fit">{s.category?.name || s.category || "General"}</Badge>
                            {s.subCategory && <span className="text-[10px] text-muted-foreground px-1">{s.subCategory?.name || s.subCategory}</span>}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {s.isActive === false ? (
                            <Badge variant="default" className="text-[10px]">Draft</Badge>
                          ) : (
                            <Badge variant="success" className="text-[10px]">Active</Badge>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(s)} className="h-8 w-8 hover:bg-primary/10 hover:text-primary"><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(s)} className="h-8 w-8 hover:bg-red-500/10 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {total > limit && (
                <div className="p-4 border-t border-border/50 bg-muted/5">
                  <Pagination page={page} totalPages={Math.ceil(total / limit)} onPageChange={setPage} />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card p-6 rounded-2xl border border-border/50">
              <h3 className="font-semibold mb-4 text-foreground">Catalog Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/30 rounded-xl">
                  <p className="text-xs text-muted-foreground uppercase font-medium">Total Items</p>
                  <p className="text-2xl font-bold text-foreground">{total}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl">
                  <p className="text-xs text-muted-foreground uppercase font-medium">Active</p>
                  <p className="text-2xl font-bold text-green-600">{activeCount}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl col-span-2">
                  <p className="text-xs text-muted-foreground uppercase font-medium">Draft</p>
                  <p className="text-2xl font-bold text-foreground">{draftCount}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
