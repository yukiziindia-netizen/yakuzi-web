"use client";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Image, GripVertical } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button, Badge, Input, Modal } from "@/components/ui";
import toast from "react-hot-toast";
import { useBanners, useCreateBanner, useUpdateBanner, useDeleteBanner } from "@/hooks/useAdmin";
import { BANNER_ACCEPT, isVideoFile, isVideoUrl, checkBannerFile } from "@yukizi/utils";

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
  const [mobileFile, setMobileFile] = useState<File | null>(null);
  const [mobilePreview, setMobilePreview] = useState<string | null>(null);
  const [removeMobile, setRemoveMobile] = useState(false);
  const mobileFileRef = useRef<HTMLInputElement>(null);

  const banners: any[] = Array.isArray(bannersData) ? bannersData : (bannersData?.data ?? []);

  const openCreate = () => {
    setEditingBanner(null);
    setTitle(""); setLink(""); setFile(null); setPreview(null);
    setMobileFile(null); setMobilePreview(null); setRemoveMobile(false);
    setShowModal(true);
  };

  const openEdit = (banner: any) => {
    setEditingBanner(banner);
    setTitle(banner.title ?? "");
    setLink(banner.link ?? "");
    setFile(null);
    setPreview(banner.imageUrl ?? null);
    setMobileFile(null);
    setMobilePreview(banner.mobileImageUrl ?? null);
    setRemoveMobile(false);
    setShowModal(true);
  };

  /**
   * Preview a picked banner file.
   *
   * Videos get an object URL rather than a base64 data URL. Reading a 40 MB
   * video with readAsDataURL produces a ~53 MB string and holds it in React
   * state, which visibly hangs the tab before anything has even been
   * uploaded. createObjectURL is instant and costs nothing. Images keep the
   * data URL, which is small and survives a re-render without needing to be
   * revoked.
   */
  const previewFor = (f: File): string =>
    isVideoFile(f) ? URL.createObjectURL(f) : "";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    // Let the same file be picked again after a rejection.
    e.target.value = "";
    if (!f) return;

    // Refused here rather than after a minute of uploading, which is what
    // used to happen: the server rejects it, but only once the whole file has
    // arrived.
    const problem = checkBannerFile(f);
    if (problem) {
      toast.error(problem);
      return;
    }

    setFile(f);
    if (isVideoFile(f)) {
      setPreview(previewFor(f));
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleMobileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;

    const problem = checkBannerFile(f);
    if (problem) {
      toast.error(problem);
      return;
    }

    setMobileFile(f);
    setRemoveMobile(false);
    if (isVideoFile(f)) {
      setMobilePreview(previewFor(f));
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setMobilePreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const clearMobileImage = () => {
    setMobileFile(null);
    setMobilePreview(null);
    if (mobileFileRef.current) mobileFileRef.current.value = "";
    // Only meaningful when the stored banner had one to remove
    if (editingBanner?.mobileImageUrl) setRemoveMobile(true);
  };

  const handleSave = async () => {
    const formData = new FormData();
    if (title) formData.append("title", title);
    if (link) formData.append("link", link);
    if (file) formData.append("image", file);
    if (mobileFile) formData.append("mobileImage", mobileFile);
    if (removeMobile && !mobileFile) formData.append("removeMobileImage", "true");
    try {
      if (editingBanner) {
        await updateBanner.mutateAsync({ id: editingBanner.id, payload: formData });
        toast.success("Banner updated");
      } else {
        if (!file) { toast.error("Please select an image or video"); return; }
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
                  {banner.imageUrl && isVideoUrl(banner.imageUrl) ? (
                    // Muted, looping, no controls: the card is a thumbnail of
                    // what shoppers will see, not something to play in here.
                    <video src={banner.imageUrl} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                  ) : banner.imageUrl ? (
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
            <label className="text-sm font-medium text-foreground mb-2 block">Image or video (desktop)</label>
            <input ref={fileRef} type="file" accept={BANNER_ACCEPT} onChange={handleFileChange} className="hidden" />
            <button onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
              {preview ? (
                isVideoUrl(preview) || isVideoFile(file) ? (
                  // Muted and looping so the preview behaves the way the
                  // storefront will, not like a media player.
                  <video src={preview} className="max-h-32 mx-auto rounded-lg" muted loop autoPlay playsInline />
                ) : (
                  <img src={preview} alt="Preview" className="max-h-32 mx-auto rounded-lg" />
                )
              ) : (
                <div>
                  <Image className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">Click to select an image or video</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">JPG, PNG, WebP up to 5MB · MP4, WebM up to 40MB</p>
                </div>
              )}
            </button>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground block">Mobile image or video (optional)</label>
              {mobilePreview && (
                <button onClick={clearMobileImage} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
                  Remove
                </button>
              )}
            </div>
            <input ref={mobileFileRef} type="file" accept={BANNER_ACCEPT} onChange={handleMobileFileChange} className="hidden" />
            <button onClick={() => mobileFileRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
              {mobilePreview ? (
                isVideoUrl(mobilePreview) || isVideoFile(mobileFile) ? (
                  <video src={mobilePreview} className="max-h-24 mx-auto rounded-lg" muted loop autoPlay playsInline />
                ) : (
                  <img src={mobilePreview} alt="Mobile preview" className="max-h-24 mx-auto rounded-lg" />
                )
              ) : (
                <p className="text-xs text-muted-foreground">Shown on phones instead of the desktop file. A still image here with a video above is a good combination — phones get the lighter file. Leave empty to reuse the desktop one.</p>
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
