import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Sun, Moon, Monitor } from "lucide-react";
import { SettingsTabLayout, SettingsSection } from "@/components/settings/settings-tab-layout";
import { SettingsSelect } from "@/components/settings/settings-field";
import { SettingsToggleRow } from "@/components/settings/settings-toggle";
import { SettingsStatCard, SettingsStatRow } from "@/components/settings/settings-stat-card";
import { subscribeSettings, getUserSettings, updateAppearancePrefs } from "@/lib/settings-store";

import { applyThemeClass, applyAppearancePrefs } from "@/lib/appearance-apply";

export function AppearanceTab({ userId }: { userId: string }) {
  const settings = useSyncExternalStore(subscribeSettings, () => getUserSettings(userId), () => getUserSettings(userId));
  const { appearance } = settings;

  const setTheme = (theme: "light" | "dark" | "system") => {
    updateAppearancePrefs(userId, { theme });
    applyThemeClass(theme);
    toast.success("Mavzu yangilandi");
  };

  const patchAppearance = (patch: Parameters<typeof updateAppearancePrefs>[1]) => {
    updateAppearancePrefs(userId, patch);
    applyAppearancePrefs(userId);
  };

  const themes = [
    { key: "light" as const, label: "Yorug'", icon: Sun },
    { key: "dark" as const, label: "Qorong'u", icon: Moon },
    { key: "system" as const, label: "Tizim", icon: Monitor },
  ];

  return (
    <SettingsTabLayout
      title=""
      stats={
        <SettingsStatRow>
          <SettingsStatCard label="Mavzu" value={appearance.theme === "system" ? "Tizim" : appearance.theme === "dark" ? "Qorong'u" : "Yorug'"} accent />
          <SettingsStatCard label="Shrift" value={appearance.fontSize === "sm" ? "Kichik" : appearance.fontSize === "lg" ? "Katta" : "Standart"} />
          <SettingsStatCard label="Animatsiya" value={appearance.animations ? "Yoqilgan" : "O'chirilgan"} />
        </SettingsStatRow>
      }
      sidebar={
        <div
          className={`rounded-xl border border-border p-4 ${appearance.theme === "dark" || (appearance.theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "bg-zinc-900 text-white" : "bg-white text-zinc-900"}`}
        >
          <div className="text-sm font-semibold">Ko'rinish namunasi</div>
          <div className="mt-2 rounded-lg border border-current/20 p-3 text-xs opacity-80">
            Ishbor marketplace interfeysi
          </div>
        </div>
      }
    >
      <SettingsSection title="Mavzu">
        <div className="grid grid-cols-3 gap-3">
          {themes.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTheme(key)}
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
            checked={appearance.compactMode}
            onChange={(v) => patchAppearance({ compactMode: v })}
          />
          <SettingsToggleRow
            label="Animatsiyalar"
            checked={appearance.animations}
            onChange={(v) => patchAppearance({ animations: v })}
          />
          <SettingsSelect
            label="Shrift o'lchami"
            value={appearance.fontSize}
            onChange={(e) => patchAppearance({ fontSize: e.target.value as "sm" | "md" | "lg" })}
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
