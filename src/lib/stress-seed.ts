/**
 * Dev/QA stress seeder — populates localStorage with scale test data.
 * Usage (browser console): import('/src/lib/stress-seed.ts').then(m => m.runStressSeed())
 * Or: window.__ishborStressSeed?.()
 */
import { getSession } from "./auth";

export type StressSeedCounts = {
  messages: number;
  notifications: number;
  orders: number;
  escrows: number;
  projects: number;
  services: number;
  portfolios: number;
  agencies: number;
  analyticsEvents: number;
  reviews: number;
};

export const DEFAULT_STRESS_COUNTS: StressSeedCounts = {
  messages: 100,
  notifications: 100,
  orders: 50,
  escrows: 50,
  projects: 50,
  services: 50,
  portfolios: 50,
  agencies: 20,
  analyticsEvents: 200,
  reviews: 100,
};

export type StressSeedResult = {
  ok: true;
  userId: string;
  counts: StressSeedCounts;
  elapsedMs: number;
  storageKeys: string[];
};

function uid(prefix: string, i: number) {
  return `${prefix}-${i}`;
}

export function runStressSeed(counts: Partial<StressSeedCounts> = {}): StressSeedResult {
  if (typeof window === "undefined") {
    throw new Error("runStressSeed requires browser environment");
  }

  const session = getSession();
  const userId = session?.user.id ?? "u-stress-guest";
  const c = { ...DEFAULT_STRESS_COUNTS, ...counts };
  const start = performance.now();
  const storageKeys: string[] = [];

  // Messages — 100 conversations
  const conversations = Array.from({ length: c.messages }, (_, i) => ({
    id: uid("m", i),
    name: `Stress User ${i + 1}`,
    hue: (i * 37) % 360,
    snippet: `Test xabar ${i + 1} — scale audit`,
    time: `${(i % 24).toString().padStart(2, "0")}:${(i % 60).toString().padStart(2, "0")}`,
    unread: i % 5 === 0 ? 1 : 0,
    online: i % 3 === 0,
    archived: i % 20 === 19,
    pinned: i === 0,
    participantUsername: i % 2 === 0 ? "nargiza" : undefined,
  }));
  const threads: Record<string, unknown[]> = {};
  for (let i = 0; i < c.messages; i++) {
    threads[uid("m", i)] = [
      {
        id: uid("t", i),
        from: i % 2 === 0 ? "them" : "me",
        type: "text",
        body: `Stress test message body #${i + 1}`,
        time: "12:00",
      },
    ];
  }
  const msgKey = `ishbor-messages-${userId}`;
  localStorage.setItem(msgKey, JSON.stringify({ conversations, threads }));
  storageKeys.push(msgKey);

  // Notifications — 100
  const notifications = Array.from({ length: c.notifications }, (_, i) => ({
    id: uid("n", i),
    kind: (["payment", "proposal", "message", "order", "escrow", "system"] as const)[i % 6],
    title: `Stress bildirishnoma ${i + 1}`,
    body: `Scale test notification body ${i + 1}`,
    time: i < 10 ? "Hozir" : `${i} kun oldin`,
    read: i % 4 === 0,
    priority: (i % 7 === 0 ? "high" : "normal") as "low" | "normal" | "high",
    userId,
  }));
  const notifAll = JSON.parse(localStorage.getItem("ishbor-notifications") ?? "{}") as Record<string, unknown[]>;
  notifAll[userId] = notifications;
  localStorage.setItem("ishbor-notifications", JSON.stringify(notifAll));
  storageKeys.push("ishbor-notifications");

  // Orders — 50
  const orders = Array.from({ length: c.orders }, (_, i) => ({
    id: uid("o", i),
    title: `Stress Order ${i + 1}`,
    client: session?.user.company ?? "Stress Client",
    clientHue: 215,
    clientSlug: session?.user.companySlug,
    ownerUserId: userId,
    freelancer: `Freelancer ${i}`,
    freelancerHue: 250,
    freelancerUsername: "nargiza",
    amount: 1000 + i * 100,
    status: (["in_progress", "review", "completed", "pending"] as const)[i % 4],
    dueDate: "2026-07-01",
    milestones: [],
  }));
  localStorage.setItem("ishbor-user-orders", JSON.stringify(orders));
  storageKeys.push("ishbor-user-orders");

  // Escrows — 50
  const escrows = Array.from({ length: c.escrows }, (_, i) => ({
    id: uid("ew", i),
    orderId: uid("o", i % c.orders),
    project: `Stress Project ${i + 1}`,
    client: session?.user.company ?? "Stress Client",
    freelancer: `Freelancer ${i}`,
    totalAmount: 2000 + i * 50,
    status: (["active", "funded", "completed", "disputed"] as const)[i % 4],
    milestones: [{ id: "ms1", title: "Bosqich 1", amount: 1000, status: "pending" }],
  }));
  localStorage.setItem("ishbor-escrow", JSON.stringify(escrows));
  storageKeys.push("ishbor-escrow");

  // Projects — 50
  const projects = Array.from({ length: c.projects }, (_, i) => ({
    slug: `stress-project-${i + 1}`,
    title: `Stress Project ${i + 1}`,
    description: `Scale test project description ${i + 1}`,
    budget: `$${(i + 1) * 500}`,
    budgetMin: (i + 1) * 500,
    budgetMax: (i + 1) * 800,
    category: "Web Design",
    status: (["published", "draft", "paused", "closed"] as const)[i % 4],
    ownerUserId: userId,
    client: session?.user.company ?? "Stress Client",
    clientHue: 215,
    proposals: i % 3,
    postedAt: "2026-06-01",
  }));
  localStorage.setItem("ishbor-projects", JSON.stringify(projects));
  storageKeys.push("ishbor-projects");

  // Services — 50
  const services = Array.from({ length: c.services }, (_, i) => ({
    slug: `stress-service-${i + 1}`,
    title: `Stress Service ${i + 1}`,
    description: `Scale test service ${i + 1}`,
    category: "Veb dasturlash",
    status: (["published", "draft", "paused"] as const)[i % 3],
    ownerUserId: userId,
    sellerUsername: session?.user.username ?? "nargiza",
    packages: [{ tier: "Essential", price: 500 + i * 10, delivery: "7 kun", revisions: "2", features: ["Feature A"], description: "Test" }],
  }));
  localStorage.setItem("ishbor-services", JSON.stringify(services));
  storageKeys.push("ishbor-services");

  // Portfolios — 50
  const portfolios = Array.from({ length: c.portfolios }, (_, i) => ({
    slug: `stress-portfolio-${i + 1}`,
    title: `Stress Portfolio ${i + 1}`,
    description: `Scale test portfolio ${i + 1}`,
    category: "Product Design",
    status: (["published", "draft"] as const)[i % 2],
    ownerUserId: userId,
    ownerUsername: session?.user.username ?? "nargiza",
    coverHue: (i * 23) % 360,
    tags: ["design"],
    media: [],
  }));
  localStorage.setItem("ishbor-portfolios", JSON.stringify(portfolios));
  storageKeys.push("ishbor-portfolios");

  // Agencies — 20
  const agencies = Array.from({ length: c.agencies }, (_, i) => ({
    slug: `stress-agency-${i + 1}`,
    name: `Stress Agency ${i + 1}`,
    description: `Scale test agency ${i + 1}`,
    status: "published" as const,
    foundedYear: 2020 + (i % 5),
    teamSize: 5 + i,
    location: "Tashkent",
    ownerUserId: userId,
    members: [{ userId, role: "owner" as const, status: "active" as const, joinedAt: "2026-01-01" }],
    specializations: ["Dizayn"],
    languages: ["O'zbek"],
    verificationStatus: "verified" as const,
  }));
  localStorage.setItem("ishbor-agencies", JSON.stringify(agencies));
  storageKeys.push("ishbor-agencies");

  // Analytics events — 200
  const events = Array.from({ length: c.analyticsEvents }, (_, i) => ({
    id: uid("ae", i),
    type: (["profile_view", "service_view", "order_created", "checkout_start"] as const)[i % 4],
    timestamp: new Date(Date.now() - i * 3600000).toISOString(),
    userId,
    entityId: `entity-${i}`,
    value: i * 10,
  }));
  localStorage.setItem("ishbor-analytics-events", JSON.stringify(events));
  storageKeys.push("ishbor-analytics-events");

  // Reviews — 100
  const reviews = Array.from({ length: c.reviews }, (_, i) => ({
    id: uid("rv", i),
    orderId: uid("o", i % c.orders),
    reviewerId: userId,
    reviewerName: session?.user.fullName ?? "Stress User",
    targetUsername: "nargiza",
    rating: (i % 5) + 1,
    text: `Stress review ${i + 1}`,
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  }));
  localStorage.setItem("ishbor-reviews", JSON.stringify(reviews));
  storageKeys.push("ishbor-reviews");

  const elapsedMs = Math.round(performance.now() - start);

  if (typeof window !== "undefined") {
    (window as unknown as { __ishborStressSeed?: () => StressSeedResult }).__ishborStressSeed = () =>
      runStressSeed();
  }

  return { ok: true, userId, counts: c, elapsedMs, storageKeys };
}

export function clearStressSeed(): void {
  if (typeof window === "undefined") return;
  const keys = [
    "ishbor-notifications",
    "ishbor-user-orders",
    "ishbor-escrow",
    "ishbor-projects",
    "ishbor-services",
    "ishbor-portfolios",
    "ishbor-agencies",
    "ishbor-analytics-events",
    "ishbor-reviews",
  ];
  const session = getSession();
  if (session) {
    localStorage.removeItem(`ishbor-messages-${session.user.id}`);
  }
  keys.forEach((k) => localStorage.removeItem(k));
}
