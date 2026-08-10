"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui";

/**
 * Chart primitives for the analytics dashboard.
 *
 * Palette: categorical hues in FIXED order (never cycled), validated with the
 * dataviz six-checks script against both surfaces:
 *   light: #7B2FBE #0891B2 #D97706  (all checks pass, surface #fcfcfb)
 *   dark:  #9D5CE6 #0FA3B1 #D97706  (all checks pass, surface #1a1a19)
 * Ranked breakdowns are magnitude, not identity → single-hue bars, not one
 * color per row. One axis per chart, always.
 */

const LIGHT_SERIES = ["#7B2FBE", "#0891B2", "#D97706"];
const DARK_SERIES = ["#9D5CE6", "#0FA3B1", "#D97706"];

export function useChartPalette(): string[] {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const el = document.documentElement;
    const update = () => setDark(el.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return dark ? DARK_SERIES : LIGHT_SERIES;
}

export function SectionCard({ title, subtitle, action, children, className }: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className={cn("glass-card rounded-2xl overflow-hidden", className)}>
      <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-border/50">
        <div>
          <h2 className="font-semibold text-sm text-foreground">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </motion.div>
  );
}

/** KPI with a comparison delta vs the previous period. */
export function KpiCard({ label, value, previous, format }: {
  label: string;
  value: number | undefined;
  previous?: number;
  format?: (n: number) => string;
}) {
  const fmt = format ?? ((n: number) => n.toLocaleString());
  const hasDelta = previous !== undefined && previous > 0 && value !== undefined;
  const deltaPct = hasDelta ? ((value! - previous!) / previous!) * 100 : null;
  const Dir = deltaPct === null ? Minus : deltaPct >= 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="glass-card rounded-2xl p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold text-foreground mt-1">{value === undefined ? "…" : fmt(value)}</p>
      <p className={cn("flex items-center gap-0.5 text-xs mt-0.5",
        deltaPct === null ? "text-muted-foreground" : deltaPct >= 0 ? "text-green-600" : "text-red-500")}>
        <Dir className="h-3 w-3" aria-hidden />
        {deltaPct === null ? "no prior data" : `${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(1)}% vs previous`}
      </p>
    </div>
  );
}

interface TrendPoint { date: string; [k: string]: number | string; }

