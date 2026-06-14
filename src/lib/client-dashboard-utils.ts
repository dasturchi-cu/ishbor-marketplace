import type { Application, HiringLead } from "./mock-data";
import { freelancers } from "./mock-data";
import { getAllApplications } from "./applications-store";
import { getMyProjects } from "./projects-store";
import { getOrdersForUser } from "./orders-store";
import type { AuthUser } from "./auth";

function mapStatusToStage(status: Application["status"]): HiringLead["stage"] | null {
  if (status === "pending") return "reviewing";
  if (status === "shortlisted") return "shortlisted";
  if (status === "accepted") return "offer";
  return null;
}

function applicationToLead(app: Application): HiringLead | null {
  const stage = mapStatusToStage(app.status);
  if (!stage || !app.freelancerUsername) return null;
  const freelancer = freelancers.find((f) => f.username === app.freelancerUsername);
  return {
    id: app.id,
    name: app.freelancerName ?? freelancer?.name ?? app.freelancerUsername,
    username: app.freelancerUsername,
    hue: app.freelancerHue ?? freelancer?.hue ?? 250,
    title: freelancer?.title ?? "Frilanser",
    stage,
    project: app.projectTitle,
    rate: app.proposalAmount ?? freelancer?.rate ?? 0,
    rating: freelancer?.rating ?? 0,
  };
}

export function getClientProjectSlugs(userId: string): Set<string> {
  return new Set(getMyProjects(userId).map((p) => p.slug));
}

export function getApplicationsForClient(user: AuthUser): Application[] {
  const slugs = getClientProjectSlugs(user.id);
  if (slugs.size === 0) return [];
  return getAllApplications().filter(
    (a) =>
      a.projectSlug &&
      slugs.has(a.projectSlug) &&
      a.status !== "rejected" &&
      (a.clientSlug === user.companySlug ||
        a.client === user.fullName ||
        (user.company && a.client === user.company) ||
        !a.clientSlug),
  );
}

export function getPendingProposalsForClient(user: AuthUser): Application[] {
  return getApplicationsForClient(user)
    .filter((a) => a.status === "pending" || a.status === "shortlisted")
    .sort((a, b) => (a.status === "pending" && b.status !== "pending" ? -1 : 1));
}

export function buildHiringPipelineForClient(user: AuthUser): HiringLead[] {
  return getApplicationsForClient(user)
    .map(applicationToLead)
    .filter((l): l is HiringLead => l !== null);
}

export function getClientLifetimeSpend(user: AuthUser): number {
  return getOrdersForUser(user.id, user.username, user.companySlug, user.company ?? user.fullName)
    .filter((o) => o.status === "completed" || o.escrowFunded)
    .reduce((sum, o) => sum + o.amount, 0);
}
