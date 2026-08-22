"use client";
import { useState } from "react";
import { Plus, X, Check } from "lucide-react";
import { Select, Input, Button } from "@/components/ui";

export function SelectWithCreate({ label, options, value, onChange, onCreate, placeholder }: {
  label: string;
  options: Array<{ id: string; name: string }>;
  value: string;
  onChange: (id: string) => void;
  onCreate: (name: string) => Promise<{ id: string } | void>;
  placeholder?: string;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const name = draft.trim();
    if (!name) return;
    setSaving(true);
    try {
      const created = await onCreate(name);
      if (created && "id" in created) onChange(created.id);
      setDraft("");
      setAdding(false);
    } finally {
      setSaving(false);
    }
  };

  if (adding) {
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-foreground">{label}</label>
        <div className="flex items-center gap-1.5">
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`New ${label.toLowerCase()} name`}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } if (e.key === "Escape") setAdding(false); }}
          />
          <Button type="button" size="sm" loading={saving} onClick={submit} className="px-2.5"><Check className="h-4 w-4" /></Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => { setAdding(false); setDraft(""); }} className="px-2.5"><X className="h-4 w-4" /></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-foreground">{label}</label>
        <button type="button" onClick={() => setAdding(true)} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          <Plus className="h-3 w-3" /> New
        </button>
      </div>
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder ?? `Select ${label.toLowerCase()}`}</option>
        {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
      </Select>
    </div>
  );
}
