import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Briefcase, Tag, Sparkles } from "lucide-react";
import { OnboardingLayout, OnboardingNav } from "@/components/auth/onboarding-layout";
import { AuthField } from "@/components/auth/auth-field";
import { OnboardingPortfolioCover } from "@/components/onboarding/onboarding-portfolio-cover";
import {
  loadOnboardingState,
  saveOnboardingState,
  type OnboardingPortfolioItem,
} from "@/lib/auth-constants";
import { isGradientUrl } from "@/lib/mock-upload";
import { cn } from "@/lib/utils";

const previewHues = [250, 215, 160, 290];

const emptyItem = (): OnboardingPortfolioItem => ({ title: "", category: "" });

export const Route = createFileRoute("/onboarding/portfolio")({
  head: () => ({
    meta: [{ title: "Portfolio qo'shish — Ishbor" }],
  }),
  component: OnboardingPortfolioPage,
});

function OnboardingPortfolioPage() {
  const navigate = useNavigate();
  const saved = loadOnboardingState();
  const [items, setItems] = useState<OnboardingPortfolioItem[]>(
    saved.portfolio.length > 0 ? saved.portfolio : [emptyItem()],
  );

  const update = (index: number, patch: Partial<OnboardingPortfolioItem>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const add = () => {
    if (items.length < 4) setItems((prev) => [...prev, emptyItem()]);
  };

  const remove = (index: number) => {
    if (items.length > 1) setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const validItems = items.filter((i) => i.title.trim() && i.category.trim());
  const withCover = validItems.filter((i) => i.coverImage && !isGradientUrl(i.coverImage)).length;

  const handleContinue = () => {
    saveOnboardingState({ portfolio: validItems });
    navigate({ to: "/onboarding/languages" });
  };

  const strengthHint =
    validItems.length === 0
      ? "Kamida bitta loyiha nomi va kategoriyasini kiriting"
      : withCover === validItems.length
        ? `${validItems.length} ta loyiha muqova bilan tayyor`
        : `${validItems.length} ta loyiha tayyor${withCover > 0 ? ` · ${withCover} tasida muqova bor` : " · muqova qo'shsangiz yaxshi ko'rinadi"}`;

  return (
    <OnboardingLayout
      stepId="portfolio"
      title="Ishlaringizni namoyish eting"
      subtitle="4 tagacha loyiha qo'shing. Muqova rasmi ixtiyoriy, lekin ishonchni oshiradi."
    >
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2.5">
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="size-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Portfolio kuchliligi</p>
          <p className="truncate text-xs text-muted-foreground">{strengthHint}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-primary/15">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${(validItems.length / 4) * 100}%` }}
            />
          </div>
          <span className="font-mono text-[10px] font-semibold text-primary">{validItems.length}/4</span>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item, i) => {
          const filled = item.title.trim() && item.category.trim();
          const hue = previewHues[i % previewHues.length]!;

          return (
            <div
              key={i}
              className={cn(
                "overflow-hidden rounded-xl border bg-card",
                filled ? "border-primary/20" : "border-border",
              )}
            >
              <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex size-5 shrink-0 items-center justify-center rounded-md font-mono text-[10px] font-bold",
                      filled ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {item.title.trim() || `${i + 1}-loyiha`}
                  </span>
                </div>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-default hover:bg-destructive/10 hover:text-destructive focus-ring"
                    aria-label="Loyihani o'chirish"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>

              <div className="grid gap-3 p-3 sm:grid-cols-[140px_1fr]">
                <OnboardingPortfolioCover
                  coverImage={item.coverImage}
                  hue={hue}
                  onChange={(url) => update(i, { coverImage: url })}
                  onClear={() => update(i, { coverImage: undefined })}
                />

                <div className="flex flex-col justify-center gap-3">
                  <AuthField
                    label="Loyiha nomi"
                    value={item.title}
                    onChange={(e) => update(i, { title: e.target.value })}
                    placeholder="Asaka Neo-bank Rebrand"
                    icon={<Briefcase className="size-4" />}
                  />
                  <AuthField
                    label="Kategoriya"
                    value={item.category}
                    onChange={(e) => update(i, { category: e.target.value })}
                    placeholder="Brendlash, UI dizayn…"
                    icon={<Tag className="size-4" />}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {items.length < 4 && (
          <button
            type="button"
            onClick={add}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border px-3 py-3 text-sm font-medium text-muted-foreground transition-default hover:border-primary/30 hover:bg-primary/5 hover:text-primary focus-ring"
          >
            <Plus className="size-4" />
            Yana loyiha
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {4 - items.length} qoldi
            </span>
          </button>
        )}
      </div>

      <OnboardingNav
        backTo="/onboarding/categories"
        onContinue={handleContinue}
        continueLabel="Davom etish"
        disabled={validItems.length < 1}
      />
    </OnboardingLayout>
  );
}
