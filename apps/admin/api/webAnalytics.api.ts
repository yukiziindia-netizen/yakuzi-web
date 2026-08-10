import { apiClient } from "@/lib/apiClient";

/** Thin fetchers over the first-party analytics reports (yakuzi-api /admin/analytics/*). */

export interface AnalyticsRange {
  from?: string; // YYYY-MM-DD
  to?: string;
}

function qs(params: Record<string, string | undefined>): string {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) p.set(k, v); });
  const s = p.toString();
  return s ? `?${s}` : "";
}

export async function getAnalyticsReport<T = any>(report: string, params: Record<string, string | undefined> = {}): Promise<T> {
  const { data } = await apiClient.get<{ data: T }>(`/admin/analytics/${report}${qs(params)}`);
  return data.data;
}

/** CSV export: fetches with auth and hands the browser a download. */
export async function downloadAnalyticsCsv(report: string, range: AnalyticsRange): Promise<void> {
  const res = await apiClient.get(`/admin/analytics/export${qs({ report, ...range })}`, { responseType: "blob" });
  const url = URL.createObjectURL(res.data as Blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `analytics-${report}-${range.from ?? "30d"}-${range.to ?? "today"}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
