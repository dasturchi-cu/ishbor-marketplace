/** Rule-based project generator from client idea + budget + timeline */

const SKILL_MAP: Record<string, string[]> = {
  dizayn: ["Figma", "UI/UX", "Brand Identity", "Prototyping"],
  design: ["Figma", "UI/UX", "Brand Identity", "Prototyping"],
  veb: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
  web: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
  mobil: ["React Native", "Flutter", "iOS", "Android"],
  mobile: ["React Native", "Flutter", "iOS", "Android"],
  marketing: ["SEO", "Content Strategy", "Social Media", "Analytics"],
  video: ["After Effects", "Premiere Pro", "Motion Graphics"],
  maqola: ["Copywriting", "Content Writing", "SEO"],
  dastur: ["Node.js", "Python", "PostgreSQL", "API Design"],
  ilova: ["React Native", "Flutter", "Firebase"],
  brend: ["Brand Strategy", "Logo Design", "Visual Identity"],
  logo: ["Logo Design", "Illustrator", "Brand Identity"],
};

const CATEGORY_MAP: Record<string, string> = {
  dizayn: "Mahsulot dizayni",
  design: "Mahsulot dizayni",
  veb: "Veb dizayn",
  web: "Veb dizayn",
  mobil: "Mobil dasturlash",
  mobile: "Mobil dasturlash",
  marketing: "Marketing",
  video: "Marketing",
  dastur: "Arxitektura",
  ilova: "Mobil dasturlash",
};

function detectKeywords(idea: string): string[] {
  const lower = idea.toLowerCase();
  return Object.keys(SKILL_MAP).filter((k) => lower.includes(k));
}

function extractSkills(idea: string): string[] {
  const keys = detectKeywords(idea);
  const skills = new Set<string>();
  for (const k of keys) {
    SKILL_MAP[k]?.forEach((s) => skills.add(s));
  }
  if (skills.size === 0) {
    return ["Tadqiqot", "Rejalashtirish", "Amalga oshirish", "Testlash"];
  }
  return [...skills].slice(0, 6);
}

function suggestCategory(idea: string): string {
  const keys = detectKeywords(idea);
  for (const k of keys) {
    if (CATEGORY_MAP[k]) return CATEGORY_MAP[k]!;
  }
  return "Konsalting";
}

function suggestTitle(idea: string): string {
  const trimmed = idea.trim();
  if (trimmed.length <= 60) return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  const firstSentence = trimmed.split(/[.!?]/)[0] ?? trimmed;
  return firstSentence.slice(0, 60).trim() + (firstSentence.length > 60 ? "…" : "");
}

function suggestBudget(clientBudget: number): { min: number; max: number; note: string } {
  if (clientBudget <= 0) {
    return { min: 500, max: 2000, note: "O'rtacha loyiha uchun tavsiya etilgan diapazon" };
  }
  const min = Math.round(clientBudget * 0.85);
  const max = Math.round(clientBudget * 1.15);
  return {
    min,
    max,
    note: clientBudget < 500 ? "Byudjet past — MVP yoki qisqa hajm tavsiya etiladi" : "Kiritilgan byudjet asosida",
  };
}

function suggestTimeline(timelineWeeks: number): { weeks: number; phases: string[]; note: string } {
  const weeks = timelineWeeks > 0 ? timelineWeeks : 4;
  const phases =
    weeks <= 2
      ? ["O'rganish (3 kun)", "Ishlab chiqish (1 hafta)", "Teslash va topshirish (3 kun)"]
      : weeks <= 4
        ? ["O'rganish (1 hafta)", "Dizayn/Prototip (1 hafta)", "Ishlab chiqish (1.5 hafta)", "Sifat nazorati va topshirish (0.5 hafta)"]
        : ["O'rganish (1 hafta)", "Strategiya va dizayn (2 hafta)", "Ishlab chiqish (3 hafta)", "Test va iteratsiya (1 hafta)", "Topshirish va hujjatlar (1 hafta)"];
  return {
    weeks,
    phases,
    note: weeks < 2 ? "Muddat qisqa — hajmni toraytiring" : "Realistik bosqichlar rejasi",
  };
}

export const AI_PROJECT_DRAFT_KEY = "ishbor-ai-project-draft";

export function saveAiProjectDraft(result: GeneratedProject) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AI_PROJECT_DRAFT_KEY, JSON.stringify(result));
  } catch { /* ignore */ }
}

export function consumeAiProjectDraft(): GeneratedProject | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AI_PROJECT_DRAFT_KEY);
    if (!raw) return null;
    localStorage.removeItem(AI_PROJECT_DRAFT_KEY);
    return JSON.parse(raw) as GeneratedProject;
  } catch {
    return null;
  }
}

export function mapAiCategoryToForm(category: string): string {
  const map: Record<string, string> = {
    "Mahsulot dizayni": "Product Design",
    "Veb dizayn": "Web Design",
    "Mobil dasturlash": "Mobile Development",
    Marketing: "Marketing",
    Arxitektura: "Architecture",
    Konsalting: "Consulting",
  };
  return map[category] ?? "Consulting";
}

export type GeneratedProject = {
  title: string;
  description: string;
  skills: string[];
  category: string;
  budget: { min: number; max: number; suggested: number; note: string };
  timeline: { weeks: number; phases: string[]; note: string };
};

export function generateProjectFromIdea(
  idea: string,
  budget: number,
  timelineWeeks: number,
): GeneratedProject | { error: string } {
  if (!idea.trim() || idea.trim().length < 10) {
    return { error: "G'oyani kamida 10 ta belgida tasvirlang." };
  }

  const skills = extractSkills(idea);
  const category = suggestCategory(idea);
  const title = suggestTitle(idea);
  const budgetSuggestion = suggestBudget(budget);
  const timelineSuggestion = suggestTimeline(timelineWeeks);

  const description = [
    `## Loyiha maqsadi`,
    idea.trim(),
    ``,
    `## Kutilayotgan natijalar`,
    `- ${category} yo'nalishida professional yechim`,
    `- ${skills.slice(0, 3).join(", ")} ko'nikmalarini talab qiladi`,
    `- ${timelineSuggestion.weeks} hafta ichida yakunlash`,
    ``,
    `## Ish hajmi`,
    ...timelineSuggestion.phases.map((p) => `- ${p}`),
  ].join("\n");

  return {
    title,
    description,
    skills,
    category,
    budget: {
      min: budgetSuggestion.min,
      max: budgetSuggestion.max,
      suggested: budget > 0 ? budget : Math.round((budgetSuggestion.min + budgetSuggestion.max) / 2),
      note: budgetSuggestion.note,
    },
    timeline: timelineSuggestion,
  };
}
