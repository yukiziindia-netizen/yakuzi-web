"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import type { AnalyticsRange } from "@/api/webAnalytics.api";

const SECTIONS = [
  { label: "Traffic", href: "/analytics/traffic" },
  { label: "Behavior", href: "/analytics/behavior" },
  { label: "Audience", href: "/analytics/audience" },
  { label: "Real-Time", href: "/analytics/realtime" },
  { label: "Business", href: "/dashboard" },
  { label: "Health & Export", href: "/analytics/health" },
];

export function AnalyticsNav({ range, onRangeChange }: {
  range?: AnalyticsRange;
  onRangeChange?: (r: AnalyticsRange) => void;
}) {
  const pathname = usePathname();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <nav className="flex gap-1 overflow-x-auto no-sb" aria-label="Analytics sections">
        {SECTIONS.map(({ label, href }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined}
              className={cn("px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                active ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground hover:bg-accent/60")}>
              {label}
            </Link>
          );
        })}
      </nav>
      {range && onRangeChange && (
        <DateRangePicker
          value={toDayRange(range)}
          onChange={(r: DateRange | undefined) => {
            if (r?.from) {
              onRangeChange({
                from: r.from.toISOString().slice(0, 10),
                to: (r.to ?? r.from).toISOString().slice(0, 10),
              });
            }
          }}
          align="end"
        />
      )}
    </div>
  );
}

function toDayRange(range: AnalyticsRange): DateRange | undefined {
  if (!range.from) return undefined;
  return { from: new Date(range.from), to: range.to ? new Date(range.to) : undefined };
}
