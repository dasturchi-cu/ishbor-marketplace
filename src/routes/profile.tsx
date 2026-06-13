import { createFileRoute, Link } from "@tanstack/react-router";
import { Settings, ExternalLink } from "lucide-react";
import { WorkspaceShell } from "@/components/site/workspace-shell";
import { GradientAvatar } from "@/components/site/avatar";
import { VerifiedIdentityBadge, LevelBadge } from "@/components/site/trust";
import { useAuth } from "@/hooks/use-auth";
import { requireAuth } from "@/lib/guards";
import {
  enrichFreelancer,
  freelancers,
  getClient,
  getFreelancerReviews,
  getFreelancerServices,
} from "@/lib/mock-data";

export const Route = createFileRoute("/profile")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: "My Profile — Ishbor" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.userType === "freelancer" && user.username) {
    const f = enrichFreelancer(freelancers.find((x) => x.username === user.username) ?? freelancers[0]!);
    const userReviews = getFreelancerReviews(f.username);
    const userServices = getFreelancerServices(f.username);

    return (
      <WorkspaceShell
        eyebrow="Your profile"
        title={f.name}
        actions={
          <Link to="/settings" className="touch-target inline-flex items-center gap-1.5 rounded-lg border border-border px-4 text-sm font-medium hover:border-primary/20">
            <Settings className="size-4" /> Settings
          </Link>
        }
      >
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="rounded-2xl border border-border bg-card p-5 text-center">
            <GradientAvatar name={f.name} hue={f.hue} size={80} rounded="rounded-2xl" className="mx-auto" />
            <h2 className="font-display mt-4 text-lg font-semibold">{f.name}</h2>
            <p className="text-sm text-muted-foreground">@{f.username}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              <LevelBadge level={f.level} />
              {f.identityVerified && <VerifiedIdentityBadge />}
            </div>
            <Link
              to="/freelancers/$username"
              params={{ username: f.username }}
              className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View public profile <ExternalLink className="size-3" />
            </Link>
          </div>
          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-display font-semibold">About</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.bio}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div><div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Location</div><div className="text-sm">{f.city}</div></div>
                <div><div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Rate</div><div className="text-sm">${f.rate}/hr</div></div>
                <div><div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Earned</div><div className="text-sm">${f.earned.toLocaleString()}</div></div>
                <div><div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Jobs</div><div className="text-sm">{f.jobs}</div></div>
              </div>
            </section>
            <section className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-display font-semibold">Skills</h3>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {f.skills.map((s) => (
                  <span key={s} className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium">{s}</span>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-display font-semibold">Services ({userServices.length})</h3>
              <div className="mt-3 space-y-2">
                {userServices.map((s) => (
                  <Link key={s.id} to="/services/$slug" params={{ slug: s.slug }} className="block rounded-lg border border-border px-4 py-3 text-sm transition-default hover:border-primary/20">
                    {s.title} · ${s.price}
                  </Link>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-display font-semibold">Reviews ({userReviews.length})</h3>
              <div className="mt-3 space-y-3">
                {userReviews.slice(0, 3).map((r) => (
                  <div key={r.id} className="rounded-lg border border-border px-4 py-3">
                    <div className="text-sm font-medium">{r.from} · {r.rating}★</div>
                    <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </WorkspaceShell>
    );
  }

  const client = getClient(user.companySlug ?? "asaka-capital");
  return (
    <WorkspaceShell
      eyebrow="Your profile"
      title={user.fullName}
      actions={
        <Link to="/settings" className="touch-target inline-flex items-center gap-1.5 rounded-lg border border-border px-4 text-sm font-medium hover:border-primary/20">
          <Settings className="size-4" /> Settings
        </Link>
      }
    >
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <GradientAvatar name={user.fullName} hue={user.avatarHue} size={64} rounded="rounded-xl" />
          <div>
            <h2 className="font-display text-lg font-semibold">{user.fullName}</h2>
            <p className="text-sm text-muted-foreground">{client?.name ?? user.company}</p>
            {user.verified && <VerifiedIdentityBadge className="mt-2" />}
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{user.bio}</p>
        {client && (
          <Link
            to="/clients/$company"
            params={{ company: client.slug }}
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View company profile <ExternalLink className="size-3.5" />
          </Link>
        )}
      </div>
    </WorkspaceShell>
  );
}
