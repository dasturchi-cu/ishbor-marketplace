import type { Freelancer, Project, Service } from "./mock-data";
import type { StoredService } from "./services-store";
import { isFeaturedActive } from "./featured-store";
import { computeFreelancerReputation } from "./reputation-store";
import { computeSuccessScore, computeResponseRate, getFreelancerLevel } from "./growth-metrics";
import { getAverageRating } from "./reviews-store";
import { rankFreelancers, rankServices, rankProjects } from "./ranking-store";
import { combineSearchScore } from "./marketplace-signals";
import { matchesQuery, textMatchScore } from "./search-match";
import { recordAnalyticsEvent } from "./analytics-events-store";

export type SortOption =
  | "newest"
  | "rating"
  | "popular"
  | "price_asc"
  | "price_desc"
  | "trust_score"
  | "success_score"
  | "response_rate"
  | "ranking_score";

export const sortLabels: Record<SortOption, string> = {
  newest: "Eng yangi",
  rating: "Eng yuqori baho",
  popular: "Eng mashhur",
  price_asc: "Eng arzon narx",
  price_desc: "Eng qimmat narx",
  trust_score: "Ishonch balli",
  success_score: "Muvaffaqiyat balli",
  response_rate: "Javob tezligi",
  ranking_score: "Reyting balli",
};

export type MarketplaceSearch = {
  q?: string;
  category?: string;
  sort?: SortOption;
  filter?: string;
};

export function normalizeSearch<T extends MarketplaceSearch>(search: Record<string, unknown>): T {
  return {
    q: typeof search.q === "string" ? search.q : "",
    category: typeof search.category === "string" ? search.category : "",
    sort: (typeof search.sort === "string" ? search.sort : "ranking_score") as SortOption,
    filter: typeof search.filter === "string" ? search.filter : "",
  } as T;
}

type SearchDestination = "/services" | "/freelancers" | "/projects";

const SERVICE_KEYWORDS = [
  "dizayn",
  "design",
  "dasturlash",
  "web",
  "ios",
  "logo",
  "brend",
  "xizmat",
  "api",
  "figma",
  "mobil",
  "marketing",
];
const PROJECT_KEYWORDS = ["loyiha", "project", "shartnoma", "ish topish", "freelance"];

/** Route nav/hero search to the most relevant marketplace tab. */
export function pickSearchRoute(q: string): { to: SearchDestination; search: MarketplaceSearch } {
  const trimmed = q.trim();
  const base: MarketplaceSearch = { sort: "ranking_score", category: "", filter: "" };
  if (!trimmed) return { to: "/projects", search: { ...base, q: "" } };

  const lower = trimmed.toLowerCase();
  if (PROJECT_KEYWORDS.some((k) => lower.includes(k))) {
    return { to: "/projects", search: { ...base, q: trimmed } };
  }
  if (SERVICE_KEYWORDS.some((k) => lower.includes(k))) {
    return { to: "/services", search: { ...base, q: trimmed } };
  }
  return { to: "/freelancers", search: { ...base, q: trimmed } };
}

/** Record search query for analytics and future suggestions. */
export function recordSearchQuery(query: string, resultCount: number, type?: string): void {
  const trimmed = query.trim();
  if (!trimmed) return;
  recordAnalyticsEvent({
    type: "search_query",
    entityId: trimmed,
    value: resultCount,
    meta: type ? { type } : undefined,
  });
}

function applyHybridRelevance<T extends { rankingScore?: number }>(
  items: T[],
  q: string,
  getText: (item: T) => string,
): T[] {
  if (!q.trim()) return items;
  return [...items].sort((a, b) => {
    const sa = combineSearchScore(textMatchScore(getText(a), q), a.rankingScore ?? 0);
    const sb = combineSearchScore(textMatchScore(getText(b), q), b.rankingScore ?? 0);
    if (sb !== sa) return sb - sa;
    return (b.rankingScore ?? 0) - (a.rankingScore ?? 0);
  });
}

