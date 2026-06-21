import { describe, expect, it } from "vitest";

import { filterFreelancers, filterServices, normalizeSearch, pickSearchRoute } from "./marketplace";
import { matchesQuery } from "./search-match";
import { freelancers, services } from "./mock-data";

describe("marketplace search", () => {
  it("normalizes search params", () => {
    expect(normalizeSearch({ q: "figma", sort: "rating" })).toEqual({
      q: "figma",
      category: "",
      sort: "rating",
      filter: "",
    });
  });

  it("routes service keywords to services tab", () => {
    expect(pickSearchRoute("figma dizayn").to).toBe("/services");
  });

  it("filters freelancers by query", () => {
    const params = normalizeSearch({ q: "Nargiza" });
    const results = filterFreelancers(freelancers, params);
    expect(results.length).toBeGreaterThan(0);
  });

  it("filters services by query", () => {
    const title = services[0]?.title ?? "dizayn";
    const params = normalizeSearch({ q: title.slice(0, 4) });
    const results = filterServices(
      services.map((s) => ({ ...s, status: "published" as const, createdAt: new Date().toISOString() })),
      params,
    );
    expect(results.length).toBeGreaterThan(0);
  });

  it("matches queries with typo tolerance", () => {
    expect(matchesQuery("dizayn", "dizyn")).toBe(true);
    expect(matchesQuery("development", "developmnt")).toBe(true);
  });
});
