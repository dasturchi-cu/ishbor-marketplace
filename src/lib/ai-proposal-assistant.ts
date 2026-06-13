import type { Project } from "./mock-data";
import { getSession } from "./auth";
import { getUserProfile } from "./profile-store";
import { computeSuccessScore, computeResponseRate } from "./growth-metrics";

export type GeneratedProposal = {
  coverLetter: string;
  timeline: string;
  proposedAmount: number;
  milestones: { label: string; amount: number; days: number }[];
  deliveryDays: number;
};

export function generateProposalForProject(project: Project): GeneratedProposal | { error: string } {
  const session = getSession();
  if (!session) return { error: "Tizimga kiring." };

  const profile = getUserProfile(session.user.id);
  const username = session.user.username ?? "";
  const skills = profile?.skills ?? [];
  const matchedSkills = project.skills.filter((ps) =>
    skills.some((s) => s.toLowerCase().includes(ps.toLowerCase()) || ps.toLowerCase().includes(s.toLowerCase())),
  );
  const matchRate = project.skills.length > 0 ? matchedSkills.length / project.skills.length : 0;

  const success = username ? computeSuccessScore(username) : { score: 0, completedJobs: 0 };
  const response = username ? computeResponseRate(username) : { rate: 0 };

  const deliveryDays = parseDurationToDays(project.duration);
  const proposedAmount = Math.round(project.budget * (matchRate >= 0.5 ? 0.95 : 1.0));

  const milestoneCount = deliveryDays <= 14 ? 2 : deliveryDays <= 30 ? 3 : 4;
  const milestones = buildMilestones(proposedAmount, deliveryDays, milestoneCount, project.title);

  const coverLetter = [
    `Assalomu alaykum, ${project.client}!`,
    ``,
    `"${project.title}" loyihasi sizning ehtiyojlaringizga mos kelishini ko'rmoqdaman.`,
    matchedSkills.length > 0
      ? `Men ${matchedSkills.join(", ")} bo'yicha tajribaga egaman va shu yo'nalishda ${success.completedJobs} ta loyiha yakunlaganman.`
      : `Men ${project.category} yo'nalishida ishlayman va tezda moslashaman.`,
    ``,
    `Taklifim:`,
    `- Muddat: ${project.duration}`,
    `- Narx: $${proposedAmount.toLocaleString()}`,
    `- Javob vaqti: ${response.rate > 0 ? `${response.rate}%` : "24 soat ichida"}`,
    ``,
    `Batafsil muhokama qilishga tayyorman. Ishbor eskrou himoyasi orqali xavfsiz hamkorlik qilamiz.`,
    ``,
    `Hurmat bilan,`,
    session.user.fullName,
  ].join("\n");

  return {
    coverLetter,
    timeline: project.duration,
    proposedAmount,
    milestones,
    deliveryDays,
  };
}

function parseDurationToDays(duration: string): number {
  const lower = duration.toLowerCase();
  if (/kun|day/.test(lower)) {
    const n = parseInt(lower, 10);
    return Number.isFinite(n) ? n : 7;
  }
  if (/hafta|week/.test(lower)) {
    const n = parseInt(lower, 10);
    return Number.isFinite(n) ? n * 7 : 14;
  }
  if (/oy|month/.test(lower)) {
    const n = parseInt(lower, 10);
    return Number.isFinite(n) ? n * 30 : 30;
  }
  return 14;
}

function buildMilestones(
  total: number,
  totalDays: number,
  count: number,
  title: string,
): GeneratedProposal["milestones"] {
  const perMilestone = Math.round(total / count);
  const perDays = Math.round(totalDays / count);
  const labels = [
    "O'rganish va reja",
    "Asosiy ishlab chiqish",
    "Iteratsiya va tuzatishlar",
    "Yakuniy topshirish",
  ];
  return Array.from({ length: count }, (_, i) => ({
    label: `${labels[i] ?? `Bosqich ${i + 1}`} — ${title.slice(0, 30)}`,
    amount: i === count - 1 ? total - perMilestone * (count - 1) : perMilestone,
    days: i === count - 1 ? totalDays - perDays * (count - 1) : perDays,
  }));
}
