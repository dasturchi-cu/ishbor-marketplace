import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Eye, Save } from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { saveGuestProjectDraft, loadGuestProjectDraft } from "@/lib/guest-project-draft";
import { getSession } from "@/lib/auth";

const categoryOptions = [
  "Product Design",
  "Web Design",
  "Mobile Development",
  "Localization",
  "Strategy & Design",
  "Architecture",
  "Marketing",
  "Consulting",
];

export const Route = createFileRoute("/projects/preview")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && getSession()) {
      throw redirect({ to: "/projects/create", search: { restore: "draft" } });
    }
  },
  head: () => ({
    meta: [
      { title: "Loyiha rejasini tuzing — Ishbor" },
      { name: "description", content: "Ro'yxatdan o'tishdan oldin loyiha rejasini tuzing va ko'ring." },
    ],
  }),
  component: ProjectPreviewPage,
});

function ProjectPreviewPage() {
  const navigate = useNavigate();
  const existing = loadGuestProjectDraft();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [category, setCategory] = useState(existing?.category ?? categoryOptions[0]!);
  const [budget, setBudget] = useState(existing?.budget ?? "1000");
  const [duration, setDuration] = useState(existing?.duration ?? "2 hafta");
  const [skills, setSkills] = useState(existing?.skills ?? "");
  const [showPreview, setShowPreview] = useState(false);

  const handleSave = () => {
    if (!title.trim()) return;
    saveGuestProjectDraft({ title, description, category, budget, duration, skills });
    setShowPreview(true);
  };

  const handleContinue = () => {
    saveGuestProjectDraft({ title, description, category, budget, duration, skills });
    navigate({ to: "/register", search: { type: "client", redirect: "/projects/create?restore=draft" } });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="mb-8 text-center">
          <div className="font-mono text-[10px] uppercase tracking-widest text-primary">Ro'yxatdan oldin</div>
          <h1 className="font-display mt-2 text-3xl font-bold tracking-tight">Loyiha rejasini tuzing</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Formani to'ldiring, natijani ko'ring — keyin ro'yxatdan o'tib darhol e'lon qiling.
          </p>
        </div>

        {!showPreview ? (
          <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <label className="block">
              <span className="text-sm font-medium">Loyiha nomi *</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="Masalan: Fintech ilova dizayni"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Tavsif</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="Nima qilish kerak, qanday natija kutilmoqda?"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Kategoriya</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium">Byudjet (USD)</span>
                <input
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  type="number"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Muddat</span>
                <input
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </label>
            </div>
            <label className="block">
              <span className="text-sm font-medium">Kerakli ko'nikmalar</span>
              <input
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="Figma, React, O'zbek tili"
              />
            </label>
            <button
              type="button"
              onClick={handleSave}
              disabled={!title.trim()}
              className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              <Eye className="size-4" /> Ko'rib chiqish
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
              <div className="font-mono text-[10px] uppercase tracking-widest text-primary">Loyiha ko'rinishi</div>
              <h2 className="font-display mt-2 text-2xl font-bold">{title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description || "Tavsif qo'shilmagan"}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-lg border border-border bg-card px-2 py-1 text-xs">{category}</span>
                <span className="rounded-lg border border-border bg-card px-2 py-1 text-xs">${budget}</span>
                <span className="rounded-lg border border-border bg-card px-2 py-1 text-xs">{duration}</span>
              </div>
              {skills && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Ko'nikmalar: <span className="text-foreground">{skills}</span>
                </p>
              )}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleContinue}
                className="touch-target inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
              >
                Ro'yxatdan o'tib joylash <ArrowRight className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="touch-target inline-flex items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-medium"
              >
                <Save className="size-4" /> Tahrirlash
              </button>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Yoki{" "}
              <Link to="/login" search={{ redirect: "/projects/create?restore=draft" }} className="font-medium text-primary hover:underline">
                mavjud hisob bilan kirish
              </Link>
            </p>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
