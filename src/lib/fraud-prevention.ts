/** Fraud prevention helpers — referral abuse, duplicate reviews, velocity. */

import { getSession } from "./auth";

const REFERRAL_VELOCITY_KEY = "ishbor-referral-velocity";
const REVIEW_FINGERPRINT_KEY = "ishbor-review-fingerprints";
const MAX_REFERRALS_PER_DAY = 5;
const MAX_REFERRALS_PER_IP_WINDOW = 10;
const IP_WINDOW_MS = 24 * 60 * 60 * 1000;

type ReferralVelocity = {
  date: string;
  count: number;
  ipCounts: Record<string, { count: number; firstSeen: number }>;
};

type ReviewFingerprint = {
  reviewerId: string;
  targetId: string;
  orderId?: string;
  at: number;
};

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function readReferralVelocity(): ReferralVelocity {
  if (typeof window === "undefined") {
    return { date: todayKey(), count: 0, ipCounts: {} };
  }
  try {
    const raw = localStorage.getItem(REFERRAL_VELOCITY_KEY);
    if (!raw) return { date: todayKey(), count: 0, ipCounts: {} };
    const parsed = JSON.parse(raw) as ReferralVelocity;
    if (parsed.date !== todayKey()) {
      return { date: todayKey(), count: 0, ipCounts: {} };
    }
    return parsed;
  } catch {
    return { date: todayKey(), count: 0, ipCounts: {} };
  }
}

function writeReferralVelocity(data: ReferralVelocity): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REFERRAL_VELOCITY_KEY, JSON.stringify(data));
}

/** Block referral apply if daily cap exceeded (client-side guard). */
export function canApplyReferral(referrerId: string, newUserId: string): { ok: boolean; reason?: string } {
  if (referrerId === newUserId) {
    return { ok: false, reason: "O'zingizni taklif qila olmaysiz" };
  }

  const velocity = readReferralVelocity();
  if (velocity.count >= MAX_REFERRALS_PER_DAY) {
    return { ok: false, reason: "Kunlik taklif limiti tugadi" };
  }

  const sessionKey = getSession()?.user.id ?? "anon";
  const ipEntry = velocity.ipCounts[sessionKey];
  const now = Date.now();
  if (ipEntry && now - ipEntry.firstSeen < IP_WINDOW_MS && ipEntry.count >= MAX_REFERRALS_PER_IP_WINDOW) {
    return { ok: false, reason: "Shubhali taklif faolligi aniqlandi" };
  }

  return { ok: true };
}

export function recordReferralApply(referrerId: string): void {
  const velocity = readReferralVelocity();
  velocity.count += 1;
  const sessionKey = getSession()?.user.id ?? "anon";
  const existing = velocity.ipCounts[sessionKey];
  if (!existing || Date.now() - existing.firstSeen >= IP_WINDOW_MS) {
    velocity.ipCounts[sessionKey] = { count: 1, firstSeen: Date.now() };
  } else {
    existing.count += 1;
  }
  writeReferralVelocity(velocity);
}

function readReviewFingerprints(): ReviewFingerprint[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(REVIEW_FINGERPRINT_KEY);
    return raw ? (JSON.parse(raw) as ReviewFingerprint[]) : [];
  } catch {
    return [];
  }
}

function writeReviewFingerprints(items: ReviewFingerprint[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REVIEW_FINGERPRINT_KEY, JSON.stringify(items.slice(-500)));
}

/** Detect duplicate review from same reviewer to same target. */
export function isDuplicateReview(
  reviewerId: string,
  targetId: string,
  orderId?: string,
): boolean {
  const fingerprints = readReviewFingerprints();
  return fingerprints.some(
    (f) =>
      f.reviewerId === reviewerId &&
      f.targetId === targetId &&
      (orderId ? f.orderId === orderId : true),
  );
}

export function recordReviewFingerprint(
  reviewerId: string,
  targetId: string,
  orderId?: string,
): void {
  const fingerprints = readReviewFingerprints();
  fingerprints.push({ reviewerId, targetId, orderId, at: Date.now() });
  writeReviewFingerprints(fingerprints);
}

/** Flag suspiciously fast reviews (< 1 hour after order). */
export function isSuspiciousReviewTiming(orderCompletedAt?: number): boolean {
  if (!orderCompletedAt) return false;
  const elapsed = Date.now() - orderCompletedAt;
  return elapsed < 60 * 60 * 1000;
}

export type FraudSummary = {
  referralAppliesToday: number;
  reviewFingerprints: number;
  suspiciousReviewFlags: number;
};

const SUSPICIOUS_REVIEW_KEY = "ishbor-suspicious-reviews";

function readSuspiciousReviewCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    return Number(localStorage.getItem(SUSPICIOUS_REVIEW_KEY) ?? "0") || 0;
  } catch {
    return 0;
  }
}

export function recordSuspiciousReviewFlag(): void {
  if (typeof window === "undefined") return;
  const next = readSuspiciousReviewCount() + 1;
  localStorage.setItem(SUSPICIOUS_REVIEW_KEY, String(next));
}

export function getFraudSummary(): FraudSummary {
  const velocity = readReferralVelocity();
  return {
    referralAppliesToday: velocity.count,
    reviewFingerprints: readReviewFingerprints().length,
    suspiciousReviewFlags: readSuspiciousReviewCount(),
  };
}
