"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Edit2, Trash2, FolderTree, ArrowRight, Loader2, ChevronDown, Layers, GripVertical, X } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useSeoMetaOne, useUpsertSeoMeta } from "@/hooks/useSeo";
import { ProductSeoFields, emptyProductSeoForm, productSeoFormFromRecord, productSeoFormHasContent, productSeoFormToPayload, type ProductSeoForm } from "@/components/seo/product-seo-fields";
import { Button, Input, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory,
  useSubCategories, useCreateSubCategory, useUpdateSubCategory, useDeleteSubCategory,
  useReplaceCategoryBanners, useReplaceSubCategoryBanners,
} from "@/hooks/useAdmin";
import { uploadImage } from "@/api/admin.api";

const MAX_SLIDES = 10;

// One slide of the banner slideshow being edited. `image`/`mobileImage` hold
// already-uploaded URLs; `file`/`mobileFile` hold not-yet-uploaded picks
// (uploaded only on Save, so Cancel never leaves orphan uploads).
type BannerSlideDraft = {
  key: string;
  image: string;
  mobileImage: string;
  file: File | null;
  mobileFile: File | null;
  preview: string | null;
  mobilePreview: string | null;
};

let slideKeySeq = 0;
const newSlideKey = () => `slide-${++slideKeySeq}`;

const emptySlide = (): BannerSlideDraft => ({
  key: newSlideKey(),
  image: "",
  mobileImage: "",
  file: null,
  mobileFile: null,
  preview: null,
  mobilePreview: null,
});

function SortableSlide({ id, disabled, children }: { id: string; disabled: boolean; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style} className={cn("flex gap-3 items-start rounded-xl border border-border/60 bg-background/40 p-3", isDragging && "opacity-50")}>
      <div className={cn("pt-8 text-muted-foreground", disabled ? "cursor-not-allowed opacity-40" : "cursor-grab active:cursor-grabbing")} aria-label="Reorder" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4" />
      </div>
      {children}
    </div>
  );
}

