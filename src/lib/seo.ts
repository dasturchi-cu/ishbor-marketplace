/** Shared SEO helpers — canonical URLs, Open Graph, JSON-LD. */

export const SITE_URL = "https://ishbor.uz";
export const SITE_NAME = "Ishbor";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/favicon.svg`;

export type PageMetaOptions = {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  type?: string;
  noindex?: boolean;
};

export function buildPageMeta(options: PageMetaOptions) {
  const canonical = options.path ? `${SITE_URL}${options.path}` : undefined;
  const image = options.image ?? DEFAULT_OG_IMAGE;

  const meta: Array<Record<string, string>> = [
    { title: options.title },
    ...(options.description
      ? [{ name: "description", content: options.description }]
      : []),
    { property: "og:title", content: options.title },
    ...(options.description
      ? [{ property: "og:description", content: options.description }]
      : []),
    { property: "og:type", content: options.type ?? "website" },
    { property: "og:site_name", content: SITE_NAME },
    ...(canonical ? [{ property: "og:url", content: canonical }] : []),
    { property: "og:image", content: image },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: options.title },
    ...(options.description
      ? [{ name: "twitter:description", content: options.description }]
      : []),
    { name: "twitter:image", content: image },
    ...(options.noindex
      ? [{ name: "robots", content: "noindex, nofollow" }]
      : []),
  ];

  const links = canonical && !options.noindex
    ? [{ rel: "canonical", href: canonical }]
    : [];

  return { meta, links };
}

export function buildJsonLdHead(data: Record<string, unknown> | Record<string, unknown>[]) {
  const payload = Array.isArray(data) ? data : [data];
  return {
    scripts: payload.map((item) => ({
      type: "application/ld+json",
      children: JSON.stringify(item),
    })),
  };
}

export function buildBreadcrumbJsonLd(
  items: Array<{ name: string; path?: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.path ? { item: `${SITE_URL}${item.path}` } : {}),
    })),
  };
}

export function buildServiceJsonLd(service: {
  title: string;
  description?: string;
  slug: string;
  seller: string;
  price: number;
  rating?: number;
  reviewCount?: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.description,
    url: `${SITE_URL}/services/${service.slug}`,
    provider: { "@type": "Person", name: service.seller },
    offers: {
      "@type": "Offer",
      price: service.price,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    ...(service.rating && service.reviewCount
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: service.rating,
            reviewCount: service.reviewCount,
          },
        }
      : {}),
  };
}

export function buildPersonJsonLd(profile: {
  name: string;
  username: string;
  title?: string;
  rating?: number;
  reviewCount?: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    url: `${SITE_URL}/freelancers/${profile.username}`,
    jobTitle: profile.title,
    ...(profile.rating && profile.reviewCount
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: profile.rating,
            reviewCount: profile.reviewCount,
          },
        }
      : {}),
  };
}

export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "uz",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: DEFAULT_OG_IMAGE,
    sameAs: [SITE_URL],
    areaServed: ["UZ", "KZ", "KG", "TJ"],
  };
}

export function buildCreativeWorkJsonLd(item: {
  title: string;
  slug: string;
  description?: string;
  creator?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: item.title,
    description: item.description,
    url: `${SITE_URL}/portfolio/${item.slug}`,
    ...(item.creator ? { creator: { "@type": "Person", name: item.creator } } : {}),
  };
}

export function buildJobPostingJsonLd(project: {
  title: string;
  description?: string;
  slug: string;
  budget?: string;
  category?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: project.title,
    description: project.description,
    url: `${SITE_URL}/projects/${project.slug}`,
    hiringOrganization: {
      "@type": "Organization",
      name: SITE_NAME,
      sameAs: SITE_URL,
    },
    ...(project.budget
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: "USD",
            value: { "@type": "QuantitativeValue", value: project.budget },
          },
        }
      : {}),
    jobLocation: {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressCountry: "UZ" },
    },
  };
}

export const PRIVATE_ROUTE_META = buildPageMeta({
  title: "Ishbor",
  noindex: true,
});
