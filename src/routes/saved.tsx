import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useSyncExternalStore } from "react";
import { Heart, Briefcase, User, FolderOpen, Images } from "lucide-react";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { EmptyState } from "@/components/site/feedback";
import { ServiceCard, FreelancerCard, ProjectCard } from "@/components/site/cards";
import { PortfolioPreviewCard } from "@/components/portfolio/portfolio-preview-card";
import { ProtectedGate } from "@/components/auth/protected-gate";
import { requireAuth } from "@/lib/guards";
import { subscribeSaved, getSaved, type SavedType } from "@/lib/saved-store";
import { getAllServices } from "@/lib/services-store";
import { freelancers, projects } from "@/lib/mock-data";
import { getAllProjects } from "@/lib/projects-store";
import { getAllPortfolios } from "@/lib/portfolio-store";
import { ClientCheckoutLink } from "@/components/checkout/client-checkout-link";
import { ArrowRight } from "lucide-react";
import { hasPriorOrderWithFreelancer } from "@/lib/ecosystem-progress";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/saved")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: "Saqlanganlar — Ishbor" }] }),
  component: () => (
    <ProtectedGate>
      <SavedPage />
    </ProtectedGate>
  ),
});

const tabs = [
  { key: "services" as const, label: "Xizmatlar", icon: Briefcase },
  { key: "freelancers" as const, label: "Frilanserlar", icon: User },
  { key: "projects" as const, label: "Loyihalar", icon: FolderOpen },
  { key: "portfolios" as const, label: "Portfoliolar", icon: Images },
];

function SavedPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("services");
  const saved = useSyncExternalStore(
    subscribeSaved,
    () => getSaved(user?.id),
    () => getSaved(),
  );

  const savedServices = saved.services
    .map((e) => {
      const s = getAllServices().find((x) => x.slug === e.id);
      return s ? { service: s, savedAt: e.savedAt } : null;
    })
    .filter(Boolean);
  const savedFreelancers = saved.freelancers
    .map((e) => {
      const f = freelancers.find((x) => x.username === e.id);
      return f ? { freelancer: f, savedAt: e.savedAt } : null;
    })
    .filter(Boolean);
  const savedProjects = saved.projects
    .map((e) => {
      const p = getAllProjects().find((x) => x.slug === e.id);
      return p ? { project: p, savedAt: e.savedAt } : null;
    })
    .filter(Boolean);
  const savedPortfolios = saved.portfolios
    .map((e) => {
      const p = getAllPortfolios().find((x) => x.slug === e.id);
      return p ? { portfolio: p, savedAt: e.savedAt } : null;
    })
    .filter(Boolean);

  const counts: Record<SavedType, number> = {
    service: savedServices.length,
    freelancer: savedFreelancers.length,
    project: savedProjects.length,
    portfolio: savedPortfolios.length,
  };

  const total = counts.service + counts.freelancer + counts.project + counts.portfolio;

  return (
    <WorkspaceShell eyebrow="Kutubxonangiz" title="Saqlanganlar">
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`touch-target inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-default ${
              tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary/50"
            }`}
          >
            <t.icon className="size-4" />
            {t.label}
            <span className="font-mono text-[10px] opacity-70">{counts[t.key === "services" ? "service" : t.key === "freelancers" ? "freelancer" : t.key === "projects" ? "project" : "portfolio"]}</span>
          </button>
        ))}
      </div>

      {total === 0 ? (
        <EmptyState
          icon={Heart}
          title="Hali hech narsa saqlanmagan"
          description="Bu yerga saqlash uchun xizmatlar, iste'dod, loyihalar yoki portfoliolar yonidagi yurak belgisini bosing."
          action={
            <Link to="/services" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Bozorni ko'rish
            </Link>
          }
        />
      ) : tab === "services" ? (
        savedServices.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="Saqlangan xizmatlar yo'q"
            description="Bozordan xizmatlarni saqlang."
            action={<Link to="/services" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Xizmatlarni ko'rish</Link>}
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {savedServices.map((entry) => entry && (
              <div key={entry.service.slug} className="space-y-2">
                <ServiceCard s={entry.service} />
                <p className="font-mono text-[10px] text-muted-foreground">
                  Saqlangan: {new Date(entry.savedAt).toLocaleDateString("uz-UZ")}
                </p>
              </div>
            ))}
          </div>
        )
      ) : tab === "freelancers" ? (
        savedFreelancers.length === 0 ? (
          <EmptyState
            icon={User}
            title="Saqlangan frilanserlar yo'q"
            description="Frilanser profillaridan iste'dod saqlang."
            action={<Link to="/freelancers" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Frilanserlar</Link>}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {savedFreelancers.map((entry) => entry && (
              <div key={entry.freelancer.username} className="space-y-2">
                <FreelancerCard f={entry.freelancer} />
                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                  <p className="font-mono text-[10px] text-muted-foreground">
                    Saqlangan: {new Date(entry.savedAt).toLocaleDateString("uz-UZ")}
                    {user && hasPriorOrderWithFreelancer(user, entry.freelancer.username)
                      ? " · Oldin hamkorlik qilgan"
                      : ""}
                  </p>
                  <ClientCheckoutLink
                    search={{ type: "hire" as const, freelancer: entry.freelancer.username }}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-95"
                  >
                    Qayta yollash <ArrowRight className="size-3" />
                  </ClientCheckoutLink>
                </div>
              </div>
            ))}
          </div>
        )
      ) : tab === "projects" ? (
        savedProjects.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="Saqlangan loyihalar yo'q"
            description="Imkoniyatlarni kuzatish uchun loyihalarni saqlang."
            action={<Link to="/projects" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Loyihalar</Link>}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {savedProjects.map((entry) => entry && (
              <div key={entry.project.slug} className="space-y-2">
                <ProjectCard p={entry.project} />
                <p className="font-mono text-[10px] text-muted-foreground">
                  Saqlangan: {new Date(entry.savedAt).toLocaleDateString("uz-UZ")}
                </p>
              </div>
            ))}
          </div>
        )
      ) : savedPortfolios.length === 0 ? (
        <EmptyState
          icon={Images}
          title="Saqlangan portfoliolar yo'q"
          description="Yoqtirgan portfolio ishlarini saqlang."
          action={<Link to="/freelancers" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Mutaxassislarni ko'rish</Link>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {savedPortfolios.map((entry) => entry && (
            <div key={entry.portfolio.slug} className="space-y-2">
              <Link to="/portfolio/$slug" params={{ slug: entry.portfolio.slug }}>
                <PortfolioPreviewCard item={entry.portfolio} />
              </Link>
              <p className="font-mono text-[10px] text-muted-foreground">
                Saqlangan: {new Date(entry.savedAt).toLocaleDateString("uz-UZ")}
              </p>
            </div>
          ))}
        </div>
      )}
    </WorkspaceShell>
  );
}
