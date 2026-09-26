"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Key, LifeBuoy, Building2, Hash, ShoppingBag, Radio } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button, Input, Skeleton } from "@/components/ui";
import toast from "react-hot-toast";
import { usePlatformSettings, useUpdatePlatformSettings } from "@/hooks/useAdmin";
import { MerchantPanel } from "@/components/settings/merchant-panel";

export default function AdminSettingsPage() {
  const { data: settingsData, isLoading } = usePlatformSettings();
  const updateSettings = useUpdatePlatformSettings();
  const [form, setForm] = useState<Record<string, any>>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (settingsData) {
      const s = typeof settingsData === "object" ? settingsData : {};
      setForm({
        adminAlertEmail: s.adminAlertEmail ?? "",
        mailFromAddress: s.mailFromAddress ?? "",
        supportEmail: s.supportEmail ?? "",
        supportPhone: s.supportPhone ?? "",
        comingSoonMode: s.comingSoonMode ?? true,
        // The commission-invoice issuer details. Seeded here so the fields
        // below show what is actually stored instead of rendering blank and
        // silently wiping the saved values on the next save.
        companyLegalName: s.companyLegalName ?? "",
        companyGstin: s.companyGstin ?? "",
        companyState: s.companyState ?? "",
        companyAddress: s.companyAddress ?? "",
        companyEmail: s.companyEmail ?? "",
        // Invoice numbering. Dotted keys are flat SystemSetting keys, not
        // nested objects.
        "invoiceNumbering.enabled": s["invoiceNumbering.enabled"] ?? false,
        "invoiceNumbering.resetMonth": s["invoiceNumbering.resetMonth"] ?? 4,
        "invoiceNumbering.resetDay": s["invoiceNumbering.resetDay"] ?? 1,
        "invoiceNumbering.consumer.prefix": s["invoiceNumbering.consumer.prefix"] ?? "YKZ/INV",
        "invoiceNumbering.consumer.next": s["invoiceNumbering.consumer.next"] ?? 1,
        "invoiceNumbering.consumer.resetStart": s["invoiceNumbering.consumer.resetStart"] ?? 1,
        "invoiceNumbering.seller.prefix": s["invoiceNumbering.seller.prefix"] ?? "YKZ/COM",
        "invoiceNumbering.seller.next": s["invoiceNumbering.seller.next"] ?? 1,
        "invoiceNumbering.seller.resetStart": s["invoiceNumbering.seller.resetStart"] ?? 1,
        // Google Merchant Center. The credential is a server env var, never here.
        "merchant.enabled": s["merchant.enabled"] ?? false,
        "merchant.accountId": s["merchant.accountId"] ?? "",
        "merchant.dataSourceId": s["merchant.dataSourceId"] ?? "",
        // Meta (Facebook) Pixel. The Conversions API token is a server env var.
        "metaPixel.enabled": s["metaPixel.enabled"] ?? false,
        "metaPixel.pixelId": s["metaPixel.pixelId"] ?? "",
        // Owned by the SEO page — round-tripped so saving here never wipes them.
        googleSiteVerification: s.googleSiteVerification ?? "",
        bingSiteVerification: s.bingSiteVerification ?? "",
      });
    }
  }, [settingsData]);

  const set = (key: string, value: any) => {
    setForm(f => ({ ...f, [key]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(form);
      toast.success("Settings saved!");
      setDirty(false);
    } catch {
      toast.error("Failed to save settings");
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6 max-w-3xl">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </AdminLayout>
    );
  }

  const SECTIONS: { id: string; icon: any; title: string; fields: { key: string; label: string; type?: string }[] }[] = [
    { id: "notifications", icon: Bell, title: "Notifications", fields: [
      { key: "adminAlertEmail", label: "Admin Alert Email (receives new-seller signups, seller shipping-details submissions, and a copy of every tax invoice issued)" },
      { key: "mailFromAddress", label: "Sender Email (must be a verified alias on the mail account, else Gmail will reject it)" },
    ]},
    // Published to customers, so it is worth being explicit that these are
    // public. Blank falls back to the storefront's built-in details rather
    // than publishing an empty contact.
    // Yukizi is the SUPPLIER on a commission invoice, so these are its own
    // registered details — not the seller's, and not the support contact
    // above. Without the GSTIN the commission document goes out as a payout
    // statement instead of a tax invoice, because a tax invoice without the
    // issuer's GSTIN is not one a seller can claim input credit against.
    { id: "company", icon: Building2, title: "Registered company details (commission invoices)", fields: [
      { key: "companyLegalName", label: "Registered legal name (as on the GST certificate)" },
      { key: "companyGstin", label: "GSTIN — REQUIRED before commission invoices count as tax invoices" },
      { key: "companyState", label: "Registered state (decides CGST + SGST vs IGST against the seller's state)" },
      { key: "companyAddress", label: "Registered address" },
      { key: "companyEmail", label: "Accounts email shown on the invoice" },
    ]},
    { id: "support", icon: LifeBuoy, title: "Public support contact", fields: [
      { key: "supportEmail", label: "Support Email (shown on Contact, About and every policy page — leave blank to keep the current one)" },
      { key: "supportPhone", label: "Support Phone (shown alongside the email and in the site's structured data)" },
    ]},
    // Only takes effect once "Use my own invoice numbering" is switched on
    // below. The number you enter is the NEXT invoice number exactly — it is
    // not skipped and nothing is added to it. Consumer = buyer tax invoices;
    // Seller = commission invoices. The two run as independent series.
    // Invoices issued before you turn this on keep their existing numbers.
    { id: "invoiceNumbering", icon: Hash, title: "Invoice numbering", fields: [
      { key: "invoiceNumbering.consumer.next", label: "Consumer — next invoice number (the very next buyer invoice gets exactly this)", type: "number" },
      { key: "invoiceNumbering.consumer.resetStart", label: "Consumer — restart each year from this number", type: "number" },
      { key: "invoiceNumbering.consumer.prefix", label: "Consumer — prefix (e.g. YKZ/INV → YKZ/INV/2026-27/000123)" },
      { key: "invoiceNumbering.seller.next", label: "Seller — next commission invoice number (exactly this)", type: "number" },
      { key: "invoiceNumbering.seller.resetStart", label: "Seller — restart each year from this number", type: "number" },
      { key: "invoiceNumbering.seller.prefix", label: "Seller — prefix (e.g. YKZ/COM → YKZ/COM/2026-27/000045)" },
      { key: "invoiceNumbering.resetMonth", label: "Restart month (1–12; 4 = April, the Indian financial year)", type: "number" },
      { key: "invoiceNumbering.resetDay", label: "Restart day of month (1–31)", type: "number" },
    ]},
    // The service-account credential is NOT here — it is a private key, set on
    // the server as GOOGLE_MERCHANT_CREDENTIALS. Account id and data source id
    // both come from Merchant Center's own "Add products → API" screen.
    { id: "merchant", icon: ShoppingBag, title: "Google Merchant Center", fields: [
      { key: "merchant.accountId", label: "Merchant Center account ID (the number in Merchant Center → Settings)" },
      { key: "merchant.dataSourceId", label: "API data source ID (from Merchant Center → Add products → API)" },
    ]},
    // The Conversions API access token is NOT here — it is a server secret
    // (META_CAPI_ACCESS_TOKEN). The Pixel ID ships in the browser, so it is safe
    // to hold here. The Pixel only loads once a visitor accepts Marketing cookies.
    { id: "metaPixel", icon: Radio, title: "Meta (Facebook) Pixel", fields: [
      { key: "metaPixel.pixelId", label: "Meta Pixel ID (Events Manager → Data sources → your pixel)" },
    ]},
  ];

  const FEATURE_FLAGS = [
    { key: "comingSoonMode", label: "Buyer App Coming Soon Mode", desc: "Replaces the storefront with the Coming Soon screen" },
    { key: "invoiceNumbering.enabled", label: "Use my own invoice numbering", desc: "Off = invoices keep the automatic reference. On = use the numbers and yearly restart set above. Turning it on only affects invoices issued from now on." },
    { key: "merchant.enabled", label: "Sync products to Google Merchant Center", desc: "Off = nothing is sent to Google. On = the catalogue is pushed daily and whenever you press Sync now below. Needs the account and data source IDs above and the server credential." },
    { key: "metaPixel.enabled", label: "Enable Meta (Facebook) Pixel", desc: "Off = no Pixel loads and no ad events are sent. On = the Pixel loads for visitors who accept Marketing cookies, and the server sends Purchase events to Meta's Conversions API. Needs the Pixel ID above and the server access token." },
  ];


  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="font-semibold text-2xl text-foreground">Platform Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Configure global platform parameters</p>
        </div>

        {SECTIONS.map(({ id, icon: Icon, title, fields }, si) => (
          <motion.div key={id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.1 }} className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center"><Icon className="h-4.5 w-4.5 text-primary" aria-hidden /></div>
              <h2 className="font-semibold text-foreground">{title}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.map(({ key, label, type }) => (
                <Input key={key} label={label} type={type} value={form[key] ?? ""} onChange={e => set(key, type === "number" ? Number(e.target.value) : e.target.value)} />
              ))}
            </div>
          </motion.div>
        ))}

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-9 w-9 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center"><Key className="h-4.5 w-4.5 text-purple-600" /></div>
            <h2 className="font-semibold text-foreground">Feature Flags</h2>
          </div>
          <div className="space-y-3">
            {FEATURE_FLAGS.map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between p-4 rounded-xl bg-accent/40">
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <button onClick={() => set(key, !form[key])}
                  className={`relative h-6 w-11 rounded-full transition-colors ${form[key] ? "bg-primary" : "bg-muted"}`} role="switch" aria-checked={!!form[key]} aria-label={label}>
                  <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${form[key] ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        <MerchantPanel enabled={!!form["merchant.enabled"]} />

        <div className="flex justify-end gap-3">
          <Button variant="outline" disabled={!dirty} onClick={() => { setForm(settingsData ?? {}); setDirty(false); }}>Cancel</Button>
          <Button onClick={handleSave} loading={updateSettings.isPending} disabled={!dirty}>Save Changes</Button>
        </div>
      </div>
    </AdminLayout>
  );
}
