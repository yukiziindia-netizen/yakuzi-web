"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Image as ImageIcon, Edit2, Loader2, GripVertical } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button, Input, Modal, Badge } from "@/components/ui";
import toast from "react-hot-toast";
import { useAdminBrands, useCreateBrand, useUpdateBrand, useDeleteBrand } from "@/hooks/useAdmin";
import { uploadImage } from "@/api/admin.api";

export default function AdminBrandsPage() {
  const { data: brandsData, isLoading } = useAdminBrands();
  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();
  const deleteBrand = useDeleteBrand();

  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any>(null);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const brands: any[] = Array.isArray(brandsData) ? brandsData : [];

  const openCreate = () => {
    setEditingBrand(null);
    setName("");
    setFile(null);
    setPreview(null);
    setShowModal(true);
  };

  const openEdit = (brand: any) => {
    setEditingBrand(brand);
    setName(brand.name);
    setFile(null);
    setPreview(brand.imageUrl);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Brand name is required");

    try {
      setUploading(true);
      let finalImageUrl = preview || "";
      if (file) {
        finalImageUrl = await uploadImage(file);
      }

      if (!finalImageUrl) {
        setUploading(false);
        return toast.error("Please provide a brand logo");
      }

      if (editingBrand) {
        await updateBrand.mutateAsync({ id: editingBrand.id, payload: { name, imageUrl: finalImageUrl } });
        toast.success("Brand updated");
      } else {
        await createBrand.mutateAsync({ name, imageUrl: finalImageUrl });
        toast.success("Brand created");
      }
      setShowModal(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save brand");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (brand: any) => {
    if (!window.confirm(`Delete brand "${brand.name}"?`)) return;
    try {
      await deleteBrand.mutateAsync(brand.id);
      toast.success("Brand deleted");
    } catch {
      toast.error("Failed to delete brand");
    }
  };

  const handleToggleStatus = async (brand: any) => {
    try {
      await updateBrand.mutateAsync({ id: brand.id, payload: { isActive: !brand.isActive } });
      toast.success(`Brand ${brand.isActive ? 'disabled' : 'enabled'}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-2xl text-foreground">Brands</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{brands.length} brands</p>
          </div>
          <Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>Add Brand</Button>
        </div>

        {isLoading ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Loading brands...</p>
          </div>
        ) : brands.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-sm text-muted-foreground">No brands yet. Add one to display on the homepage.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {brands.map((brand: any, i: number) => (
              <motion.div key={brand.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                className="glass-card rounded-2xl overflow-hidden group border border-border">
                <div className="aspect-square bg-white relative p-4 flex items-center justify-center">
                  {brand.imageUrl ? (
                    <img src={brand.imageUrl} alt={brand.name} className="max-w-full max-h-full object-contain" />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
                  )}
                  
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="xs" variant="secondary" onClick={() => openEdit(brand)} className="h-8 w-8 p-0" title="Edit">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="xs" variant="danger" onClick={() => handleDelete(brand)} className="h-8 w-8 p-0" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="absolute top-2 left-2 cursor-pointer" onClick={() => handleToggleStatus(brand)}>
                    <Badge variant={brand.isActive ? "success" : "default"}>
                      {brand.isActive ? 'Active' : 'Hidden'}
                    </Badge>
                  </div>
                </div>
                <div className="p-3 border-t border-border/50 text-center bg-muted/10">
                  <p className="text-sm font-semibold text-foreground truncate">{brand.name}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-card/60 glass-card rounded-2xl shadow-xl overflow-hidden border border-border">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-1">
                  {editingBrand ? "Edit Brand" : "Add Brand"}
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Enter the details for this brand.
                </p>
                <form onSubmit={handleSave} className="space-y-4">
                  <Input label="Brand Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Cipla" required autoFocus />
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Brand Logo</label>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    {preview ? (
                      <div className="relative aspect-[2/1] w-full rounded-xl overflow-hidden group bg-white border border-border flex items-center justify-center">
                        <img src={preview} alt="Preview" className="max-w-[80%] max-h-[80%] object-contain" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button type="button" variant="ghost" className="text-white hover:bg-white/20" onClick={() => fileRef.current?.click()}>
                            Change Logo
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={() => fileRef.current?.click()}
                        className="w-full aspect-[2/1] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-muted/50 hover:border-primary/50 transition-colors">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Plus className="h-5 w-5" />
                        </div>
                        <div className="text-sm font-medium text-foreground">Upload Logo</div>
                        <div className="text-xs text-muted-foreground">Recommend transparent PNG</div>
                      </button>
                    )}
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button type="submit" loading={uploading || createBrand.isPending || updateBrand.isPending}>
                      {editingBrand ? "Save Changes" : "Create"}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
