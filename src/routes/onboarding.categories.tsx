import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check } from "lucide-react";
import { OnboardingLayout, OnboardingNav } from "@/components/auth/onboarding-layout";
import { loadOnboardingState, saveOnboardingState } from "@/lib/auth-constants";
import { categories } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding/categories")({
  head: () => ({
    meta: [{ title: "Select categories — Ishbor" }],
  }),
  component: OnboardingCategoriesPage,
});

function OnboardingCategoriesPage() {
  const navigate = useNavigate();
  const saved = loadOnboardingState();
  const [selected, setSelected] = useState<string[]>(saved.categories);

  const toggle = (slug: string) => {
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : prev.length < 5 ? [...prev, slug] : prev,
    );
  };

  const handleContinue = () => {
    saveOnboardingState({ categories: selected });
    navigate({ to: "/onboarding/portfolio" });
  };

  return (
    <OnboardingLayout
      stepId="categories"
      title="Which categories do you work in?"
      subtitle="Choose up to 5 categories where you offer services or apply to projects."
    >
      <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {selected.length}/5 selected
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {categories.map((cat) => {
          const isSelected = selected.includes(cat.slug);
          return (
            <button
              key={cat.slug}
              type="button"
              onClick={() => toggle(cat.slug)}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-4 text-left transition-default focus-ring",
                isSelected
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border bg-card hover:border-primary/30",
              )}
            >
              <span className="text-xl">{cat.glyph}</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{cat.name}</div>
                <div className="font-mono text-[10px] text-muted-foreground">
                  {cat.count.toLocaleString()} listings
                </div>
              </div>
              {isSelected && <Check className="size-4 shrink-0 text-primary" />}
            </button>
          );
        })}
      </div>

      <OnboardingNav
        backTo="/onboarding/skills"
        onContinue={handleContinue}
        disabled={selected.length < 1}
      />
    </OnboardingLayout>
  );
}
