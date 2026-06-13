import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Copy, Briefcase } from "lucide-react";
import { EmptyState } from "@/components/site/feedback";
import { SiteFooter } from "@/components/site/footer";
import { requireAuth } from "@/lib/guards";
import { getStoredProjects } from "@/lib/projects-store";
import { generateProposalForProject } from "@/lib/ai-proposal-assistant";

export const Route = createFileRoute("/ai/proposal-assistant")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: "AI Taklif yordamchisi — Ishbor" }] }),
  component: ProposalAssistantPage,
});

function ProposalAssistantPage() {
  const [selectedSlug, setSelectedSlug] = useState("");
  const projects = getStoredProjects().filter((p) => p.status === "published" || !p.status);
  const project = projects.find((p) => p.slug === selectedSlug);
  const proposal = project ? generateProposalForProject(project) : null;

  const handleCopy = () => {
    if (!proposal || "error" in proposal) return;
    navigator.clipboard.writeText(proposal.coverLetter);
    toast.success("Taklif matni nusxalandi");
  };

  return (
    <>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="size-5" />
          <span className="font-mono text-[10px] uppercase tracking-widest">AI · Profilingiz asosida</span>
        </div>
        <h1 className="font-display mt-2 text-2xl font-bold">Taklif yordamchisi</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Loyiha tanlang — ko'nikmalaringiz va statistikangiz asosida taklif, muddat va bosqichlar generatsiya qilinadi.
        </p>

        <div className="mt-6">
          <label className="mb-1.5 block text-sm font-medium">Loyiha tanlang</label>
          <select
            value={selectedSlug}
            onChange={(e) => setSelectedSlug(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm"
          >
            <option value="">— Loyiha —</option>
            {projects.map((p) => (
              <option key={p.slug} value={p.slug}>{p.title} — ${p.budget}</option>
            ))}
          </select>
        </div>

        {projects.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="Ochiq loyihalar yo'q"
            description="Taklif yaratish uchun avval loyihalar ro'yxatidan ish tanlang yoki yangi loyiha qidiring."
            action={<Link to="/projects" className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Loyihalar →</Link>}
          />
        ) : !selectedSlug ? (
          <EmptyState
            icon={Sparkles}
            title="Loyiha tanlang"
            description="Yuqoridagi ro'yxatdan loyiha tanlang — AI taklif matnini avtomatik tayyorlaydi."
          />
        ) : null}

        {proposal && !("error" in proposal) && (
          <div className="mt-8 space-y-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Qo'shimcha xat</h2>
                <button type="button" onClick={handleCopy} className="inline-flex items-center gap-1 text-xs text-primary">
                  <Copy className="size-3.5" /> Nusxalash
                </button>
              </div>
              <pre className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{proposal.coverLetter}</pre>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="text-xs text-muted-foreground">Taklif narxi</div>
                <div className="font-display text-xl font-bold">${proposal.proposedAmount.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Muddat: {proposal.timeline}</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="text-xs text-muted-foreground">Bosqichlar</div>
                <ul className="mt-2 space-y-1 text-sm">
                  {proposal.milestones.map((m, i) => (
                    <li key={i}>{m.label} — ${m.amount} ({m.days} kun)</li>
                  ))}
                </ul>
              </div>
            </div>
            <Link
              to="/projects/$slug"
              params={{ slug: selectedSlug }}
              search={{ proposal: true }}
              className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Taklif yuborish
            </Link>
          </div>
        )}

        {proposal && "error" in proposal && (
          <p className="mt-4 text-sm text-destructive">{proposal.error}</p>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
