"use client";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Badge, Select, Skeleton } from "@/components/ui";
import { AnalyticsNav } from "@/components/analytics/analytics-nav";
import { BarList, KpiCard, SectionCard, TrendChart } from "@/components/analytics/charts";
import { useAnalyticsRange, useAnalyticsReport } from "@/hooks/useWebAnalytics";

const CATEGORY_LABELS: Record<string, string> = {
  ORGANIC_SEARCH: "Organic search",
  AI: "AI assistants",
  SOCIAL: "Social",
  VIDEO: "Video",
  REFERRAL: "Referral",
  DIRECT: "Direct",
  PAID: "Paid",
  EMAIL: "Email",
  MESSAGING: "Messaging",
  UNKNOWN: "Unknown",
};

export default function TrafficAnalyticsPage() {
  const { range, setRange } = useAnalyticsRange();
  const [drillCategory, setDrillCategory] = useState<string>("");

  const overview = useAnalyticsReport("overview", range);
  const acquisition = useAnalyticsReport("acquisition", range);
  const ai = useAnalyticsReport("ai", range);
  const campaigns = useAnalyticsReport("campaigns", range);
  const drill = useAnalyticsReport("acquisition/sources", range, { category: drillCategory || undefined });

  const cur = overview.data?.current;
  const prev = overview.data?.previous;
  const aiTotals = ai.data?.totals ?? {};

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Traffic & acquisition</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            First-party data — bots excluded; “Direct” means the browser sent no referrer.
          </p>
        </div>
        <AnalyticsNav range={range} onRangeChange={setRange} />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard label="Visitors" value={cur?.visitors} previous={prev?.visitors} />
          <KpiCard label="Sessions" value={cur?.sessions} previous={prev?.sessions} />
          <KpiCard label="Page views" value={cur?.pageviews} previous={prev?.pageviews} />
          <KpiCard label="Signups" value={cur?.signups} previous={prev?.signups} />
          <KpiCard label="Purchases" value={cur?.purchases} previous={prev?.purchases} />
          <KpiCard label="Revenue" value={cur?.revenue} previous={prev?.revenue} format={(n) => `₹${Math.round(n).toLocaleString()}`} />
        </div>

        <SectionCard title="Daily trend" subtitle="Visitors, sessions and signups per day (rolled up nightly; today updates within 15 minutes)">
          {overview.isLoading ? <Skeleton className="h-64 w-full" /> : (
            <TrendChart
              data={overview.data?.daily ?? []}
              series={[
                { key: "visitors", label: "Visitors" },
                { key: "sessions", label: "Sessions" },
                { key: "signups", label: "Signups" },
              ]}
            />
          )}
        </SectionCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard title="Acquisition channels" subtitle="Sessions by channel — click a channel in the filter below to drill into its sources">
            {acquisition.isLoading ? <Skeleton className="h-48 w-full" /> : (
              <BarList
                rows={(acquisition.data?.byCategory ?? []).map((c: any) => ({
                  label: CATEGORY_LABELS[c.category] ?? c.category,
                  value: Number(c.sessions),
                  extra: `${Number(c.visitors).toLocaleString()} visitors`,
                }))}
              />
            )}
          </SectionCard>

          <SectionCard title="Top referrer domains" subtitle="Actual domains that sent traffic (never collapsed into a generic “Referral”)">
            {acquisition.isLoading ? <Skeleton className="h-48 w-full" /> : (
              <BarList
                rows={(acquisition.data?.topReferrers ?? []).map((r: any) => ({
                  label: String(r.domain),
                  value: Number(r.sessions),
                  extra: `${Number(r.visitors).toLocaleString()} visitors`,
                }))}
              />
            )}
          </SectionCard>
        </div>

        <SectionCard
          title="AI traffic"
          subtitle="Human visitors arriving from AI assistants — referrer/UTM evidence only, never inferred. AI crawlers are counted separately as bots."
          action={<Badge variant="purple"><Sparkles className="h-3 w-3" /> {Number(aiTotals.visitors ?? 0).toLocaleString()} visitors</Badge>}
        >
          {ai.isLoading ? <Skeleton className="h-40 w-full" /> : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                <h3 className="text-xs font-medium uppercase text-muted-foreground mb-2">By assistant</h3>
                <BarList
                  rows={(ai.data?.sources ?? []).map((s: any) => ({
                    label: String(s.source),
                    value: Number(s.sessions),
                    extra: `${s.signups} signups · ${s.purchases} purchases`,
                  }))}
                  emptyText="No AI-referred visits in this period."
                />
              </div>
              <div>
                <h3 className="text-xs font-medium uppercase text-muted-foreground mb-2">Top landing pages</h3>
                <BarList
                  rows={(ai.data?.landingPages ?? []).map((p: any) => ({
                    label: String(p.page ?? "/"),
                    value: Number(p.sessions),
                  }))}
                  emptyText="No AI-referred visits in this period."
                />
              </div>
              <div>
                <h3 className="text-xs font-medium uppercase text-muted-foreground mb-2">Products viewed from AI</h3>
                <BarList
                  rows={(ai.data?.products ?? []).map((p: any) => ({
                    label: String(p.name),
                    value: Number(p.views),
                    extra: `${p.visitors} visitors`,
                  }))}
                  emptyText="No AI-referred product views yet."
                />
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Sources"
          subtitle="Every source with sessions in range — visitors → engagement → signups → purchases → revenue"
          action={
            <Select value={drillCategory} onChange={(e) => setDrillCategory(e.target.value)} className="w-44 !py-1.5 text-xs">
              <option value="">All channels</option>
              {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          }
        >
          <SourceTable rows={drill.data ?? []} loading={drill.isLoading} />
        </SectionCard>

        <SectionCard title="Campaigns (UTM)" subtitle="Tagged campaign links — visitors → product views → signups → purchases → revenue">
          {campaigns.isLoading ? <Skeleton className="h-32 w-full" /> : (campaigns.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No campaign traffic yet. Tag links with utm_source / utm_medium / utm_campaign to measure them here.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-muted-foreground">
                    <th className="px-2 py-2 font-medium">Campaign</th>
                    <th className="px-2 py-2 font-medium">Source / medium</th>
                    <th className="px-2 py-2 font-medium text-right">Visitors</th>
                    <th className="px-2 py-2 font-medium text-right">Sessions</th>
                    <th className="px-2 py-2 font-medium text-right">Product views</th>
                    <th className="px-2 py-2 font-medium text-right">Signups</th>
                    <th className="px-2 py-2 font-medium text-right">Purchases</th>
                    <th className="px-2 py-2 font-medium text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {(campaigns.data ?? []).map((c: any, i: number) => (
                    <tr key={i}>
                      <td className="px-2 py-1.5 text-foreground">{String(c.campaign)}</td>
                      <td className="px-2 py-1.5 text-muted-foreground">{String(c.source ?? "—")} / {String(c.medium ?? "—")}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{Number(c.visitors).toLocaleString()}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{Number(c.sessions).toLocaleString()}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{Number(c.productViews).toLocaleString()}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{Number(c.signups).toLocaleString()}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{Number(c.purchases).toLocaleString()}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">₹{Number(c.revenue).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </AdminLayout>
  );
}

function SourceTable({ rows, loading }: { rows: any[]; loading: boolean }) {
  if (loading) return <Skeleton className="h-40 w-full" />;
  if (!rows.length) return <p className="text-sm text-muted-foreground py-4 text-center">No traffic in this period.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase text-muted-foreground">
            <th className="px-2 py-2 font-medium">Source</th>
            <th className="px-2 py-2 font-medium text-right">Visitors</th>
            <th className="px-2 py-2 font-medium text-right">Sessions</th>
            <th className="px-2 py-2 font-medium text-right">New</th>
            <th className="px-2 py-2 font-medium text-right">Page views</th>
            <th className="px-2 py-2 font-medium text-right">Product views</th>
            <th className="px-2 py-2 font-medium text-right">Signups</th>
            <th className="px-2 py-2 font-medium text-right">Purchases</th>
            <th className="px-2 py-2 font-medium text-right">Revenue</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {rows.map((r: any, i: number) => (
            <tr key={i}>
              <td className="px-2 py-1.5">
                <span className="text-foreground">{String(r.source)}</span>
                <span className="ml-1.5 text-[11px] text-muted-foreground">{String(r.category)}</span>
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums">{Number(r.visitors).toLocaleString()}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{Number(r.sessions).toLocaleString()}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{Number(r.newSessions).toLocaleString()}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{Number(r.pageviews).toLocaleString()}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{Number(r.productViews).toLocaleString()}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{Number(r.signups).toLocaleString()}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{Number(r.purchases).toLocaleString()}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">₹{Number(r.revenue).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
