import { readStoredApplications } from "./applications-store";
import { getOrdersForFreelancer } from "./orders-store";
import { readStoredReviews } from "./reviews-store";
import { computeProfileCompletionPercent } from "./profile-store";
import { getPublishedPortfoliosByUsername } from "./portfolio-store";
import type { AuthUser } from "./auth";
import { getActiveRole } from "./active-role-store";

const SERVICES_STORAGE_KEY = "ishbor-user-services";
const RESPONSE_METRICS_KEY = "ishbor-response-metrics";

type PendingResponse = {
  conversationId: string;
  messageId: string;
  receivedAt: number;
  respondedAt?: number;
};

type UserResponseMetrics = {
  username: string;
  pending: PendingResponse[];
  history: PendingResponse[];
};

function countPublishedServices(userId: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(SERVICES_STORAGE_KEY);
    if (!raw) return 0;
    const stored = JSON.parse(raw) as { ownerUserId?: string; status?: string }[];
    return stored.filter((s) => s.ownerUserId === userId && s.status === "published").length;
  } catch {
    return 0;
  }
}

function readResponseMetrics(username: string): {
  totalIncoming: number;
  respondedWithin24h: number;
  medianMinutes: number | null;
} {
  if (typeof window === "undefined") {
    return { totalIncoming: 0, respondedWithin24h: 0, medianMinutes: null };
  }
  try {
    const raw = localStorage.getItem(RESPONSE_METRICS_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, UserResponseMetrics>) : {};
    const metrics = all[username] ?? { username, pending: [], history: [] };
    const responded = metrics.history.filter((h) => h.respondedAt);
    const totalIncoming = metrics.history.length + metrics.pending.length;

    if (totalIncoming === 0) {
      return { totalIncoming: 0, respondedWithin24h: 0, medianMinutes: null };
    }

    const within24h = responded.filter((h) => (h.respondedAt! - h.receivedAt) / 60000 <= 1440).length;
    const times = responded.map((h) => (h.respondedAt! - h.receivedAt) / 60000).sort((a, b) => a - b);
    const medianMinutes = times.length > 0 ? times[Math.floor(times.length / 2)]! : null;

    return { totalIncoming, respondedWithin24h: within24h, medianMinutes };
  } catch {
    return { totalIncoming: 0, respondedWithin24h: 0, medianMinutes: null };
  }
}

export type SuccessScoreResult = {
  score: number;
  completionRate: number;
  onTimeRate: number;
  repeatClientRate: number;
  totalJobs: number;
  completedJobs: number;
  avgRating: number;
  reviewCount: number;
};

export type ResponseRateResult = {
  rate: number;
  medianMinutes: number | null;
  totalIncoming: number;
  respondedCount: number;
};

export type TrustScoreResult = {
  trustScore: number;
  profileCompletion: number;
  verificationProgress: number;
  portfolioStrength: number;
  successScore: number;
  responseRate: number;
  reviewScore: number;
  label: "Yangi" | "Barqaror" | "Ishonchli" | "Eng yuqori baho";
};

/** Success Score formula (0–100, faqat stored user actions):
 * - completionRate × 40  (completed / total orders)
 * - onTimeRate × 25      (completed before due / completed)
 * - repeatClientRate × 15 (clients with 2+ orders / unique clients)
 * - avgRating × 4        (0–20 from 0–5 stars)
 * - disputePenalty       (-10 if any disputed order)
 */
