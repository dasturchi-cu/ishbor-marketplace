import { useEffect, useState } from "react";
import { Globe, Github, Link2, Linkedin, Send } from "lucide-react";
import { ProfileVideoEditor } from "@/components/profile/profile-video-editor";
import { ProfileCompletionCard } from "@/components/trust/profile-completion-card";
import { ProfilePreviewPanel } from "@/components/settings/profile-preview-panel";
import { RecentActivityList } from "@/components/settings/recent-activity-list";
import { SettingsField, SettingsSelect, SettingsTextarea } from "@/components/settings/settings-field";
import { SettingsTabLayout, SettingsSection } from "@/components/settings/settings-tab-layout";
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
import { useActiveRole } from "@/hooks/use-active-role";

export function AccountTab({
  user,
  onDirtyChange,
  saveVersion = 0,
}: {
  user: AuthUser;
  onDirtyChange: (dirty: boolean, form: AccountFormData) => void;
  saveVersion?: number;
}) {
  const [form, setForm] = useState<AccountFormData>(() => buildAccountFormFromSession(user.id));
  const [baseline, setBaseline] = useState<AccountFormData>(() => buildAccountFormFromSession(user.id));
  const { activeRole } = useActiveRole();

  const userType = activeRole;
  const completion = computeProfileCompletionPercent(user.id, userType);
  const items = getProfileCompletionItems(user.id, userType);
  const reputation =
    activeRole === "freelancer" && user.username
      ? computeFreelancerReputation(user.username, user)
      : computeClientReputation(user.companySlug ?? "", user.fullName, user);

  useEffect(() => {
    const next = buildAccountFormFromSession(user.id);
    setForm(next);
    setBaseline(next);
  }, [user.id, user.fullName, user.bio, saveVersion]);

  useEffect(() => {
    onDirtyChange(!accountFormsEqual(form, baseline), form);
  }, [form, baseline, onDirtyChange]);

  const patch = (p: Partial<AccountFormData>) => setForm((f) => ({ ...f, ...p }));
  const patchSocial = (key: keyof AccountFormData["social"], value: string) =>
    setForm((f) => ({ ...f, social: { ...f.social, [key]: value } }));

  return (
    <SettingsTabLayout
      title=""
      sidebar={
        <>
          <ProfilePreviewPanel user={user} headline={form.headline} tier={reputation.tier} />
          <ProfileCompletionCard percent={completion} items={items} />
        </>
      }
    >
      <SettingsSection title="Asosiy ma'lumotlar" description="Ommaviy profilda ko'rinadigan ma'lumotlar">
        <div className="grid gap-5 sm:grid-cols-2">
          <SettingsField
            label="Ko'rsatiladigan ism"
            value={form.fullName}
            onChange={(e) => patch({ fullName: e.target.value })}
            placeholder="Ismingiz"
          />
          <SettingsField
            label="Foydalanuvchi nomi"
            value={form.username}
            onChange={(e) => patch({ username: e.target.value })}
            placeholder="username"
            hint="Ommaviy profil manzili uchun"
          />
          <div className="sm:col-span-2">
            <SettingsField
              label="Sarlavha"
              value={form.headline}
              onChange={(e) => patch({ headline: e.target.value })}
              placeholder="Masalan: Webflow mutaxassisi"
            />
          </div>
          <SettingsField
            label="Joylashuv"
            value={form.location}
            onChange={(e) => patch({ location: e.target.value })}
            placeholder="Toshkent, O'zbekiston"
          />
          <SettingsSelect
            label="Vaqt mintaqasi"
            value={form.timezone}
            onChange={(e) => patch({ timezone: e.target.value })}
          >
            {TIMEZONE_OPTIONS.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </SettingsSelect>
          <div className="sm:col-span-2">
            <SettingsTextarea
              label="Bio"
              value={form.bio}
              onChange={(e) => patch({ bio: e.target.value })}
              rows={4}
              placeholder="Tajribangiz va mutaxassisligingiz haqida qisqacha yozing…"
              hint="2–3 jumla yetarli — mijozlar tezda tanishadi"
            />
          </div>
          <div className="sm:col-span-2">
            <SettingsField
              label="Elektron pochta"
              value={user.email}
              disabled
              readOnly
              hint="Emailni o'zgartirish uchun qo'llab-quvvatlashga murojaat qiling"
            />
          </div>
        </div>
      </SettingsSection>

      {activeRole === "freelancer" && (
        <SettingsSection
          title="Video tanishtiruv"
          description="Profil sahifangizda ko'rinadigan qisqa video — ishonchni oshiradi"
        >
          <ProfileVideoEditor userId={user.id} hue={user.avatarHue} />
        </SettingsSection>
      )}

      <SettingsSection title="Ijtimoiy havolalar" description="Ishonch va portfolio uchun ixtiyoriy">
        <div className="grid gap-5 sm:grid-cols-2">
          <SettingsField
            label="Veb-sayt"
            value={form.social.website ?? ""}
            onChange={(e) => patchSocial("website", e.target.value)}
            placeholder="https://example.com"
            icon={<Globe className="size-4" />}
          />
          <SettingsField
            label="Portfel havolasi"
            value={form.social.portfolioUrl ?? ""}
            onChange={(e) => patchSocial("portfolioUrl", e.target.value)}
            placeholder="https://behance.net/..."
            icon={<Link2 className="size-4" />}
          />
          <SettingsField
            label="GitHub"
            value={form.social.github ?? ""}
            onChange={(e) => patchSocial("github", e.target.value)}
            placeholder="github.com/username"
            icon={<Github className="size-4" />}
          />
          <SettingsField
            label="LinkedIn"
            value={form.social.linkedin ?? ""}
            onChange={(e) => patchSocial("linkedin", e.target.value)}
            placeholder="linkedin.com/in/username"
            icon={<Linkedin className="size-4" />}
          />
          <div className="sm:col-span-2">
            <SettingsField
              label="Telegram"
              value={form.social.telegram ?? ""}
              onChange={(e) => patchSocial("telegram", e.target.value)}
              placeholder="@username"
              icon={<Send className="size-4" />}
            />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="So'nggi faoliyat" description="Platformadagi oxirgi harakatlar">
        <RecentActivityList userId={user.id} limit={5} />
      </SettingsSection>
    </SettingsTabLayout>
  );
}
