import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildSitemapEntries, buildSitemapXml } from "../src/lib/sitemap-generator";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

writeFileSync(join(root, "public", "sitemap.xml"), buildSitemapXml(), "utf8");
console.log(`Sitemap generated: ${buildSitemapEntries().length} URLs`);
