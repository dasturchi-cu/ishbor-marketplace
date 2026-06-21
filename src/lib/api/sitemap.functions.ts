import { createServerFn } from "@tanstack/react-start";

import { buildSitemapXml } from "../sitemap-generator";

/** Dynamic sitemap for crawlers — mock catalog + static pages. */
export const getSitemapXml = createServerFn({ method: "GET" }).handler(async () => {
  return {
    contentType: "application/xml",
    body: buildSitemapXml(),
  };
});
