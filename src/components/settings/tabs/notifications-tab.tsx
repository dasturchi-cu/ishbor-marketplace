import { useSyncExternalStore, useState } from "react";
import { Bell, Mail, MessageSquare } from "lucide-react";
import { SettingsTabLayout, SettingsSection } from "@/components/settings/settings-tab-layout";
import { SettingsStatCard, SettingsStatRow } from "@/components/settings/settings-stat-card";
import {
  subscribeSettings,
  getUserSettings,
  updateNotificationPrefs,
  type NotificationPrefs,
} from "@/lib/settings-store";

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
      <span className="text-sm">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 rounded" />
    </label>
  );
}

export function NotificationsTab({ userId }: { userId: string }) {
  const settings = useSyncExternalStore(subscribeSettings, () => getUserSettings(userId), () => getUserSettings(userId));
  const [previewType, setPreviewType] = useState<keyof NotificationPrefs>("proposals");

  const patch = (p: Partial<NotificationPrefs>) => updateNotificationPrefs(userId, p);

  const enabledCount = Object.values(settings.notifications).filter(Boolean).length;

  const previewLabels: Record<string, string> = {
    proposals: "Takliflar",
    orders: "Buyurtmalar",
    escrow: "Eskrou",
    marketplace: "Bozor",
  };

  const previewMap: Record<string, { title: string; body: string; icon: typeof Bell }> = {
    proposals: { title: "Yangi taklif", body: "Sizning loyihangizga taklif keldi.", icon: Bell },
    orders: { title: "Buyurtma yangilandi", body: "Buyurtma holati o'zgartirildi.", icon: MessageSquare },
    escrow: { title: "Eskrou moliyalashtirildi", body: "Mablag'lar himoya ostida.", icon: Mail },
    marketplace: { title: "Yangi mos xizmat", body: "Qidiruvingizga mos xizmat topildi.", icon: Bell },
  };

  const preview = previewMap[previewType] ?? previewMap.proposals!;
  const PreviewIcon = preview.icon;

  return (
    <SettingsTabLayout
      title="Bildirishnomalar"
      description="Qaysi hodisalar haqida xabar olishni tanlang"
      stats={
        <SettingsStatRow>
          <SettingsStatCard label="Yoqilgan" value={enabledCount} hint="Jami sozlamalar" accent />
          <SettingsStatCard label="Elektron pochta" value={settings.notifications.email ? "Faol" : "O'chirilgan"} />
          <SettingsStatCard label="Push-bildirishnoma" value={settings.notifications.push ? "Faol" : "O'chirilgan"} />
        </SettingsStatRow>
      }
      sidebar={
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Ko'rinish</div>
          <div className="flex gap-2 mb-3 flex-wrap">
            {(["proposals", "orders", "escrow", "marketplace"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setPreviewType(k)}
                className={`rounded-lg px-2 py-1 text-xs ${previewType === k ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
              >
                {previewLabels[k] ?? k}
              </button>
            ))}
          </div>
          <div className="rounded-lg border border-border p-3">
            <div className="flex items-start gap-2">
              <div className="inline-flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <PreviewIcon className="size-4" />
              </div>
              <div>
                <div className="text-sm font-medium">{preview.title}</div>
                <div className="text-xs text-muted-foreground">{preview.body}</div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <SettingsSection title="Kanallar">
        <div className="space-y-2">
          <ToggleRow label="Email bildirishnomalar" checked={settings.notifications.email} onChange={(v) => patch({ email: v })} />
          <ToggleRow label="Push bildirishnomalar" checked={settings.notifications.push} onChange={(v) => patch({ push: v })} />
          <ToggleRow label="SMS bildirishnomalar" checked={settings.notifications.sms} onChange={(v) => patch({ sms: v })} />
        </div>
      </SettingsSection>
      <SettingsSection title="Marketplace">
        <div className="space-y-2">
          <ToggleRow label="Marketplace ogohlantirishlari" checked={settings.notifications.marketplace} onChange={(v) => patch({ marketplace: v })} />
          <ToggleRow label="Taklif ogohlantirishlari" checked={settings.notifications.proposals} onChange={(v) => patch({ proposals: v })} />
          <ToggleRow label="Buyurtma ogohlantirishlari" checked={settings.notifications.orders} onChange={(v) => patch({ orders: v })} />
          <ToggleRow label="Eskrou ogohlantirishlari" checked={settings.notifications.escrow} onChange={(v) => patch({ escrow: v })} />
          <ToggleRow label="Sharh ogohlantirishlari" checked={settings.notifications.reviews} onChange={(v) => patch({ reviews: v })} />
          <ToggleRow label="Marketing xabarlari" checked={settings.notifications.marketing} onChange={(v) => patch({ marketing: v })} />
        </div>
      </SettingsSection>
    </SettingsTabLayout>
  );
}
