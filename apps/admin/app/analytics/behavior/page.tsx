"use client";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Skeleton } from "@/components/ui";
import { AnalyticsNav } from "@/components/analytics/analytics-nav";
import { BarList, FunnelSteps, SectionCard } from "@/components/analytics/charts";
import { useAnalyticsRange, useAnalyticsReport } from "@/hooks/useWebAnalytics";

export default function BehaviorAnalyticsPage() {
  const { range, setRange } = useAnalyticsRange();
  const pages = useAnalyticsReport("pages", range);
  const products = useAnalyticsReport("products", range);
  const productSources = useAnalyticsReport("products/sources", range);
  const searches = useAnalyticsReport("searches", range);
  const funnel = useAnalyticsReport("funnel", range);
  const events = useAnalyticsReport("events", range);

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Behavior</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Pages, products, searches and the conversion funnel.</p>
        </div>
        <AnalyticsNav range={range} onRangeChange={setRange} />

        <SectionCard title="Conversion funnel" subtitle="Unique visitors reaching each stage (% of the previous stage)">
          {funnel.isLoading ? <Skeleton className="h-40 w-full" /> : <FunnelSteps stages={funnel.data ?? []} />}
        </SectionCard>

        <SectionCard title="Top pages" subtitle="Views, unique visitors, engagement and bounce (single-pageview sessions under 10s)">
          {pages.isLoading ? <Skeleton className="h-48 w-full" /> : (pages.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No page views in range.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-muted-foreground">
                    <th className="px-2 py-2 font-medium">Page</th>
                    <th className="px-2 py-2 font-medium text-right">Views</th>
                    <th className="px-2 py-2 font-medium text-right">Visitors</th>
                    <th className="px-2 py-2 font-medium text-right">Entries</th>
                    <th className="px-2 py-2 font-medium text-right">Bounce</th>
                    <th className="px-2 py-2 font-medium text-right">Avg scroll</th>
                    <th className="px-2 py-2 font-medium text-right">Engaged time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {(pages.data ?? []).map((p: any) => (
                    <tr key={String(p.page)}>
                      <td className="px-2 py-1.5 text-foreground max-w-[16rem] truncate" title={String(p.page)}>{String(p.page)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{Number(p.views).toLocaleString()}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{Number(p.visitors).toLocaleString()}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{Number(p.entries).toLocaleString()}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{p.bounceRate == null ? "—" : `${p.bounceRate}%`}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{Number(p.avgScrollPct) ? `${p.avgScrollPct}%` : "—"}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{formatMs(Number(p.engagedMs))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard title="Top products" subtitle="Views → carts → purchases per product">
            {products.isLoading ? <Skeleton className="h-48 w-full" /> : (
              <BarList
                rows={(products.data ?? []).map((p: any) => ({
                  label: String(p.name),
                  value: Number(p.views),
                  extra: `${p.addToCart} carts · ${p.purchases} bought`,
                }))}
                emptyText="No product views in range."
              />
            )}
          </SectionCard>

          <SectionCard title="Site searches" subtitle="What shoppers type — zero-result queries reveal missing catalog">
            {searches.isLoading ? <Skeleton className="h-48 w-full" /> : (
              <BarList
                rows={(searches.data ?? []).map((s: any) => ({
                  label: String(s.query),
                  value: Number(s.searches),
                  extra: Number(s.zeroResults) > 0 ? `${s.zeroResults}× no results` : undefined,
                }))}
                emptyText="No searches in range."
              />
            )}
          </SectionCard>
        </div>

        <SectionCard title="Product × traffic source" subtitle="Where the viewers of the top 10 products actually came from">
          {productSources.isLoading ? <Skeleton className="h-40 w-full" /> : (productSources.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Needs product views with session attribution — check back once traffic flows.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-muted-foreground">
                    <th className="px-2 py-2 font-medium">Product</th>
                    <th className="px-2 py-2 font-medium">Source</th>
                    <th className="px-2 py-2 font-medium text-right">Views</th>
                    <th className="px-2 py-2 font-medium text-right">Visitors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {(productSources.data ?? []).map((r: any, i: number) => (
                    <tr key={i}>
                      <td className="px-2 py-1.5 text-foreground max-w-[16rem] truncate" title={String(r.name)}>{String(r.name)}</td>
                      <td className="px-2 py-1.5 text-muted-foreground">{String(r.source)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{Number(r.views).toLocaleString()}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{Number(r.visitors).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <SectionCard title="All events" subtitle="Everything the tracker recorded in range">
          {events.isLoading ? <Skeleton className="h-32 w-full" /> : (
            <BarList
              rows={(events.data ?? []).map((e: any) => ({ label: String(e.name), value: Number(e.count) }))}
              emptyText="No events in range."
            />
          )}
        </SectionCard>
      </div>
    </AdminLayout>
  );
}

function formatMs(ms: number): string {
  if (!ms) return "—";
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}