export function filterServices(items: StoredService[], search: MarketplaceSearch): StoredService[] {
  let result = [...items];
  const q = search.q ?? "";
  const category = search.category ?? "";
  const filter = search.filter ?? "";

  if (q) {
    result = result.filter(
      (s) =>
        matchesQuery(s.title, q) ||
        matchesQuery(s.seller, q) ||
        matchesQuery(s.sellerUsername ?? "", q) ||
        matchesQuery(s.category, q) ||
        (s.description ? matchesQuery(s.description, q) : false),
    );
  }
  if (category) {
    result = result.filter((s) =>
      s.category.toLowerCase().includes(category.toLowerCase()) ||
      category === "design" && /design|brand/i.test(s.category) ||
      category === "development" && /development|web/i.test(s.category) ||
      category === "marketing" && /strategy|growth/i.test(s.category) ||
      category === "video" && /3d|motion/i.test(s.category) ||
      category === "consulting" && /legal|strategy/i.test(s.category),
    );
  }
  if (filter === "top-rated") {
    result = result.filter((s) => s.rating >= 4.95);
  }

  const sorted = sortServices(result, search.sort ?? "ranking_score");
  if (q.trim()) {
    const ranked = rankServices(sorted);
    return applyHybridRelevance(ranked, q, (s) =>
      `${s.title} ${s.seller} ${s.sellerUsername ?? ""} ${s.category} ${s.description ?? ""}`,
    ).map(({ rankingScore: _, ...s }) => s);
  }
  return sorted;
}

export function sortServices(items: StoredService[], sort: SortOption): StoredService[] {
  const sorted = [...items];
  const withFeatured = sorted.sort((a, b) => {
    const af = isFeaturedActive(a.featured, a.featuredUntil) ? 1 : 0;
    const bf = isFeaturedActive(b.featured, b.featuredUntil) ? 1 : 0;
    return bf - af;
  });
  switch (sort) {
    case "ranking_score":
      return rankServices(withFeatured).map(({ rankingScore: _, ...s }) => s);
    case "rating":
      return withFeatured.sort((a, b) => b.rating - a.rating);
    case "trust_score":
      return withFeatured.sort(
        (a, b) =>
          computeFreelancerReputation(b.sellerUsername).trustScore -
          computeFreelancerReputation(a.sellerUsername).trustScore,
      );
    case "success_score":
      return withFeatured.sort((a, b) => {
        const sa = computeSuccessScore(a.sellerUsername).score;
        const sb = computeSuccessScore(b.sellerUsername).score;
        return sb - sa;
      });
    case "response_rate":
      return withFeatured.sort((a, b) => {
        const ra = computeResponseRate(a.sellerUsername).rate;
        const rb = computeResponseRate(b.sellerUsername).rate;
        return rb - ra;
      });
    case "popular":
      return withFeatured.sort((a, b) => b.reviews - a.reviews);
    case "price_asc":
      return withFeatured.sort((a, b) => a.price - b.price);
    case "price_desc":
      return withFeatured.sort((a, b) => b.price - a.price);
    case "newest":
      return withFeatured.sort((a, b) => {
        const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bt - at;
      });
    default:
      return rankServices(withFeatured).map(({ rankingScore: _, ...s }) => s);
  }
}

export function filterFreelancers(items: Freelancer[], search: MarketplaceSearch): Freelancer[] {
  let result = [...items];
  const q = search.q ?? "";
  const filter = search.filter ?? "";

  if (q) {
    result = result.filter(
      (f) =>
        matchesQuery(f.name, q) ||
        matchesQuery(f.title, q) ||
        matchesQuery(f.city, q) ||
        f.skills.some((s) => matchesQuery(s, q)),
    );
  }
  if (filter === "top-rated") {
    result = result.filter((f) => getFreelancerLevel(f.username) === "Top Rated");
  } else if (filter === "available") {
    result = result.filter((f) => f.available);
  } else if (filter === "under-50") {
    result = result.filter((f) => f.rate < 50);
  } else if (filter === "tashkent") {
    result = result.filter((f) => f.city === "Tashkent");
  } else if (filter === "verified") {
    result = result.filter((f) => f.identityVerified);
  } else if (filter === "trust") {
    result = result.filter((f) => computeFreelancerReputation(f.username).trustScore >= 70);
  }

  const sorted = sortFreelancers(result, search.sort ?? "ranking_score");
  if (q.trim()) {
    const ranked = rankFreelancers(sorted);
    return applyHybridRelevance(ranked, q, (f) =>
      `${f.name} ${f.title} ${f.username} ${f.skills.join(" ")} ${f.city}`,
    ).map(({ rankingScore: _, ...f }) => f);
  }
  return sorted;
}

