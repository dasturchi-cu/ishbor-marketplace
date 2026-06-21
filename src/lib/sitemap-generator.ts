import { categories, freelancers, projects, services } from "./mock-data";
import { mockPortfolioItems } from "./portfolio-mock-data";
import { SITE_URL } from "./seo";

export type SitemapEntry = {
  loc: string;
  changefreq: "daily" | "weekly" | "monthly" | "yearly";
  priority: number;
  lastmod?: string;
};

const STATIC_PAGES: SitemapEntry[] = [
  { loc: "/", changefreq: "daily", priority: 1.0 },
  { loc: "/services", changefreq: "daily", priority: 0.9 },
  { loc: "/projects", changefreq: "daily", priority: 0.9 },
  { loc: "/freelancers", changefreq: "daily", priority: 0.9 },
  { loc: "/search", changefreq: "daily", priority: 0.8 },
  { loc: "/agencies", changefreq: "weekly", priority: 0.8 },
  { loc: "/pricing", changefreq: "monthly", priority: 0.8 },
  { loc: "/help", changefreq: "monthly", priority: 0.6 },
  { loc: "/terms", changefreq: "yearly", priority: 0.4 },
  { loc: "/privacy", changefreq: "yearly", priority: 0.4 },
  { loc: "/status", changefreq: "daily", priority: 0.5 },
  { loc: "/register", changefreq: "monthly", priority: 0.7 },
];

const REGIONS = ["toshkent", "samarqand", "buxoro", "almaty"];

const AGENCY_SLUGS = ["ishbor-studio"];

export function buildSitemapEntries(): SitemapEntry[] {
  const today = new Date().toISOString().slice(0, 10);
  const entries: SitemapEntry[] = STATIC_PAGES.map((e) => ({ ...e, lastmod: today }));

  for (const region of REGIONS) {
    entries.push({
      loc: `/freelancers/region/${region}`,
      changefreq: "weekly",
      priority: 0.75,
      lastmod: today,
    });
  }

  for (const cat of categories) {
    entries.push({
      loc: `/services/category/${cat.slug}`,
      changefreq: "weekly",
      priority: 0.7,
      lastmod: today,
    });
  }

  for (const s of services) {
    entries.push({
      loc: `/services/${s.slug}`,
      changefreq: "weekly",
      priority: 0.65,
      lastmod: today,
    });
  }

  for (const p of projects) {
    entries.push({
      loc: `/projects/${p.slug}`,
      changefreq: "weekly",
      priority: 0.65,
      lastmod: today,
    });
  }

  for (const f of freelancers) {
    entries.push({
      loc: `/freelancers/${f.username}`,
      changefreq: "weekly",
      priority: 0.7,
      lastmod: today,
    });
  }

  for (const item of mockPortfolioItems.filter((p) => p.status === "published")) {
    entries.push({
      loc: `/portfolio/${item.slug}`,
      changefreq: "weekly",
      priority: 0.6,
      lastmod: item.updatedAt?.slice(0, 10) ?? today,
    });
  }

  for (const slug of AGENCY_SLUGS) {
    entries.push({
      loc: `/agencies/${slug}`,
      changefreq: "weekly",
      priority: 0.65,
      lastmod: today,
    });
  }

  return entries;
}

export function buildSitemapXml(entries = buildSitemapEntries()): string {
  const urls = entries
    .map((e) => {
      const lastmod = e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : "";
      return `  <url><loc>${SITE_URL}${e.loc}</loc>${lastmod}<changefreq>${e.changefreq}</changefreq><priority>${e.priority.toFixed(2)}</priority></url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
