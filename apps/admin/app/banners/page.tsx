"use client";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Image, GripVertical } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button, Badge, Input, Modal } from "@/components/ui";
import toast from "react-hot-toast";
import { useBanners, useCreateBanner, useUpdateBanner, useDeleteBanner } from "@/hooks/useAdmin";

export default function BannersPage() {
  const { data: bannersData, isLoading } = useBanners();
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const banners: any[] = Array.isArray(bannersData) ? bannersData : (bannersData?.data ?? []);

  const openCreate = () => {
    setEditingBanner(null);
    setTitle(""); setLink(""); setFile(null); setPreview(null);
    setShowModal(true);
  };

  const openEdit = (banner: any) => {
    setEditingBanner(banner);
    setTitle(banner.title ?? "");
    setLink(banner.link ?? "");
    setFile(null);
    setPreview(banner.imageUrl ?? null);
    setShowModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleSave = async () => {
    const formData = new FormData();
    if (title) formData.append("title", title);
    if (link) formData.append("link", link);
    if (file) formData.append("image", file);
    try {
      if (editingBanner) {
        await updateBanner.mutateAsync({ id: editingBanner.id, payload: formData });
        toast.success("Banner updated");
      } else {
        if (!file) { toast.error("Please select an image"); return; }
        await createBanner.mutateAsync(formData);
        toast.success("Banner created");
      }
      setShowModal(false);
    } catch {
      toast.error("Failed to save banner");
    }
  };

  const handleDelete = async (banner: any) => {
    if (!window.confirm("Delete this banner?")) return;
    try {
      await deleteBanner.mutateAsync(banner.id);
      toast.success("Banner deleted");
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
            <p className="text-sm text-muted-foreground">Loading banners…</p>
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
            <h1 className="font-semibold text-2xl text-foreground">Banner Management</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{banners.length} banners · Displayed on buyer app homepage</p>
          </div>
          <Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>Add Banner</Button>
        </div>

        {banners.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <Image className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-sm text-muted-foreground">No banners yet. Add one to display on the homepage.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {banners.map((banner: any, i: number) => (
              <motion.div key={banner.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="glass-card rounded-2xl overflow-hidden group">
                <div className="aspect-[16/7] bg-muted/30 relative">
                  {banner.imageUrl ? (
                    <img src={banner.imageUrl} alt={banner.title ?? "Banner"} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="xs" variant="secondary" onClick={() => openEdit(banner)}>Edit</Button>
                    <Button size="xs" variant="danger" onClick={() => handleDelete(banner)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  {banner.order != null && (
                    <div className="absolute top-2 left-2">
                      <Badge variant="info">#{banner.order + 1}</Badge>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-sm font-semibold text-foreground">{banner.title || "Untitled Banner"}</p>
                  {banner.link && <p className="text-xs text-muted-foreground mt-1 truncate">{banner.link}</p>}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingBanner ? "Edit Banner" : "Add Banner"}>
        <div className="space-y-4">
          <Input label="Title (optional)" value={title} onChange={e => setTitle(e.target.value)} placeholder="Banner title" />
          <Input label="Link (optional)" value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." />
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Image</label>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            <button onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
              {preview ? (
                <img src={preview} alt="Preview" className="max-h-32 mx-auto rounded-lg" />
              ) : (
                <div>
                  <Image className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">Click to select image</p>
                </div>
              )}
            </button>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={createBanner.isPending || updateBanner.isPending}>
              {editingBanner ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