/** Multi-series line chart: thin 2px lines, crosshair tooltip, legend (≥2 series). */
export function TrendChart({ data, series, height = 260 }: {
  data: TrendPoint[];
  series: Array<{ key: string; label: string }>;
  height?: number;
}) {
  const palette = useChartPalette();
  if (!data.length) {
    return <p className="text-sm text-muted-foreground py-10 text-center">No data yet for this period.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
          tickFormatter={(d: string) => d.slice(5)} minTickGap={24} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={44} allowDecimals={false} />
        <Tooltip
          cursor={{ stroke: "currentColor", strokeOpacity: 0.2 }}
          contentStyle={{ borderRadius: 12, border: "1px solid rgba(128,128,128,0.25)", background: "var(--card, #fff)", fontSize: 12 }}
        />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {series.map((s, i) => (
          <Line key={s.key} type="monotone" dataKey={s.key} name={s.label}
            stroke={palette[i % palette.length]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

interface BarRow { label: string; value: number; hint?: string; extra?: string; }

/**
 * Ranked horizontal bars — magnitude in ONE hue (rank ≠ identity), value
 * labels in text ink, 2px gaps, native title tooltip per row.
 */
export function BarList({ rows, max, emptyText = "No data yet." }: {
  rows: BarRow[];
  max?: number;
  emptyText?: string;
}) {
  const palette = useChartPalette();
  const top = max ?? Math.max(...rows.map((r) => r.value), 1);
  if (!rows.length) return <p className="text-sm text-muted-foreground py-6 text-center">{emptyText}</p>;
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label} title={`${r.label}: ${r.value.toLocaleString()}`}>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="truncate text-foreground">{r.label}</span>
            <span className="flex-shrink-0 tabular-nums text-foreground font-medium">
              {r.value.toLocaleString()}
              {r.extra && <span className="ml-1.5 text-xs text-muted-foreground font-normal">{r.extra}</span>}
            </span>
          </div>
          {r.hint && <p className="text-[11px] text-muted-foreground truncate">{r.hint}</p>}
          <div className="mt-1 h-2 rounded-sm bg-muted/60 overflow-hidden">
            <div className="h-full rounded-sm" style={{ width: `${Math.max((r.value / top) * 100, 1)}%`, background: palette[0] }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Funnel: full-width stage rows with completion % of the previous stage. */
export function FunnelSteps({ stages }: {
  stages: Array<{ stage: string; count: number; pctOfPrevious: number | null }>;
}) {
  const palette = useChartPalette();
  const top = Math.max(...stages.map((s) => s.count), 1);
  return (
    <div className="space-y-2">
      {stages.map((s) => (
        <div key={s.stage} className="flex items-center gap-3">
          <div className="w-36 flex-shrink-0 text-sm text-foreground truncate">{s.stage}</div>
          <div className="flex-1 h-6 rounded-md bg-muted/60 overflow-hidden">
            <div className="h-full rounded-md" style={{ width: `${Math.max((s.count / top) * 100, 2)}%`, background: palette[0] }} />
          </div>
          <div className="w-28 flex-shrink-0 text-right text-sm tabular-nums text-foreground">
            {s.count.toLocaleString()}
            <span className="ml-1 text-xs text-muted-foreground">
              {s.pctOfPrevious === null ? "" : `(${s.pctOfPrevious}%)`}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Retention cohort table: sequential single-hue intensity by rate. */
export function CohortTable({ rows }: {
  rows: Array<Record<string, unknown>>;
}) {
  const palette = useChartPalette();
  if (!rows.length) return <p className="text-sm text-muted-foreground py-6 text-center">No cohorts in range.</p>;
  const days = ["d1", "d3", "d7", "d14", "d30"] as const;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase text-muted-foreground">
            <th className="px-2 py-2 font-medium">Cohort week</th>
            <th className="px-2 py-2 font-medium text-right">Visitors</th>
            {days.map((d) => <th key={d} className="px-2 py-2 font-medium text-center">{d.toUpperCase()}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const size = Number(r.size) || 0;
            const cohortDate = r.cohort instanceof Date ? r.cohort.toISOString() : String(r.cohort);
            return (
              <tr key={cohortDate} className="border-t border-border/40">
                <td className="px-2 py-1.5 text-foreground whitespace-nowrap">{cohortDate.slice(0, 10)}</td>
                <td className="px-2 py-1.5 text-right tabular-nums text-foreground">{size}</td>
                {days.map((d) => {
                  const pct = size ? Math.round((Number(r[d]) / size) * 100) : 0;
                  return (
                    <td key={d} className="px-1 py-1.5 text-center">
                      <span
                        className="inline-block min-w-[3rem] rounded px-1.5 py-0.5 tabular-nums text-xs"
                        style={{
                          background: `${palette[0]}${alphaHex(pct)}`,
                          color: pct >= 55 ? "#fff" : "inherit",
                        }}
                        title={`${Number(r[d])} of ${size} returned within ${d.slice(1)} day(s)`}
                      >
                        {size ? `${pct}%` : "—"}
                      </span>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** 0–100 → two-digit alpha hex, floored so nonzero rates stay visible. */
function alphaHex(pct: number): string {
  const alpha = Math.round(Math.min(Math.max(pct, 0), 100) * 2.2 + (pct > 0 ? 20 : 6));
  return Math.min(alpha, 255).toString(16).padStart(2, "0");
}

export function ChartSkeleton() {
  return <Skeleton className="h-48 w-full" />;
}
