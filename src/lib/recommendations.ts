import type { Freelancer, Project, Service } from "./mock-data";
import type { StoredService } from "./services-store";
import { getUserProfile } from "./profile-store";
import { getSaved } from "./saved-store";
import { getSession } from "./auth";
import { computeSuccessScore, computeResponseRate } from "./growth-metrics";
import { isFeaturedActive } from "./featured-store";

export type ScoredItem<T> = T & { recommendScore: number; recommendReason?: string };

function skillOverlap(userSkills: string[], itemSkills: string[]): number {
  if (userSkills.length === 0 || itemSkills.length === 0) return 0;
  let matches = 0;
  for (const us of userSkills) {
    for (const is of itemSkills) {
      if (
        us.toLowerCase().includes(is.toLowerCase()) ||
        is.toLowerCase().includes(us.toLowerCase())
      ) {
        matches++;
        break;
      }
    }
  }
  return matches / Math.max(userSkills.length, 1);
}

function categoryOverlap(userCategories: string[], itemCategory: string): number {
  if (userCategories.length === 0) return 0;
  return userCategories.some((c) => itemCategory.toLowerCase().includes(c.toLowerCase())) ? 1 : 0;
}

/** Score projects for a freelancer based on profile skills + saved items. */
export function recommendProjects(
  projects: Project[],
  userId?: string,
): ScoredItem<Project>[] {
  const uid = userId ?? getSession()?.user.id;
  const profile = uid ? getUserProfile(uid) : null;
  const saved = uid ? getSaved(uid) : { projects: [], services: [], freelancers: [], portfolios: [] };
  const savedSlugs = new Set(saved.projects.map((p) => p.id));

  return projects
    .map((p) => {
      let score = 0;
      const reasons: string[] = [];

      const skillScore = skillOverlap(profile?.skills ?? [], p.skills) * 40;
      score += skillScore;
      if (skillScore > 10) reasons.push("Ko'nikmalaringizga mos");

      const catScore = categoryOverlap(profile?.categories ?? [], p.category) * 20;
      score += catScore;
      if (catScore > 0) reasons.push("Kategoriyangizga mos");

      if (p.featured && isFeaturedActive(p.featured, p.featuredUntil)) {
        score += 15;
        reasons.push("Ajratilgan");
      }

      if (p.escrowProtected) score += 5;

      if (savedSlugs.has(p.id)) {
        score += 10;
        reasons.push("Saqlangan");
      }

      if (p.clientVerified) score += 5;

      return { ...p, recommendScore: Math.round(score), recommendReason: reasons[0] };
    })
    .sort((a, b) => b.recommendScore - a.recommendScore);
}

/** Score services based on hiring goals (client) or complementary skills. */
export function recommendServices(
  services: StoredService[],
  userId?: string,
): ScoredItem<StoredService>[] {
  const uid = userId ?? getSession()?.user.id;
  const profile = uid ? getUserProfile(uid) : null;
  const saved = uid ? getSaved(uid) : { projects: [], services: [], freelancers: [], portfolios: [] };
  const savedIds = new Set(saved.services.map((s) => s.id));

  return services
    .map((s) => {
      let score = 0;
      const reasons: string[] = [];

      const success = computeSuccessScore(s.sellerUsername);
      score += success.score * 0.2;
      if (success.score >= 75) reasons.push("Yuqori muvaffaqiyat balli");

      const response = computeResponseRate(s.sellerUsername);
      score += response.rate * 0.1;

      if (s.featured && isFeaturedActive(s.featured, s.featuredUntil)) {
        score += 20;
        reasons.push("Ajratilgan");
      }

      if (profile?.hiringGoals?.length) {
        const goalMatch = profile.hiringGoals.some((g) => {
          if (g === "design") return /dizayn|brand|ui/i.test(s.category);
          if (g === "engineering") return /dastur|web|mobil/i.test(s.category);
          if (g === "strategy") return /strateg|huquq/i.test(s.category);
          return false;
        });
        if (goalMatch) {
          score += 25;
          reasons.push("Yollash maqsadlaringizga mos");
        }
      }

      if (savedIds.has(s.id)) {
        score += 10;
      }

      score += s.rating * 4;

      return { ...s, recommendScore: Math.round(score), recommendReason: reasons[0] };
    })
    .sort((a, b) => b.recommendScore - a.recommendScore);
}

/** Score freelancers for client hiring. */
export function recommendFreelancers(
  freelancers: Freelancer[],
  userId?: string,
): ScoredItem<Freelancer>[] {
  const uid = userId ?? getSession()?.user.id;
  const profile = uid ? getUserProfile(uid) : null;
  const saved = uid ? getSaved(uid) : { projects: [], services: [], freelancers: [], portfolios: [] };
  const savedIds = new Set(saved.freelancers.map((f) => f.id));

  return freelancers
    .map((f) => {
      let score = 0;
      const reasons: string[] = [];

      const success = computeSuccessScore(f.username);
      score += success.score * 0.25;
      if (success.score >= 75) reasons.push(`${success.score} muvaffaqiyat balli`);

      const response = computeResponseRate(f.username);
      score += response.rate * 0.15;
      if (response.rate >= 80) reasons.push("Tez javob");

      if (profile?.hiringGoals?.length) {
        const skillMatch = skillOverlap(
          profile.hiringGoals.flatMap((g) => {
            if (g === "design") return ["Figma", "Dizayn"];
            if (g === "engineering") return ["React", "Next.js"];
            if (g === "strategy") return ["Strategiya"];
            return [];
          }),
          f.skills,
        );
        score += skillMatch * 30;
        if (skillMatch > 0.3) reasons.push("Maqsadlaringizga mos");
      }

      if (f.available) score += 10;

      if (savedIds.has(f.id)) score += 10;

      score += f.rating * 4;

      return { ...f, recommendScore: Math.round(score), recommendReason: reasons[0] };
    })
    .sort((a, b) => b.recommendScore - a.recommendScore);
}
