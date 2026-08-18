"use client";
import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Edit2, Trash2, Loader2, LayoutGrid, GripVertical } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button, Input, Select, Badge } from "@/components/ui";
import toast from "react-hot-toast";
import {
  useHomepageSections, useCreateHomepageSection, useUpdateHomepageSection, useDeleteHomepageSection, useReorderHomepageSections,
  useCategories, useSubCategories,
} from "@/hooks/useAdmin";

// Combines a Collection/Sub-collection into one picker value: "category:<id>"
// or "subcategory:<id>" — split back into categoryId/subCategoryId on submit.
function parseSource(source: string): { categoryId?: string; subCategoryId?: string } {
  const [kind, id] = source.split(":");
  if (kind === "subcategory") return { subCategoryId: id };
  return { categoryId: id };
}

function sourceValueFor(section: any): string {
  if (section.subCategoryId || section.subCategory?.id) return `subcategory:${section.subCategoryId ?? section.subCategory.id}`;
  return `category:${section.categoryId ?? section.category?.id ?? ""}`;
}

// A plain <tr> (not motion.tr) deliberately — @dnd-kit's drag transform and
// framer-motion's own transform-based enter animation would otherwise fight
// over the same CSS property on the same element.
//
// `disabled` (NEW — not in the original plan draft, added after a review of
// the reorder hook flagged a race: firing a second drag-drop before the
// first PATCH settles can let an older optimistic state clobber a newer one
// in the query cache). While a reorder mutation is in flight, every row's
// drag interaction is disabled via dnd-kit's own `useSortable({ disabled })`
// option — the row still renders normally, it just can't be picked up again
// until the in-flight request settles. This fully prevents overlapping
// reorder requests rather than just narrowing the race window.
function SortableRow({ section, disabled, children }: { section: any; disabled: boolean; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id, disabled });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };
  return (
    <tr ref={setNodeRef} style={style} className={`hover:bg-accent/30 transition-colors ${isDragging ? "opacity-50 bg-accent/20" : ""}`}>
      <td className={`px-3 py-4 text-muted-foreground ${disabled ? "cursor-not-allowed opacity-40" : "cursor-grab active:cursor-grabbing"}`} {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4" />
      </td>
      {children}
    </tr>
  );
}

