import type { Project } from "./mock-data";
import type { ProjectFormInput } from "./projects-store";

const GARBAGE_PATTERNS = [
  /^asd+$/i,
  /^das+$/i,
  /^qwe+$/i,
  /^test+$/i,
  /^xxx+$/i,
  /^sdadsa$/i,
  /^dasdasd$/i,
  /^asdd$/i,
  /^dsaas/i,
];

export function hasMeaningfulText(text: string, minLetters = 3): boolean {
  const trimmed = text.trim();
  if (trimmed.length < minLetters) return false;

  const normalized = trimmed.replace(/\s+/g, "").toLowerCase();
  if (GARBAGE_PATTERNS.some((p) => p.test(normalized))) return false;

  const letters = trimmed.match(/[a-zA-Z\u0400-\u04FF\u0100-\u024F']/g) ?? [];
  if (letters.length < Math.min(minLetters, Math.ceil(trimmed.length * 0.35))) return false;

  const unique = new Set(normalized).size;
  if (trimmed.length >= 6 && unique <= 3) return false;

  return true;
}

export function validateProjectInput(input: ProjectFormInput): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const title = input.title.trim();
  const description = input.description.trim();
  const duration = input.duration.trim();
  const skills = input.skills.map((s) => s.trim()).filter((s) => s.length >= 2);

  if (title.length < 12) {
    errors.push("Loyiha nomi kamida 12 belgidan iborat bo'lishi kerak.");
  } else if (!hasMeaningfulText(title, 4)) {
    errors.push("Loyiha nomi tushunarli matn bo'lishi kerak.");
  }

  if (description.length < 40) {
    errors.push("Tavsif kamida 40 belgidan iborat bo'lishi kerak.");
  } else if (!hasMeaningfulText(description, 8)) {
    errors.push("Tavsif tushunarli va batafsil bo'lishi kerak.");
  }

  if (input.budget <= 0) {
    errors.push("Byudjet 0 dan katta bo'lishi kerak.");
  }

  if (duration.length < 2) {
    errors.push("Muddatni kiriting.");
  } else if (!hasMeaningfulText(duration, 2)) {
    errors.push("Muddat tushunarli bo'lishi kerak (masalan, 6 hafta).");
  }

  if (skills.length < 1) {
    errors.push("Kamida bitta ko'nikma kiriting.");
  } else if (skills.some((s) => !hasMeaningfulText(s, 2))) {
    errors.push("Ko'nikmalar tushunarli bo'lishi kerak.");
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true };
}

export function isMarketplaceReady(project: Project): boolean {
  if (project.status && project.status !== "published") return false;

  const input: ProjectFormInput = {
    title: project.title,
    category: project.category,
    budget: project.budget,
    budgetType: project.budgetType,
    duration: project.duration,
    description: project.description,
    skills: project.skills,
    experienceLevel: project.experienceLevel,
    attachments: project.attachments,
  };

  return validateProjectInput(input).ok;
}

export const experienceLevelLabels: Record<Project["experienceLevel"], string> = {
  Entry: "Boshlang'ich",
  Intermediate: "O'rta",
  Expert: "Ekspert",
};

export const budgetTypeLabels: Record<Project["budgetType"], string> = {
  fixed: "Belgilangan",
  hourly: "Soatlik",
};

export const packageTierLabels: Record<"Essential" | "Premium" | "Enterprise", string> = {
  Essential: "Asosiy",
  Premium: "Premium",
  Enterprise: "Korporativ",
};

export function formatPackageTier(tier: string): string {
  return packageTierLabels[tier as keyof typeof packageTierLabels] ?? tier;
}

export function formatPostedAgo(value: string): string {
  if (value === "Just now") return "Hozirgina";
  return value;
}

export function formatProjectBudget(project: Project): string {
  if (project.budgetType === "hourly") {
    return `$${project.budget.toLocaleString()}/soat`;
  }
  return `$${project.budget.toLocaleString()}`;
}
