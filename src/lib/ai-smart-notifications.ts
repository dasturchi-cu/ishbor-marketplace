import { getSession } from "./auth";
import { getActiveRole } from "./active-role-store";
import { addNotification } from "./notifications-store";
import { computeProfileCompletionPercent } from "./profile-store";
import { computeOpportunityScore } from "./ai-opportunity-store";
import { matchProjectsForFreelancer, matchFreelancersForClient } from "./ai-matching-store";
import { analyzePortfolio } from "./ai-portfolio-optimizer";

const SENT_KEY = "ishbor-ai-smart-notifications-sent";

function getSentIds(userId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(SENT_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    return new Set(all[userId] ?? []);
  } catch {
    return new Set();
  }
}

function markSent(userId: string, id: string) {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem(SENT_KEY);
  const all = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
  const ids = all[userId] ?? [];
  if (!ids.includes(id)) {
    all[userId] = [...ids, id].slice(-50);
    localStorage.setItem(SENT_KEY, JSON.stringify(all));
  }
}

/** Generate rule-based smart notifications from real platform data (deduped) */
export function syncSmartNotifications(userId?: string): number {
  const session = getSession();
  const uid = userId ?? session?.user.id;
  if (!uid || !session) return 0;

  const sent = getSentIds(uid);
  let created = 0;
  const userType = getActiveRole();

  const completion = computeProfileCompletionPercent(uid, userType);
  if (completion >= 80 && completion < 100 && !sent.has("profile-80")) {
    addNotification({
      userId: uid,
      kind: "system",
      title: "Profil deyarli tayyor",
      body: `Profilingiz ${completion}% tayyor. Qolgan bo'limlarni to'ldiring.`,
      priority: "normal",
      href: "/settings",
    });
    markSent(uid, "profile-80");
    created++;
  }

  const opportunity = computeOpportunityScore(session.user);
  if (opportunity.total < 50 && !sent.has("opportunity-low")) {
    addNotification({
      userId: uid,
      kind: "system",
      title: "Imkoniyat balli past",
      body: `Imkoniyat balli: ${opportunity.total}/100. AI maslahatchidan foydalaning.`,
      priority: "normal",
      href: "/ai/trust-coach",
    });
    markSent(uid, "opportunity-low");
    created++;
  }

  if (userType === "freelancer") {
    const matches = matchProjectsForFreelancer(uid, 5);
    if (matches.length >= 3 && !sent.has("project-matches")) {
      addNotification({
        userId: uid,
        kind: "proposal",
        title: "Mos loyihalar topildi",
        body: `Sizga mos ${matches.length} ta loyiha topildi.`,
        priority: "high",
        href: "/projects",
      });
      markSent(uid, "project-matches");
      created++;
    }

    const portfolio = analyzePortfolio(session.user);
    if (portfolio.portfolioCount === 0 && !sent.has("portfolio-trust")) {
      addNotification({
        userId: uid,
        kind: "portfolio",
        title: "Portfolio qo'shing",
        body: "Portfolio qo'shsangiz trust score +8 oshadi.",
        priority: "high",
        href: "/portfolio/create",
      });
      markSent(uid, "portfolio-trust");
      created++;
    }
  }

  if (userType === "client") {
    const matches = matchFreelancersForClient(uid, 5);
    if (matches.length >= 2 && !sent.has("freelancer-matches")) {
      addNotification({
        userId: uid,
        kind: "system",
        title: "Mos frilanserlar",
        body: `Maqsadlaringizga mos ${matches.length} ta frilanser topildi.`,
        priority: "normal",
        href: "/freelancers",
      });
      markSent(uid, "freelancer-matches");
      created++;
    }
  }

  return created;
}