export function computeSuccessScore(username: string): SuccessScoreResult {
  const orders = getOrdersForFreelancer(username);
  const reviews = readStoredReviews().filter((r) => r.freelancerUsername === username);
  const totalJobs = orders.length;

  if (totalJobs === 0) {
    const reviewCount = reviews.length;
    const avgRating = reviewCount > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviewCount : 0;
    const reviewPoints = Math.round(avgRating * 4);
    return {
      score: reviewCount > 0 ? Math.min(20, reviewPoints) : 0,
      completionRate: 0,
      onTimeRate: 0,
      repeatClientRate: 0,
      totalJobs: 0,
      completedJobs: 0,
      avgRating: Math.round(avgRating * 10) / 10,
      reviewCount,
    };
  }

  const completed = orders.filter((o) => o.status === "completed");
  const completedJobs = completed.length;
  const completionRate = Math.round((completedJobs / totalJobs) * 100);

  const onTimeCompleted = completed.filter((o) => !isOrderLate(o.dueDate, o.completedAt)).length;
  const onTimeRate = completedJobs > 0 ? Math.round((onTimeCompleted / completedJobs) * 100) : 0;

  const clientCounts = new Map<string, number>();
  for (const o of orders) {
    clientCounts.set(o.client, (clientCounts.get(o.client) ?? 0) + 1);
  }
  const uniqueClients = clientCounts.size;
  const repeatClients = [...clientCounts.values()].filter((c) => c >= 2).length;
  const repeatClientRate = uniqueClients > 0 ? Math.round((repeatClients / uniqueClients) * 100) : 0;

  const reviewCount = reviews.length;
  const avgRating = reviewCount > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviewCount : 0;

  const disputed = orders.some((o) => o.status === "disputed");
  const disputePenalty = disputed ? 10 : 0;

  const raw =
    completionRate * 0.4 +
    onTimeRate * 0.25 +
    repeatClientRate * 0.15 +
    avgRating * 4 -
    disputePenalty;

  return {
    score: Math.max(0, Math.min(100, Math.round(raw))),
    completionRate,
    onTimeRate,
    repeatClientRate,
    totalJobs,
    completedJobs,
    avgRating: Math.round(avgRating * 10) / 10,
    reviewCount,
  };
}

function isOrderLate(dueDate: string, completedAt?: string): boolean {
  if (!completedAt || dueDate === "TBD" || dueDate === "As discussed") return false;
  try {
    const due = new Date(dueDate);
    const done = new Date(completedAt);
    if (isNaN(due.getTime())) return false;
    return done > due;
  } catch {
    return false;
  }
}

/** Response Rate formula (0–100):
 * respondedWithin24h / totalIncomingMessages × 100
 * medianMinutes = median response time in minutes
 */
export function computeResponseRate(username: string): ResponseRateResult {
  const metrics = readResponseMetrics(username);
  if (metrics.totalIncoming === 0) {
    return { rate: 0, medianMinutes: null, totalIncoming: 0, respondedCount: 0 };
  }
  const rate = Math.round((metrics.respondedWithin24h / metrics.totalIncoming) * 100);
  return {
    rate,
    medianMinutes: metrics.medianMinutes,
    totalIncoming: metrics.totalIncoming,
    respondedCount: metrics.respondedWithin24h,
  };
}

export function formatResponseTime(medianMinutes: number | null): string {
  if (medianMinutes === null) return "—";
  if (medianMinutes < 30) return "< 30 daqiqa";
  if (medianMinutes < 60) return "< 1 soat";
  if (medianMinutes < 120) return "< 2 soat";
  if (medianMinutes < 1440) return `< ${Math.round(medianMinutes / 60)} soat`;
  return "< 24 soat";
}

/** Trust Score formula (0–100):
 * profileCompletion × 0.25
 * verificationProgress × 0.20
 * portfolioStrength × 0.15
 * successScore × 0.25
 * responseRate × 0.10
 * reviewAvg × 4 × 0.05 (max 5 pts)
 */
