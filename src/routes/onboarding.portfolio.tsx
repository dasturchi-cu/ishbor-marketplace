import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Image } from "lucide-react";
import { OnboardingLayout, OnboardingNav } from "@/components/auth/onboarding-layout";
import { AuthField } from "@/components/auth/auth-field";
import { loadOnboardingState, saveOnboardingState } from "@/lib/auth-constants";

export const Route = createFileRoute("/onboarding/portfolio")({
  head: () => ({
    meta: [{ title: "Add portfolio — Ishbor" }],
  }),
  component: OnboardingPortfolioPage,
});

function OnboardingPortfolioPage() {
  const navigate = useNavigate();
  const saved = loadOnboardingState();
  const [items, setItems] = useState(saved.portfolio.length > 0 ? saved.portfolio : [{ title: "", category: "" }]);

  const update = (index: number, field: "title" | "category", value: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const add = () => {
    if (items.length < 4) setItems((prev) => [...prev, { title: "", category: "" }]);
  };

  const remove = (index: number) => {
    if (items.length > 1) setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const validItems = items.filter((i) => i.title.trim() && i.category.trim());

  const handleContinue = () => {
    saveOnboardingState({ portfolio: validItems });
    navigate({ to: "/dashboard/freelancer" });
  };

  return (
    <OnboardingLayout
      stepId="portfolio"
      title="Showcase your work"
      subtitle="Add up to 4 portfolio highlights. Strong portfolios increase hire rates by 40%."
    >
      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Project {i + 1}
              </span>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Remove project"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
            <div className="mb-3 flex aspect-video items-center justify-center rounded-xl border border-dashed border-border bg-elevated/40">
              <div className="text-center">
                <Image className="mx-auto size-8 text-muted-foreground/50" />
                <p className="mt-1 text-xs text-muted-foreground">Cover image (optional)</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <AuthField
                label="Project title"
                value={item.title}
                onChange={(e) => update(i, "title", e.target.value)}
                placeholder="Asaka Neo-bank Rebrand"
              />
              <AuthField
                label="Category"
                value={item.category}
                onChange={(e) => update(i, "category", e.target.value)}
                placeholder="Branding"
              />
            </div>
          </div>
        ))}

        {items.length < 4 && (
          <button
            type="button"
            onClick={add}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm font-medium text-muted-foreground transition-default hover:border-primary/30 hover:text-foreground"
          >
            <Plus className="size-4" /> Add another project
          </button>
        )}
      </div>

      <OnboardingNav
        backTo="/onboarding/categories"
        onContinue={handleContinue}
        continueLabel="Finish setup"
        disabled={validItems.length < 1}
      />
    </OnboardingLayout>
  );
}
