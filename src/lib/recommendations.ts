import type { Freelancer, Project } from "./mock-data";
import type { StoredService } from "./services-store";
import { getUserProfile, subscribeProfiles } from "./profile-store";
import { getSaved, subscribeSaved } from "./saved-store";
import { getSession } from "./auth";
import { computeSuccessScore, computeResponseRate } from "./growth-metrics";
import { isFeaturedActive } from "./featured-store";
import { getActiveRole, subscribeActiveRole, type WorkspaceRole } from "./active-role-store";
import { getAllOrders, subscribeOrders } from "./orders-store";
import { getAllAnalyticsEvents, subscribeAnalyticsEvents } from "./analytics-events-store";
import { getClientCrmData, getFreelancerCrmData } from "./crm-store";
import { getMyPortfolios } from "./portfolio-store";
import { getMyServices } from "./services-store";
import { readStoredApplications, subscribeApplications } from "./applications-store";
import { getPublishedAgencies } from "./agency-store";
import { rankAgencies } from "./agency-ranking-store";
import type { Agency } from "./agency-types";
import { getPublishedProjects, subscribeProjects } from "./projects-store";
import { getPublishedServices, subscribeServices } from "./services-store";
import { freelancers, services, projects } from "./mock-data";
import { rankFreelancers, rankProjects, rankServices } from "./ranking-store";
import type { MarketplaceSearch } from "./marketplace";

export type ScoredItem<T> = T & { recommendScore: number; recommendReason?: string };

export type UserInterestProfile = {
  userId: string;
  role: WorkspaceRole;
  skills: string[];
  categories: string[];
  hiringGoals: string[];
  industry?: string;
  company?: string;
  teamSize?: string;
  appliedCategories: string[];
  appliedSkills: string[];
  savedProjectIds: Set<string>;
  savedServiceIds: Set<string>;
  savedFreelancerUsernames: Set<string>;
  viewedCategories: string[];
  orderCategories: string[];
  portfolioCategories: string[];
  serviceCategories: string[];
  previousHireUsernames: string[];
  previousClientSlugs: string[];
};

export type SkillRecommendation = { skill: string; demand: number; reason: string };

export type ProjectTemplateRecommendation = {
  id: string;
  title: string;
  category: string;
  description: string;
  reason: string;
};

const PROJECT_TEMPLATES: Omit<ProjectTemplateRecommendation, "reason">[] = [
  { id: "brand", title: "Brend identifikatsiyasi", category: "Branding", description: "Logo, rang palitrasi va brend qo'llanmasi." },
  { id: "web-app", title: "Veb ilova ishlab chiqish", category: "Development", description: "React/Next.js asosida MVP yaratish." },
  { id: "mobile", title: "Mobil ilova", category: "Mobile", description: "iOS yoki Android uchun ilova." },
  { id: "gtm", title: "GTM strategiyasi", category: "Strategy", description: "Bozorga chiqish va o'sish rejasi." },
  { id: "ui-audit", title: "UI/UX audit", category: "Design", description: "Mahsulot interfeysini tahlil qilish." },
  { id: "content", title: "Kontent strategiyasi", category: "Marketing", description: "Kontent kalendari va SEO rejasi." },
];

const GOAL_TEMPLATE_MAP: Record<string, string[]> = {
  design: ["brand", "ui-audit"],
  engineering: ["web-app", "mobile"],
  strategy: ["gtm", "content"],
  "one-off": ["brand", "ui-audit"],
  contractors: ["web-app", "content"],
  agency: ["web-app", "brand"],
};

let recommendationsVersion = 0;

function bumpRecommendations() {
  recommendationsVersion += 1;
}

export function subscribeRecommendations(listener: () => void) {
  const bump = () => {
    bumpRecommendations();
    listener();
  };
  const unsubs = [
    subscribeProfiles(bump),
    subscribeSaved(bump),
    subscribeOrders(bump),
    subscribeActiveRole(bump),
    subscribeAnalyticsEvents(bump),
    subscribeProjects(bump),
    subscribeServices(bump),
    subscribeApplications(bump),
  ];
  return () => unsubs.forEach((u) => u());
}

export function getRecommendationsVersion(): number {
  return recommendationsVersion;
}

function textOverlap(a: string, b: string): boolean {
  const al = a.toLowerCase();
  const bl = b.toLowerCase();
  return al.includes(bl) || bl.includes(al);
}

