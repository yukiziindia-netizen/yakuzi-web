"use client";
import { useState } from "react";
import { Download } from "lucide-react";
import toast from "react-hot-toast";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Badge, Button, Skeleton } from "@/components/ui";
import { AnalyticsNav } from "@/components/analytics/analytics-nav";
import { SectionCard } from "@/components/analytics/charts";
import { useAnalyticsRange, useAnalyticsReport } from "@/hooks/useWebAnalytics";
import { downloadAnalyticsCsv } from "@/api/webAnalytics.api";

const EXPORTS = [
  { report: "sources", label: "Traffic sources" },
  { report: "campaigns", label: "Campaigns" },
  { report: "pages", label: "Pages" },
  { report: "products", label: "Products" },
  { report: "searches", label: "Site searches" },
  { report: "events", label: "Event counts" },
];

export default function AnalyticsHealthPage() {
  const { range, setRange } = useAnalyticsRange();
  const health = useAnalyticsReport("health", {});
  const [exporting, setExporting] = useState<string | null>(null);

  const h = health.data;
  const lastEventAgeMin = h?.lastEvent?.ts ? Math.round((Date.now() - new Date(h.lastEvent.ts).getTime()) / 60000) : null;

  const handleExport = async (report: string) => {
    setExporting(report);
    try {
      await downloadAnalyticsCsv(report, range);
    } catch {
      toast.error("Export failed — try a smaller date range.");
    } finally {
      setExporting(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Analytics health & export</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Is tracking itself working — and CSV exports of every report.</p>
        </div>
        <AnalyticsNav range={range} onRangeChange={setRange} />

        <SectionCard title="Tracking health" subtitle="If the last event is hours old while the site has traffic, the tracker or ingest path is broken">
          {health.isLoading ? <Skeleton className="h-32 w-full" /> : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Events (last 24h)</p>
                <p className="text-xl font-semibold text-foreground">{Number(h?.eventsLast24h ?? 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last event</p>
                <p className="text-xl font-semibold text-foreground">
                  {lastEventAgeMin === null ? "never" : lastEventAgeMin < 1 ? "just now" : `${lastEventAgeMin}m ago`}
                </p>
                {h?.lastEvent?.name && <p className="text-xs text-muted-foreground">{String(h.lastEvent.name)}</p>}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Unattributed sessions (24h)</p>
                <p className="text-xl font-semibold text-foreground">{Number(h?.unattributedSessionsLast24h ?? 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">UNKNOWN source — should stay near zero</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Since last API restart</p>
                <p className="text-sm text-foreground mt-1">
                  {Number(h?.sinceRestart?.received ?? 0).toLocaleString()} received ·{" "}
                  <span className={Number(h?.sinceRestart?.errors) > 0 ? "text-red-500" : ""}>
                    {Number(h?.sinceRestart?.errors ?? 0)} errors
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  rollup: {h?.sinceRestart?.lastRollupAt ? new Date(h.sinceRestart.lastRollupAt).toLocaleTimeString() : "pending"}
                </p>
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Export CSV" subtitle="Uses the date range selected above">
          <div className="flex flex-wrap gap-2">
            {EXPORTS.map(({ report, label }) => (
              <Button key={report} variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}
                loading={exporting === report} onClick={() => handleExport(report)}>
                {label}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Need JSON instead? Every report is also available raw at <code className="bg-muted px-1 rounded">GET /api/admin/analytics/&lt;report&gt;</code> with your admin token.
          </p>
        </SectionCard>

        <SectionCard title="What this system does NOT do" subtitle="Honesty notes, so numbers are never over-read">
          <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
            <li>“Direct” means the browser sent no referrer — typed URLs, bookmarks, most apps, and some privacy tools all land here.</li>
            <li>AI traffic is counted only on hard evidence (referrer or UTM). Visits from AI apps that strip the referrer appear as Direct.</li>
            <li>Visitors with Do-Not-Track enabled, blocked storage, or aggressive ad-blockers are partially or fully invisible — signups and purchases are still counted server-side.</li>
            <li>Geo comes from Vercel's edge headers (country/region/city). No IP addresses are stored anywhere.</li>
            <li>One person on two devices counts as two visitors until they log in on both.</li>
          </ul>
        </SectionCard>
      </div>
    </AdminLayout>
  );
}
