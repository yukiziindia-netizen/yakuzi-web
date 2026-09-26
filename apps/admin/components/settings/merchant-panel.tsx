"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, PlayCircle, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui";
import toast from "react-hot-toast";
import {
  getMerchantStatus,
  runMerchantSync,
  type MerchantSyncSummary,
} from "@/api/admin.api";

/**
 * The interactive half of the Merchant Center settings: check readiness, do a
 * dry run (maps everything and reports what WOULD be sent, no Google call, no
 * credentials needed), or push for real. The account/data-source fields and
 * the on/off flag live in the main settings form; this panel drives the sync.
 */
/**
 * Turns whatever was thrown into one short line an admin can act on.
 *
 * Distinguishes the three cases that previously looked identical: the server
 * refused (status + its own message), the server was unreachable, or the
 * response arrived but was not the shape the client expected.
 */
function describeError(err: unknown): string {
  const res = (err as { response?: { status?: number; data?: { message?: string } } })?.response;
  if (res?.status) {
    const detail = res.data?.message;
    if (res.status === 401) return "not signed in (401)";
    if (res.status === 403) return "your admin role lacks the Settings permission (403)";
    if (res.status === 404) return "the endpoint is missing — the API may need deploying (404)";
    return detail ? `server said ${res.status}: ${detail}` : `server returned ${res.status}`;
  }
  if ((err as { code?: string })?.code === "ERR_NETWORK") return "the API is unreachable";
  const message = (err as Error)?.message;
  return message ? message : "unexpected response from the API";
}

export function MerchantPanel({ enabled }: { enabled: boolean }) {
  const [busy, setBusy] = useState<null | "dry" | "live" | "status">(null);
  const [result, setResult] = useState<MerchantSyncSummary | null>(null);
  const [problems, setProblems] = useState<string[] | null>(null);

  const checkStatus = async () => {
    setBusy("status");
    try {
      const s = await getMerchantStatus();
      setProblems(s.problems);
      setResult(s.lastSync);
      toast.success(s.ready ? "Ready to sync" : "Not ready yet — see the checklist");
    } catch (err) {
      // Show why. The bare `catch {}` here previously discarded the cause, so
      // a permission error, an outage and a malformed response were all
      // indistinguishable — which is what made a response-shape mismatch take
      // so long to identify.
      toast.error(`Could not read Merchant Center status — ${describeError(err)}`);
    } finally {
      setBusy(null);
    }
  };

  const sync = async (dryRun: boolean) => {
    setBusy(dryRun ? "dry" : "live");
    try {
      const summary = await runMerchantSync(dryRun);
      setResult(summary);
      if (!summary.ran) {
        toast.error(summary.reason || "Sync did not run");
      } else {
        toast.success(
          `${dryRun ? "Dry run" : "Synced"}: ${summary.pushed} product${summary.pushed === 1 ? "" : "s"}` +
            (summary.failed ? `, ${summary.failed} failed` : ""),
        );
      }
    } catch (err) {
      toast.error(`${dryRun ? "Dry run" : "Sync"} failed — ${describeError(err)}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="glass-card rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <ShoppingBag className="h-4.5 w-4.5 text-primary" aria-hidden />
        </div>
        <h2 className="font-semibold text-foreground">Merchant Center sync</h2>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        A dry run shows exactly which products would be sent to Google and why
        any are skipped — it makes no changes and needs no credentials. Sync now
        pushes for real (only works once the fields above are set, the server
        credential is in place, and the switch is on).
      </p>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={checkStatus} loading={busy === "status"}>
          Check status
        </Button>
        <Button variant="outline" onClick={() => sync(true)} loading={busy === "dry"}>
          <FlaskConical className="h-4 w-4 mr-1.5" /> Dry run
        </Button>
        <Button onClick={() => sync(false)} loading={busy === "live"} disabled={!enabled}>
          <PlayCircle className="h-4 w-4 mr-1.5" /> Sync now
        </Button>
      </div>

      {problems && problems.length > 0 && (
        <div className="mt-4 rounded-xl bg-amber-500/10 p-4">
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-1">
            Before a real sync can run:
          </p>
          <ul className="list-disc pl-5 text-xs text-amber-700/90 dark:text-amber-400/90 space-y-0.5">
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      {result && (
        <div className="mt-4 rounded-xl bg-accent/40 p-4 text-sm">
          <p className="font-medium text-foreground">
            {result.dryRun ? "Dry run" : "Last sync"}
            {result.ran ? "" : " — did not run"}
          </p>
          {result.ran ? (
            <p className="text-muted-foreground mt-1">
              {result.pushed} of {result.total} product{result.total === 1 ? "" : "s"} sent
              {result.skipped ? `, ${result.skipped} skipped` : ""}
              {result.failed ? `, ${result.failed} failed` : ""}.
            </p>
          ) : (
            <p className="text-muted-foreground mt-1">{result.reason}</p>
          )}
          {result.problems && result.problems.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-xs text-muted-foreground space-y-0.5">
              {result.problems.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </motion.div>
  );
}
