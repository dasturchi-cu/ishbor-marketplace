import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Globe } from "lucide-react";
import { OnboardingLayout, OnboardingNav } from "@/components/auth/onboarding-layout";
import {
  loadOnboardingState,
  saveOnboardingState,
  languageOptions,
  languageLevels,
  type LanguageEntry,
} from "@/lib/auth-constants";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding/languages")({
  head: () => ({
    meta: [{ title: "Languages — Ishbor" }],
  }),
  component: OnboardingLanguagesPage,
});

function OnboardingLanguagesPage() {
  const navigate = useNavigate();
  const saved = loadOnboardingState();
  const [languages, setLanguages] = useState<LanguageEntry[]>(
    saved.languages.length > 0 ? saved.languages : [{ language: "Uzbek", level: "Native" }],
  );

  const update = (index: number, field: keyof LanguageEntry, value: string) => {
    setLanguages((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  };

  const add = () => {
    if (languages.length < 5) {
      setLanguages((prev) => [...prev, { language: "", level: "Professional" }]);
    }
  };

  const remove = (index: number) => {
    if (languages.length > 1) setLanguages((prev) => prev.filter((_, i) => i !== index));
  };

  const valid = languages.filter((l) => l.language && l.level);

  const handleContinue = () => {
    saveOnboardingState({ languages: valid });
    navigate({ to: "/onboarding/availability" });
  };

  return (
    <OnboardingLayout
      stepId="languages"
      title="What languages do you speak?"
      subtitle="Central Asia's marketplace — multilingual freelancers get 2× more inquiries."
    >
      <div className="space-y-3">
        {languages.map((lang, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Globe className="size-4 text-primary" />
                Language {i + 1}
              </div>
              {languages.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Remove language"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Language
                </label>
                <select
                  value={lang.language}
                  onChange={(e) => update(i, "language", e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm transition-default focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select language</option>
                  {languageOptions.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Proficiency
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {languageLevels.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => update(i, "level", level)}
                      className={cn(
                        "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-default",
                        lang.level === level
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/30",
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        {languages.length < 5 && (
          <button
            type="button"
            onClick={add}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm font-medium text-muted-foreground transition-default hover:border-primary/30 hover:text-foreground"
          >
            <Plus className="size-4" /> Add another language
          </button>
        )}
      </div>

      <OnboardingNav
        backTo="/onboarding/portfolio"
        onContinue={handleContinue}
        disabled={valid.length < 1}
      />
    </OnboardingLayout>
  );
}