function skillOverlap(userSkills: string[], itemSkills: string[]): number {
  if (userSkills.length === 0 || itemSkills.length === 0) return 0;
  let matches = 0;
  for (const us of userSkills) {
    for (const is of itemSkills) {
      if (textOverlap(us, is)) {
        matches++;
        break;
      }
    }
  }
  return matches / Math.max(userSkills.length, 1);
}

function categoryOverlap(userCategories: string[], itemCategory: string): number {
  if (userCategories.length === 0) return 0;
  return userCategories.some((c) => textOverlap(c, itemCategory)) ? 1 : 0;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function extractViewedCategories(userId: string): string[] {
  return unique(
    getAllAnalyticsEvents()
      .filter((e) => e.userId === userId)
      .flatMap((e) => {
        const cats: string[] = [];
        if (e.meta?.category) cats.push(e.meta.category);
        if (e.type === "service_view" && e.meta?.serviceCategory) cats.push(e.meta.serviceCategory);
        return cats;
      }),
  );
}

function extractOrderCategories(userId: string, username?: string, clientSlug?: string, clientName?: string): string[] {
  const orders = getAllOrders().filter((o) => {
    if (o.ownerUserId === userId) return true;
    if (username && o.freelancerUsername === username) return true;
    if (clientSlug && o.clientSlug === clientSlug) return true;
    if (clientName && o.client === clientName) return true;
    return false;
  });
  return unique(
    orders
      .filter((o) => o.status === "completed" || o.status === "in_progress" || o.status === "review")
      .map((o) => o.title.split("·")[0]?.trim() ?? o.title),
  );
}

function extractApplicationSignals(username?: string): { categories: string[]; skills: string[] } {
  if (!username) return { categories: [], skills: [] };
  const apps = readStoredApplications().filter((a) => a.freelancerUsername === username && !a.archived);
  return {
    categories: unique(apps.map((a) => a.category).filter(Boolean) as string[]),
    skills: unique(apps.flatMap((a) => [a.category, a.projectTitle].filter(Boolean) as string[])),
  };
}

/** Aggregate onboarding, profile, portfolio, services, orders, saved items, and CRM into one profile. */
export function buildUserInterestProfile(userId?: string, role?: WorkspaceRole): UserInterestProfile | null {
  const uid = userId ?? getSession()?.user.id;
  if (!uid) return null;

  const session = getSession();
  const profile = getUserProfile(uid);
  const saved = getSaved(uid);
  const activeRole = role ?? getActiveRole();
  const username = session?.user.id === uid ? session.user.username : profile?.username;
  const clientSlug = session?.user.id === uid ? session.user.companySlug : undefined;
  const clientName = session?.user.id === uid ? (session.user.company || session.user.fullName) : profile?.company;

  const portfolios = getMyPortfolios(uid);
  const myServices = getMyServices(uid);

  const portfolioCategories = unique(portfolios.map((p) => p.category));
  const serviceCategories = unique(myServices.map((s) => s.category));

  const applicationSignals = extractApplicationSignals(username);

  const crmClient = activeRole === "client" ? getClientCrmData(uid, clientSlug, clientName) : null;
  const crmFreelancer = username && activeRole === "freelancer" ? getFreelancerCrmData(username) : null;

  return {
    userId: uid,
    role: activeRole,
    skills: unique([...(profile?.skills ?? []), ...applicationSignals.skills]),
    categories: unique([
      ...(profile?.categories ?? []),
      ...portfolioCategories,
      ...serviceCategories,
      ...applicationSignals.categories,
    ]),
    hiringGoals: profile?.hiringGoals ?? [],
    industry: profile?.industry,
    company: profile?.company,
    teamSize: profile?.teamSize,
    appliedCategories: applicationSignals.categories,
    appliedSkills: applicationSignals.skills,
    savedProjectIds: new Set(saved.projects.map((p) => p.id)),
    savedServiceIds: new Set(saved.services.map((s) => s.id)),
    savedFreelancerUsernames: new Set(saved.freelancers.map((f) => f.id)),
    viewedCategories: extractViewedCategories(uid),
    orderCategories: extractOrderCategories(uid, username, clientSlug, clientName),
    portfolioCategories,
    serviceCategories,
    previousHireUsernames: crmClient?.previouslyHired.map((f) => f.username) ?? [],
    previousClientSlugs: crmFreelancer?.previousClients.map((c) => c.slug) ?? [],
  };
}

export function shouldPersonalizeList(search: MarketplaceSearch): boolean {
  return !search.q?.trim() && !search.category && !search.filter;
}

export function getPopularFreelancers(limit = 6): Freelancer[] {
  return rankFreelancers(freelancers)
    .slice(0, limit)
    .map(({ rankingScore: _, ...f }) => f);
}

export function getPopularProjects(limit = 4): Project[] {
  return rankProjects(getPublishedProjects().length ? getPublishedProjects() : projects)
    .slice(0, limit)
    .map(({ rankingScore: _, ...p }) => p);
}

export function getPopularServices(limit = 4): StoredService[] {
  const all = getPublishedServices();
  const source = all.length ? all : (services as StoredService[]);
  return rankServices(source)
    .slice(0, limit)
    .map(({ rankingScore: _, ...s }) => s);
}

function interestCategories(interest: UserInterestProfile | null): string[] {
  if (!interest) return [];
  return unique([
    ...interest.categories,
    ...interest.viewedCategories,
    ...interest.orderCategories,
    ...interest.portfolioCategories,
    ...interest.serviceCategories,
  ]);
}

function hiringGoalSkills(goals: string[]): string[] {
  return goals.flatMap((g) => {
    if (g === "design") return ["Figma", "Dizayn", "UI/UX dizayn", "Brendlash"];
    if (g === "engineering") return ["React", "Next.js", "TypeScript", "Python"];
    if (g === "strategy") return ["Strategiya", "GTM strategiyasi", "Kopirayting"];
    return [];
  });
}

/** Score projects for a freelancer based on full interest profile. */
export function recommendProjects(
  projectList: Project[],
  userId?: string,
): ScoredItem<Project>[] {
  const interest = buildUserInterestProfile(userId);
  const savedSlugs = interest?.savedProjectIds ?? new Set<string>();
  const allCategories = interestCategories(interest);
  const repeatClients = new Set(interest?.previousClientSlugs ?? []);

  return projectList
    .map((p) => {
      let score = 0;
      const reasons: string[] = [];

      const skillScore = skillOverlap(interest?.skills ?? [], p.skills) * 40;
      score += skillScore;
      if (skillScore > 10) reasons.push("Ko'nikmalaringizga mos");

      const catScore = categoryOverlap(allCategories, p.category) * 20;
      score += catScore;
      if (catScore > 0) reasons.push("Kategoriyangizga mos");

      if (interest?.appliedCategories.some((c) => textOverlap(c, p.category))) {
        score += 12;
        reasons.push("Arizalar tarixingizga mos");
      }

      if (p.clientSlug && repeatClients.has(p.clientSlug)) {
        score += 15;
        reasons.push("Oldin ishlagan mijoz");
      }

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

/** Score services based on skills, viewed categories, saved items, and completed orders. */
export function recommendServices(
  serviceList: StoredService[],
  userId?: string,
): ScoredItem<StoredService>[] {
  const interest = buildUserInterestProfile(userId);
  const savedIds = interest?.savedServiceIds ?? new Set<string>();
  const allCategories = interestCategories(interest);
  const savedSellerUsernames = interest?.savedFreelancerUsernames ?? new Set<string>();

  return serviceList
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

      const skillScore = skillOverlap(interest?.skills ?? [], [s.category, s.title]) * 25;
      score += skillScore;
      if (skillScore > 8) reasons.push("Ko'nikmalaringizga mos");

      const catScore = categoryOverlap(allCategories, s.category) * 20;
      score += catScore;
      if (catScore > 0 && !reasons.includes("Ko'nikmalaringizga mos")) {
        reasons.push("Qiziqish kategoriyangizga mos");
      }

      if (interest?.hiringGoals?.length) {
        const goalMatch = interest.hiringGoals.some((g) => {
          if (g === "design") return /dizayn|brand|ui/i.test(s.category);
          if (g === "engineering") return /dastur|web|mobil|development/i.test(s.category);
          if (g === "strategy") return /strateg|huquq|marketing/i.test(s.category);
          return false;
        });
        if (goalMatch) {
          score += 25;
          reasons.push("Yollash maqsadlaringizga mos");
        }
      }

      if (savedIds.has(s.id)) {
        score += 10;
        reasons.push("Saqlangan");
      }

      if (savedSellerUsernames.has(s.sellerUsername)) {
        score += 8;
        reasons.push("Saqlangan frilanser");
      }

      if (interest?.orderCategories.some((c) => textOverlap(c, s.category))) {
        score += 12;
        reasons.push("Oldingi buyurtmalaringizga mos");
      }

      score += s.rating * 4;

      return { ...s, recommendScore: Math.round(score), recommendReason: reasons[0] };
    })
    .sort((a, b) => b.recommendScore - a.recommendScore);
}

/** Score freelancers for client hiring. */
export function recommendFreelancers(
  freelancerList: Freelancer[],
  userId?: string,
): ScoredItem<Freelancer>[] {
  const interest = buildUserInterestProfile(userId);
  const savedIds = interest?.savedFreelancerUsernames ?? new Set<string>();
  const allCategories = interestCategories(interest);
  const previousHires = new Set(interest?.previousHireUsernames ?? []);
  const goalSkills = hiringGoalSkills(interest?.hiringGoals ?? []);

  return freelancerList
    .map((f) => {
      let score = 0;
      const reasons: string[] = [];

      const success = computeSuccessScore(f.username);
      score += success.score * 0.25;
      if (success.score >= 75) reasons.push(`${success.score} muvaffaqiyat balli`);

      const response = computeResponseRate(f.username);
      score += response.rate * 0.15;
      if (response.rate >= 80) reasons.push("Tez javob");

      const goalMatch = skillOverlap(goalSkills, f.skills);
      score += goalMatch * 30;
      if (goalMatch > 0.3) reasons.push("Maqsadlaringizga mos");

      const catMatch = categoryOverlap(allCategories, f.title) +
        f.portfolio.reduce((s, p) => s + categoryOverlap(allCategories, p.category), 0) * 0.5;
      score += Math.min(25, catMatch * 12);
      if (catMatch > 0.5 && !reasons.includes("Maqsadlaringizga mos")) {
        reasons.push("Kategoriyangizga mos");
      }

      if (previousHires.has(f.username)) {
        score += 20;
        reasons.push("Oldin yollagan frilanser");
      }

      if (f.available) score += 10;

      if (savedIds.has(f.username)) {
        score += 10;
        reasons.push("Saqlangan");
      }

      score += f.rating * 4;

      return { ...f, recommendScore: Math.round(score), recommendReason: reasons[0] };
    })
    .sort((a, b) => b.recommendScore - a.recommendScore);
}

export function recommendSkillsToLearn(userId?: string, limit = 5): SkillRecommendation[] {
  const interest = buildUserInterestProfile(userId);
  if (!interest || interest.role !== "freelancer") return [];

  const demand = new Map<string, number>();
  for (const p of getPublishedProjects()) {
    for (const skill of p.skills) {
      if (skillOverlap(interest.skills, [skill]) > 0) continue;
      demand.set(skill, (demand.get(skill) ?? 0) + 1);
    }
  }

  return [...demand.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([skill, count]) => ({
      skill,
      demand: count,
      reason: `${count} ta ochiq loyihada talab qilinadi`,
    }));
}

export function recommendProjectTemplates(userId?: string, limit = 3): ProjectTemplateRecommendation[] {
  const interest = buildUserInterestProfile(userId);
  if (!interest || interest.role !== "client") return [];

  const templateScores = new Map<string, { score: number; reason: string }>();

  for (const goal of interest.hiringGoals) {
    for (const id of GOAL_TEMPLATE_MAP[goal] ?? []) {
      const cur = templateScores.get(id) ?? { score: 0, reason: "Yollash maqsadlaringizga mos" };
      cur.score += 20;
      templateScores.set(id, cur);
    }
  }

  for (const cat of interestCategories(interest)) {
    for (const tpl of PROJECT_TEMPLATES) {
      if (textOverlap(cat, tpl.category)) {
        const cur = templateScores.get(tpl.id) ?? { score: 0, reason: "Qiziqish kategoriyangizga mos" };
        cur.score += 15;
        templateScores.set(tpl.id, cur);
      }
    }
  }

  if (interest.industry) {
    for (const tpl of PROJECT_TEMPLATES) {
      if (interest.industry === "Fintex" && tpl.id === "web-app") {
        templateScores.set(tpl.id, { score: 18, reason: `${interest.industry} sohasi uchun mos` });
      }
      if (interest.industry === "Elektron savdo" && (tpl.id === "brand" || tpl.id === "web-app")) {
        const cur = templateScores.get(tpl.id) ?? { score: 0, reason: `${interest.industry} sohasi uchun mos` };
        cur.score += 12;
        templateScores.set(tpl.id, cur);
      }
    }
  }

  return PROJECT_TEMPLATES.map((tpl) => {
    const scored = templateScores.get(tpl.id);
    return {
      ...tpl,
      reason: scored?.reason ?? "Mashhur loyiha shabloni",
      recommendScore: scored?.score ?? 5,
    } as ProjectTemplateRecommendation & { recommendScore: number };
  })
    .sort((a, b) => (b as ProjectTemplateRecommendation & { recommendScore: number }).recommendScore -
      (a as ProjectTemplateRecommendation & { recommendScore: number }).recommendScore)
    .slice(0, limit)
    .map(({ recommendScore: _, ...tpl }) => tpl);
}

export function recommendClientsForFreelancer(userId?: string, limit = 5) {
  const session = getSession();
  const username =
    session && userId && session.user.id === userId
      ? session.user.username
      : getUserProfile(userId ?? "")?.username;
  if (!username) return [];

  const crm = getFreelancerCrmData(username);
  return crm.topPaying.slice(0, limit).map((c) => ({
    ...c,
    recommendReason: c.isRepeat ? "Takroriy mijoz" : "Yuqori to'lovchi mijoz",
  }));
}

export function recommendAgenciesForClient(userId?: string, limit = 3): (Agency & { recommendScore: number; recommendReason: string })[] {
  const interest = buildUserInterestProfile(userId);
  if (!interest || interest.role !== "client") return [];

  const agencies = getPublishedAgencies();
  const ranked = rankAgencies(agencies);

  return ranked
    .map((a) => {
      let score = a.rankingScore * 0.35;
      const reasons: string[] = [];

      const specOverlap = skillOverlap(
        unique([...interest.categories, ...interest.hiringGoals.flatMap((g) => hiringGoalSkills([g]))]),
        a.specializations,
      );
      score += specOverlap * 35;
      if (specOverlap > 0.2) reasons.push("Mutaxassislik mos keladi");

      if (interest.industry && a.description.toLowerCase().includes(interest.industry.toLowerCase())) {
        score += 15;
        reasons.push(`${interest.industry} sohasiga mos`);
      }

      if (interest.hiringGoals.includes("agency")) {
        score += 20;
        reasons.push("Agentlik hamkorligi maqsadiga mos");
      }

      if (a.verificationLevel !== "none") score += 8;

      return {
        ...a,
        recommendScore: Math.round(Math.min(100, score)),
        recommendReason: reasons[0] ?? "Yuqori reyting",
      };
    })
    .sort((a, b) => b.recommendScore - a.recommendScore)
    .slice(0, limit);
}

export function getPersonalizedHomeContent(userId?: string, role?: WorkspaceRole) {
  const interest = buildUserInterestProfile(userId, role);
  if (!interest) {
    return {
      freelancers: getPopularFreelancers(6),
      projects: getPopularProjects(4),
      services: getPopularServices(4),
      personalized: false as const,
    };
  }

  if (interest.role === "freelancer") {
    const allProjects = getPublishedProjects().length ? getPublishedProjects() : projects;
    return {
      freelancers: getPopularFreelancers(6),
      projects: recommendProjects(allProjects, interest.userId).slice(0, 4),
      services: recommendServices(getPublishedServices().length ? getPublishedServices() : (services as StoredService[]), interest.userId).slice(0, 4),
      personalized: true as const,
    };
  }

  return {
    freelancers: recommendFreelancers(freelancers, interest.userId).slice(0, 6),
    projects: getPopularProjects(4),
    services: recommendServices(getPublishedServices().length ? getPublishedServices() : (services as StoredService[]), interest.userId).slice(0, 4),
    personalized: true as const,
  };
}

export function applyPersonalizedProjectOrder(items: Project[], userId?: string): Project[] {
  if (!userId) return items;
  const scored = recommendProjects(items, userId);
  const order = new Map(scored.map((p, i) => [p.id, i]));
  return [...items].sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
}

export function applyPersonalizedFreelancerOrder(items: Freelancer[], userId?: string): Freelancer[] {
  if (!userId) return items;
  const scored = recommendFreelancers(items, userId);
  const order = new Map(scored.map((f, i) => [f.id, i]));
  return [...items].sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
}

export function applyPersonalizedServiceOrder(items: StoredService[], userId?: string): StoredService[] {
  if (!userId) return items;
  const scored = recommendServices(items, userId);
  const order = new Map(scored.map((s, i) => [s.id, i]));
  return [...items].sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
}
