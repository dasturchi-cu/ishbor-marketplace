import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";

import { useEffect } from "react";

import { toast } from "sonner";

import {

  MapPin,

  Globe,

  Users,

  Calendar,

  Star,

  TrendingUp,

  Shield,

  DollarSign,

  Briefcase,

  MessageSquare,

} from "lucide-react";

import { SiteNav } from "@/components/site/nav";

import { SiteFooter } from "@/components/site/footer";

import { EntityNotFound } from "@/components/site/entity-not-found";

import { AgencyVerificationBadge } from "@/components/agency/agency-verification-badge";

import { AgencyMemberRow } from "@/components/agency/agency-card";

import { getAgencyBySlug, hasAgencyPermission } from "@/lib/agency-store";

import { computeAgencyMetrics } from "@/lib/agency-metrics-store";

import { computeAgencyRankingScore } from "@/lib/agency-ranking-store";

import { getCaseStudiesByAgency } from "@/lib/agency-portfolio-store";

import { recordAgencyView, recordContactClick } from "@/lib/analytics-utils";

import { getSession } from "@/lib/auth";

import { useAuth } from "@/hooks/use-auth";

import { agencyRoleLabels } from "@/lib/agency-types";
import { messagesPath } from "@/lib/messages-routing";



export const Route = createFileRoute("/agencies/$slug")({

  loader: ({ params }) => {

    const agency = getAgencyBySlug(params.slug);

    if (!agency) throw notFound();

    const session = typeof window !== "undefined" ? getSession() : null;

    const isMember = !!(

      session && agency.members.some((m) => m.userId === session.user.id && m.status === "active")

    );

    if (agency.status !== "published" && !isMember) throw notFound();

    return { agency, isMember };

  },

  head: ({ loaderData }) => ({

    meta: [{ title: `${loaderData?.agency?.name ?? "Agentlik"} — Ishbor` }],

  }),

  notFoundComponent: () => (

    <EntityNotFound

      title="Agentlik topilmadi"

      description="Bu agentlik mavjud emas, hali e'lon qilinmagan yoki o'chirilgan."

      backTo="/agencies"

      backLabel="Agentliklarni ko'rish"

    />

  ),

  component: AgencyProfilePage,

});



