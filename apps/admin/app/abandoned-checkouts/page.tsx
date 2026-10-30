"use client";
import { useState, useEffect } from "react";
import { Search, Phone, AlertTriangle } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Input, Badge, Pagination } from "@/components/ui";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { formatCurrency } from "@yukizi/utils";
import { cn } from "@/lib/utils";
import { useAbandonedCheckouts } from "@/hooks/useAdmin";

const TABS = [
  { label: "Abandoned", v: "abandoned" },
  { label: "In progress", v: "in_progress" },
  { label: "All", v: "all" },
] as const;

// Mirrors ABANDONMENT_TRACKING_START in the API. Older orders carry no signal
// that says whether they were ever paid for, so they are not listed — said on
// screen rather than leaving an owner to wonder where last month's went.
const TRACKING_SINCE = "19 Aug 2026";
const PAGE_LIMIT = 20;

const when = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : "—";

// A picked end date is its first instant; the API treats a bare ISO time as
// exact, which would silently drop the whole last day of the range.
const endOfDay = (d?: Date) => {
  if (!d) return undefined;
  const e = new Date(d);
  e.setHours(23, 59, 59, 999);
  return e.toISOString();
};

function SummaryCard({ label, value, hint, tone }: { label: string; value: string; hint: string; tone?: "loss" }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-2 text-2xl font-semibold", tone === "loss" ? "text-red-600 dark:text-red-400" : "text-foreground")}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export default function AbandonedCheckoutsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["v"]>("abandoned");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showTest, setShowTest] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  useEffect(() => { setPage(1); }, [tab, search, dateRange, showTest]);

  const { data, isLoading, isError, error, refetch, isFetching } = useAbandonedCheckouts({
    state: tab,
    page,
    limit: PAGE_LIMIT,
    search: search || undefined,
    dateFrom: dateRange?.from?.toISOString(),
    dateTo: endOfDay(dateRange?.to ?? dateRange?.from),
    includeTestOrders: showTest ? "true" : undefined,
  });

  const rows = data?.data ?? [];
  const summary = data?.summary;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-semibold text-2xl text-foreground">Abandoned Checkouts</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Buyers who reached payment and did not finish. A recovery email already goes out automatically; this is the record of who, and what it cost.
            </p>
          </div>
          <DateRangePicker value={dateRange} onChange={setDateRange} align="end" />
        </div>

        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SummaryCard tone="loss" label="Revenue lost" value={formatCurrency(summary.abandonedValue)} hint="Gross value of abandoned checkouts, before any that came back" />
            <SummaryCard label="Abandoned checkouts" value={String(summary.abandonedCount)} hint="Given up and cancelled" />
            <SummaryCard label="In progress" value={`${summary.inProgressCount} · ${formatCurrency(summary.inProgressValue)}`} hint="Payment window still open — too early to chase" />
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input placeholder="Search by buyer phone, name or email…" value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4" />} />
          </div>
          <div className="flex gap-1.5 flex-wrap" role="group" aria-label="Checkout state">
            {TABS.map(({ label, v }) => (
              <button key={v} onClick={() => setTab(v)} aria-pressed={tab === v}
                className={cn("px-3 py-2 rounded-xl text-xs font-medium border transition-all", tab === v ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:bg-accent/60")}>{label}</button>
            ))}
            <button onClick={() => setShowTest(v => !v)}
              className={cn("px-3 py-2 rounded-xl text-xs font-medium border transition-all whitespace-nowrap", showTest ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:bg-accent/60")}>
              {showTest ? "Hide test accounts" : "Show test accounts"}
            </button>
          </div>
        </div>

        {data?.truncated && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>This range holds more checkouts than can be listed, so the oldest are missing and the totals above undercount. Narrow the dates.</span>
          </div>
        )}

        {isError ? (
          // A failed read must never look like an empty list: "no abandoned
          // checkouts" is good news, and this screen would be saying it by accident.
          <div role="alert" className="glass-card rounded-2xl p-8 text-center space-y-3">
            <p className="font-medium text-foreground">Could not load abandoned checkouts</p>
            <p className="text-sm text-muted-foreground">{(error as any)?.response?.data?.message ?? "Something went wrong reaching the server."}</p>
            <button onClick={() => void refetch()} className="px-4 py-2 rounded-xl text-sm font-medium border border-border hover:bg-accent/60">Try again</button>
          </div>
        ) : isLoading ? (
          <div className="min-h-[30vh] flex items-center justify-center">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className={cn("glass-card rounded-2xl overflow-hidden transition-opacity", isFetching && "opacity-70")}>
            <div className="overflow-x-auto">
              <table className="w-full" aria-label="Abandoned checkouts">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/20">
                    {["Buyer", "Items", "Amount", "Started", "Outcome"].map(h => (
                      <th key={h} scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {rows.map(r => {
                    const name = r.address?.name ?? r.buyer?.buyerProfile?.legalName ?? "—";
                    const phone = r.buyer?.phone ?? r.address?.phone ?? null;
                    const shown = r.items.slice(0, 2);
                    return (
                      <tr key={r.id} className="hover:bg-accent/30 transition-colors align-top">
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-foreground">{name}</p>
                          {phone && (
                            <a href={`tel:${phone}`} className="mt-0.5 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                              <Phone className="h-3 w-3" />{phone}
                            </a>
                          )}
                          {r.buyer?.email && <p className="text-xs text-muted-foreground">{r.buyer.email}</p>}
                        </td>
                        <td className="px-5 py-4 text-sm text-foreground">
                          {shown.map((i, idx) => <p key={idx}>{i.name} <span className="text-muted-foreground">×{i.quantity}</span></p>)}
                          {r.items.length > shown.length && <p className="text-xs text-muted-foreground">+{r.items.length - shown.length} more</p>}
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-foreground whitespace-nowrap">{formatCurrency(r.totalAmount)}</td>
                        <td className="px-5 py-4 text-sm text-muted-foreground whitespace-nowrap">{when(r.startedAt)}</td>
                        <td className="px-5 py-4 space-y-1">
                          {r.state === "in_progress"
                            ? <Badge variant="warning">In progress</Badge>
                            : <Badge variant="error">Abandoned</Badge>}
                          {r.state === "abandoned" && r.cancelledAt && <p className="text-xs text-muted-foreground">Cancelled {when(r.cancelledAt)}</p>}
                          {r.boughtLater && <div><Badge variant="success">Bought since</Badge></div>}
                        </td>
                      </tr>
                    );
                  })}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">
                        {tab === "in_progress" ? "No checkouts are in progress right now." : "No abandoned checkouts match these filters."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {(data?.totalPages ?? 0) > 1 && <Pagination page={page} totalPages={data!.totalPages} onPageChange={setPage} />}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Tracking began {TRACKING_SINCE}; earlier orders carry no record of whether they were ever paid for, so they are not listed. {data ? `${data.total} shown.` : ""}
        </p>
      </div>
    </AdminLayout>
  );
}