export default function AdminCollectionsPage() {
  const [view, setView] = useState<"categories" | "subcategories">("categories");
  const [search, setSearch] = useState("");

  const { data: categoriesData, isLoading: catLoading } = useCategories();
  const { data: subCatsData, isLoading: subLoading } = useSubCategories();

  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory();
  const deleteCat = useDeleteCategory();
  const createSubCat = useCreateSubCategory();
  const updateSubCat = useUpdateSubCategory();
  const deleteSubCat = useDeleteSubCategory();
  const replaceCatBanners = useReplaceCategoryBanners();
  const replaceSubCatBanners = useReplaceSubCategoryBanners();

  // Add-type picker dropdown
  const [addPickerOpen, setAddPickerOpen] = useState(false);
  const addPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (addPickerRef.current && !addPickerRef.current.contains(e.target as Node)) {
        setAddPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Modal State — addType tracks what is being created/edited independently of view tab
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [addType, setAddType] = useState<"categories" | "subcategories">("categories");
  const [editId, setEditId] = useState("");
  // Full modal-embedded SEO (per Rishi: everything at the source, no separate
  // row button) — the same tabbed fields the product pages embed, writing the
  // same SeoMeta record the SEO tab used to edit.
  const modalSeoType = addType === "categories" ? "CATEGORY" : "SUB_CATEGORY";
  const { data: modalSeo } = useSeoMetaOne(
    modalOpen && modalMode === "edit" ? modalSeoType : undefined,
    editId || undefined,
  );
  const upsertSeo = useUpsertSeoMeta();
  const [seoForm, setSeoForm] = useState<ProductSeoForm>(emptyProductSeoForm());
  const [editSlug, setEditSlug] = useState("");
  // Seed ONCE per edit session: react-query refetches on window refocus, and
  // re-seeding on every data change would silently wipe in-progress edits.
  const seoSeededFor = useRef<string | null>(null);
  useEffect(() => {
    if (!modalOpen || modalMode !== "edit") { seoSeededFor.current = null; return; }
    if (modalSeo === undefined) return; // still loading
    if (seoSeededFor.current === editId) return;
    seoSeededFor.current = editId;
    setSeoForm(productSeoFormFromRecord(modalSeo));
  }, [modalSeo, modalOpen, modalMode, editId]);
  /** Validate the SEO JSON fields BEFORE creating/updating, so a bad value
   *  can't leave a collection saved but its SEO silently dropped. */
  const validateModalSeo = (): boolean => {
    if (!productSeoFormHasContent(seoForm)) return true;
    return productSeoFormToPayload(seoForm, "probe", modalSeoType) !== null;
  };
  const saveModalSeo = async (entityId: string) => {
    // Upsert when something was written, or when a record exists (so clearing
    // fields actually clears them). Best-effort: an SEO save failure must not
    // fail the collection save.
    if (!productSeoFormHasContent(seoForm) && !modalSeo) return;
    const payload = productSeoFormToPayload(seoForm, entityId, modalSeoType);
    if (!payload) return;
    try {
      await upsertSeo.mutateAsync(payload);
    } catch {
      toast.error("Collection saved, but its SEO could not be saved — reopen Edit to retry.");
    }
  };

  const [formData, setFormData] = useState({ name: "", categoryId: "", description: "" });
  const [slides, setSlides] = useState<BannerSlideDraft[]>([]);
  const [uploading, setUploading] = useState(false);

  // One shared hidden file input; this ref records which slide/side the next
  // pick belongs to (avoids a ref per slide).
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<{ key: string; field: "desktop" | "mobile" } | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.categories ?? []);
  const subCategories = Array.isArray(subCatsData) ? subCatsData : (subCatsData?.subCategories ?? []);

  // Prefill slides from the item's slideshow; fall back to the legacy single
  // image pair for categories that predate the slideshow migration.
  const slidesFromItem = (item: any): BannerSlideDraft[] => {
    const rows = Array.isArray(item.bannerImages) && item.bannerImages.length > 0
      ? item.bannerImages
      : item.image
        ? [{ image: item.image, mobileImage: item.mobileImage }]
        : [];
    return rows.map((r: any) => ({
      key: newSlideKey(),
      image: r.image || "",
      mobileImage: r.mobileImage || "",
      file: null,
      mobileFile: null,
      preview: r.image || null,
      mobilePreview: r.mobileImage || null,
    }));
  };

  const openCreateModal = (type: "categories" | "subcategories") => {
    setAddType(type);
    setModalMode("create");
    setEditId("");
    setFormData({
      name: "",
      categoryId: type === "subcategories" && categories.length > 0 ? categories[0].id : "",
      description: "",
    });
    setSeoForm(emptyProductSeoForm());
    setEditSlug("");
    setSlides([]);
    setAddPickerOpen(false);
    setModalOpen(true);
  };

  const openEditModal = (item: any) => {
    // Determine type from context: if item has categoryId, it's a subcategory
    const type = item.categoryId ? "subcategories" : "categories";
    setAddType(type);
    setModalMode("edit");
    setEditId(item.id);
    setFormData({
      name: item.name || "",
      categoryId: item.categoryId || (categories.length > 0 ? categories[0].id : ""),
      description: item.description || "",
    });
    setSeoForm(emptyProductSeoForm());
    setEditSlug(item.slug || "");
    setSlides(slidesFromItem(item));
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormData({ name: "", categoryId: "", description: "" });
    setSeoForm(emptyProductSeoForm());
    setEditSlug("");
    setSlides([]);
  };

  const pickFile = (key: string, field: "desktop" | "mobile") => {
    uploadTargetRef.current = { key, field };
    fileRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    const target = uploadTargetRef.current;
    // Allow re-picking the same file later.
    e.target.value = "";
    if (!f || !target) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setSlides((prev) => prev.map((s) => {
        if (s.key !== target.key) return s;
        return target.field === "desktop"
          ? { ...s, file: f, preview: dataUrl }
          : { ...s, mobileFile: f, mobilePreview: dataUrl };
      }));
    };
    reader.readAsDataURL(f);
  };

  const clearSlideMobile = (key: string) => {
    setSlides((prev) => prev.map((s) => (s.key === key ? { ...s, mobileFile: null, mobilePreview: null, mobileImage: "" } : s)));
  };

  const removeSlide = (key: string) => {
    setSlides((prev) => prev.filter((s) => s.key !== key));
  };

  const addSlide = () => {
    setSlides((prev) => (prev.length >= MAX_SLIDES ? prev : [...prev, emptySlide()]));
  };

  const handleSlideDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSlides((prev) => {
      const oldIndex = prev.findIndex((s) => s.key === active.id);
      const newIndex = prev.findIndex((s) => s.key === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (slides.some((s) => !s.file && !s.image)) {
        return toast.error("Every banner needs a desktop image (or remove the empty slide)");
      }

      // Upload any newly picked files, then send the whole ordered list.
      let banners: { image: string; mobileImage?: string }[];
      setUploading(true);
      try {
        banners = await Promise.all(slides.map(async (s) => {
          const image = s.file ? await uploadImage(s.file) : s.image;
          const mobileImage = s.mobileFile ? await uploadImage(s.mobileFile) : s.mobileImage;
          return { image, ...(mobileImage ? { mobileImage } : {}) };
        }));
      } finally {
        // Without this an upload failure leaves the button spinning forever.
        setUploading(false);
      }

      if (!validateModalSeo()) return; // builder already toasted the reason
      if (addType === "categories") {
        if (modalMode === "create") {
          const created = await createCat.mutateAsync({ name: formData.name });
          if (formData.description.trim()) await updateCat.mutateAsync({ id: created.id, payload: { description: formData.description } });
          await saveModalSeo(created.id);
          await replaceCatBanners.mutateAsync({ id: created.id, banners });
          toast.success("Collection created");
        } else {
          await updateCat.mutateAsync({ id: editId, payload: { name: formData.name, description: formData.description } });
          await saveModalSeo(editId);
          await replaceCatBanners.mutateAsync({ id: editId, banners });
          toast.success("Collection updated");
        }
      } else {
        if (!formData.categoryId) return toast.error("Select a parent collection");
        if (modalMode === "create") {
          const created = await createSubCat.mutateAsync({ name: formData.name, categoryId: formData.categoryId });
          await saveModalSeo(created.id);
          await replaceSubCatBanners.mutateAsync({ id: created.id, banners });
          toast.success("Sub-collection created");
        } else {
          await updateSubCat.mutateAsync({ id: editId, payload: { name: formData.name, categoryId: formData.categoryId } });
          await saveModalSeo(editId);
          await replaceSubCatBanners.mutateAsync({ id: editId, banners });
          toast.success("Sub-collection updated");
        }
      }
      closeModal();
    } catch (error: any) {
      setUploading(false);
      toast.error(error?.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Permanently delete "${name}"? This action cannot be undone.`)) return;
    try {
      if (view === "categories") {
        await deleteCat.mutateAsync(id);
      } else {
        await deleteSubCat.mutateAsync(id);
      }
      toast.success(`"${name}" deleted`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete");
    }
  };

  const isLoading = view === "categories" ? catLoading : subLoading;
  const list = view === "categories" ? categories : subCategories;
  const filtered = list.filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase()) ||
    (view === "subcategories" && c.category?.name?.toLowerCase().includes(search.toLowerCase()))
  );

  const isSaving = createCat.isPending || updateCat.isPending || createSubCat.isPending || updateSubCat.isPending
    || replaceCatBanners.isPending || replaceSubCatBanners.isPending || uploading;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-semibold text-2xl text-foreground flex items-center gap-2">
              <Layers className="h-6 w-6 text-primary" />
              Collections
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your product collections</p>
          </div>

          {/* Add button with type picker */}
          <div className="relative" ref={addPickerRef}>
            <Button onClick={() => setAddPickerOpen(!addPickerOpen)} leftIcon={<Plus className="h-4 w-4" />} rightIcon={<ChevronDown className={cn("h-3.5 w-3.5 transition-transform", addPickerOpen && "rotate-180")} />}>
              Add New
            </Button>
            <AnimatePresence>
              {addPickerOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 rounded-xl glass border border-white/20 shadow-xl overflow-hidden z-50"
                >
                  <button
                    onClick={() => openCreateModal("categories")}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-primary/10 transition-colors"
                  >
                    <Layers className="h-4 w-4 text-primary" />
                    <div className="text-left">
                      <div className="font-medium">Collection</div>
                      <div className="text-xs text-muted-foreground">Top-level grouping</div>
                    </div>
                  </button>
                  <div className="border-t border-white/10" />
                  <button
                    onClick={() => openCreateModal("subcategories")}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-primary/10 transition-colors"
                  >
                    <FolderTree className="h-4 w-4 text-primary" />
                    <div className="text-left">
                      <div className="font-medium">Sub-collection</div>
                      <div className="text-xs text-muted-foreground">Under a parent collection</div>
                    </div>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="flex gap-1.5 p-1 bg-muted/30 rounded-xl" role="group">
            <button onClick={() => setView("categories")} className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", view === "categories" ? "bg-white dark:bg-zinc-800 shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>Collections</button>
            <button onClick={() => setView("subcategories")} className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", view === "subcategories" ? "bg-white dark:bg-zinc-800 shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>Sub-collections</button>
          </div>
          <div className="flex-1 max-w-sm">
            <Input placeholder={`Search ${view === 'categories' ? 'collections' : 'sub-collections'}…`} value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4" />} />
          </div>
        </div>
        {view === "subcategories" && (
          <p className="text-xs text-muted-foreground">
            Sub-collection pages canonicalize to their parent collection's URL (duplicate-content protection) — but their full SEO (meta, social, keywords, FAQ) is editable via Edit on each row and shows on the sub-collection page.
          </p>
        )}

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" aria-label={view}>
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Name</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Slug</th>
                  {view === "subcategories" && <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Parent Collection</th>}
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Banners</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {isLoading ? (
                  <tr><td colSpan={5} className="py-12 text-center text-sm text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" /> Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">No {view === 'categories' ? 'collections' : 'sub-collections'} found</td></tr>
                ) : filtered.map((item: any, i: number) => (
                  <motion.tr key={item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="hover:bg-accent/30 transition-colors">
                    <td className="px-5 py-4 font-medium text-foreground">{item.name}</td>
                    <td className="px-5 py-4 text-sm text-muted-foreground font-mono">{item.slug}</td>
                    {view === "subcategories" && (
                      <td className="px-5 py-4">
                        <Badge variant="info" className="flex items-center gap-1 w-fit">
                          {item.category?.name ?? "—"} <ArrowRight className="h-3 w-3" />
                        </Badge>
                      </td>
                    )}
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {(Array.isArray(item.bannerImages) ? item.bannerImages.length : 0) || (item.image ? 1 : 0) || "—"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEditModal(item)} aria-label="Edit" title="Edit"
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(item.id, item.name)} aria-label="Delete" title="Delete"
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ═══ Create / Edit Modal ═══ */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={closeModal} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-card/60 glass-card rounded-2xl shadow-xl overflow-hidden border border-border">
              <div className="p-6 max-h-[85vh] overflow-y-auto">
                <h2 className="text-xl font-semibold mb-1">
                  {modalMode === "create" ? "Add" : "Edit"} {addType === "categories" ? "Collection" : "Sub-collection"}
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Enter the details for this {addType === "categories" ? "collection" : "sub-collection"}.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {addType === "subcategories" && (
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-foreground">Parent Collection</label>
                      <select value={formData.categoryId} onChange={e => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                        className="w-full rounded-xl border border-input bg-background/50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all font-medium appearance-none" required>
                        <option value="" disabled>Select a collection</option>
                        {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  )}
                  <Input label="Name" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Figurines" required autoFocus />

                  {addType === "categories" && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Description <span className="text-muted-foreground font-normal">(shown on the collection page and used for SEO — a couple of sentences about what buyers find here)</span>
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        maxLength={5000}
                        placeholder="e.g. Authentic anime figurines — scale figures, Nendoroids and prize figures from verified sellers across India."
                        className="w-full rounded-xl border border-input bg-background/50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all resize-y"
                      />
                    </div>
                  )}

                  <div className="space-y-3 rounded-xl border border-border/60 p-3">
                    <p className="text-xs font-semibold text-foreground">
                      Search engine optimization <span className="text-muted-foreground font-normal">(optional — blank fields fall back to generated defaults; saves with the collection)</span>
                    </p>
                    <ProductSeoFields
                      value={seoForm}
                      onChange={setSeoForm}
                      productName={formData.name || undefined}
                      previewPath={addType === "categories" ? `/category/${editSlug || "…"}` : `/category/…?sub=${editSlug || "…"}`}
                      entityLabel="collection"
                    />
                    {addType === "subcategories" && (
                      <p className="text-2xs text-muted-foreground">
                        Sub-collection pages keep their canonical URL pointed at the parent collection (duplicate-content protection); everything here controls what the sub-collection page itself shows.
                      </p>
                    )}
                  </div>

                  {/* Banner slideshow. Order here is the order buyers see; drag
                      the handle to rearrange. Slide 1 also fills the legacy
                      single-image slots older screens still read. */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-medium text-foreground">
                        Banner slideshow <span className="text-muted-foreground font-normal">({slides.length}/{MAX_SLIDES})</span>
                      </label>
                      <Button type="button" variant="ghost" size="sm" onClick={addSlide} disabled={slides.length >= MAX_SLIDES} leftIcon={<Plus className="h-3.5 w-3.5" />}>
                        Add banner
                      </Button>
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

                    {slides.length === 0 ? (
                      <button type="button" onClick={addSlide}
                        className="w-full aspect-[16/6] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-muted/50 hover:border-primary/50 transition-colors">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Plus className="h-5 w-5" />
                        </div>
                        <div className="text-sm font-medium text-foreground">Add your first banner</div>
                        <div className="text-xs text-muted-foreground">Recommend 1200x400px. Add more for a slideshow.</div>
                      </button>
                    ) : (
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSlideDragEnd}>
                        <SortableContext items={slides.map((s) => s.key)} strategy={verticalListSortingStrategy}>
                          <div className="space-y-3">
                            {slides.map((slide, index) => (
                              <SortableSlide key={slide.key} id={slide.key} disabled={isSaving}>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-semibold text-muted-foreground">Banner {index + 1}</span>
                                    <button type="button" onClick={() => removeSlide(slide.key)} aria-label={`Remove banner ${index + 1}`}
                                      className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                  <div className="flex gap-3">
                                    {/* Desktop image */}
                                    <div className="flex-1 min-w-0">
                                      {slide.preview ? (
                                        <div className="relative aspect-[16/6] w-full rounded-lg overflow-hidden group/img">
                                          <img src={slide.preview} alt={`Banner ${index + 1} desktop`} className="w-full h-full object-cover" />
                                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                                            <Button type="button" variant="ghost" size="sm" className="text-white hover:bg-white/20" onClick={() => pickFile(slide.key, "desktop")}>
                                              Change
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <button type="button" onClick={() => pickFile(slide.key, "desktop")}
                                          className="w-full aspect-[16/6] border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-muted/50 hover:border-primary/50 transition-colors">
                                          <Plus className="h-4 w-4 text-primary" />
                                          <span className="text-xs font-medium text-foreground">Desktop image</span>
                                        </button>
                                      )}
                                    </div>
                                    {/* Mobile image */}
                                    <div className="w-24 shrink-0">
                                      {slide.mobilePreview ? (
                                        <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden group/img">
                                          <img src={slide.mobilePreview} alt={`Banner ${index + 1} mobile`} className="w-full h-full object-cover" />
                                          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity">
                                            <button type="button" className="text-[11px] font-medium text-white hover:underline" onClick={() => pickFile(slide.key, "mobile")}>Change</button>
                                            <button type="button" className="text-[11px] font-medium text-white hover:underline" onClick={() => clearSlideMobile(slide.key)}>Remove</button>
                                          </div>
                                        </div>
                                      ) : (
                                        <button type="button" onClick={() => pickFile(slide.key, "mobile")}
                                          className="w-full aspect-[3/4] border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-muted/50 hover:border-primary/50 transition-colors">
                                          <Plus className="h-3.5 w-3.5 text-primary" />
                                          <span className="text-[11px] font-medium text-foreground text-center px-1">Mobile (optional)</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </SortableSlide>
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Buyers see these in order as a slideshow on the {addType === "categories" ? "collection" : "sub-collection"} page. Mobile image is shown on phones; leave it empty to use the desktop image everywhere.
                    </p>
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={closeModal}>Cancel</Button>
                    <Button type="submit" loading={isSaving}>
                      {modalMode === "create" ? "Create" : "Save Changes"}
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
