import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { SettingsTabLayout, SettingsSection } from "@/components/settings/settings-tab-layout";
import { SettingsSelect } from "@/components/settings/settings-field";
import { SettingsStatCard, SettingsStatRow } from "@/components/settings/settings-stat-card";
import { subscribeSettings, getUserSettings, updateLanguagePrefs } from "@/lib/settings-store";

const LANGUAGES = [
  { code: "O'zbek", flag: "🇺🇿", desc: "Asosiy interfeys tili" },
  { code: "Inglizcha", flag: "🇬🇧", desc: "Formatlar va ko'rinish" },
  { code: "Ruscha", flag: "🇷🇺", desc: "Formatlar va ko'rinish" },
];

export function LanguageTab({ userId }: { userId: string }) {
  const settings = useSyncExternalStore(subscribeSettings, () => getUserSettings(userId), () => getUserSettings(userId));
  const { language } = settings;

  const selectDefault = (code: string) => {
    updateLanguagePrefs(userId, { default: code, marketplace: code, notifications: code });
    toast.success(code === "O'zbek" ? "Til yangilandi" : "Format sozlamalari yangilandi");
  };

  const sampleDate = new Date().toLocaleDateString(
    language.default === "Inglizcha" ? "en-US" : language.default === "Ruscha" ? "ru-RU" : "uz-UZ",
  );
  const sampleCurrency =
    language.currencyFormat === "USD" ? "$1,250.00" : "1 250 000 so'm";

  return (
    <SettingsTabLayout
      title=""
      stats={
        <SettingsStatRow>
          <SettingsStatCard label="Asosiy til" value={language.default} accent />
          <SettingsStatCard label="Sana formati" value={language.dateFormat} />
          <SettingsStatCard label="Valyuta" value={language.currencyFormat} />
        </SettingsStatRow>
      }
      sidebar={
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Ko'rinish</div>
          <div className="space-y-2 text-sm">
            <div>Sana: <span className="font-medium">{sampleDate}</span></div>
            <div>Summa: <span className="font-medium">{sampleCurrency}</span></div>
          </div>
        </div>
      }
    >
      <SettingsSection title="Til tanlash">
        <div className="grid gap-3 sm:grid-cols-3">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => selectDefault(lang.code)}
              className={`rounded-xl border p-4 text-left transition-default ${
                language.default === lang.code ? "border-primary bg-primary/8" : "border-border hover:border-primary/20"
              }`}
            >
              <div className="text-2xl">{lang.flag}</div>
              <div className="mt-2 text-sm font-semibold">{lang.code}</div>
              <div className="text-xs text-muted-foreground">{lang.desc}</div>
            </button>
          ))}
        </div>
        {language.default !== "O'zbek" && (
          <p className="mt-3 text-xs text-muted-foreground">
            Interfeys matnlari hozircha o'zbekcha. Tanlangan til sana va valyuta formatlariga qo'llanadi.
          </p>
        )}
      </SettingsSection>
      <SettingsSection title="Formatlar">
        <div className="grid gap-3 sm:grid-cols-2">
          <SettingsSelect
            label="Sana formati"
            value={language.dateFormat}
            onChange={(e) => updateLanguagePrefs(userId, { dateFormat: e.target.value })}
          >
            <option value="DD.MM.YYYY">DD.MM.YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </SettingsSelect>
          <SettingsSelect
            label="Valyuta"
            value={language.currencyFormat}
            onChange={(e) => updateLanguagePrefs(userId, { currencyFormat: e.target.value })}
          >
            <option value="UZS">UZS (so'm)</option>
            <option value="USD">USD ($)</option>
          </SettingsSelect>
        </div>
      </SettingsSection>
    </SettingsTabLayout>
  );
}
