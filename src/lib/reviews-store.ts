import type { Review } from "./mock-data";
import { reviews as seedReviews } from "./mock-data";
import { getSession } from "./auth";
import { addNotification } from "./notifications-store";
import { recordAnalyticsEvent } from "./analytics-events-store";

const STORAGE_KEY = "ishbor-reviews";
const EMPTY_REVIEWS: StoredReview[] = [];
const listeners = new Set<() => void>();
let cache: StoredReview[] | null = null;
let cachedByFreelancer: Map<string, StoredReview[]> | null = null;

export type ReviewInput = {
  orderId: string;
  from: string;
  fromHue: number;
  fromUsername?: string;
  toUsername?: string;
  toCompany?: string;
  project: string;
  rating: number;
  body: string;
  direction: "client_to_freelancer" | "freelancer_to_client";
  freelancerUsername?: string;
  serviceSlug?: string;
};

export type StoredReview = Review & {
  orderId?: string;
  direction?: ReviewInput["direction"];
  fromUsername?: string;
  toUsername?: string;
  toCompany?: string;
  createdAt?: string;
};

function notify() {
  cache = null;
  cachedByFreelancer = null;
  listeners.forEach((l) => l());
}

export function subscribeReviews(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readStored(): StoredReview[] {
  if (typeof window === "undefined") return EMPTY_REVIEWS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredReview[]) : EMPTY_REVIEWS;
  } catch {
    return EMPTY_REVIEWS;
  }
}

function writeStored(reviews: StoredReview[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
}

export function getAllReviews(): StoredReview[] {
  if (typeof window === "undefined") {
    return [...seedReviews];
  }
  if (!cache) {
    const stored = readStored();
    cache = stored.length > 0 ? stored : [...seedReviews];
  }
  return cache;
}

export function getReviewsForFreelancer(username: string): StoredReview[] {
  if (cachedByFreelancer?.has(username)) {
    return cachedByFreelancer.get(username)!;
  }
  if (!cachedByFreelancer) {
    cachedByFreelancer = new Map();
  }
  const filtered = getAllReviews().filter((r) => r.freelancerUsername === username);
  cachedByFreelancer.set(username, filtered);
  return filtered;
}

export function getReviewsForClient(companySlug: string): StoredReview[] {
  return getAllReviews().filter(
    (r) => r.direction === "freelancer_to_client" && r.toCompany === companySlug,
  );
}

export function getReviewForOrder(orderId: string, direction: ReviewInput["direction"]): StoredReview | undefined {
  return getAllReviews().find((r) => r.orderId === orderId && r.direction === direction);
}

export function getAverageRating(username: string): { avg: number; count: number } {
  const list = readStoredReviews().filter((r) => r.freelancerUsername === username && r.direction !== "freelancer_to_client");
  if (list.length === 0) return { avg: 0, count: 0 };
  const avg = list.reduce((s, r) => s + r.rating, 0) / list.length;
  return { avg: Math.round(avg * 10) / 10, count: list.length };
}

export function getClientAverageRating(companySlug: string): { avg: number; count: number } {
  const list = readStoredReviews().filter(
    (r) => r.direction === "freelancer_to_client" && r.toCompany === companySlug,
  );
  if (list.length === 0) return { avg: 0, count: 0 };
  const avg = list.reduce((s, r) => s + r.rating, 0) / list.length;
  return { avg: Math.round(avg * 10) / 10, count: list.length };
}

export function getReviewsForOrder(orderId: string): StoredReview[] {
  return readStoredReviews().filter((r) => r.orderId === orderId);
}

export function readStoredReviews(): StoredReview[] {
  return readStored();
}

export function submitReview(input: ReviewInput): StoredReview {
  const now = new Date();
  const review: StoredReview = {
    id: `rv-${Date.now()}`,
    from: input.from,
    fromHue: input.fromHue,
    project: input.project,
    rating: input.rating,
    body: input.body,
    date: now.toLocaleDateString("uz-UZ", { month: "short", day: "numeric", year: "numeric" }),
    createdAt: now.toISOString(),
    freelancerUsername: input.freelancerUsername,
    serviceSlug: input.serviceSlug,
    orderId: input.orderId,
    direction: input.direction,
    fromUsername: input.fromUsername,
    toUsername: input.toUsername,
    toCompany: input.toCompany,
  };
  const stored = readStored();
  writeStored([review, ...stored]);
  notify();

  recordAnalyticsEvent({
    type: "review_submitted",
    entityId: input.orderId,
    value: input.rating,
    meta: { direction: input.direction },
  });

  return review;
}

export function hasUserReviewedOrder(orderId: string, direction: ReviewInput["direction"]): boolean {
  return !!getReviewForOrder(orderId, direction);
}

export function canReviewOrder(orderId: string): boolean {
  const session = getSession();
  if (!session) return false;
  const dir: ReviewInput["direction"] =
    session.user.userType === "client" ? "client_to_freelancer" : "freelancer_to_client";
  return !hasUserReviewedOrder(orderId, dir);
}
