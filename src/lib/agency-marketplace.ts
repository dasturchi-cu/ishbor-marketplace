import type { Agency, AgencySearchParams, AgencySortOption } from "./agency-types";
import { rankAgencies } from "./agency-ranking-store";

export const agencySortLabels: Record<AgencySortOption, string> = {
  ranking: "Reyting balli",
  rating: "Eng yuqori baho",
  trust: "Ishonch balli",
  success: "Muvaffaqiyat balli",
  team_size: "Jamoa hajmi",
  newest: "Eng yangi",
};

export function normalizeAgencySearch(search: Record<string, unknown>): AgencySearchParams {
  return {
    q: typeof search.q === "string" ? search.q : "",
    sort: (typeof search.sort === "string" ? search.sort : "ranking") as AgencySortOption,
    filter: typeof search.filter === "string" ? search.filter : "",
    country: typeof search.country === "string" ? search.country : "",
    minTeam: typeof search.minTeam === "string" ? search.minTeam : "",
  };
}

function matchesQuery(text: string, q: string) {
  if (!q.trim()) return true;
  return text.toLowerCase().includes(q.trim().toLowerCase());
}

export function filterAgencies(agencies: Agency[], search: AgencySearchParams): Agency[] {
  let result = [...agencies];
  const q = search.q ?? "";
  const filter = search.filter ?? "";
  const country = search.country ?? "";
  const minTeam = parseInt(search.minTeam ?? "0", 10) || 0;

  if (q) {
    result = result.filter(
      (a) =>
        matchesQuery(a.name, q) ||
        matchesQuery(a.description, q) ||
        matchesQuery(a.location, q) ||
        a.specializations.some((s) => matchesQuery(s, q)),
    );
  }

  if (country) {
    result = result.filter((a) => a.location.toLowerCase().includes(country.toLowerCase()));
  }

  if (minTeam > 0) {
    result = result.filter(
      (a) => a.members.filter((m) => m.status === "active").length >= minTeam,
    );
  }

  if (filter === "verified") {
    result = result.filter((a) => a.verificationLevel !== "none");
  } else if (filter === "premium") {
    result = result.filter((a) => a.verificationLevel === "premium" || a.verificationLevel === "enterprise");
  } else if (filter === "enterprise") {
    result = result.filter((a) => a.verificationLevel === "enterprise");
  }

  return sortAgencies(result, search.sort ?? "ranking");
}

export function sortAgencies(agencies: Agency[], sort: AgencySortOption): Agency[] {
  const ranked = rankAgencies(agencies);

  switch (sort) {
    case "rating":
      return ranked.sort((a, b) => b.metrics.rating - a.metrics.rating).map(stripRanking);
    case "trust":
      return ranked.sort((a, b) => b.metrics.trustScore - a.metrics.trustScore).map(stripRanking);
    case "success":
      return ranked.sort((a, b) => b.metrics.successScore - a.metrics.successScore).map(stripRanking);
    case "team_size":
      return ranked
        .sort(
          (a, b) =>
            b.members.filter((m) => m.status === "active").length -
            a.members.filter((m) => m.status === "active").length,
        )
        .map(stripRanking);
    case "newest":
      return ranked
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map(stripRanking);
    case "ranking":
    default:
      return ranked.map(stripRanking);
  }
}

function stripRanking(a: Agency & { rankingScore?: number; metrics?: unknown }): Agency {
  const { rankingScore: _, metrics: __, ...rest } = a as Agency & { rankingScore: number; metrics: unknown };
  return rest;
}

export function getRankedAgencies(agencies: Agency[]) {
  return rankAgencies(agencies);
}
