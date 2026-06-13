import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Image, Briefcase, Tag, Upload, Sparkles } from "lucide-react";
import { OnboardingLayout, OnboardingNav } from "@/components/auth/onboarding-layout";
import { AuthField } from "@/components/auth/auth-field";
import { loadOnboardingState, saveOnboardingState } from "@/lib/auth-constants";
import { cn } from "@/lib/utils";

const previewHues = [250, 215, 160, 290];

export const Route = createFileRoute("/onboarding/portfolio")({
  head: () => ({
    meta: [{ title: "Portfolio qo'shish — Ishbor" }],
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
    navigate({ to: "/onboarding/languages" });
  };

  return (
    <OnboardingLayout
      stepId="portfolio"
      title="Ishlaringizni namoyish eting"
      subtitle="4 tagacha portfolio namunasini qo'shing. Kuchli portfolio yollanish ehtimolini 40% oshiradi."
    >
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="inline-flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="size-4" />
          </div>
          <div>
            <p className="text-sm font-medium">Portfolio kuchliligi</p>
            <p className="text-xs text-muted-foreground">
              {validItems.length === 0
                ? "Davom etish uchun kamida bitta loyiha qo'shing"
                : `${validItems.length} ta loyiha tayyor — yaxshi boshlang'ich`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-primary/15">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${(validItems.length / 4) * 100}%` }}
            />
          </div>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-primary">
            {validItems.length}/4
          </span>
        </div>
      </div>

      <div className="space-y-5">
        {items.map((item, i) => {
          const filled = item.title.trim() && item.category.trim();
          const hue = previewHues[i % previewHues.length]!;

          return (
            <div
              key={i}
              className={cn(
                "overflow-hidden rounded-2xl border bg-card transition-default",
                filled ? "border-primary/25 shadow-[0_8px_24px_-12px_oklch(0.546_0.185_257/0.12)]" : "border-border",
              )}
            >
              <div className="flex items-center justify-between border-b border-border/60 bg-elevated/30 px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "inline-flex size-6 items-center justify-center rounded-lg font-mono text-[10px] font-bold",
                      filled ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {filled ? item.title : `${i + 1}-loyiha`}
                  </span>
                </div>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-default hover:bg-destructive/10 hover:text-destructive focus-ring"
                    aria-label="Loyihani o'chirish"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>

              <div className="grid gap-5 p-4 sm:grid-cols-[200px_1fr] sm:p-5">
                <button
                  type="button"
                  className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-dashed border-border bg-elevated/40 transition-default hover:border-primary/40 focus-ring sm:aspect-auto sm:min-h-[148px]"
                  aria-label="Muqova rasmini yuklash"
                >
                  <div
                    className="absolute inset-0 opacity-80 transition-default group-hover:opacity-100"
                    style={{
                      background: `linear-gradient(135deg, oklch(0.72 0.14 ${hue}) 0%, oklch(0.38 0.10 ${hue + 35}) 100%)`,
                    }}
                  />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.2),transparent_65%)]" />
                  <div className="relative flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
                    <div className="inline-flex size-10 items-center justify-center rounded-xl bg-white/90 text-primary shadow-sm transition-default group-hover:scale-105">
                      <Upload className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white drop-shadow-sm">Muqova qo'shish</p>
                      <p className="mt-0.5 text-[10px] text-white/80">Ixtiyoriy · JPG yoki PNG</p>
                    </div>
                  </div>
                  {filled && (
                    <div className="absolute bottom-2 left-2 right-2 truncate rounded-md bg-black/40 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                      {item.category}
                    </div>
                  )}
                </button>

                <div className="flex flex-col justify-center gap-4">
                  <AuthField
                    label="Loyiha nomi"
                    value={item.title}
                    onChange={(e) => update(i, "title", e.target.value)}
                    placeholder="Asaka Neo-bank Rebrand"
                    icon={<Briefcase className="size-4" />}
                  />
                  <AuthField
                    label="Kategoriya"
                    value={item.category}
                    onChange={(e) => update(i, "category", e.target.value)}
                    placeholder="Brendlash, UI dizayn, Dasturlash…"
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
            className="group flex w-full items-center justify-center gap-2.5 rounded-2xl border border-dashed border-border bg-card/50 px-4 py-4 text-sm font-medium text-muted-foreground transition-default hover:border-primary/35 hover:bg-primary/5 hover:text-primary focus-ring"
          >
            <span className="inline-flex size-8 items-center justify-center rounded-xl border border-border bg-background transition-default group-hover:border-primary/30 group-hover:bg-primary/10 group-hover:text-primary">
              <Plus className="size-4" />
            </span>
            Yana loyiha qo'shish
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-primary/70">
              {4 - items.length} ta qoldi
            </span>
          </button>
        )}
      </div>

      <p className="mt-5 flex items-start gap-2 text-xs text-muted-foreground">
        <Image className="mt-0.5 size-3.5 shrink-0 text-primary/70" />
        Maslahat: Aniq nom va kategoriyaga ega loyihalar mijoz qidiruvida yuqoriroq ko&apos;rinadi.
      </p>

      <OnboardingNav
        backTo="/onboarding/categories"
        onContinue={handleContinue}
        continueLabel="Davom etish"
        disabled={validItems.length < 1}
      />
    </OnboardingLayout>
  );
}
