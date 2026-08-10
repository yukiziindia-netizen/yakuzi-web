"use client";
import { useState } from "react";
import { X } from "lucide-react";

/** String-array input: Enter or comma adds a chip, backspace on empty removes the last. */
export function ChipsInput({ label, values, onChange, placeholder }: {
  label?: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const v = draft.trim().replace(/,$/, "");
    setDraft("");
    if (!v || values.includes(v)) return;
    onChange([...values, v]);
  };

  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-foreground">{label}</label>}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-input bg-background px-2 py-1.5 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/60 transition-all">
        {values.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-foreground">
            {v}
            <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} className="text-muted-foreground hover:text-foreground" aria-label={`Remove ${v}`}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => {
            if (e.target.value.endsWith(",")) { setDraft(e.target.value); setTimeout(commit, 0); }
            else setDraft(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); commit(); }
            if (e.key === "Backspace" && !draft && values.length) onChange(values.slice(0, -1));
          }}
          onBlur={commit}
          placeholder={values.length ? "" : placeholder}
          className="flex-1 min-w-[8rem] bg-transparent px-1 py-1 text-sm placeholder:text-muted-foreground focus:outline-none"
        />
      </div>
    </div>
  );
}
