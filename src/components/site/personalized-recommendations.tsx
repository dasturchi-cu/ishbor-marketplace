import { Link } from "@tanstack/react-router";
import { ArrowRight, Briefcase, Lightbulb, Sparkles, Star, Users } from "lucide-react";
import { useMemo, useSyncExternalStore, type ComponentType, type ReactNode } from "react";
import { GradientAvatar } from "@/components/site/avatar";
import { ServiceCard } from "@/components/site/cards";
import { useAuth } from "@/hooks/use-auth";
import { useActiveRole } from "@/hooks/use-active-role";
import {
  getRecommendationsVersion,
  recommendAgenciesForClient,
  recommendClientsForFreelancer,
  recommendProjectTemplates,
  recommendSkillsToLearn,
  subscribeRecommendations,
} from "@/lib/recommendations";
import {
  matchProjectsForFreelancer,
  matchFreelancersForClient,
  matchServicesForClient,
} from "@/lib/ai-matching-store";
import type { StoredService } from "@/lib/services-store";

function useRecommendationSnapshot() {
  return useSyncExternalStore(subscribeRecommendations, getRecommendationsVersion, () => 0);
}

export function FreelancerRecommendations({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const { activeRole } = useActiveRole();
  const recVersion = useRecommendationSnapshot();

  const projects = useMemo(
    () => (user && activeRole === "freelancer" ? matchProjectsForFreelancer(user.id, compact ? 3 : 4) : []),
    [user, activeRole, recVersion, compact],
  );
  const clients = useMemo(
    () => (user && activeRole === "freelancer" && !compact ? recommendClientsForFreelancer(user.id, 4) : []),
    [user, activeRole, recVersion, compact],
  );
  const skills = useMemo(
    () => (user && activeRole === "freelancer" && !compact ? recommendSkillsToLearn(user.id, 4) : []),
    [user, activeRole, recVersion, compact],
  );
  const services = useMemo(
    () => (user && activeRole === "freelancer" && !compact ? matchServicesForClient(user.id, 3) : []),
    [user, activeRole, recVersion, compact],
  );

  if (!user || activeRole !== "freelancer") return null;

  if (compact) {
    if (projects.length === 0) return null;
    return (
      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-display text-sm font-semibold">Sizga mos loyihalar</h2>
          <Link to="/projects" className="text-xs font-medium text-primary hover:underline">
            Barchasi →
          </Link>
        </div>
        <ul className="divide-y divide-border">
          {projects.map((p) => (
            <li key={p.slug}>
              <Link
                to="/projects/$slug"
                params={{ slug: p.slug }}
                className="flex items-center justify-between gap-3 py-2.5 transition-default hover:text-primary"
              >
                <span className="min-w-0 truncate text-sm font-medium">{p.title}</span>
                <ScoreBadge score={p.matchScore} />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <>
    <div className="mt-8 grid gap-6 lg:grid-cols-3">
      <RecommendationCard title="Tavsiya etilgan loyihalar" viewAllHref="/projects" icon={Briefcase}>
        {projects.length === 0 ? (
          <EmptyHint text="Ko'nikmalaringizni yangilang — mos loyihalar paydo bo'ladi." />
        ) : (
          <ul className="space-y-2">
            {projects.map((p) => (
              <li key={p.slug}>
                <Link
                  to="/projects/$slug"
                  params={{ slug: p.slug }}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface/50 px-3 py-2.5 transition-default hover:border-primary/25"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Briefcase className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{p.title}</div>
                    <div className="truncate text-xs text-muted-foreground">{p.matchReason}</div>
                  </div>
                  <ScoreBadge score={p.matchScore} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </RecommendationCard>

      <RecommendationCard title="Tavsiya etilgan mijozlar" viewAllHref="/freelancers/manage" icon={Users}>
        {clients.length === 0 ? (
          <EmptyHint text="Birinchi buyurtmani yakunlang — CRM tavsiyalari ochiladi." />
        ) : (
          <ul className="space-y-2">
            {clients.map((c) => (
              <li key={c.slug} className="flex items-center gap-3 rounded-xl border border-border bg-surface/50 px-3 py-2.5">
                <GradientAvatar name={c.name} hue={c.hue} size={36} rounded="rounded-lg" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{c.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{c.recommendReason}</div>
                </div>
                <div className="text-right text-xs font-semibold text-primary">${c.totalPaid.toLocaleString()}</div>
              </li>
            ))}
          </ul>
        )}
      </RecommendationCard>

      <RecommendationCard title="O'rganish tavsiyasi" viewAllHref="/onboarding/skills" icon={Lightbulb}>
        {skills.length === 0 ? (
          <EmptyHint text="Ko'nikmalaringiz bozor talabiga mos — ajoyib!" />
        ) : (
          <ul className="space-y-2">
            {skills.map((s) => (
              <li key={s.skill} className="rounded-xl border border-border bg-surface/50 px-3 py-2.5">
                <div className="text-sm font-semibold">{s.skill}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{s.reason}</div>
              </li>
            ))}
          </ul>
        )}
      </RecommendationCard>
    </div>

    {services.length > 0 && (
      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <Sparkles className="size-3 text-primary" />
              Shaxsiylashtirilgan
            </div>
            <h2 className="font-display mt-1 text-base font-semibold">Tavsiya etilgan xizmatlar</h2>
          </div>
          <Link to="/services" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            Barchasi <ArrowRight className="size-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {services.map((s) => (
            <ServiceCard key={s.id} s={s as StoredService} />
          ))}
        </div>
      </section>
    )}
    </>
  );
}

export function ClientRecommendations({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const { activeRole } = useActiveRole();
  const recVersion = useRecommendationSnapshot();

  const freelancers = useMemo(
    () => (user && activeRole === "client" ? matchFreelancersForClient(user.id, compact ? 3 : 4) : []),
    [user, activeRole, recVersion, compact],
  );
  const services = useMemo(
    () => (user && activeRole === "client" && !compact ? matchServicesForClient(user.id, 4) : []),
    [user, activeRole, recVersion, compact],
  );
  const templates = useMemo(
    () => (user && activeRole === "client" && !compact ? recommendProjectTemplates(user.id, 3) : []),
    [user, activeRole, recVersion, compact],
  );
  const agencies = useMemo(
    () => (user && activeRole === "client" && !compact ? recommendAgenciesForClient(user.id, 3) : []),
    [user, activeRole, recVersion, compact],
  );

  if (!user || activeRole !== "client") return null;

  if (compact) {
    if (freelancers.length === 0) return null;
    return (
      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-display text-sm font-semibold">Tavsiya etilgan frilanserlar</h2>
          <Link to="/freelancers" className="text-xs font-medium text-primary hover:underline">
            Barchasi →
          </Link>
        </div>
        <ul className="divide-y divide-border">
          {freelancers.map((f) => (
            <li key={f.username}>
              <Link
                to="/freelancers/$username"
                params={{ username: f.username }}
                className="flex items-center justify-between gap-3 py-2.5 transition-default hover:text-primary"
              >
                <span className="min-w-0 truncate text-sm font-medium">{f.name}</span>
                <ScoreBadge score={f.matchScore} />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <RecommendationCard title="Tavsiya etilgan frilanserlar" viewAllHref="/freelancers" icon={Users}>
          {freelancers.length === 0 ? (
            <EmptyHint text="Yollash maqsadlarini to'ldiring — mos frilanserlar ko'rsatiladi." />
          ) : (
            <ul className="space-y-2">
              {freelancers.map((f) => (
                <li key={f.username}>
                  <Link
                    to="/freelancers/$username"
                    params={{ username: f.username }}
                    className="flex items-center gap-3 rounded-xl border border-border bg-surface/50 px-3 py-2.5 transition-default hover:border-primary/25"
                  >
                    <GradientAvatar name={f.name} hue={f.hue} size={36} rounded="rounded-lg" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{f.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{f.matchReason}</div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <ScoreBadge score={f.matchScore} />
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                        <Star className="size-3 fill-warning text-warning" />
                        {f.rating.toFixed(1)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </RecommendationCard>

        <RecommendationCard title="Loyiha shablonlari" viewAllHref="/projects/create" icon={Briefcase}>
          {templates.length === 0 ? (
            <EmptyHint text="Onboarding maqsadlarini to'ldiring — shablonlar moslashtiriladi." />
          ) : (
            <ul className="space-y-2">
              {templates.map((t) => (
                <li key={t.id}>
                  <Link
                    to="/projects/create"
                    className="block rounded-xl border border-border bg-surface/50 px-3 py-2.5 transition-default hover:border-primary/25"
                  >
                    <div className="text-sm font-semibold">{t.title}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{t.reason}</div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </RecommendationCard>
      </div>

      {agencies.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <Sparkles className="size-3 text-primary" />
                Shaxsiylashtirilgan
              </div>
              <h2 className="font-display mt-1 text-base font-semibold">Tavsiya etilgan agentliklar</h2>
            </div>
            <Link to="/agencies" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              Barchasi <ArrowRight className="size-3" />
            </Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-3">
            {agencies.map((a) => (
              <li key={a.slug}>
                <Link
                  to="/agencies/$slug"
                  params={{ slug: a.slug }}
                  className="block rounded-xl border border-border bg-surface/50 px-3 py-2.5 transition-default hover:border-primary/25"
                >
                  <div className="truncate text-sm font-semibold">{a.name}</div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">{a.recommendReason}</div>
                  <div className="mt-1 font-mono text-[10px] text-primary">{a.recommendScore} ball</div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {services.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <Sparkles className="size-3 text-primary" />
                Sizga mos xizmatlar
              </div>
              <h2 className="font-display mt-1 text-base font-semibold">Tavsiya etilgan xizmatlar</h2>
            </div>
            <Link to="/services" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              Barchasi <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s) => (
              <ServiceCard key={s.id} s={s as StoredService} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function RecommendationCard({
  title,
  viewAllHref,
  icon: Icon,
  children,
}: {
  title: string;
  viewAllHref: string;
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <Icon className="size-3 text-primary" />
            Shaxsiylashtirilgan
          </div>
          <h2 className="font-display mt-1 text-base font-semibold">{title}</h2>
        </div>
        <Link to={viewAllHref} className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline">
          Barchasi <ArrowRight className="size-3" />
        </Link>
      </div>
      {children}
    </section>
  );
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
      {score}
    </span>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-secondary/30 px-4 py-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
