import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Star, Briefcase } from "lucide-react";
import { GradientAvatar } from "@/components/site/avatar";
import type { Freelancer, Project } from "@/lib/mock-data";
import type { SmartMatch } from "@/lib/ai-matching-store";

type AiLink = { label: string; to: string };

type FreelancerPanelProps = {
  variant: "freelancers";
  title: string;
  viewAllHref: string;
  items: SmartMatch<Freelancer>[];
  links: AiLink[];
  emptyMessage: string;
};

type ProjectPanelProps = {
  variant: "projects";
  title: string;
  viewAllHref: string;
  items: SmartMatch<Project>[];
  links: AiLink[];
  emptyMessage: string;
};

export function SmartMatchPanel(props: FreelancerPanelProps | ProjectPanelProps) {
  const { title, viewAllHref, items, links, emptyMessage } = props;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <Sparkles className="size-3 text-primary" />
            AI moslik
          </div>
          <h3 className="font-display mt-1 text-base font-semibold">{title}</h3>
        </div>
        <Link
          to={viewAllHref}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Barchasi <ArrowRight className="size-3" />
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="mt-5 flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/30 px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((item, i) =>
            props.variant === "freelancers" ? (
              <FreelancerRow key={item.username} freelancer={item as SmartMatch<Freelancer>} rank={i + 1} />
            ) : (
              <ProjectRow key={item.slug} project={item as SmartMatch<Project>} rank={i + 1} />
            ),
          )}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium transition-default hover:border-primary/25 hover:text-primary"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function MatchBadge({ score, reason }: { score: number; reason?: string }) {
  return (
    <div className="flex shrink-0 flex-col items-end gap-0.5">
      <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
        {score}%
      </span>
      {reason && (
        <span className="max-w-[88px] truncate text-[10px] text-muted-foreground">{reason}</span>
      )}
    </div>
  );
}

function FreelancerRow({ freelancer, rank }: { freelancer: SmartMatch<Freelancer>; rank: number }) {
  return (
    <li>
      <Link
        to="/freelancers/$username"
        params={{ username: freelancer.username }}
        className="group flex items-center gap-3 rounded-xl border border-border bg-surface/50 px-3 py-2.5 transition-default hover:border-primary/25 hover:bg-surface"
      >
        <span className="font-mono text-[10px] text-muted-foreground/60">{rank}</span>
        <GradientAvatar name={freelancer.name} hue={freelancer.hue} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium group-hover:text-primary">{freelancer.name}</span>
            {!freelancer.available && (
              <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                Band
              </span>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">{freelancer.title}</p>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-0.5">
              <Star className="size-3 fill-warning text-warning" />
              {freelancer.rating.toFixed(1)}
            </span>
            <span>·</span>
            <span>${freelancer.rate}/soat</span>
          </div>
        </div>
        <MatchBadge score={freelancer.matchScore} reason={freelancer.matchReason} />
      </Link>
    </li>
  );
}

function ProjectRow({ project, rank }: { project: SmartMatch<Project>; rank: number }) {
  return (
    <li>
      <Link
        to="/projects/$slug"
        params={{ slug: project.slug }}
        className="group flex items-center gap-3 rounded-xl border border-border bg-surface/50 px-3 py-2.5 transition-default hover:border-primary/25 hover:bg-surface"
      >
        <span className="font-mono text-[10px] text-muted-foreground/60">{rank}</span>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Briefcase className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="line-clamp-1 font-medium group-hover:text-primary">{project.title}</span>
          <p className="truncate text-xs text-muted-foreground">{project.category}</p>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            ${project.budget.toLocaleString()} · {project.duration}
          </div>
        </div>
        <MatchBadge score={project.matchScore} reason={project.matchReason} />
      </Link>
    </li>
  );
}
