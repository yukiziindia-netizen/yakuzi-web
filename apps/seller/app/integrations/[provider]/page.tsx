"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { Badge, Button, Skeleton } from "@/components/ui";
import {
  useCompleteIntegrationSetup,
  useDisconnectIntegration,
  useRequestIntegrationSync,
  useSellerIntegration,
  useUpdateIntegrationSettings,
} from "@/hooks/useSeller";
import {
  ConnectionStatusBadge,
  PROVIDER_META,
  timeAgo,
  type ProviderKey,
} from "@/components/integrations/provider-meta";

const DIRECTION_LABELS: Record<string, { title: string; help: string }> = {
  IMPORT_ONLY: {
    title: "Import only",
    help: "Changes on the channel update Yukizi.",
  },
  EXPORT_ONLY: {
    title: "Export only",
    help: "Yukizi controls the quantity on the channel.",
  },
  TWO_WAY: {
    title: "Two-way sync",
    help: "Yukizi and the channel keep each other up to date.",
  },
};

export default function IntegrationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const provider = String(params?.provider ?? "").toUpperCase() as ProviderKey;
  const meta = PROVIDER_META[provider];

  const { data, isLoading, isError } = useSellerIntegration(
    String(params?.provider ?? ""),
  );
  const [showDisconnect, setShowDisconnect] = useState(false);

  const integration = data?.integration;
  const activity: any[] = data?.activity?.data ?? [];
  const activeJob = data?.activeJob ?? null;

  if (!meta) {
    return (
      <div className="max-w-4xl mx-auto">
        <p className="text-sm text-muted-foreground">Unknown channel.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  // A 404 here means "not connected", which is a normal state, not a failure.
  if (isError || !integration) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <BackLink />
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="font-medium text-foreground">{meta.name} isn&apos;t connected</p>
          <p className="text-sm text-muted-foreground mt-1">
            Connect it from the Integrations page to start syncing.
          </p>
          <Link href="/integrations">
            <Button size="sm" className="mt-4">
              Go to Integrations
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <BackLink />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-semibold text-2xl text-foreground">{meta.name}</h1>
            <ConnectionStatusBadge
              health={integration.health}
              syncing={Boolean(activeJob)}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {integration.storeName ?? integration.storeUrl ?? "Connected account"}
          </p>
        </div>
        <SyncNowButton integrationId={integration.id} activeJob={activeJob} />
      </div>

      {integration.lastError && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" aria-hidden />
          <div>
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              This connection needs attention
            </p>
            <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">
              {integration.lastError}
            </p>
          </div>
        </div>
      )}

      {!integration.setupCompleted ? (
        <SetupWizard integration={integration} providerName={meta.name} />
      ) : (
        <SyncSettings integration={integration} />
      )}

      {/* Product mapping summary. Only meaningful once an import has run. */}
      {integration.setupCompleted && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-foreground">Product mapping</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {activeJob
                  ? "Importing this channel's catalogue..."
                  : "Match this channel's listings to your Yukizi products."}
              </p>
              {activeJob && activeJob.processedItems > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {activeJob.processedItems} listings processed so far
                </p>
              )}
            </div>
            <Link href={`/integrations/${String(params?.provider ?? "")}/mappings`}>
              <Button
                variant="outline"
                size="sm"
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              >
                View mapping
              </Button>
            </Link>
          </div>
        </motion.div>
      )}

      {/* Connection facts */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6"
      >
        <h2 className="font-semibold text-foreground mb-4">Connection</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <Fact label="Connected store" value={integration.storeName ?? "—"} mono />
          <Fact label="Last synced" value={timeAgo(integration.lastSuccessfulSyncAt)} />
          <Fact label="Connected on" value={new Date(integration.connectedAt).toLocaleDateString()} />
          {integration.marketplaceId && (
            <Fact label="Marketplace" value={integration.marketplaceId} mono />
          )}
        </dl>
      </motion.div>

      {/* Sync activity */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-card rounded-2xl p-6"
      >
        <h2 className="font-semibold text-foreground mb-4">Sync activity</h2>
        {activity.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <Clock className="h-7 w-7 mx-auto text-muted-foreground/40" aria-hidden />
            <p className="mt-3 text-sm text-muted-foreground">
              No sync activity yet. Activity appears here once syncing runs.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border/30">
            {activity.map((entry) => (
              <li key={entry.id} className="py-3 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm text-foreground">
                    {entry.message ?? entry.action.replace(/_/g, " ").toLowerCase()}
                  </p>
                  {entry.entityRef && (
                    <span className="font-mono text-xs text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded inline-block mt-1">
                      {entry.entityRef}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Badge
                    variant={
                      entry.status === "SUCCESS"
                        ? "success"
                        : entry.status === "WARNING"
                          ? "warning"
                          : "error"
                    }
                    size="sm"
                  >
                    {entry.status.toLowerCase()}
                  </Badge>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {timeAgo(entry.createdAt)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </motion.div>

      {/* Disconnect */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-foreground">Disconnect {meta.name}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Stop synchronizing with this channel. Your Yukizi products stay exactly as
              they are.
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            onClick={() => setShowDisconnect(true)}
          >
            Disconnect
          </Button>
        </div>
      </motion.div>

      {showDisconnect && (
        <DisconnectModal
          integrationId={integration.id}
          providerName={meta.name}
          onClose={() => setShowDisconnect(false)}
          onDone={() => router.push("/integrations")}
        />
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/integrations"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
      Integrations
    </Link>
  );
}

function Fact({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground uppercase tracking-wider">{label}</dt>
      <dd
        className={`mt-1 text-foreground ${
          mono ? "font-mono text-xs bg-muted/30 px-1.5 py-0.5 rounded inline-block" : "text-sm"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

/**
 * Sync Now. Disabled while a job is already queued or running, so repeated
 * clicks cannot pile up duplicate work — the server enforces the same rule.
 */
function SyncNowButton({
  integrationId,
  activeJob,
}: {
  integrationId: string;
  activeJob: { status: string } | null;
}) {
  const requestSync = useRequestIntegrationSync();
  const running = Boolean(activeJob);

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={running}
      loading={requestSync.isPending}
      leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
      onClick={() =>
        requestSync.mutate(integrationId, {
          onSuccess: (result) =>
            toast.success(
              result.alreadyQueued ? "A sync is already running." : "Sync queued.",
            ),
          onError: (err: any) =>
            toast.error(err?.response?.data?.message || "Couldn't queue a sync."),
        })
      }
    >
      {running ? "Sync running" : "Sync Now"}
    </Button>
  );
}

/**
 * First-connection wizard. Products/Inventory are real options; Prices and
 * Orders are shown as Coming soon rather than fake toggles that do nothing.
 */
function SetupWizard({
  integration,
  providerName,
}: {
  integration: any;
  providerName: string;
}) {
  const [syncProducts, setSyncProducts] = useState(true);
  const [syncInventory, setSyncInventory] = useState(true);
  const [direction, setDirection] = useState("IMPORT_ONLY");
  const [sourceOfTruth, setSourceOfTruth] = useState("YUKIZI");
  const complete = useCompleteIntegrationSetup();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6 space-y-6"
    >
      <div className="flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" aria-hidden />
        <div>
          <h2 className="font-semibold text-foreground">Connection successful</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {providerName} is connected as{" "}
            <span className="font-mono text-xs bg-muted/30 px-1.5 py-0.5 rounded">
              {integration.storeName ?? integration.storeUrl}
            </span>
            . Choose what to sync to finish setup.
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Choose what to sync</h3>
        <div className="space-y-2">
          <CheckRow
            label="Products"
            help="Import listings and match them to your Yukizi products."
            checked={syncProducts}
            onChange={setSyncProducts}
          />
          <CheckRow
            label="Inventory"
            help="Keep stock quantities aligned."
            checked={syncInventory}
            onChange={setSyncInventory}
          />
          <CheckRow label="Prices" help="Coming soon." checked={false} disabled />
          <CheckRow label="Orders" help="Coming soon." checked={false} disabled />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Inventory sync direction
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(["IMPORT_ONLY", "EXPORT_ONLY", "TWO_WAY"] as const).map((value) => {
            const twoWayLocked = value === "TWO_WAY";
            return (
              <button
                key={value}
                type="button"
                disabled={twoWayLocked}
                onClick={() => setDirection(value)}
                className={`text-left rounded-xl border p-3 transition-all ${
                  direction === value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-accent/40"
                } ${twoWayLocked ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <p className="text-sm font-medium text-foreground">
                  {DIRECTION_LABELS[value].title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {twoWayLocked
                    ? "Available once inventory sync is live."
                    : DIRECTION_LABELS[value].help}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Inventory source of truth
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setSourceOfTruth("YUKIZI")}
            className={`text-left rounded-xl border p-3 transition-all ${
              sourceOfTruth === "YUKIZI"
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-accent/40"
            }`}
          >
            <p className="text-sm font-medium text-foreground">
              Yukizi is inventory master{" "}
              <span className="text-xs text-muted-foreground">(recommended)</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Yukizi quantities are distributed to your connected channels.
            </p>
          </button>
          <button
            type="button"
            onClick={() => setSourceOfTruth("EXTERNAL")}
            className={`text-left rounded-xl border p-3 transition-all ${
              sourceOfTruth === "EXTERNAL"
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-accent/40"
            }`}
          >
            <p className="text-sm font-medium text-foreground">This channel is master</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Quantities on this channel overwrite Yukizi.
            </p>
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          size="sm"
          loading={complete.isPending}
          onClick={() =>
            complete.mutate(
              {
                id: integration.id,
                input: {
                  syncProducts,
                  syncInventory,
                  inventoryDirection: direction,
                  sourceOfTruth,
                },
              },
              {
                onSuccess: () => toast.success("Setup complete."),
                onError: (err: any) =>
                  toast.error(err?.response?.data?.message || "Couldn't save setup."),
              },
            )
          }
        >
          Finish setup
        </Button>
      </div>
    </motion.div>
  );
}

/** Post-setup controls. */
function SyncSettings({ integration }: { integration: any }) {
  const update = useUpdateIntegrationSettings();

  const save = (input: Record<string, unknown>) =>
    update.mutate(
      { id: integration.id, input },
      {
        onSuccess: () => toast.success("Settings updated."),
        onError: (err: any) =>
          toast.error(err?.response?.data?.message || "Couldn't update settings."),
      },
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6 space-y-4"
    >
      <h2 className="font-semibold text-foreground">Synchronization</h2>

      <ToggleRow
        label="Auto sync"
        help="Run scheduled syncing for this channel."
        checked={integration.syncEnabled}
        onChange={(v) => save({ syncEnabled: v })}
      />
      <ToggleRow
        label="Products"
        help="Keep listings matched to Yukizi products."
        checked={integration.syncProducts}
        onChange={(v) => save({ syncProducts: v })}
      />
      <ToggleRow
        label="Inventory"
        help="Keep stock quantities aligned."
        checked={integration.syncInventory}
        onChange={(v) => save({ syncInventory: v })}
      />

      <div className="pt-2 border-t border-border/40">
        <p className="text-sm font-medium text-foreground mb-1">Inventory direction</p>
        <p className="text-xs text-muted-foreground">
          {DIRECTION_LABELS[integration.inventoryDirection]?.title} —{" "}
          {DIRECTION_LABELS[integration.inventoryDirection]?.help}
        </p>
      </div>
    </motion.div>
  );
}

function CheckRow({
  label,
  help,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  help: string;
  checked: boolean;
  onChange?: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-start gap-3 rounded-xl border border-border p-3 ${
        disabled ? "opacity-60" : "cursor-pointer hover:bg-accent/40"
      } transition-colors`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
      />
      <span>
        <span className="text-sm font-medium text-foreground block">{label}</span>
        <span className="text-xs text-muted-foreground">{help}</span>
      </span>
    </label>
  );
}

/** Switch styled like the admin app's, since the seller app has no Switch. */
function ToggleRow({
  label,
  help,
  checked,
  onChange,
}: {
  label: string;
  help: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{help}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`relative h-6 w-11 rounded-full transition-colors flex-shrink-0 ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <div
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function DisconnectModal({
  integrationId,
  providerName,
  onClose,
  onDone,
}: {
  integrationId: string;
  providerName: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const disconnect = useDisconnectIntegration();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass-card rounded-2xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-4 w-4 text-red-600" aria-hidden />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">
                Disconnect {providerName}?
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Yukizi will stop synchronizing products and inventory with this store. Your
                existing Yukizi products will not be deleted.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={disconnect.isPending}
            onClick={() =>
              disconnect.mutate(integrationId, {
                onSuccess: () => {
                  toast.success(`${providerName} disconnected.`);
                  onDone();
                },
                onError: (err: any) =>
                  toast.error(err?.response?.data?.message || "Couldn't disconnect."),
              })
            }
          >
            Disconnect
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
