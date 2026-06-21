import { useEffect, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Sun, Moon, Monitor } from "lucide-react";
import { SettingsTabLayout, SettingsSection } from "@/components/settings/settings-tab-layout";
import { SettingsSelect } from "@/components/settings/settings-field";
import { SettingsToggleRow } from "@/components/settings/settings-toggle";
import { SettingsStatCard, SettingsStatRow } from "@/components/settings/settings-stat-card";
import { AppearancePreview } from "@/components/settings/appearance-preview";
import { subscribeSettings, getUserSettings, updateAppearancePrefs } from "@/lib/settings-store";
import { applyAppearancePrefs } from "@/lib/appearance-apply";
import type { AppearancePrefs } from "@/lib/settings-store";

export function AppearanceTab({ userId }: { userId: string }) {
  const settings = useSyncExternalStore(subscribeSettings, () => getUserSettings(userId), () => getUserSettings(userId));
  const { appearance } = settings;

  useEffect(() => {
    applyAppearancePrefs(userId);
  }, [userId]);

  const patchAppearance = (patch: Partial<AppearancePrefs>, message?: string) => {
    updateAppearancePrefs(userId, patch);
    applyAppearancePrefs(userId);
    if (message) toast.success(message);
  };

  const themes = [
    { key: "light" as const, label: "Yorug'", icon: Sun },
    { key: "dark" as const, label: "Qorong'u", icon: Moon },
    { key: "system" as const, label: "Tizim", icon: Monitor },
  ];

  const themeLabel =
    appearance.theme === "system" ? "Tizim" : appearance.theme === "dark" ? "Qorong'u" : "Yorug'";
  const fontLabel =
    appearance.fontSize === "sm" ? "Kichik" : appearance.fontSize === "lg" ? "Katta" : "Standart";

  return (
    <SettingsTabLayout
      title=""
      stats={
        <SettingsStatRow>
          <SettingsStatCard label="Mavzu" value={themeLabel} accent />
          <SettingsStatCard label="Shrift" value={fontLabel} />
          <SettingsStatCard label="Animatsiya" value={appearance.animations ? "Yoqilgan" : "O'chirilgan"} />
        </SettingsStatRow>
      }
      sidebar={<AppearancePreview appearance={appearance} />}
    >
      <SettingsSection title="Mavzu">
        <div className="grid grid-cols-3 gap-3">
          {themes.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => patchAppearance({ theme: key }, "Mavzu yangilandi")}
              className={`touch-target flex flex-col items-center gap-2 rounded-xl border p-4 text-sm transition-default ${
                appearance.theme === key ? "border-primary bg-primary/8 text-primary" : "border-border hover:border-primary/20"
              }`}
            >
              <Icon className="size-5" />
              {label}
            </button>
          ))}
        </div>
      </SettingsSection>
      <SettingsSection title="Qo'shimcha">
        <div className="space-y-3">
          <SettingsToggleRow
            label="Ixcham rejim"
            description="Bo'shliqlar qisqartiriladi"
            checked={appearance.compactMode}
            onChange={(v) => patchAppearance({ compactMode: v })}
          />
          <SettingsToggleRow
            label="Animatsiyalar"
            description="O'tish va harakat effektlari"
            checked={appearance.animations}
            onChange={(v) => patchAppearance({ animations: v })}
          />
          <SettingsSelect
            label="Shrift o'lchami"
            value={appearance.fontSize}
            onChange={(e) => patchAppearance({ fontSize: e.target.value as AppearancePrefs["fontSize"] })}
          >
            <option value="sm">Kichik</option>
            <option value="md">Standart</option>
            <option value="lg">Katta</option>
          </SettingsSelect>
        </div>
      </SettingsSection>
    </SettingsTabLayout>
  );
}
