"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Bell, Globe, Key } from "lucide-react";
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
        platformName: s.platformName ?? "PharmaBag",
        supportEmail: s.supportEmail ?? "support@pharmabag.in",
        supportPhone: s.supportPhone ?? "+91 1800-XXX-XXXX",
        sessionTimeout: s.sessionTimeout ?? 60,
        maxLoginAttempts: s.maxLoginAttempts ?? 5,
        otpExpiry: s.otpExpiry ?? 120,
        fraudAlertEmail: s.fraudAlertEmail ?? "",
        adminAlertEmail: s.adminAlertEmail ?? "",
        allowSellerRegistration: s.allowSellerRegistration ?? true,
        expressLogin: s.expressLogin ?? true,
        creditLineOrders: s.creditLineOrders ?? true,
        maintenanceMode: s.maintenanceMode ?? false,
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
    { id: "platform", icon: Globe, title: "Platform Settings", fields: [
      { key: "platformName", label: "Platform Name" },
      { key: "supportEmail", label: "Support Email" },
      { key: "supportPhone", label: "Support Phone" },
    ]},
    { id: "security", icon: Shield, title: "Security", fields: [
      { key: "sessionTimeout", label: "Session Timeout (mins)", type: "number" },
      { key: "maxLoginAttempts", label: "Max Login Attempts", type: "number" },
      { key: "otpExpiry", label: "OTP Expiry (secs)", type: "number" },
    ]},
    { id: "notifications", icon: Bell, title: "Notifications", fields: [
      { key: "fraudAlertEmail", label: "Fraud Alert Email" },
      { key: "adminAlertEmail", label: "Admin Alert Email" },
    ]},
  ];

  const FEATURE_FLAGS = [
    { key: "allowSellerRegistration", label: "New Seller Registrations", desc: "Allow new sellers to register" },
    { key: "expressLogin", label: "Express Login", desc: "OTP-based login without signup" },
    { key: "creditLineOrders", label: "Credit Line Orders", desc: "30-day credit for verified buyers" },
    { key: "maintenanceMode", label: "Maintenance Mode", desc: "Take platform offline for maintenance" },
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
