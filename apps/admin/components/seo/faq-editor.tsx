"use client";
import { Plus, Trash2 } from "lucide-react";
import { Button, Input, Textarea } from "@/components/ui";
import type { SeoFaqEntry } from "@/api/seo.api";

/** Q/A rows rendered as visible FAQ + FAQPage JSON-LD on the storefront. */
export function FaqEditor({ value, onChange }: {
  value: SeoFaqEntry[];
  onChange: (next: SeoFaqEntry[]) => void;
}) {
  const setRow = (i: number, patch: Partial<SeoFaqEntry>) =>
    onChange(value.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-sm text-muted-foreground">No FAQ entries. Questions with answers render on the page and as FAQPage structured data.</p>
      )}
      {value.map((row, i) => (
        <div key={i} className="rounded-xl border border-border p-3 space-y-2">
          <div className="flex items-start gap-2">
            <div className="flex-1 space-y-2">
              <Input placeholder={`Question ${i + 1}`} value={row.question} onChange={(e) => setRow(i, { question: e.target.value })} />
              <Textarea placeholder="Answer" rows={2} value={row.answer} onChange={(e) => setRow(i, { answer: e.target.value })} />
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={`Remove FAQ ${i + 1}`}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => onChange([...value, { question: "", answer: "" }])}>
        Add question
      </Button>
    </div>
  );
}
