import { Link } from "@tanstack/react-router";
import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Bell, Search, Plus } from "lucide-react";
import { EmptyState } from "@/components/site/feedback";
import { SettingsTabLayout, SettingsSection } from "@/components/settings/settings-tab-layout";
import { SettingsField } from "@/components/settings/settings-field";
import { SettingsToggleRow } from "@/components/settings/settings-toggle";
import { SettingsStatCard, SettingsStatRow } from "@/components/settings/settings-stat-card";
import {
  subscribeAlerts,
  getUserAlerts,
  updateJobAlertPrefs,
  removeSavedSearchAlert,
  toggleSavedSearchAlert,
} from "@/lib/alerts-store";
import { getMyPublishedProjects } from "@/lib/projects-store";

export function JobAlertsTab({ userId }: { userId: string }) {
  const alerts = useSyncExternalStore(subscribeAlerts, () => getUserAlerts(userId), () => getUserAlerts(userId));
  const projects = getMyPublishedProjects(userId);
  const matchingPreview = projects.slice(0, 3);

  return (
    <SettingsTabLayout
      title=""
      stats={
        <SettingsStatRow>
          <SettingsStatCard label="Holat" value={alerts.jobAlerts.enabled ? "Faol" : "O'chirilgan"} accent={alerts.jobAlerts.enabled} />
          <SettingsStatCard label="Ko'nikmalar" value={alerts.jobAlerts.skills.length || "—"} />
          <SettingsStatCard label="Saqlangan qidiruvlar" value={alerts.savedSearches.length} />
        </SettingsStatRow>
      }
      sidebar={
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 text-sm font-semibold">Mos loyihalar (namuna)</div>
          {matchingPreview.length === 0 ? (
            <p className="text-xs text-muted-foreground">Ko'nikmalaringizga mos loyihalar paydo bo'lganda shu yerda ko'rinadi.</p>
          ) : (
            <ul className="space-y-2">
              {matchingPreview.map((p) => (
                <li key={p.id} className="rounded-lg border border-border px-3 py-2 text-xs">
                  {p.title}
                </li>
              ))}
            </ul>
          )}
        </div>
      }
    >
      <SettingsSection title="Asosiy sozlamalar">
        <SettingsToggleRow
          label="Mos loyihalar haqida xabar olish"
          checked={alerts.jobAlerts.enabled}
          onChange={(v) => updateJobAlertPrefs(userId, { enabled: v })}
        />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <SettingsField
            label="Min byudjet ($)"
            type="number"
            value={alerts.jobAlerts.minBudget}
            onChange={(e) => updateJobAlertPrefs(userId, { minBudget: Number(e.target.value) || 0 })}
          />
          <SettingsField
            label="Max byudjet ($)"
            type="number"
            value={alerts.jobAlerts.maxBudget}
            onChange={(e) => updateJobAlertPrefs(userId, { maxBudget: Number(e.target.value) || 999999 })}
          />
        </div>
        <div className="mt-3 rounded-lg border border-border p-4 text-sm text-muted-foreground">
          Ko'nikmalar: {alerts.jobAlerts.skills.join(", ") || "Hali belgilanmagan"}
          <Link to="/onboarding/skills" className="ml-2 font-medium text-primary hover:underline">Tahrirlash</Link>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Saqlangan qidiruvlar"
        action={
          <Link to="/projects" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            <Search className="size-3" /> Qidiruvni saqlash
          </Link>
        }
      >
        {alerts.savedSearches.length === 0 ? (
          <EmptyState
            compact
            icon={Bell}
            title="Saqlangan qidiruv yo'q"
            description="Xizmatlar yoki loyihalar sahifasida qidiruvni saqlang."
            action={
              <Link to="/projects" className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                <Plus className="size-4" /> Loyihalarni ko'rish
              </Link>
            }
          />
        ) : (
          <ul className="space-y-2">
            {alerts.savedSearches.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium">{s.label}</div>
                  <div className="text-xs text-muted-foreground">{s.type} · {s.query || "Barchasi"}</div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={s.enabled}
                    onChange={(e) => toggleSavedSearchAlert(userId, s.id, e.target.checked)}
                    className="size-4 rounded"
                    aria-label="Yoqish"
                  />
                  <button
                    onClick={() => { removeSavedSearchAlert(userId, s.id); toast.success("O'chirildi"); }}
                    className="text-xs text-destructive hover:underline"
                  >
                    O'chirish
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SettingsSection>
    </SettingsTabLayout>
  );
}
