import { freelancers } from "./mock-data";
import type { PortfolioItem } from "./portfolio-types";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

const sampleDescriptions: Record<string, string> = {
  Branding: "Complete brand identity system including logo, typography, color palette, and brand guidelines delivered for a regional fintech launch.",
  "Mobile Design": "End-to-end mobile app design from research through high-fidelity prototypes, tested with 40+ users across two markets.",
  Fintech: "Payment gateway architecture handling 2M+ daily transactions with sub-100ms latency and PCI-DSS compliance.",
  Strategy: "Go-to-market strategy and growth playbook for a Series A startup entering three new CIS markets.",
  Motion: "Cinematic motion design and 3D visualization for a documentary series premiere.",
  Heritage: "Heritage site restoration documentation combining traditional craft with modern sustainable materials.",
};

const sampleTech = ["Figma", "React", "TypeScript", "PostgreSQL", "Next.js", "Tailwind CSS", "Node.js", "AWS"];

function buildMockItem(
  f: (typeof freelancers)[number],
  p: { title: string; category: string; hue: number; year: number },
  idx: number,
): PortfolioItem {
  const slug = `${slugify(p.title)}-${f.username}`;
  const desc = sampleDescriptions[p.category] ?? `Professional ${p.category.toLowerCase()} project delivered for a leading Central Asian brand.`;
  return {
    id: `pf-${f.id}-${idx}`,
    slug,
    title: p.title,
    category: p.category,
    description: desc,
    objectives: `Deliver a world-class ${p.category.toLowerCase()} solution that increases user engagement and brand trust across the ${f.city} market.`,
    challenges: "Tight timeline, multi-stakeholder approvals, and legacy system integration required careful planning and iterative delivery.",
    solutions: "Agile sprints with weekly client reviews, design system foundation, and automated testing pipeline ensured on-time delivery.",
    skills: f.skills.slice(0, 4),
    technologies: sampleTech.slice(0, 3 + (idx % 4)),
    clientName: idx % 2 === 0 ? "Confidential Client" : undefined,
    duration: `${2 + (idx % 4)} months`,
    teamSize: idx % 3 === 0 ? "Solo" : `${2 + (idx % 3)} people`,
    budgetRange: `$${(5 + idx * 3) * 1000} – $${(8 + idx * 4) * 1000}`,
    completionDate: `${p.year}-${String(6 + (idx % 6)).padStart(2, "0")}-15`,
    coverImage: "",
    galleryImages: [],
    videoUrl: idx === 0 ? "https://www.youtube.com/watch?v=dQw4w9WgXcQ" : undefined,
    links: {
      github: p.category.includes("Fintech") || p.category.includes("Mobile") ? `https://github.com/${f.username}/${slugify(p.title)}` : undefined,
      behance: p.category.includes("Brand") || p.category.includes("Design") ? `https://behance.net/${f.username}` : undefined,
      liveDemo: idx % 2 === 0 ? `https://demo.ishbor.uz/${slug}` : undefined,
      figma: p.category.includes("Design") ? `https://figma.com/file/${slug}` : undefined,
    },
    caseStudy: {
      clientProblem: `The client needed a modern ${p.category.toLowerCase()} solution to compete in the rapidly growing Central Asian digital economy.`,
      research: "Conducted user interviews with 25 stakeholders, competitive analysis of 8 regional products, and market sizing across Uzbekistan and Kazakhstan.",
      strategy: "Phased rollout starting with MVP validation, followed by full feature set and localization for three languages.",
      designProcess: "Discovery workshops → wireframes → interactive prototypes → usability testing → final UI with design system documentation.",
      developmentProcess: "Two-week sprints, CI/CD pipeline, code review standards, and staging environment for client UAT before production launch.",
      finalResult: `Delivered on time with measurable impact: +${35 + idx * 5}% engagement, ${90 + idx}% client satisfaction score.`,
      lessonsLearned: "Early stakeholder alignment and weekly demos prevented scope creep. Investing in a shared design system accelerated later phases significantly.",
    },
    metrics: [
      { label: "Engagement lift", value: `+${35 + idx * 5}%` },
      { label: "Delivery time", value: `${2 + (idx % 4)} mo` },
      { label: "Client satisfaction", value: `${90 + idx}%` },
    ],
    outcomes: `Project completed successfully with strong ROI. Client renewed for a follow-up engagement within ${3 + idx} months.`,
    hue: p.hue,
    ownerUserId: f.id,
    freelancerUsername: f.username,
    freelancerName: f.name,
    freelancerHue: f.hue,
    status: "published",
    adminStatus: "approved",
    featured: idx === 0,
    createdAt: `${p.year}-01-01T00:00:00.000Z`,
    updatedAt: `${p.year}-06-15T00:00:00.000Z`,
  };
}

export const mockPortfolioItems: PortfolioItem[] = freelancers.flatMap((f) =>
  f.portfolio.map((p, idx) => buildMockItem(f, p, idx)),
);
