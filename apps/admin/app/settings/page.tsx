"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Key, LifeBuoy } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button, Input, Skeleton } from "@/components/ui";
import toast from "react-hot-toast";
import { usePlatformSettings, useUpdatePlatformSettings } from "@/hooks/useAdmin";

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
      { key: "adminAlertEmail", label: "Admin Alert Email (receives new-seller signups and seller shipping-details submissions)" },
      { key: "mailFromAddress", label: "Sender Email (must be a verified alias on the mail account, else Gmail will reject it)" },
    ]},
    // Published to customers, so it is worth being explicit that these are
    // public. Blank falls back to the storefront's built-in details rather
    // than publishing an empty contact.
    { id: "support", icon: LifeBuoy, title: "Public support contact", fields: [
      { key: "supportEmail", label: "Support Email (shown on Contact, About and every policy page — leave blank to keep the current one)" },
      { key: "supportPhone", label: "Support Phone (shown alongside the email and in the site's structured data)" },
    ]},
  ];

  const FEATURE_FLAGS = [
    { key: "comingSoonMode", label: "Buyer App Coming Soon Mode", desc: "Replaces the storefront with the Coming Soon screen" },
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

        <div className="flex justify-end gap-3">
          <Button variant="outline" disabled={!dirty} onClick={() => { setForm(settingsData ?? {}); setDirty(false); }}>Cancel</Button>
          <Button onClick={handleSave} loading={updateSettings.isPending} disabled={!dirty}>Save Changes</Button>
        </div>
      </div>
    </AdminLayout>
  );
}
