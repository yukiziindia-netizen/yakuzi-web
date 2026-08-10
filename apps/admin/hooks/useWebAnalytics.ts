"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAnalyticsReport, type AnalyticsRange } from "@/api/webAnalytics.api";

/** One hook per report keeps query keys uniform and pages tiny. */
export function useAnalyticsReport<T = any>(
  report: string,
  range: AnalyticsRange = {},
  extra: Record<string, string | undefined> = {},
  options: { refetchInterval?: number; enabled?: boolean } = {},
) {
  return useQuery<T>({
    queryKey: ["admin", "web-analytics", report, range, extra],
    queryFn: () => getAnalyticsReport<T>(report, { ...range, ...extra }),
    staleTime: options.refetchInterval ? 0 : 60_000,
    retry: 1,
    ...options,
  });
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Shared date-range state: defaults to the last 30 days. */
export function useAnalyticsRange() {
  const [range, setRange] = useState<AnalyticsRange>(() => {
    const to = new Date();
    const from = new Date(to.getTime() - 29 * 24 * 3600_000);
    return { from: isoDay(from), to: isoDay(to) };
  });
  return { range, setRange };
}