export function sortFreelancers(items: Freelancer[], sort: SortOption): Freelancer[] {
  if (sort === "ranking_score") {
    return rankFreelancers(items).map(({ rankingScore: _, ...f }) => f);
  }
  const sorted = [...items];
  switch (sort) {
    case "rating":
      return sorted.sort((a, b) => {
        const ra = getAverageRating(a.username);
        const rb = getAverageRating(b.username);
        const avga = ra.count > 0 ? ra.avg : a.rating;
        const avgb = rb.count > 0 ? rb.avg : b.rating;
        return avgb - avga;
      });
    case "trust_score":
      return sorted.sort((a, b) =>
        computeFreelancerReputation(b.username).trustScore - computeFreelancerReputation(a.username).trustScore,
      );
    case "success_score":
      return sorted.sort((a, b) => computeSuccessScore(b.username).score - computeSuccessScore(a.username).score);
    case "response_rate":
      return sorted.sort((a, b) => computeResponseRate(b.username).rate - computeResponseRate(a.username).rate);
    case "popular":
      return sorted.sort((a, b) => b.reviews - a.reviews);
    case "price_asc":
      return sorted.sort((a, b) => a.rate - b.rate);
    case "price_desc":
      return sorted.sort((a, b) => b.rate - a.rate);
    default:
      return sorted;
  }
}

const postedOrder: Record<string, number> = {
  "4 soat oldin": 1,
  "8 soat oldin": 2,
  "1 kun oldin": 3,
  "2 kun oldin": 4,
  "3 kun oldin": 5,
};

export function filterProjects(items: Project[], search: MarketplaceSearch): Project[] {
  let result = [...items];
  const q = search.q ?? "";
  const category = search.category ?? "";

  if (q) {
    result = result.filter(
      (p) =>
        matchesQuery(p.title, q) ||
        matchesQuery(p.client, q) ||
        matchesQuery(p.category, q) ||
        p.skills.some((s) => matchesQuery(s, q)),
    );
  }
  if (category) {
    result = result.filter((p) =>
      p.category.toLowerCase().includes(category.toLowerCase()) ||
      category === "design" && /design/i.test(p.category) ||
      category === "development" && /development|mobile/i.test(p.category),
    );
  }

  const sorted = sortProjects(result, search.sort ?? "ranking_score");
  if (q.trim()) {
    const ranked = rankProjects(sorted);
    return applyHybridRelevance(ranked, q, (p) =>
      `${p.title} ${p.client} ${p.category} ${p.skills.join(" ")}`,
    ).map(({ rankingScore: _, ...p }) => p);
  }
  return sorted;
}

export function sortProjects(items: Project[], sort: SortOption): Project[] {
  const sorted = [...items];
  const withFeatured = sorted.sort((a, b) => {
    const af = isFeaturedActive(a.featured, a.featuredUntil) ? 1 : 0;
    const bf = isFeaturedActive(b.featured, b.featuredUntil) ? 1 : 0;
    return bf - af;
  });
  switch (sort) {
    case "ranking_score":
      return rankProjects(withFeatured).map(({ rankingScore: _, ...p }) => p);
    case "rating":
      return withFeatured.sort((a, b) => b.clientSpent - a.clientSpent);
    case "popular":
      return withFeatured.sort((a, b) => b.proposals - a.proposals);
    case "price_asc":
      return withFeatured.sort((a, b) => a.budget - b.budget);
    case "price_desc":
      return withFeatured.sort((a, b) => b.budget - a.budget);
    case "newest":
      return withFeatured.sort((a, b) => {
        const at = a.createdAt ? new Date(a.createdAt).getTime() : (postedOrder[a.postedAgo] ?? 99);
        const bt = b.createdAt ? new Date(b.createdAt).getTime() : (postedOrder[b.postedAgo] ?? 99);
        if (typeof at === "number" && typeof bt === "number" && !a.createdAt) {
          return (at as number) - (bt as number);
        }
        return (bt as number) - (at as number);
      });
    default:
      return rankProjects(withFeatured).map(({ rankingScore: _, ...p }) => p);
  }
}
