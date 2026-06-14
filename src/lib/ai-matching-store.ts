import { recommendProjects, recommendServices, recommendFreelancers } from "./recommendations";
import { getPublishedAgencies } from "./agency-store";
import { rankAgencies } from "./agency-ranking-store";
import { getPublishedProjects } from "./projects-store";
import { getPublishedServices } from "./services-store";
import { freelancers } from "./mock-data";
import { getSession } from "./auth";
import { getActiveRole } from "./active-role-store";
import type { Project } from "./mock-data";
import type { Freelancer } from "./mock-data";
import type { StoredService } from "./services-store";
import type { Agency } from "./agency-types";

export type SmartMatch<T> = T & { matchScore: number; matchReason: string };

function skillOverlap(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  let m = 0;
  for (const x of a) {
    if (b.some((y) => x.toLowerCase().includes(y.toLowerCase()) || y.toLowerCase().includes(x.toLowerCase()))) m++;
  }
  return m / Math.max(a.length, 1);
}

/** Projects for freelancer — extends recommendProjects with trust/success weighting */
export function matchProjectsForFreelancer(userId?: string, limit = 5): SmartMatch<Project>[] {
  const uid = userId ?? getSession()?.user.id;
  const published = getPublishedProjects();
  const scored = recommendProjects(published, uid);
  return scored.slice(0, limit).map((p) => ({
    ...p,
    matchScore: p.recommendScore,
    matchReason: p.recommendReason ?? "Ko'nikmalaringizga mos",
  }));
}

/** Freelancers for client */
export function matchFreelancersForClient(userId?: string, limit = 5): SmartMatch<Freelancer>[] {
  const uid = userId ?? getSession()?.user.id;
  const scored = recommendFreelancers(freelancers, uid);
  return scored.slice(0, limit).map((f) => ({
    ...f,
    matchScore: f.recommendScore,
    matchReason: f.recommendReason ?? "Maqsadlaringizga mos",
  }));
}

/** Services for client */
export function matchServicesForClient(userId?: string, limit = 5): SmartMatch<StoredService>[] {
  const uid = userId ?? getSession()?.user.id;
  const services = getPublishedServices();
  const scored = recommendServices(services, uid);
  return scored.slice(0, limit).map((s) => ({
    ...s,
    matchScore: s.recommendScore,
    matchReason: s.recommendReason ?? "Yuqori reyting",
  }));
}

/** Agencies for project based on skills + ranking */
export function matchAgenciesForProject(project: Project, limit = 3): SmartMatch<Agency>[] {
  const agencies = getPublishedAgencies();
  const ranked = rankAgencies(agencies);

  return ranked
    .map((a) => {
      const specOverlap = skillOverlap(project.skills, a.specializations);
      let score = a.rankingScore * 0.4 + specOverlap * 40;
      if (a.verificationLevel !== "none") score += 10;
      const activeMembers = a.members.filter((m) => m.status === "active").length;
      if (activeMembers >= project.skills.length) score += 5;
      return {
        ...a,
        matchScore: Math.round(Math.min(100, score)),
        matchReason: specOverlap > 0.3 ? "Mutaxassislik mos keladi" : "Yuqori reyting",
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}

/** Unified matches for current user */
export function getSmartMatchesForUser(userId?: string) {
  const session = getSession();
  const uid = userId ?? session?.user.id;
  const userType = getActiveRole();

  if (userType === "client") {
    return {
      freelancers: matchFreelancersForClient(uid, 5),
      services: matchServicesForClient(uid, 5),
      projects: [] as SmartMatch<Project>[],
    };
  }

  return {
    projects: matchProjectsForFreelancer(uid, 5),
    freelancers: [] as SmartMatch<Freelancer>[],
    services: [] as SmartMatch<StoredService>[],
  };
}

export const MATCHING_FORMULA = `
Project match (freelancer):
  skillOverlap × 40 + categoryMatch × 20 + featured +15 + saved +10 + verified client +5

Freelancer match (client):
  successScore × 0.25 + responseRate × 0.15 + skillMatch × 30 + available +10 + rating × 4

Agency match (project):
  rankingScore × 0.4 + specializationOverlap × 40 + verified +10 + teamSize bonus +5
`;