export default function HomepageSectionsPage() {
  const { data: sectionsData, isLoading } = useHomepageSections();
  const { data: categoriesData } = useCategories();
  const { data: subCategoriesData } = useSubCategories();
  const createSection = useCreateHomepageSection();
  const updateSection = useUpdateHomepageSection();
  const deleteSection = useDeleteHomepageSection();
  const reorderSections = useReorderHomepageSections();

  const sections: any[] = Array.isArray(sectionsData) ? sectionsData : (sectionsData?.sections ?? []);
  const categories: any[] = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.categories ?? []);
  const subCategories: any[] = Array.isArray(subCategoriesData) ? subCategoriesData : (subCategoriesData?.subcategories ?? []);

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState("");
  const [formData, setFormData] = useState({ source: "", title: "", productLimit: 16, isActive: true });

  const openCreateModal = () => {
    setEditId("");
    const first = categories[0];
    setFormData({ source: first ? `category:${first.id}` : "", title: "", productLimit: 16, isActive: true });
    setModalOpen(true);
  };

  const openEditModal = (section: any) => {
    setEditId(section.id);
    setFormData({
      source: sourceValueFor(section),
      title: section.title ?? "",
      productLimit: section.productLimit ?? 16,
      isActive: section.isActive ?? true,
    });
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.source) return toast.error("Select a collection or sub-collection");
    const payload = {
      ...parseSource(formData.source),
      // null (not undefined) so a blanked-out override actually clears server-side —
      // undefined would be dropped from the JSON body and the old title would stick.
      title: formData.title || null,
      productLimit: Number(formData.productLimit) || 16,
      // Reordering is drag-only now — a brand new section just appends to the
      // end; editing an existing one never touches order.
      ...(editId ? { isActive: formData.isActive } : { order: sections.length }),
    };
    try {
      if (editId) {
        await updateSection.mutateAsync({ id: editId, payload });
        toast.success("Section updated");
      } else {
        await createSection.mutateAsync(payload);
        toast.success("Section created");
      }
      closeModal();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (section: any) => {
    if (!window.confirm(`Remove the "${section.title || section.category?.name || section.subCategory?.name}" homepage row?`)) return;
    try {
      await deleteSection.mutateAsync(section.id);
      toast.success("Section removed");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete");
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = [...sections];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    reorderSections.mutate(reordered.map((s) => s.id));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-semibold text-2xl text-foreground flex items-center gap-2">
              <LayoutGrid className="h-6 w-6 text-primary" />
              Homepage Sections
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Choose which collections show as scrollable rows on the buyer homepage. Drag rows to reorder.</p>
          </div>
          <Button onClick={openCreateModal} leftIcon={<Plus className="h-4 w-4" />}>Add Section</Button>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" aria-label="homepage sections">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  <th scope="col" className="px-3 py-3.5 w-8"></th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Collection</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Title Override</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Products</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Order</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Active</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {isLoading ? (
                  <tr><td colSpan={7} className="py-12 text-center text-sm text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" /> Loading…</td></tr>
                ) : sections.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">No homepage sections yet. Add one to start showing category rows on the homepage.</td></tr>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                      {sections.map((section: any) => (
                        <SortableRow key={section.id} section={section} disabled={reorderSections.isPending}>
                          <td className="px-5 py-4 font-medium text-foreground">
                            {section.category?.name ?? (section.subCategory ? `${section.subCategory.name} (${section.subCategory.category?.name ?? ""})` : "—")}
                          </td>
                          <td className="px-5 py-4 text-sm text-muted-foreground">{section.title || "—"}</td>
                          <td className="px-5 py-4 text-sm text-muted-foreground">{section.productLimit}</td>
                          <td className="px-5 py-4">
                            <Badge variant="info">#{section.order}</Badge>
                          </td>
                          <td className="px-5 py-4">
                            <Badge variant={section.isActive ? "success" : "default"}>{section.isActive ? "Active" : "Inactive"}</Badge>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => openEditModal(section)} aria-label="Edit" title="Edit"
                                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleDelete(section)} aria-label="Delete" title="Delete"
                                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </SortableRow>
                      ))}
                    </SortableContext>
                  </DndContext>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={closeModal} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-card/60 glass-card rounded-2xl shadow-xl overflow-hidden border border-border">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-1">{editId ? "Edit" : "Add"} Homepage Section</h2>
                <p className="text-sm text-muted-foreground mb-6">Pick a collection or sub-collection and how it should appear as a homepage row.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Select label="Collection / Sub-collection" value={formData.source} onChange={e => setFormData(prev => ({ ...prev, source: e.target.value }))} required>
                    <option value="" disabled>Select a collection or sub-collection</option>
                    {categories.map((c: any) => (
                      <optgroup key={c.id} label={c.name}>
                        <option value={`category:${c.id}`}>{c.name} (all)</option>
                        {subCategories.filter((sc: any) => sc.categoryId === c.id).map((sc: any) => (
                          <option key={sc.id} value={`subcategory:${sc.id}`}>{sc.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </Select>
                  <Input
                    label="Title override (optional)"
                    value={formData.title}
                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Defaults to the collection/sub-collection name"
                  />
                  <Input
                    label="Products to show"
                    type="number"
                    min={1}
                    max={50}
                    value={formData.productLimit}
                    onChange={e => setFormData(prev => ({ ...prev, productLimit: Number(e.target.value) }))}
                    required
                  />
                  {editId && (
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="h-4 w-4 rounded border-input"
                      />
                      Active (shown on the homepage)
                    </label>
                  )}
                  <div className="pt-4 flex justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={closeModal}>Cancel</Button>
                    <Button type="submit" loading={createSection.isPending || updateSection.isPending}>
                      {editId ? "Save Changes" : "Create"}
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
