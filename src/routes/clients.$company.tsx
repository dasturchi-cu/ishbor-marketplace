import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Star, Building2, MapPin, Users, ShieldCheck } from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { GradientAvatar } from "@/components/site/avatar";
import { ProjectCard } from "@/components/site/cards";
import { VerifiedIdentityBadge } from "@/components/site/trust";
import { getClient, getClientProjects, getClientReviews } from "@/lib/mock-data";

export const Route = createFileRoute("/clients/$company")({
  loader: ({ params }) => {
    const client = getClient(params.company);
    if (!client) throw notFound();
    return {
      client,
      openProjects: getClientProjects(params.company),
      clientReviews: getClientReviews(params.company),
    };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.client.name ?? "Client"} — Ishbor` }],
  }),
  component: ClientProfilePage,
});

function ClientProfilePage() {
  const { client, openProjects, clientReviews } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <GradientAvatar name={client.name} hue={client.hue} size={80} rounded="rounded-2xl" />
            <div className="min-w-0 flex-1">
              <div className="eyebrow mb-2">Client profile</div>
              <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{client.name}</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{client.bio}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {client.verified && <VerifiedIdentityBadge />}
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  <Building2 className="size-3" /> {client.industry}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" /> {client.location}</span>
                <span className="inline-flex items-center gap-1"><Users className="size-3.5" /> {client.teamSize}</span>
                <span>Member since {client.memberSince}</span>
              </div>
            </div>
            <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-1">
              <div className="rounded-xl border border-border bg-background px-4 py-3 text-center">
                <div className="font-display text-xl font-bold">${(client.spent / 1000).toFixed(0)}k</div>
                <div className="text-xs text-muted-foreground">Total spent</div>
              </div>
              <div className="rounded-xl border border-border bg-background px-4 py-3 text-center">
                <div className="font-display text-xl font-bold">{client.hires}</div>
                <div className="text-xs text-muted-foreground">Hires</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6">
        <section>
          <h2 className="font-display text-lg font-semibold">Open projects</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {openProjects.map((p) => (
              <ProjectCard key={p.id} p={p} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold">Team</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {client.team.map((member) => (
              <div key={member.name} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <GradientAvatar name={member.name} hue={member.hue} size={40} />
                <div>
                  <div className="text-sm font-medium">{member.name}</div>
                  <div className="text-xs text-muted-foreground">{member.role}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold">Reviews received</h2>
          {clientReviews.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No reviews yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {clientReviews.map((r) => (
                <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2">
                    <Star className="size-4 fill-gold text-gold" />
                    <span className="text-sm font-medium">{r.rating}.0</span>
                    <span className="text-sm text-muted-foreground">· {r.project}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold">Hiring history</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {client.hires} successful hires · ${client.spent.toLocaleString()} total investment on Ishbor
          </p>
          <Link to="/projects" search={{ q: client.name }} className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
            View all projects
          </Link>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}
