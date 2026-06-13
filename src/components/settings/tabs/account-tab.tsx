import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { ProfileCompletionCard } from "@/components/trust/profile-completion-card";
import { ProfilePreviewPanel } from "@/components/settings/profile-preview-panel";
import { SettingsTabLayout, SettingsSection } from "@/components/settings/settings-tab-layout";
import { SettingsStatCard, SettingsStatRow } from "@/components/settings/settings-stat-card";
import { AuthField } from "@/components/auth/auth-field";
import type { AuthUser } from "@/lib/auth";
import {
  buildAccountFormFromSession,
  accountFormsEqual,
  TIMEZONE_OPTIONS,
  type AccountFormData,
} from "@/lib/settings-store";
import {
  computeProfileCompletionPercent,
  getProfileCompletionItems,
} from "@/lib/profile-store";
import {
  computeFreelancerReputation,
  computeClientReputation,
} from "@/lib/reputation-store";
import { getRecentEventsForUser, getEventLabel } from "@/lib/analytics-events-store";

export function AccountTab({
  user,
  onDirtyChange,
}: {
  user: AuthUser;
  onDirtyChange: (dirty: boolean, form: AccountFormData) => void;
  saveTrigger?: number;
  onSaved?: () => void;
}) {
  const [form, setForm] = useState<AccountFormData>(() => buildAccountFormFromSession(user.id));
  const [baseline, setBaseline] = useState<AccountFormData>(() => buildAccountFormFromSession(user.id));

  const userType = user.userType === "client" ? "client" : "freelancer";
  const completion = computeProfileCompletionPercent(user.id, userType);
  const items = getProfileCompletionItems(user.id, userType);
  const reputation =
    user.userType === "freelancer" && user.username
      ? computeFreelancerReputation(user.username, user)
      : computeClientReputation(user.companySlug ?? "", user.fullName, user);
  const recentEvents = getRecentEventsForUser(user.id, 5);

  useEffect(() => {
    const next = buildAccountFormFromSession(user.id);
    setForm(next);
    setBaseline(next);
  }, [user.id, user.fullName, user.bio]);

  useEffect(() => {
    onDirtyChange(!accountFormsEqual(form, baseline), form);
  }, [form, baseline, onDirtyChange]);

  const patch = (p: Partial<AccountFormData>) => setForm((f) => ({ ...f, ...p }));
  const patchSocial = (key: keyof AccountFormData["social"], value: string) =>
    setForm((f) => ({ ...f, social: { ...f.social, [key]: value } }));

  return (
    <SettingsTabLayout
      title="Hisob"
      description="Profil ma'lumotlari va ijtimoiy havolalar"
      stats={
        <SettingsStatRow>
          <SettingsStatCard label="Profil to'ldirilishi" value={`${completion}%`} accent />
          <SettingsStatCard label="Ishonch balli" value={reputation.trustScore} hint={reputation.label} />
          <SettingsStatCard label="Faoliyat" value={recentEvents.length} hint="So'nggi harakatlar" />
        </SettingsStatRow>
      }
      sidebar={
        <>
          <ProfilePreviewPanel user={user} headline={form.headline} completionPercent={completion} tier={reputation.tier} />
          <ProfileCompletionCard percent={completion} items={items} />
        </>
      }
    >
      <SettingsSection title="Asosiy ma'lumotlar">
        <div className="grid gap-4 sm:grid-cols-2">
          <AuthField label="Ko'rsatiladigan ism" value={form.fullName} onChange={(e) => patch({ fullName: e.target.value })} />
          <AuthField label="Foydalanuvchi nomi" value={form.username} onChange={(e) => patch({ username: e.target.value })} placeholder="@username" />
          <AuthField label="Sarlavha" value={form.headline} onChange={(e) => patch({ headline: e.target.value })} className="sm:col-span-2" />
          <AuthField label="Joylashuv" value={form.location} onChange={(e) => patch({ location: e.target.value })} />
          <label className="block space-y-1.5">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Vaqt mintaqasi</span>
            <select
              value={form.timezone}
              onChange={(e) => patch({ timezone: e.target.value })}
              className="w-full rounded-xl border border-input bg-card px-3 py-3 text-sm"
            >
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Bio</span>
            <textarea
              value={form.bio}
              onChange={(e) => patch({ bio: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-input bg-card px-3 py-3 text-sm"
            />
          </label>
          <AuthField label="Elektron pochta" value={user.email} disabled className="sm:col-span-2 opacity-70" />
        </div>
      </SettingsSection>

      <SettingsSection title="Ijtimoiy havolalar">
        <div className="grid gap-4 sm:grid-cols-2">
          <AuthField label="Veb-sayt" value={form.social.website ?? ""} onChange={(e) => patchSocial("website", e.target.value)} placeholder="https://" />
          <AuthField label="Portfel havolasi" value={form.social.portfolioUrl ?? ""} onChange={(e) => patchSocial("portfolioUrl", e.target.value)} />
          <AuthField label="GitHub" value={form.social.github ?? ""} onChange={(e) => patchSocial("github", e.target.value)} />
          <AuthField label="LinkedIn" value={form.social.linkedin ?? ""} onChange={(e) => patchSocial("linkedin", e.target.value)} />
          <AuthField label="Telegram" value={form.social.telegram ?? ""} onChange={(e) => patchSocial("telegram", e.target.value)} className="sm:col-span-2" />
        </div>
      </SettingsSection>

      <SettingsSection title="So'nggi faoliyat">
        {recentEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">Hali faoliyat qayd etilmagan.</p>
        ) : (
          <ul className="space-y-2">
            {recentEvents.map((e) => (
              <li key={e.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm">
                <Activity className="size-4 shrink-0 text-primary" />
                <span className="flex-1">{getEventLabel(e.type)}</span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {new Date(e.timestamp).toLocaleDateString("uz-UZ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SettingsSection>
    </SettingsTabLayout>
  );
}
