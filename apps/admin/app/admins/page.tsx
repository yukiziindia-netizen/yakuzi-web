"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Pencil, Trash2, Shield } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button, Badge, Input, Modal } from "@/components/ui";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { useAdmins, useCreateAdmin, useUpdateAdmin, useDeleteAdmin } from "@/hooks/useAdmin";

const PERMISSION_LABELS: Record<string, string> = {
  "1": "View Users", "2": "Manage Users", "3": "View Products", "4": "Manage Products",
  "5": "View Orders", "6": "Manage Orders", "7": "View Payments", "8": "Manage Payments",
  "9": "View Settlements", a: "Manage Settlements", b: "View Tickets", c: "Manage Tickets",
  d: "View Suggestions", e: "Manage Suggestions", f: "View Product Requests", g: "Manage Product Requests",
  h: "View Marketing", i: "Manage Marketing", j: "View Notifications", k: "Manage Notifications",
  l: "View Referrals", m: "Manage Referrals", n: "View Custom Orders", o: "Manage Custom Orders",
  p: "View Analytics", q: "Manage Analytics", r: "View Settings", s: "Manage Settings",
  v: "View Banners", w: "Manage Banners",
  x: "Super Admin",
};

export default function AdminManagementPage() {
  const { data: adminsData, isLoading } = useAdmins();
  const createAdmin = useCreateAdmin();
  const updateAdmin = useUpdateAdmin();
  const deleteAdmin = useDeleteAdmin();
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [form, setForm] = useState({ name: "", phone: "", department: "General", permissions: "" });
  const [search, setSearch] = useState("");

  const admins: any[] = Array.isArray(adminsData) ? adminsData : (adminsData?.data ?? []);
  const filtered = admins.filter((a: any) =>
    !search || (a.name ?? "").toLowerCase().includes(search.toLowerCase()) || (a.phone ?? "").includes(search)
  );

  const openCreate = () => {
    setEditingAdmin(null);
    setForm({ name: "", phone: "", department: "General", permissions: "" });
    setShowModal(true);
  };

  const openEdit = (admin: any) => {
    setEditingAdmin(admin);
    setForm({ name: admin.name ?? "", phone: admin.phone ?? "", department: admin.department ?? "General", permissions: admin.permissions ?? "" });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingAdmin) {
        // Omit phone for updates as it's not editable and may trigger validation errors (forbidNonWhitelisted)
        // This also prevents potential issues if the backend expects a strict DTO without 'phone'
        const { phone, ...payload } = form;
        await updateAdmin.mutateAsync({ adminId: editingAdmin.id, payload });
        toast.success("Admin updated");
      } else {
        await createAdmin.mutateAsync(form);
        toast.success("Admin created");
      }
      setShowModal(false);
    } catch {
      toast.error(editingAdmin ? "Failed to update admin" : "Failed to create admin");
    }
  };

  const handleDelete = async (admin: any) => {
    if (!window.confirm(`Remove admin "${admin.name}"?`)) return;
    try {
      await deleteAdmin.mutateAsync(admin.id);
      toast.success("Admin removed");
    } catch {
      toast.error("Failed to remove admin");
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Loading admins…</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-2xl text-foreground">Admin Management</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{admins.length} admin users</p>
          </div>
          <Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>Add Admin</Button>
        </div>

        <div className="max-w-sm">
          <Input placeholder="Search admins…" value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4" />} />
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  {["Admin", "Phone", "Unique ID", "Department", "Permissions", "Created", "Actions"].map(h => (
                    <th key={h} className="px-5 py-3.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">No admins found</td></tr>
                ) : filtered.map((admin: any, i: number) => (
                  <motion.tr key={admin.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="hover:bg-accent/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <Shield className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-semibold text-foreground">{admin.name ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-mono text-muted-foreground">{admin.phone ?? "—"}</td>
                    <td className="px-5 py-4 max-w-[120px]">
                      <span className="font-mono text-[10px] text-muted-foreground break-all whitespace-normal leading-tight block">{admin.id}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <Badge variant={admin.permissions?.includes("x") ? "purple" : "info"}>
                        {admin.permissions?.includes("x") ? "Super Admin" : (admin.department || "Admin")}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {admin.permissions?.includes("x") ? (
                          <Badge variant="purple" size="sm">All</Badge>
                        ) : (
                          (admin.permissions ?? "").split("").filter((c: string) => PERMISSION_LABELS[c]).slice(0, 4).map((c: string) => (
                            <Badge key={c} size="sm">{PERMISSION_LABELS[c]}</Badge>
                          ))
                        )}
                        {!admin.permissions?.includes("x") && (admin.permissions ?? "").length > 4 && (
                          <Badge size="sm">+{(admin.permissions ?? "").length - 4}</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground text-center">{admin.createdAt ? new Date(admin.createdAt).toLocaleDateString("en-IN") : "—"}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(admin)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(admin)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingAdmin ? "Edit Admin" : "Add Admin"}>
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Admin name" />
          <Input label="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="10-digit phone" disabled={!!editingAdmin} />
          <Input label="Department" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="e.g. Sales, Operations, Technical" />
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">System Permissions</label>
            <div className="space-y-3">
              <div className={cn(
                "p-3 rounded-xl transition-all border",
                form.permissions.includes("x") 
                  ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-900/40" 
                  : "bg-muted/30 border-transparent hover:border-border"
              )}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.permissions.includes("x")}
                    onChange={e => setForm(f => ({ ...f, permissions: e.target.checked ? "x" : "" }))}
                    className="h-4 w-4 rounded border-purple-300 text-purple-600 focus:ring-purple-500" />
                  <div>
                    <div className="text-sm font-semibold text-foreground">Super Admin (Full Access)</div>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">Grants unrestricted access to all dashboard modules and administrative settings.</p>
                  </div>
                </label>
              </div>

              {!form.permissions.includes("x") && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {Object.entries(PERMISSION_LABELS).filter(([c]) => c !== "x").map(([code, label]) => (
                    <label key={code} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1.5 rounded-lg transition-colors">
                      <input type="checkbox" checked={form.permissions.includes(code)}
                        onChange={e => {
                          setForm(f => ({
                            ...f,
                            permissions: e.target.checked
                              ? f.permissions + code
                              : f.permissions.replace(code, ""),
                          }));
                        }}
                        className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5" />
                      <span className="text-muted-foreground text-xs">{label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={createAdmin.isPending || updateAdmin.isPending}>
              {editingAdmin ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
