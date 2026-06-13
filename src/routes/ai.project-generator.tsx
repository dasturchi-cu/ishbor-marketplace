import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, ArrowRight, AlertCircle } from "lucide-react";
import { InlineBanner } from "@/components/site/feedback";
import { SiteFooter } from "@/components/site/footer";
import { requireAuth } from "@/lib/guards";
import { generateProjectFromIdea, saveAiProjectDraft } from "@/lib/ai-project-generator";

export const Route = createFileRoute("/ai/project-generator")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: "AI Loyiha generatori — Ishbor" }] }),
  component: ProjectGeneratorPage,
});

function ProjectGeneratorPage() {
  const navigate = useNavigate();
  const [idea, setIdea] = useState("");
  const [budget, setBudget] = useState(2000);
  const [weeks, setWeeks] = useState(4);
  const [result, setResult] = useState<ReturnType<typeof generateProjectFromIdea> | null>(null);

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleGenerate = () => {
    if (!idea.trim()) {
      setValidationError("Loyiha g'oyasini kiriting — kamida bir jumla.");
      return;
    }
    setValidationError(null);
    const r = generateProjectFromIdea(idea, budget, weeks);
    if ("error" in r) {
      toast.error(r.error);
      return;
    }
    setResult(r);
    toast.success("Loyiha loyihasi tayyor");
  };

  const handleUse = () => {
    if (!result || "error" in result) return;
    saveAiProjectDraft(result);
    navigate({ to: "/projects/create", search: { ai: "1" } });
    toast.success("Loyiha yaratish sahifasiga o'tildi — maydonlar to'ldirildi");
  };

  return (
    <>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="size-5" />
          <span className="font-mono text-[10px] uppercase tracking-widest">AI · Qoidalar asosida</span>
        </div>
        <h1 className="font-display mt-2 text-2xl font-bold sm:text-3xl">Aqlli loyiha generatori</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          G'oyangizni kiriting — platforma qoidalari asosida sarlavha, tavsif, ko'nikmalar va byudjet tavsiya qilinadi.
        </p>

        <div className="mt-8 space-y-4">
          <Field label="Loyiha g'oyasi">
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              rows={4}
              placeholder="Masalan: Fintech mobil ilova uchun UI/UX dizayn va prototip kerak..."
              className={inputClass}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Byudjet (USD)">
              <input type="number" value={budget} onChange={(e) => setBudget(Number(e.target.value))} className={inputClass} min={0} />
            </Field>
            <Field label="Muddat (hafta)">
              <input type="number" value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} className={inputClass} min={1} max={52} />
            </Field>
          </div>
          <button type="button" onClick={handleGenerate} className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground">
            Generatsiya qilish
          </button>
          {validationError && (
            <InlineBanner variant="error" icon={AlertCircle}>{validationError}</InlineBanner>
          )}
        </div>

        {result && !("error" in result) && (
          <div className="mt-8 rounded-xl border border-border bg-card p-5">
            <h2 className="font-display font-semibold">{result.title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{result.category}</p>
            <pre className="mt-4 whitespace-pre-wrap text-sm text-muted-foreground">{result.description}</pre>
            <div className="mt-4 flex flex-wrap gap-2">
              {result.skills.map((s) => (
                <span key={s} className="rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary">{s}</span>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
              <div className="rounded-lg bg-secondary/50 p-3">
                <div className="text-xs text-muted-foreground">Byudjet tavsiyasi</div>
                <div className="font-semibold">${result.budget.suggested.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">{result.budget.note}</div>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3">
                <div className="text-xs text-muted-foreground">Muddat</div>
                <div className="font-semibold">{result.timeline.weeks} hafta</div>
                <div className="text-xs text-muted-foreground">{result.timeline.note}</div>
              </div>
            </div>
            <button type="button" onClick={handleUse} className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Loyiha yaratish <ArrowRight className="size-4" />
            </button>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

const inputClass = "w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus:border-primary focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