export function computeTrustScore(user: AuthUser, username?: string): TrustScoreResult {
  const uname = username ?? user.username;
  const userId = user.id;
  const userType: "client" | "freelancer" = uname ? "freelancer" : getActiveRole();

  const profileCompletion = computeProfileCompletionPercent(userId, userType);

  let verificationProgress = 0;
  if (user.verified) verificationProgress += 60;
  if (user.isAdmin) verificationProgress += 10;
  verificationProgress = Math.min(100, verificationProgress);

  let portfolioStrength = 0;
  if (uname) {
    const portfolios = getPublishedPortfoliosByUsername(uname);
    portfolioStrength = Math.min(100, portfolios.length * 25 + (portfolios.some((p) => p.featured) ? 15 : 0));
  }

  const success = uname ? computeSuccessScore(uname) : { score: 0, avgRating: 0 };
  const response = uname ? computeResponseRate(uname) : { rate: 0 };
  const reviewScore = Math.min(5, success.avgRating * 1);

  if (countPublishedServices(userId) > 0) portfolioStrength = Math.min(100, portfolioStrength + 10);

  const trustScore = Math.round(
    profileCompletion * 0.25 +
    verificationProgress * 0.2 +
    portfolioStrength * 0.15 +
    success.score * 0.25 +
    response.rate * 0.1 +
    reviewScore * 5 * 0.05,
  );

  const label: TrustScoreResult["label"] =
    trustScore >= 90 ? "Eng yuqori baho"
    : trustScore >= 75 ? "Ishonchli"
    : trustScore >= 55 ? "Barqaror"
    : "Yangi";

  return {
    trustScore: Math.min(100, trustScore),
    profileCompletion,
    verificationProgress,
    portfolioStrength,
    successScore: success.score,
    responseRate: response.rate,
    reviewScore,
    label,
  };
}

export function computeClientTrustScore(user: AuthUser): TrustScoreResult {
  const profileCompletion = computeProfileCompletionPercent(user.id, "client");
  const verificationProgress = user.verified ? 100 : 40;
  const trustScore = Math.round(profileCompletion * 0.5 + verificationProgress * 0.5);
  return {
    trustScore: Math.min(100, trustScore),
    profileCompletion,
    verificationProgress,
    portfolioStrength: 0,
    successScore: 0,
    responseRate: 0,
    reviewScore: 0,
    label: trustScore >= 80 ? "Ishonchli" : trustScore >= 60 ? "Barqaror" : "Yangi",
  };
}

export function getFreelancerLevel(username: string): "Top Rated" | "Expert" | "Rising" | "Verified" {
  const success = computeSuccessScore(username);
  const response = computeResponseRate(username);
  if (success.score >= 90 && success.reviewCount >= 5) return "Top Rated";
  if (success.score >= 75 && success.completedJobs >= 3) return "Expert";
  if (success.totalJobs >= 1 || success.reviewCount >= 1) return "Rising";
  return "Verified";
}

export function getWinRate(username: string): number {
  const apps = readStoredApplications().filter((a) => a.freelancerUsername === username && !a.archived);
  if (apps.length === 0) return 0;
  const accepted = apps.filter((a) => a.status === "accepted").length;
  return Math.round((accepted / apps.length) * 100);
}

export function getEarningsLast30Days(username: string): number {
  const orders = getOrdersForFreelancer(username).filter((o) => o.status === "completed");
  const thirtyDaysAgo = Date.now() - 30 * 86400000;
  return orders
    .filter((o) => o.completedAt && new Date(o.completedAt).getTime() >= thirtyDaysAgo)
    .reduce((s, o) => s + o.amount, 0);
}

export function getMonthlyEarnings(username: string, months = 6): { month: string; value: number }[] {
  const orders = getOrdersForFreelancer(username).filter(
    (o) => o.status === "completed" && o.completedAt,
  );
  const result: { month: string; value: number }[] = [];
  const monthNames = ["Yan", "Fev", "Mar", "Aprel", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = monthNames[d.getMonth()]!;
    const total = orders
      .filter((o) => {
        const cd = new Date(o.completedAt!);
        return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear();
      })
      .reduce((s, o) => s + o.amount, 0);
    result.push({ month, value: Math.round(total) });
  }
  return result;
}

export function applyLiveServiceMetrics<T extends {
  sellerUsername: string;
  sellerSuccessScore: number;
  sellerCompletionRate: number;
  sellerOnTime: number;
  sellerResponseTime: string;
  sellerRepeatClients: number;
}>(service: T): T {
  const success = computeSuccessScore(service.sellerUsername);
  const response = computeResponseRate(service.sellerUsername);
  return {
    ...service,
    sellerSuccessScore: success.score,
    sellerCompletionRate: success.completionRate,
    sellerOnTime: success.onTimeRate,
    sellerResponseTime: formatResponseTime(response.medianMinutes),
    sellerRepeatClients: success.repeatClientRate,
  };
}
