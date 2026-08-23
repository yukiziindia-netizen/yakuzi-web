"use client";
import { useState } from "react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, GripVertical, ChevronDown, Layers, Power, PowerOff } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import {
  useChatbotRules, useDeleteChatbotRule, useUpdateChatbotRule,
  useReorderChatbotRules, useDeleteAllChatbotRules,
} from "@/hooks/useChatbot";
import type { ChatbotRule, ChatbotRuleTier } from "@/api/chatbot.api";

// A plain <div> (not motion) deliberately, same reasoning as the homepage-sections
// list: dnd-kit's drag transform and any enter-animation library would fight over
// the same CSS transform property on the same element.
function SortableRuleRow({ rule, disabled, onDelete, onToggleTier, onToggleActive }: {
  rule: ChatbotRule;
  disabled: boolean;
  onDelete: (id: string) => void;
  onToggleTier: (rule: ChatbotRule) => void;
  onToggleActive: (rule: ChatbotRule) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: rule.id,
    disabled,
  });
  const [expanded, setExpanded] = useState(false);
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : undefined };

  return (
    <div ref={setNodeRef} style={style} className={cn(
      "rounded-xl border border-border/60 bg-background",
      isDragging && "opacity-50 bg-accent/20",
      !rule.isActive && "opacity-60",
    )}>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span
          {...attributes}
          {...listeners}
          className={cn("text-muted-foreground", disabled ? "cursor-not-allowed opacity-40" : "cursor-grab active:cursor-grabbing")}
          aria-label="Reorder"
        >
          <GripVertical className="h-4 w-4" />
        </span>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex-1 min-w-0 flex items-center gap-2 text-left"
        >
          <ChevronDown className={cn("h-3.5 w-3.5 flex-shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")} />
          <span className="truncate text-sm font-medium text-foreground">{rule.trigger}</span>
        </button>
        <button
          type="button"
          onClick={() => onToggleTier(rule)}
          className={cn(
            "text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0",
            rule.tier === "CORE" ? "bg-primary/15 text-primary" : "bg-gray-100 text-gray-700",
          )}
          title="Click to move to the other tier"
        >
          {rule.tier}
        </button>
        <button
          type="button"
          onClick={() => onToggleActive(rule)}
          className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors flex-shrink-0"
          title={rule.isActive ? "Deactivate (bot stops following this rule)" : "Activate"}
        >
          {rule.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => onDelete(rule.id)}
          className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
          title="Delete rule"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {expanded && (
        <div className="px-4 pb-3 border-t border-border/40 pt-2">
          <p className="text-xs text-foreground whitespace-pre-wrap">{rule.instruction}</p>
        </div>
      )}
    </div>
  );
}

function TierColumn({ tier, rules, onDelete, onToggleTier, onToggleActive, mutationPending }: {
  tier: ChatbotRuleTier;
  rules: ChatbotRule[];
  onDelete: (id: string) => void;
  onToggleTier: (rule: ChatbotRule) => void;
  onToggleActive: (rule: ChatbotRule) => void;
  mutationPending: boolean;
}) {
  const reorder = useReorderChatbotRules();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (reorder.isPending) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = rules.findIndex((r) => r.id === active.id);
    const newIndex = rules.findIndex((r) => r.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = [...rules];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    // The apiClient interceptor only toasts on 401/403/5xx — a 400 from the
    // server's exact-id-set check (stale list) would otherwise silently snap
    // the row back with no explanation.
    reorder.mutateAsync({ tier, orderedIds: reordered.map((r) => r.id) }).catch((err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to reorder — refresh and try again.");
    });
  };

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
        <Layers className="h-3.5 w-3.5" /> {tier === "CORE" ? "Core" : "Surface"}
      </h3>
      {rules.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border/60 rounded-xl">
          {tier === "CORE" ? "No core trainings yet." : "No surface trainings yet."}
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={rules.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1.5">
              {rules.map((rule) => (
                <SortableRuleRow
                  key={rule.id}
                  rule={rule}
                  disabled={reorder.isPending || mutationPending}
                  onDelete={onDelete}
                  onToggleTier={onToggleTier}
                  onToggleActive={onToggleActive}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

export function SavedTrainingsPanel() {
  const { data: rules = [], isLoading, isError } = useChatbotRules();
  const deleteRule = useDeleteChatbotRule();
  const updateRule = useUpdateChatbotRule();
  const deleteAll = useDeleteAllChatbotRules();
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  const core = rules.filter((r) => r.tier === "CORE");
  const surface = rules.filter((r) => r.tier === "SURFACE");

  const handleDelete = async (id: string) => {
    try {
      await deleteRule.mutateAsync(id);
      toast.success("Training deleted.");
    } catch {
      toast.error("Failed to delete training.");
    }
  };

  const handleToggleTier = async (rule: ChatbotRule) => {
    const nextTier = rule.tier === "CORE" ? "SURFACE" : "CORE";
    try {
      await updateRule.mutateAsync({ id: rule.id, payload: { tier: nextTier } });
    } catch {
      toast.error("Failed to move training.");
    }
  };

  const handleToggleActive = async (rule: ChatbotRule) => {
    try {
      await updateRule.mutateAsync({ id: rule.id, payload: { isActive: !rule.isActive } });
    } catch {
      toast.error("Failed to update training.");
    }
  };

  const handleDeleteAll = async () => {
    try {
      await deleteAll.mutateAsync();
      toast.success("All trainings cleared — chatbot reset to default.");
    } catch {
      toast.error("Failed to reset trainings.");
    } finally {
      setConfirmDeleteAll(false);
    }
  };

  return (
    <div className="glass p-6 rounded-2xl border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Saved Trainings</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Core trainings are treated as foundational; surface trainings layer on top.
          </p>
        </div>
        {rules.length > 0 && (
          <button
            type="button"
            onClick={() => setConfirmDeleteAll(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear All & Reset
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
      ) : isError ? (
        <p className="text-sm text-red-500 py-8 text-center">Couldn't load trainings — try refreshing.</p>
      ) : rules.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No trainings yet. Teach the bot something in the sandbox above, then "Save conversation."
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TierColumn tier="CORE" rules={core} onDelete={handleDelete} onToggleTier={handleToggleTier} onToggleActive={handleToggleActive} mutationPending={updateRule.isPending} />
          <TierColumn tier="SURFACE" rules={surface} onDelete={handleDelete} onToggleTier={handleToggleTier} onToggleActive={handleToggleActive} mutationPending={updateRule.isPending} />
        </div>
      )}

      {confirmDeleteAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-background border border-border p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold mb-2">Clear All Trainings & Reset</h3>
            <p className="text-muted-foreground text-sm mb-6">
              This deletes every saved training and resets the live chatbot to its default persona. This can't be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDeleteAll(false)} className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-xl transition-colors">
                Cancel
              </button>
              <button onClick={handleDeleteAll} disabled={deleteAll.isPending} className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
