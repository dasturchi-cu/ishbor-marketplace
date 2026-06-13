import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Star, Clock, Users, ShieldCheck, Check, ArrowRight, CircleCheck as CheckCircle2, DollarSign, Calendar, Send, Lock, ChevronRight, UserCheck, X } from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { GradientAvatar } from "@/components/site/avatar";
import { EscrowShield, LevelBadge } from "@/components/site/trust";
import { ConversionFlowBanner, FREELANCER_HIRE_FLOW } from "@/components/site/conversion-flow";
import {
  createApplication,
  getApplicationsByProjectSlug,
  acceptApplication,
  updateApplicationStatus,
  subscribeApplications,
  shortlistApplication,
} from "@/lib/applications-store";
import { getProjectBySlug, isProjectOwner } from "@/lib/projects-store";
import { getSession } from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";
import { freelancers } from "@/lib/mock-data";

type ProjectSearch = { proposal?: boolean; published?: string };

export const Route = createFileRoute("/projects/$slug")({
  validateSearch: (search: Record<string, unknown>): ProjectSearch => ({
    proposal: search.proposal === true || search.proposal === "true",
    published: typeof search.published === "string" ? search.published : undefined,
  }),
  loader: ({ params }) => {
    const p = getProjectBySlug(params.slug);
    if (!p) throw notFound();
    if (p.status === "draft" || p.status === "paused" || p.status === "closed") {
      const session = typeof window !== "undefined" ? getSession() : null;
      const isOwner = session && p.ownerUserId === session.user.id;
      if (!isOwner) throw notFound();
    }
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
  const { proposal: openProposal, published } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOwner = user ? isProjectOwner(p.slug, user.id) : false;
  const [showPublishedBanner, setShowPublishedBanner] = useState(!!published);
  const applications = useSyncExternalStore(
    subscribeApplications,
    () => getApplicationsByProjectSlug(p.slug),
    () => getApplicationsByProjectSlug(p.slug),
  );

  const [showProposal, setShowProposal] = useState(false);
  const [proposalText, setProposalText] = useState("");
  const [proposalRate, setProposalRate] = useState("");
  const [proposalDuration, setProposalDuration] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [createdAppId, setCreatedAppId] = useState<string | null>(null);
  const [proposalSort, setProposalSort] = useState<"newest" | "amount-asc" | "amount-desc">("newest");

  const sortedApplications = [...applications].sort((a, b) => {
    if (proposalSort === "amount-asc") {
      return (a.proposalAmount ?? a.budget) - (b.proposalAmount ?? b.budget);
    }
    if (proposalSort === "amount-desc") {
      return (b.proposalAmount ?? b.budget) - (a.proposalAmount ?? a.budget);
    }
    return 0;
  });

  useEffect(() => {
    if (openProposal) setShowProposal(true);
  }, [openProposal]);

  const openProposalForm = () => {
    if (!getSession()) {
      toast.info("Sign in to submit a proposal");
      navigate({ to: "/login", search: { redirect: `/projects/${p.slug}?proposal=true` } });
      return;
    }
    setShowProposal(true);
  };

  const handleSubmit = () => {
    if (!getSession()) {
      toast.error("Sign in required", { description: "Sign in as a freelancer to submit proposals." });
      navigate({ to: "/login", search: { redirect: `/projects/${p.slug}?proposal=true` } });
      return;
    }
    const app = createApplication({
      projectTitle: p.title,
      projectSlug: p.slug,
      client: p.client,
      clientHue: p.clientHue,
      budget: p.budget,
      proposalAmount: Number(proposalRate) || p.budget,
      deliveryTime: proposalDuration || p.duration,
      category: p.category,
      coverNote: proposalText.trim(),
    });
    setCreatedAppId(app.id);
    setSubmitted(true);
    toast.success("Application created", { description: "Your proposal is now under client review." });
    navigate({ to: "/applications/$id", params: { id: app.id } });
  };

  const canSubmit = proposalText.trim() && proposalRate.trim() && proposalDuration.trim();
  const canPropose = !isOwner && (!p.status || p.status === "published");

  const handleAccept = (appId: string) => {
    const result = acceptApplication(appId);
    if (!result) {
      toast.error("Could not accept application");
      return;
    }
    toast.success("Freelancer accepted", { description: "Order created. Fund escrow to start work." });
    navigate({ to: "/checkout", search: { type: "order", order: result.orderId } });
  };

  const handleReject = (appId: string) => {
    updateApplicationStatus(appId, "rejected");
    toast.success("Proposal rejected");
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {showPublishedBanner && (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-success/20 bg-success/5 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-5 text-success" />
              <div>
                <div className="font-display text-sm font-bold text-success">Project published successfully</div>
                <p className="text-xs text-muted-foreground">Freelancers can now view and submit proposals.</p>
              </div>
            </div>
            <button onClick={() => setShowPublishedBanner(false)} className="text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          </div>
        )}

        {isOwner && (
          <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <span className="text-sm font-medium">You own this project</span>
            <Link to="/my-projects" className="text-xs font-medium text-primary hover:underline">Manage in My Projects</Link>
            <Link to="/projects/create" search={{ edit: p.slug }} className="text-xs font-medium text-primary hover:underline">Edit project</Link>
          </div>
        )}
        <nav className="font-mono mb-6 flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          <Link to="/projects">Projects</Link>
          <span>/</span>
          <span>{p.category}</span>
        </nav>

        <ConversionFlowBanner
          title="Freelancer hiring path"
          steps={FREELANCER_HIRE_FLOW}
          currentStep={submitted ? "application" : showProposal ? "proposal" : "project"}
          nextHint={
            submitted
              ? "Track your application while the client reviews your proposal."
              : showProposal
                ? "Submit your proposal to create an application the client can review."
                : "Read the brief, then submit a tailored proposal to get hired."
          }
          className="mb-8"
        />

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
              {isOwner ? (
                <section className="rounded-2xl border border-border bg-card overflow-hidden">
                  <div className="border-b border-border px-6 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="font-display text-lg font-bold">Proposals ({applications.length})</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Compare proposals, accept a freelancer, and fund escrow to start the order.
                        </p>
                      </div>
                      {applications.length > 1 && (
                        <select
                          value={proposalSort}
                          onChange={(e) => setProposalSort(e.target.value as typeof proposalSort)}
                          className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium outline-none focus:border-primary/30"
                        >
                          <option value="newest">Sort: Newest</option>
                          <option value="amount-asc">Sort: Lowest bid</option>
                          <option value="amount-desc">Sort: Highest bid</option>
                        </select>
                      )}
                    </div>
                  </div>
                  <div className="divide-y divide-border">
                    {sortedApplications.length === 0 ? (
                      <p className="p-6 text-sm text-muted-foreground">No proposals yet. Share your project to attract talent.</p>
                    ) : (
                      sortedApplications.map((app) => (
                        <div key={app.id} className="p-6">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <GradientAvatar name={app.freelancerName ?? "Freelancer"} hue={app.freelancerHue ?? 250} size={40} />
                              <div>
                                <div className="font-display text-sm font-semibold">{app.freelancerName ?? "Freelancer"}</div>
                                <div className="text-xs text-muted-foreground">${(app.proposalAmount ?? app.budget).toLocaleString()} · {app.deliveryTime}</div>
                              </div>
                            </div>
                            <span className={`rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest ${
                              app.status === "accepted" ? "bg-success/10 text-success" :
                              app.status === "rejected" ? "bg-destructive/10 text-destructive" :
                              "bg-secondary text-muted-foreground"
                            }`}>{app.status}</span>
                          </div>
                          <p className="mt-3 text-sm text-muted-foreground">{app.coverNote}</p>
                          {app.status === "pending" || app.status === "shortlisted" ? (
                            <div className="mt-4 flex flex-wrap gap-2">
                              <button
                                onClick={() => handleAccept(app.id)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
                              >
                                <UserCheck className="size-3.5" /> Accept & create order
                              </button>
                              {app.status === "pending" && (
                                <button
                                  onClick={() => { shortlistApplication(app.id); toast.success("Proposal shortlisted"); }}
                                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:border-primary/20"
                                >
                                  Shortlist
                                </button>
                              )}
                              <button
                                onClick={() => handleReject(app.id)}
                                className="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:border-primary/20"
                              >
                                Reject
                              </button>
                              {app.freelancerUsername && (
                                <Link
                                  to="/freelancers/$username"
                                  params={{ username: app.freelancerUsername }}
                                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:border-primary/20"
                                >
                                  View profile
                                </Link>
                              )}
                            </div>
                          ) : app.status === "accepted" && app.orderId ? (
                            <Link
                              to="/checkout"
                              search={{ type: "order", order: app.orderId }}
                              className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                            >
                              Fund escrow <ArrowRight className="size-3" />
                            </Link>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </section>
              ) : !canPropose ? (
                <p className="text-sm text-muted-foreground">This project is not accepting proposals.</p>
              ) : !showProposal ? (
                <button
                  onClick={openProposalForm}
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
                        Application created. {p.client} will review your proposal. Redirecting to Applications…
                      </p>
                    </div>
                  </div>
                  {createdAppId && (
                    <Link
                      to="/applications/$id"
                      params={{ id: createdAppId }}
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      View application now <ArrowRight className="size-3.5" />
                    </Link>
                  )}
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
                        Cover letter
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
                          Proposal amount ({p.budgetType})
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
                          Delivery time
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
                        onClick={handleSubmit}
                        disabled={!canSubmit}
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
