import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Star, Clock, Users, ShieldCheck, Check, ArrowRight, CircleCheck as CheckCircle2, DollarSign, Calendar, MapPin, Briefcase, Send, Lock, ChevronRight } from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { GradientAvatar } from "@/components/site/avatar";
import { EscrowShield, LevelBadge, VerifiedIdentityBadge } from "@/components/site/trust";
import { freelancers, projects } from "@/lib/mock-data";

export const Route = createFileRoute("/projects/$slug")({
  loader: ({ params }) => {
    const p = projects.find((x) => x.slug === params.slug) ?? projects[0];
    if (!p) throw notFound();
    return { project: p };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.project?.title ?? "Project"} — Ishbor` },
      { name: "description", content: loaderData?.project?.description ?? "" },
    ],
  }),
  notFoundComponent: () => <div className="p-8">Project not found</div>,
  errorComponent: ({ error }) => <div className="p-8">{error.message}</div>,
  component: ProjectDetail,
});

function ProjectDetail() {
  const { project: p } = Route.useLoaderData();
  const [showProposal, setShowProposal] = useState(false);
  const [proposalText, setProposalText] = useState("");
  const [proposalRate, setProposalRate] = useState("");
  const [proposalDuration, setProposalDuration] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <nav className="font-mono mb-6 flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          <Link to="/projects">Projects</Link>
          <span>/</span>
          <span>{p.category}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                {p.category}
              </span>
              {p.escrowProtected && <EscrowShield size="sm" />}
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {p.experienceLevel}
              </span>
            </div>

            <h1 className="font-display mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {p.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <GradientAvatar name={p.client} hue={p.clientHue} size={28} />
                <span className="font-medium text-foreground">{p.client}</span>
                {p.clientVerified && (
                  <span className="inline-flex items-center gap-1 text-success">
                    <CheckCircle2 className="size-3.5" /> Verified
                  </span>
                )}
              </div>
              <span>{p.postedAgo}</span>
            </div>

            {/* Budget */}
            <div className="mt-6 flex flex-wrap gap-4">
              <div className="rounded-xl border border-border bg-card px-5 py-4">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Budget</div>
                <div className="font-display mt-1 text-2xl font-bold">
                  {p.budgetType === "hourly" ? "$" : ""}{p.budget.toLocaleString()}{p.budgetType === "hourly" ? "/hr" : ""}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{p.budgetType}</div>
              </div>
              <div className="rounded-xl border border-border bg-card px-5 py-4">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Duration</div>
                <div className="font-display mt-1 text-2xl font-bold">{p.duration}</div>
              </div>
              <div className="rounded-xl border border-border bg-card px-5 py-4">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Proposals</div>
                <div className="font-display mt-1 text-2xl font-bold">{p.proposals}</div>
              </div>
            </div>

            {/* Description */}
            <section className="mt-8">
              <h2 className="font-display mb-3 text-lg font-bold">Description</h2>
              <p className="text-foreground/85 leading-relaxed">{p.description}</p>
            </section>

            {/* Scope */}
            {p.scope.length > 0 && (
              <section className="mt-8">
                <h2 className="font-display mb-3 text-lg font-bold">Scope of work</h2>
                <ul className="space-y-2">
                  {p.scope.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm">
                      <Check className="size-4 text-primary" /> {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Skills */}
            <section className="mt-8">
              <h2 className="font-display mb-3 text-lg font-bold">Required skills</h2>
              <div className="flex flex-wrap gap-2">
                {p.skills.map((s) => (
                  <span key={s} className="rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </section>

            {/* Proposal form */}
            <section className="mt-10">
              {!showProposal ? (
                <button
                  onClick={() => setShowProposal(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-default shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.08)] hover:shadow-[0_8px_24px_-8px_oklch(0.546_0.185_257/0.16)] focus-ring"
                >
                  <Send className="size-4" /> Submit a proposal
                </button>
              ) : submitted ? (
                <div className="rounded-2xl border border-success/20 bg-success/5 p-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="size-6 text-success" />
                    <div>
                      <div className="font-display text-lg font-bold text-success">Proposal submitted</div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {p.client} will review your proposal. You'll be notified when they respond.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                  <div className="border-b border-border px-6 py-4">
                    <h2 className="font-display text-lg font-bold">Submit your proposal</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Tell {p.client} why you're the right fit for this project.
                    </p>
                  </div>
                  <div className="p-6 space-y-5">
                    <div>
                      <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        Cover note
                      </label>
                      <textarea
                        value={proposalText}
                        onChange={(e) => setProposalText(e.target.value)}
                        rows={5}
                        placeholder="Describe your approach, relevant experience, and why you're the best fit..."
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition-default focus:border-primary/30 placeholder:text-muted-foreground/50"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          Your rate ({p.budgetType})
                        </label>
                        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5">
                          <DollarSign className="size-4 text-muted-foreground" />
                          <input
                            value={proposalRate}
                            onChange={(e) => setProposalRate(e.target.value)}
                            type="number"
                            placeholder={p.budgetType === "hourly" ? "55" : "12000"}
                            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
                          />
                          {p.budgetType === "hourly" && <span className="text-xs text-muted-foreground">/hr</span>}
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          Estimated duration
                        </label>
                        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5">
                          <Calendar className="size-4 text-muted-foreground" />
                          <input
                            value={proposalDuration}
                            onChange={(e) => setProposalDuration(e.target.value)}
                            placeholder="3 weeks"
                            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-primary/15 bg-primary/5 px-4 py-3 text-xs">
                      <EscrowShield size="sm" />
                      <span className="text-muted-foreground">Payment is protected — funds released only on your approval</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSubmitted(true)}
                        disabled={!proposalText.trim()}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-default hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed focus-ring"
                      >
                        <Send className="size-3.5" /> Submit proposal
                      </button>
                      <button
                        onClick={() => setShowProposal(false)}
                        className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition-default hover:border-primary/20 focus-ring"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
            {/* Client info */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <GradientAvatar name={p.client} hue={p.clientHue} size={48} rounded="rounded-xl" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-display text-sm font-bold">{p.client}</span>
                    {p.clientVerified && <CheckCircle2 className="size-4 text-success" />}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {p.clientVerified ? "Verified business" : "Client"}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Total spent</div>
                  <div className="font-mono text-sm font-semibold">${(p.clientSpent / 1000).toFixed(0)}k</div>
                </div>
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Hires</div>
                  <div className="font-mono text-sm font-semibold">{p.clientHires}</div>
                </div>
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Member since</div>
                  <div className="font-mono text-sm font-semibold">{p.clientMemberSince}</div>
                </div>
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Posted</div>
                  <div className="font-mono text-sm font-semibold">{p.postedAgo}</div>
                </div>
              </div>
            </div>

            {/* Escrow guarantee */}
            <div className="rounded-xl border border-primary/20 bg-primary/8 p-5">
              <div className="mb-2">
                <EscrowShield size="md" />
              </div>
              <h4 className="text-sm font-semibold">Full escrow protection</h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                The client has pre-funded this project into escrow. Your payment is guaranteed upon milestone completion.
                Disputes resolved within 24 hours by independent mediators.
              </p>
            </div>

            {/* Project requirements */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-display mb-3 text-sm font-bold">Requirements</h3>
              <ul className="space-y-2">
                {[
                  { label: "Experience", value: p.experienceLevel },
                  { label: "Budget type", value: p.budgetType },
                  { label: "Duration", value: p.duration },
                  { label: "Escrow", value: p.escrowProtected ? "Funded" : "Pending" },
                ].map((r) => (
                  <li key={r.label} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="font-medium">{r.value}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Similar freelancers */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-display mb-3 text-sm font-bold">Recommended talent</h3>
              <div className="space-y-3">
                {freelancers.slice(0, 3).map((f) => (
                  <Link
                    key={f.id}
                    to="/freelancers/$username"
                    params={{ username: f.username }}
                    className="flex items-center gap-3 transition-default hover:opacity-80"
                  >
                    <GradientAvatar name={f.name} hue={f.hue} size={32} rounded="rounded-lg" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold">{f.name}</div>
                      <div className="flex items-center gap-1.5">
                        <LevelBadge level={f.level} className="!px-1.5 !py-0 !text-[8px]" />
                        <span className="font-mono text-[9px] text-muted-foreground">${f.rate}/h</span>
                      </div>
                    </div>
                    <ChevronRight className="size-3.5 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