function AgencyProfilePage() {

  const { agency, isMember } = Route.useLoaderData();

  const navigate = useNavigate();

  const { user } = useAuth();

  const caseStudies = getCaseStudiesByAgency(agency.slug, true);

  const canManage = user && hasAgencyPermission(agency, user.id, "edit_agency");

  const metrics = computeAgencyMetrics(agency);

  const rankingScore = computeAgencyRankingScore({ agency, metrics });

  const activeMembers = agency.members.filter((m) => m.status === "active");



  useEffect(() => {

    if (agency.status === "published" || isMember) {

      recordAgencyView(agency.slug);

    }

  }, [agency.slug, agency.status, isMember]);



  const handleContact = () => {
    recordContactClick(agency.slug);
    if (!user) {
      toast.info("Xabar yuborish uchun tizimga kiring", {
        action: { label: "Kirish", onClick: () => navigate({ to: "/login" }) },
      });
      return;
    }
    navigate(messagesPath());
    toast.success("Xabarlar bo'limiga o'tildi");
  };



  return (

    <div className="min-h-screen bg-background">

      <SiteNav />



      <div

        className="relative h-40 bg-gradient-to-br from-primary/20 to-primary/5 sm:h-52"

        style={agency.cover ? { backgroundImage: `url(${agency.cover})`, backgroundSize: "cover" } : undefined}

      />



      <div className="mx-auto max-w-5xl px-4 sm:px-6">

        <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <div className="flex items-end gap-4">

            {agency.logo ? (

              <img src={agency.logo} alt="" className="size-20 rounded-2xl border-4 border-background object-cover shadow-lg sm:size-24" />

            ) : (

              <div className="flex size-20 items-center justify-center rounded-2xl border-4 border-background bg-primary font-display text-2xl font-bold text-primary-foreground shadow-lg sm:size-24">

                {agency.name.slice(0, 2).toUpperCase()}

              </div>

            )}

            <div>

              <div className="flex flex-wrap items-center gap-2">

                <h1 className="font-display text-2xl font-bold sm:text-3xl">{agency.name}</h1>

                <AgencyVerificationBadge level={agency.verificationLevel} />

              </div>

              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">

                <MapPin className="size-3.5" /> {agency.location}

              </p>

            </div>

          </div>

          <div className="flex flex-wrap gap-2">

            {canManage && (

              <Link

                to="/dashboard/agency"

                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-primary/30"

              >

                Boshqarish

              </Link>

            )}

            <button

              type="button"

              onClick={handleContact}

              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"

            >

              <MessageSquare className="size-4" /> Bog'lanish

            </button>

          </div>

        </div>



        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard icon={Shield} label="Ishonch balli" value={metrics.trustScore} />

          <StatCard icon={TrendingUp} label="Muvaffaqiyat" value={metrics.successScore} />

          <StatCard icon={Star} label="Reyting" value={metrics.rating > 0 ? metrics.rating.toFixed(1) : "—"} />

          <StatCard icon={TrendingUp} label="Reyting balli" value={rankingScore} sub="Umumiy reyting" />

          <StatCard icon={Briefcase} label="Faol loyihalar" value={metrics.activeProjects} />

          <StatCard icon={Briefcase} label="Yakunlangan" value={metrics.completedProjects} />

          <StatCard icon={DollarSign} label="Daromad" value={`$${metrics.revenueGenerated.toLocaleString()}`} />

          <StatCard icon={Users} label="Jamoa" value={activeMembers.length} />

        </div>



        <div className="mt-8 grid gap-8 lg:grid-cols-3">

          <div className="lg:col-span-2 space-y-8">

            <section className="rounded-xl border border-border bg-card p-5">

              <h2 className="font-display font-semibold">Haqida</h2>

              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{agency.description}</p>

              <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">

                <span className="inline-flex items-center gap-1"><Calendar className="size-3.5" /> {agency.foundedYear} yildan</span>

                <span className="inline-flex items-center gap-1"><Users className="size-3.5" /> {agency.teamSize} kishi</span>

                {agency.website && (

                  <a href={agency.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">

                    <Globe className="size-3.5" /> {agency.website.replace(/^https?:\/\//, "")}

                  </a>

                )}

              </div>

              <div className="mt-4 flex flex-wrap gap-2">

                {agency.specializations.map((s) => (

                  <span key={s} className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{s}</span>

                ))}

              </div>

              {agency.languages.length > 0 && (

                <p className="mt-3 text-xs text-muted-foreground">

                  Tillar: {agency.languages.join(", ")}

                </p>

              )}

            </section>



            <section className="rounded-xl border border-border bg-card p-5">

              <h2 className="font-display font-semibold">Portfolio va case study</h2>

              {caseStudies.length === 0 ? (

                <p className="mt-3 text-sm text-muted-foreground">Hali case study e'lon qilinmagan.</p>

              ) : (

                <ul className="mt-4 space-y-4">

                  {caseStudies.map((cs) => (

                    <li key={cs.id} className="rounded-lg border border-border p-4">

                      <div className="font-semibold">{cs.title}</div>

                      <div className="text-xs text-muted-foreground">{cs.client} · {cs.category}</div>

                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{cs.description}</p>

                      {cs.metrics.length > 0 && (

                        <div className="mt-3 flex flex-wrap gap-3">

                          {cs.metrics.map((m) => (

                            <span key={m.label} className="font-mono text-xs">

                              <span className="text-muted-foreground">{m.label}:</span> {m.value}

                            </span>

                          ))}

                        </div>

                      )}

                    </li>

                  ))}

                </ul>

              )}

            </section>

          </div>



          <div className="space-y-6">

            <section className="rounded-xl border border-border bg-card p-5">

              <h2 className="font-display font-semibold">Jamoa ({activeMembers.length})</h2>

              <ul className="mt-4 space-y-2">

                {activeMembers.map((m) => (

                  <li key={m.userId}>

                    {m.username ? (

                      <Link to="/freelancers/$username" params={{ username: m.username }}>

                        <AgencyMemberRow name={m.fullName} role={agencyRoleLabels[m.role]} hue={m.avatarHue} username={m.username} />

                      </Link>

                    ) : (

                      <AgencyMemberRow name={m.fullName} role={agencyRoleLabels[m.role]} hue={m.avatarHue} />

                    )}

                  </li>

                ))}

              </ul>

            </section>



            {!isMember && (

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">

                <p className="font-medium">Agentlik bilan ishlashni xohlaysizmi?</p>

                <p className="mt-1 text-xs text-muted-foreground">Egasi sizni jamoaga taklif qilishi kerak.</p>

              </div>

            )}

          </div>

        </div>

      </div>

      <SiteFooter />

    </div>

  );

}



function StatCard({ icon: Icon, label, value, sub }: { icon: typeof Star; label: string; value: string | number; sub?: string }) {

  return (

    <div className="rounded-xl border border-border bg-card p-4">

      <Icon className="size-4 text-primary" />

      <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>

      <div className="font-display mt-1 text-xl font-bold">{value}</div>

      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}

    </div>

  );

}

