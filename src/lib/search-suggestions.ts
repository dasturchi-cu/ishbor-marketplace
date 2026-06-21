import { getAllAnalyticsEvents } from "./analytics-events-store";
import { getStoredServices } from "./services-store";
import { getPublishedProjects } from "./projects-store";
import { freelancers } from "./mock-data";

export type SearchSuggestion = {
  label: string;
  query: string;
  type?: "services" | "freelancers" | "projects" | "all";
};

export const POPULAR_SEARCHES: SearchSuggestion[] = [
  { label: "Figma dizayn", query: "Figma", type: "services" },
  { label: "Next.js", query: "Next.js", type: "freelancers" },
  { label: "Mobil ilova", query: "mobil", type: "projects" },
  { label: "Brending", query: "brend", type: "services" },
  { label: "Fintech", query: "fintech", type: "projects" },
  { label: "UI/UX", query: "dizayn", type: "freelancers" },
];

export const SEARCH_TIPS = [
  "Ko'nikma nomi bilan qidiring — masalan, React, Swift, Figma",
  "Shahar yoki mintaqa qo'shing — masalan, Tashkent",
  "Kategoriya bo'yicha filtrlash tezroq natija beradi",
  "Imlo xatosi bo'lsa ham qidiruv mos natijalarni topadi",
];

/** Analytics + katalogdan dinamik tavsiyalar — statik ro'yxat o'rniga yoki qo'shimcha. */
export function getDynamicSearchSuggestions(limit = 6): SearchSuggestion[] {
  if (typeof window === "undefined") return POPULAR_SEARCHES.slice(0, limit);

  const suggestions: SearchSuggestion[] = [];
  const seen = new Set<string>();

  const push = (label: string, query: string, type?: SearchSuggestion["type"]) => {
    const key = query.toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    suggestions.push({ label, query, type });
  };

  for (const e of getAllAnalyticsEvents()) {
    if (e.type !== "search_query" || !e.entityId) continue;
    push(e.entityId, e.entityId, (e.meta?.type as SearchSuggestion["type"]) ?? "all");
  }

  for (const s of getStoredServices().filter((x) => x.status === "published").slice(0, 8)) {
    push(s.title.slice(0, 32), s.title.split(" ")[0] ?? s.title, "services");
  }

  for (const p of getPublishedProjects().slice(0, 6)) {
    push(p.title.slice(0, 32), p.title.split(" ")[0] ?? p.title, "projects");
  }

  for (const f of freelancers.slice(0, 4)) {
    for (const skill of f.skills.slice(0, 2)) {
      push(skill, skill, "freelancers");
    }
  }

  if (suggestions.length >= 3) return suggestions.slice(0, limit);
  return [...suggestions, ...POPULAR_SEARCHES.filter((p) => !seen.has(p.query.toLowerCase()))].slice(0, limit);
}
