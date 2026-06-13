import type { Freelancer, Project, Service } from "./mock-data";

export type SortOption =
  | "newest"
  | "rating"
  | "popular"
  | "price_asc"
  | "price_desc";

export const sortLabels: Record<SortOption, string> = {
  newest: "Newest",
  rating: "Highest rated",
  popular: "Most popular",
  price_asc: "Lowest price",
  price_desc: "Highest price",
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
    sort: (typeof search.sort === "string" ? search.sort : "newest") as SortOption,
    filter: typeof search.filter === "string" ? search.filter : "",
  } as T;
}

function matchesQuery(text: string, q: string) {
  if (!q.trim()) return true;
  return text.toLowerCase().includes(q.trim().toLowerCase());
}

export function filterServices(items: Service[], search: MarketplaceSearch): Service[] {
  let result = [...items];
  const q = search.q ?? "";
  const category = search.category ?? "";
  const filter = search.filter ?? "";

  if (q) {
    result = result.filter(
      (s) =>
        matchesQuery(s.title, q) ||
        matchesQuery(s.seller, q) ||
        matchesQuery(s.category, q),
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

  return sortServices(result, search.sort ?? "newest");
}

export function sortServices(items: Service[], sort: SortOption): Service[] {
  const sorted = [...items];
  switch (sort) {
    case "rating":
      return sorted.sort((a, b) => b.rating - a.rating);
    case "popular":
      return sorted.sort((a, b) => b.reviews - a.reviews);
    case "price_asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price_desc":
      return sorted.sort((a, b) => b.price - a.price);
    default:
      return sorted;
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
    result = result.filter((f) => f.level === "Top Rated" || f.rating >= 4.95);
  } else if (filter === "available") {
    result = result.filter((f) => f.available);
  } else if (filter === "under-50") {
    result = result.filter((f) => f.rate < 50);
  } else if (filter === "tashkent") {
    result = result.filter((f) => f.city === "Tashkent");
  } else if (filter === "verified") {
    result = result.filter((f) => f.identityVerified);
  }

  return sortFreelancers(result, search.sort ?? "newest");
}

export function sortFreelancers(items: Freelancer[], sort: SortOption): Freelancer[] {
  const sorted = [...items];
  switch (sort) {
    case "rating":
      return sorted.sort((a, b) => b.rating - a.rating);
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
  "4h ago": 1,
  "8h ago": 2,
  "1d ago": 3,
  "2d ago": 4,
  "3d ago": 5,
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

  return sortProjects(result, search.sort ?? "newest");
}

export function sortProjects(items: Project[], sort: SortOption): Project[] {
  const sorted = [...items];
  switch (sort) {
    case "rating":
      return sorted.sort((a, b) => b.clientSpent - a.clientSpent);
    case "popular":
      return sorted.sort((a, b) => b.proposals - a.proposals);
    case "price_asc":
      return sorted.sort((a, b) => a.budget - b.budget);
    case "price_desc":
      return sorted.sort((a, b) => b.budget - a.budget);
    default:
      return sorted.sort(
        (a, b) => (postedOrder[a.postedAgo] ?? 99) - (postedOrder[b.postedAgo] ?? 99),
      );
  }
}
