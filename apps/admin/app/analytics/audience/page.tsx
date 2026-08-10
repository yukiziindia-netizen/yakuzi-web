"use client";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Badge, Skeleton } from "@/components/ui";
import { AnalyticsNav } from "@/components/analytics/analytics-nav";
import { BarList, CohortTable, SectionCard } from "@/components/analytics/charts";
import { useAnalyticsRange, useAnalyticsReport } from "@/hooks/useWebAnalytics";

export default function AudienceAnalyticsPage() {
  const { range, setRange } = useAnalyticsRange();
  const geo = useAnalyticsReport("geography", range);
  const devices = useAnalyticsReport("devices", range);
  const retention = useAnalyticsReport("retention", range);
  const quality = useAnalyticsReport("quality", range);
  const signups = useAnalyticsReport("signups", range);

  const geoRows = (list: any[] | undefined, label: (r: any) => string) =>
    (list ?? []).map((r: any) => ({ label: label(r), value: Number(r.sessions), extra: `${Number(r.visitors).toLocaleString()} visitors` }));

  const deviceRows = (list: any[] | undefined) =>
    (list ?? []).map((r: any) => ({
      label: String(r.value ?? "Unknown"),
      value: Number(r.sessions),
      extra: `${r.signupRate}% signup rate`,
    }));

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Audience</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Where visitors are, what they use, and whether they come back.</p>
        </div>
        <AnalyticsNav range={range} onRangeChange={setRange} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SectionCard title="Countries">
            {geo.isLoading ? <Skeleton className="h-40 w-full" /> : <BarList rows={geoRows(geo.data?.countries, (r) => String(r.country))} />}
          </SectionCard>
          <SectionCard title="States / regions">
            {geo.isLoading ? <Skeleton className="h-40 w-full" /> : <BarList rows={geoRows(geo.data?.regions, (r) => `${r.region}, ${r.country}`)} />}
          </SectionCard>
          <SectionCard title="Cities">
            {geo.isLoading ? <Skeleton className="h-40 w-full" /> : <BarList rows={geoRows(geo.data?.cities, (r) => `${r.city}, ${r.region ?? r.country}`)} />}
          </SectionCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SectionCard title="Devices" subtitle="Signup rate shows which device actually converts">
            {devices.isLoading ? <Skeleton className="h-40 w-full" /> : <BarList rows={deviceRows(devices.data?.deviceTypes)} />}
          </SectionCard>
          <SectionCard title="Operating systems">
            {devices.isLoading ? <Skeleton className="h-40 w-full" /> : <BarList rows={deviceRows(devices.data?.os)} />}
          </SectionCard>
          <SectionCard title="Browsers">
            {devices.isLoading ? <Skeleton className="h-40 w-full" /> : <BarList rows={deviceRows(devices.data?.browsers)} />}
          </SectionCard>
        </div>

        <SectionCard title="Retention cohorts" subtitle="Of visitors first seen each week, the share that came back within N days">
          {retention.isLoading ? <Skeleton className="h-48 w-full" /> : <CohortTable rows={retention.data ?? []} />}
        </SectionCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard title="Signups by source" subtitle="First-touch source of visitors who signed up in range">
            {signups.isLoading ? <Skeleton className="h-40 w-full" /> : (
              <BarList
                rows={(signups.data?.bySource ?? []).filter((s: any) => Number(s.signups) > 0).map((s: any) => ({
                  label: String(s.source ?? "Unknown"),
                  value: Number(s.signups),
                  extra: `${s.signupRate}% of ${Number(s.visitors).toLocaleString()} visitors`,
                }))}
                emptyText="No signups in range."
              />
            )}
          </SectionCard>

          <SectionCard
            title="Traffic quality"
            subtitle="Bots and crawlers are stored but never mixed into the human reports"
            action={quality.data && (
              <Badge variant={Number(quality.data.botSessions) > Number(quality.data.humanSessions) ? "warning" : "success"}>
                {Number(quality.data.humanSessions).toLocaleString()} human / {Number(quality.data.botSessions).toLocaleString()} bot
              </Badge>
            )}
          >
            {quality.isLoading ? <Skeleton className="h-40 w-full" /> : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {Number(quality.data?.lowEngagementSessions ?? 0).toLocaleString()} human sessions
                  ({quality.data?.lowEngagementPct ?? 0}%) bounced in under 5 seconds.
                </p>
                <BarList
                  rows={(quality.data?.botFamilies ?? []).map((b: any) => ({ label: String(b.bot), value: Number(b.sessions) }))}
                  emptyText="No bot traffic detected in range."
                />
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </AdminLayout>
  );
}
