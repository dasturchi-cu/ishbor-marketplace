/**
 * Dev/QA stress seeder — populates localStorage with scale test data.
 * Browser console: window.__ishborStressSeed?.()
 * Clear: window.__ishborClearStressSeed?.()
 */
import type {
  Application,
  EscrowWorkflow,
  Order,
  Project,
  Service,
} from "./mock-data";
import { freelancers } from "./mock-data";
import type { Agency, AgencyMember } from "./agency-types";
import type { PortfolioItem } from "./portfolio-types";
import type { StoredService } from "./services-store";
import type { StoredReview } from "./reviews-store";
import type { AppNotification } from "./notifications-store";
import type { Conversation, MessagesState, ThreadMessage } from "./messages-store";
import { getSession } from "./auth";
import { rehydrateAllStores } from "./store-rehydrate";

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
  applications: number;
  reviews: number;
};

export const DEFAULT_STRESS_COUNTS: StressSeedCounts = {
  messages: 100,
  notifications: 100,
  orders: 100,
  escrows: 100,
  projects: 100,
  services: 100,
  portfolios: 100,
  agencies: 20,
  analyticsEvents: 100,
  reviews: 100,
  applications: 100,
};

export type StressSeedResult = {
  ok: true;
  userId: string;
  counts: StressSeedCounts;
  elapsedMs: number;
  storageKeys: string[];
};

const PROJECT_CATEGORIES = [
  "Mahsulot dizayni",
  "Veb dasturlash",
  "Mobil dasturlash",
  "Brending",
  "Strategiya va dizayn",
  "Arxitektura",
];
const SERVICE_CATEGORIES = [
  "Mobil dizayn",
  "Veb dasturlash",
  "Brending",
  "Strategiya",
  "3D va Motion",
  "Huquq",
];
const ORDER_STATUSES: Order["status"][] = [
  "in_progress",
  "review",
  "revision",
  "completed",
  "disputed",
  "cancelled",
];
const ESCROW_STATUSES: EscrowWorkflow["status"][] = [
  "funded",
  "in_progress",
  "delivered",
  "review",
  "completed",
  "disputed",
];
const APP_STATUSES: Application["status"][] = ["pending", "shortlisted", "accepted", "rejected"];
const NOTIF_KINDS: AppNotification["kind"][] = [
  "payment",
  "proposal",
  "message",
  "order",
  "escrow",
  "system",
];

function uid(prefix: string, i: number) {
  return `${prefix}-stress-${i}`;
}

function pad(n: number, width = 3) {
  return String(n).padStart(width, "0");
}

function buildProject(i: number, ctx: SeedContext): Project {
  const n = i + 1;
  const status = i % 5 === 0 ? "draft" : "published";
  return {
    id: uid("p", i),
    slug: `stress-project-${pad(n)}`,
    title: `Stress test loyihasi ${pad(n)} — UI audit`,
    client: ctx.clientName,
    clientHue: ctx.clientHue,
    clientSlug: ctx.clientSlug,
    clientSpent: 12000 + i * 120,
    clientHires: 3 + (i % 8),
    clientVerified: true,
    clientMemberSince: "2023",
    budget: 1500 + i * 75,
    budgetType: i % 7 === 0 ? "hourly" : "fixed",
    category: PROJECT_CATEGORIES[i % PROJECT_CATEGORIES.length]!,
    postedAgo: i < 5 ? "Hozirgina" : `${1 + (i % 14)} kun oldin`,
    proposals: i % 12,
    description:
      `Bu stress test loyihasi ${n} bo'yicha batafsil tavsif. ` +
      "UI, eskrou va buyurtma oqimlarini yuqori hajmda sinash uchun yaratilgan.",
    skills: ["Figma", "React", "TypeScript"].slice(0, 1 + (i % 3)),
    duration: `${2 + (i % 8)} hafta`,
    verified: true,
    escrowProtected: true,
    scope: ["Discovery", "Dizayn", "Yetkazish"].slice(0, 1 + (i % 3)),
    experienceLevel: (["Entry", "Intermediate", "Expert"] as const)[i % 3],
    status,
    ownerUserId: ctx.userId,
    createdAt: new Date(Date.now() - i * 3600000).toISOString(),
  };
}

function buildService(i: number, ctx: SeedContext): StoredService {
  const n = i + 1;
  const seller = freelancers[i % freelancers.length]!;
  const status = i % 6 === 0 ? "draft" : "published";
  const price = 400 + i * 15;
  const base: Service = {
    id: uid("s", i),
    slug: `stress-service-${pad(n)}`,
    title: `Stress xizmat ${pad(n)} — professional yetkazish`,
    seller: seller.name.split(" ")[0] + " " + seller.name.split(" ")[1]?.[0] + ".",
    sellerHue: seller.hue,
    sellerUsername: seller.username,
    sellerLevel: seller.level,
    sellerSuccessScore: seller.successScore,
    sellerCompletionRate: seller.completionRate,
    sellerOnTime: seller.onTimeDelivery,
    sellerResponseTime: seller.responseTime,
    sellerIdentityVerified: seller.identityVerified,
    sellerRepeatClients: seller.repeatClients,
    sellerTotalEarned: seller.earned,
    category: SERVICE_CATEGORIES[i % SERVICE_CATEGORIES.length]!,
    price,
    rating: 4.5 + (i % 5) * 0.1,
    reviews: 5 + (i % 40),
    delivery: `${3 + (i % 14)} kun`,
    hue: seller.hue,
    inProgress: i % 4,
    queuePosition: 1 + (i % 5),
    description: `Stress test xizmati ${n}. Aniq doira, aniq narx, aniq muddat.`,
    packages: [
      {
        tier: "Essential",
        price,
        delivery: `${5 + (i % 10)} kun`,
        revisions: 2,
        features: ["Asosiy yetkazish", "1 ta tuzatish"],
        description: "Standart paket",
      },
    ],
  };
  return {
    ...base,
    status,
    ownerUserId: ctx.userId,
    createdAt: new Date(Date.now() - i * 7200000).toISOString(),
  };
}

function buildPortfolio(i: number, ctx: SeedContext): PortfolioItem {
  const n = i + 1;
  const f = freelancers[i % freelancers.length]!;
  const slug = `stress-portfolio-${pad(n)}`;
  return {
    id: uid("pf", i),
    slug,
    title: `Stress portfolio ${pad(n)} — keys stadiya`,
    category: PROJECT_CATEGORIES[i % PROJECT_CATEGORIES.length]!,
    description:
      `Professional portfolio elementi ${n}. Stress test uchun to'liq keys stadiya va metrikalar bilan.`,
    objectives: "Foydalanuvchi jalb qilish va ishonchni oshirish.",
    challenges: "Qisqa muddat va ko'p stakeholderlar.",
    solutions: "Agile sprintlar va haftalik demo.",
    skills: f.skills.slice(0, 3),
    technologies: ["Figma", "React", "TypeScript", "PostgreSQL"].slice(0, 2 + (i % 3)),
    clientName: i % 3 === 0 ? "Stress Mijoz" : undefined,
    duration: `${2 + (i % 4)} oy`,
    teamSize: i % 2 === 0 ? "Solo" : "3 kishi",
    budgetRange: `$${(4 + i) * 1000} – $${(6 + i) * 1000}`,
    completionDate: "2025-08-15",
    coverImage: "",
    galleryImages: [],
    links: { liveDemo: `https://demo.ishbor.uz/${slug}` },
    caseStudy: {
      clientProblem: "Zamonaviy raqamli mahsulot kerak edi.",
      research: "25 ta stakeholder bilan suhbatlar o'tkazildi.",
      strategy: "MVP dan boshlab bosqichma-bosqich kengaytirish.",
      designProcess: "Wireframe → prototip → UI tizimi.",
      developmentProcess: "Ikki haftalik sprintlar va CI/CD.",
      finalResult: "Vaqtida yetkazildi, +40% engagement.",
      lessonsLearned: "Erta alignment muhim.",
    },
    metrics: [
      { label: "Engagement", value: `+${30 + (i % 20)}%` },
      { label: "Muddat", value: `${2 + (i % 4)} oy` },
    ],
    outcomes: "Mijoz keyingi loyiha uchun qayta murojaat qildi.",
    hue: f.hue,
    ownerUserId: ctx.userId,
    freelancerUsername: ctx.username ?? f.username,
    freelancerName: ctx.fullName ?? f.name,
    freelancerHue: ctx.avatarHue ?? f.hue,
    status: i % 8 === 0 ? "draft" : "published",
    adminStatus: "approved",
    featured: i === 0,
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function buildOrder(i: number, ctx: SeedContext): Order {
  const n = i + 1;
  const f = freelancers[i % freelancers.length]!;
  const amount = 1200 + i * 90;
  const half = Math.round(amount / 2);
  const status = ORDER_STATUSES[i % ORDER_STATUSES.length]!;
  return {
    id: uid("o", i),
    title: `Stress buyurtma ${pad(n)}`,
    client: ctx.clientName,
    clientHue: ctx.clientHue,
    clientSlug: ctx.clientSlug,
    ownerUserId: ctx.userId,
    freelancer: f.name,
    freelancerHue: f.hue,
    freelancerUsername: f.username,
    status,
    progress: status === "completed" ? 100 : (i * 7) % 95,
    dueDate: "2026-07-15",
    amount,
    escrowFunded: i % 3 !== 0,
    milestones: [
      { label: "Kickoff va discovery", done: i % 2 === 0, amount: half },
      { label: "Yakuniy yetkazish", done: status === "completed", amount: amount - half },
    ],
    completedAt: status === "completed" ? new Date(Date.now() - i * 86400000).toISOString() : undefined,
  };
}

function buildEscrow(i: number, order: Order): EscrowWorkflow {
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const status = ESCROW_STATUSES[i % ESCROW_STATUSES.length]!;
  const funded = order.escrowFunded;
  return {
    id: uid("ew", i),
    orderId: order.id,
    project: order.title,
    client: order.client,
    clientHue: order.clientHue,
    freelancer: order.freelancer,
    freelancerHue: order.freelancerHue,
    amount: order.amount,
    status,
    milestones: order.milestones.map((m, idx) => ({
      label: m.label,
      amount: m.amount,
      status: m.done ? "released" : funded && idx === 0 ? "funded" : "pending",
    })),
    timeline: [
      { step: "Taklif yuborildi", date: today, done: true },
      { step: "Taklif qabul qilindi", date: today, done: true },
      { step: "Eskrou to'ldirildi", date: funded ? today : "—", done: funded },
      { step: "Ish boshlandi", date: status !== "funded" ? today : "—", done: status !== "funded" },
      { step: "Yakunlandi", date: status === "completed" ? today : "—", done: status === "completed" },
    ],
  };
}

function buildApplication(i: number, ctx: SeedContext, projectCount: number): Application {
  const n = i + 1;
  const projectIndex = i % projectCount;
  const f = freelancers[i % freelancers.length]!;
  return {
    id: uid("app", i),
    projectTitle: `Stress test loyihasi ${pad(projectIndex + 1)} — UI audit`,
    projectSlug: `stress-project-${pad(projectIndex + 1)}`,
    client: ctx.clientName,
    clientHue: ctx.clientHue,
    clientSlug: ctx.clientSlug,
    budget: 1800 + i * 40,
    category: PROJECT_CATEGORIES[i % PROJECT_CATEGORIES.length]!,
    submittedAgo: i < 3 ? "Bugun" : `${1 + (i % 20)} kun oldin`,
    status: APP_STATUSES[i % APP_STATUSES.length]!,
    coverNote: `Stress ariza ${n}: tajribam va portfolio mos keladi deb hisoblayman.`,
    proposalAmount: 900 + i * 35,
    deliveryTime: `${1 + (i % 4)} hafta`,
    freelancerUsername: ctx.username ?? f.username,
    freelancerName: ctx.fullName ?? f.name,
    freelancerHue: ctx.avatarHue ?? f.hue,
    orderId: i % 5 === 0 ? uid("o", i % projectCount) : undefined,
    archived: i % 25 === 24,
  };
}

function buildReview(i: number, orderCount: number): StoredReview {
  const n = i + 1;
  const f = freelancers[i % freelancers.length]!;
  const orderIdx = i % orderCount;
  return {
    id: uid("rv", i),
    from: "Stress Mijoz",
    fromHue: 215,
    project: `Stress buyurtma ${pad(orderIdx + 1)}`,
    rating: (i % 5) + 1,
    body: `Stress sharh ${n}: sifat va aloqa yaxshi, tavsiya qilaman.`,
    date: `${1 + (i % 28)} kun oldin`,
    freelancerUsername: f.username,
    orderId: uid("o", orderIdx),
    direction: i % 2 === 0 ? "client_to_freelancer" : "freelancer_to_client",
    fromUsername: "stress-client",
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  };
}

function buildAgency(i: number, ctx: SeedContext): Agency {
  const n = i + 1;
  const owner: AgencyMember = {
    userId: ctx.userId,
    username: ctx.username,
    email: ctx.email ?? "stress@ishbor.uz",
    fullName: ctx.fullName ?? "Stress User",
    avatarHue: ctx.avatarHue,
    role: "owner",
    status: "active",
    joinedAt: "2025-01-01T00:00:00.000Z",
  };
  return {
    id: uid("ag", i),
    slug: `stress-agency-${pad(n, 2)}`,
    name: `Stress Agency ${pad(n, 2)}`,
    description: `Stress test agentligi ${n}. Jamoa, portfolio va CRM oqimlarini sinash uchun.`,
    foundedYear: 2018 + (i % 7),
    teamSize: 8 + i,
    specializations: ["Dizayn", "Dasturlash"].slice(0, 1 + (i % 2)),
    languages: ["O'zbek", "Rus", "Ingliz"].slice(0, 1 + (i % 3)),
    location: i % 2 === 0 ? "Tashkent" : "Samarkand",
    website: `https://agency-${n}.ishbor.uz`,
    ownerUserId: ctx.userId,
    members: [owner],
    verificationLevel: (["verified", "premium", "enterprise"] as const)[i % 3],
    status: "published",
    createdAt: new Date(Date.now() - i * 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function buildConversation(i: number): Conversation {
  const f = freelancers[i % freelancers.length]!;
  return {
    id: uid("m", i),
    name: i % 3 === 0 ? f.name : `Stress User ${i + 1}`,
    hue: (i * 37) % 360,
    snippet: `Stress xabar ${i + 1} — scale audit matni`,
    time: i < 5 ? "Hozir" : `${i % 24}:${pad(i % 60, 2)}`,
    unread: i % 5 === 0 ? 1 : 0,
    online: i % 3 === 0,
    archived: i % 20 === 19,
    pinned: i === 0,
    participantUsername: f.username,
    lastSeenAt: new Date(Date.now() - i * 600000).toISOString(),
  };
}

function buildThread(i: number): ThreadMessage[] {
  return [
    {
      id: uid("t", i),
      from: i % 2 === 0 ? "them" : "me",
      type: "text",
      body: `Stress test xabar tana #${i + 1}. UI va xabarlar oqimini sinash.`,
      time: "12:00",
      timestampMs: Date.now() - i * 60000,
      read: i % 2 === 0,
    },
  ];
}

type SeedContext = {
  userId: string;
  username?: string;
  fullName?: string;
  email?: string;
  avatarHue: number;
  clientName: string;
  clientHue: number;
  clientSlug?: string;
};

function buildContext(): SeedContext {
  const session = getSession();
  const user = session?.user;
  return {
    userId: user?.id ?? "u-stress-guest",
    username: user?.username,
    fullName: user?.fullName,
    email: user?.email,
    avatarHue: user?.avatarHue ?? 215,
    clientName: user?.company ?? user?.fullName ?? "Stress Client Co",
    clientHue: user?.avatarHue ?? 215,
    clientSlug: user?.companySlug,
  };
}

export function clearStressSeed(): void {
  if (typeof window === "undefined") return;

  const session = getSession();
  const keys = [
    "ishbor-notifications",
    "ishbor-user-orders",
    "ishbor-user-escrow",
    "ishbor-user-projects",
    "ishbor-user-services",
    "ishbor-user-portfolios",
    "ishbor-agencies",
    "ishbor-analytics-events",
    "ishbor-reviews",
    "ishbor-user-applications",
  ];

  if (session) {
    localStorage.removeItem(`ishbor-messages-${session.user.id}`);
  }

  keys.forEach((k) => localStorage.removeItem(k));
  rehydrateAllStores(session?.user.id);
}

export function runStressSeed(counts: Partial<StressSeedCounts> = {}): StressSeedResult {
  if (typeof window === "undefined") {
    throw new Error("runStressSeed requires browser environment");
  }

  clearStressSeed();

  const ctx = buildContext();
  const c = { ...DEFAULT_STRESS_COUNTS, ...counts };
  const start = performance.now();
  const storageKeys: string[] = [];

  const conversations = Array.from({ length: c.messages }, (_, i) => buildConversation(i));
  const threads: Record<string, ThreadMessage[]> = {};
  for (let i = 0; i < c.messages; i++) {
    threads[uid("m", i)] = buildThread(i);
  }
  const msgKey = `ishbor-messages-${ctx.userId}`;
  const messagesState: MessagesState = { conversations, threads };
  localStorage.setItem(msgKey, JSON.stringify(messagesState));
  storageKeys.push(msgKey);

  const notifications: AppNotification[] = Array.from({ length: c.notifications }, (_, i) => ({
    id: uid("n", i),
    kind: NOTIF_KINDS[i % NOTIF_KINDS.length]!,
    title: `Stress bildirishnoma ${i + 1}`,
    body: `Scale test bildirishnoma matni ${i + 1}.`,
    time: i < 10 ? "Hozir" : `${i} kun oldin`,
    read: i % 4 === 0,
    priority: (i % 7 === 0 ? "high" : "normal") as AppNotification["priority"],
    userId: ctx.userId,
    href: i % 2 === 0 ? "/orders" : undefined,
  }));
  localStorage.setItem("ishbor-notifications", JSON.stringify({ [ctx.userId]: notifications }));
  storageKeys.push("ishbor-notifications");

  const projects = Array.from({ length: c.projects }, (_, i) => buildProject(i, ctx));
  localStorage.setItem("ishbor-user-projects", JSON.stringify(projects));
  storageKeys.push("ishbor-user-projects");

  const services = Array.from({ length: c.services }, (_, i) => buildService(i, ctx));
  localStorage.setItem("ishbor-user-services", JSON.stringify(services));
  storageKeys.push("ishbor-user-services");

  const portfolios = Array.from({ length: c.portfolios }, (_, i) => buildPortfolio(i, ctx));
  localStorage.setItem("ishbor-user-portfolios", JSON.stringify(portfolios));
  storageKeys.push("ishbor-user-portfolios");

  const orders = Array.from({ length: c.orders }, (_, i) => buildOrder(i, ctx));
  localStorage.setItem("ishbor-user-orders", JSON.stringify(orders));
  storageKeys.push("ishbor-user-orders");

  const escrows = Array.from({ length: c.escrows }, (_, i) =>
    buildEscrow(i, orders[i % orders.length]!),
  );
  localStorage.setItem("ishbor-user-escrow", JSON.stringify(escrows));
  storageKeys.push("ishbor-user-escrow");

  const agencies = Array.from({ length: c.agencies }, (_, i) => buildAgency(i, ctx));
  localStorage.setItem("ishbor-agencies", JSON.stringify(agencies));
  storageKeys.push("ishbor-agencies");

  const reviews = Array.from({ length: c.reviews }, (_, i) => buildReview(i, c.orders));
  localStorage.setItem("ishbor-reviews", JSON.stringify(reviews));
  storageKeys.push("ishbor-reviews");

  const applications = Array.from({ length: c.applications }, (_, i) =>
    buildApplication(i, ctx, c.projects),
  );
  localStorage.setItem("ishbor-user-applications", JSON.stringify(applications));
  storageKeys.push("ishbor-user-applications");

  const events = Array.from({ length: c.analyticsEvents }, (_, i) => ({
    id: uid("ae", i),
    type: (["profile_view", "service_view", "order_created", "checkout_start"] as const)[i % 4],
    timestamp: new Date(Date.now() - i * 3600000).toISOString(),
    userId: ctx.userId,
    entityId: `entity-${i}`,
    value: i * 10,
  }));
  localStorage.setItem("ishbor-analytics-events", JSON.stringify(events));
  storageKeys.push("ishbor-analytics-events");

  rehydrateAllStores(ctx.userId);

  const elapsedMs = Math.round(performance.now() - start);

  if (typeof window !== "undefined") {
    const w = window as unknown as {
      __ishborStressSeed?: () => StressSeedResult;
      __ishborClearStressSeed?: () => void;
    };
    w.__ishborStressSeed = () => runStressSeed();
    w.__ishborClearStressSeed = () => clearStressSeed();
  }

  return { ok: true, userId: ctx.userId, counts: c, elapsedMs, storageKeys };
}

export function installStressSeedGlobals(): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    __ishborStressSeed?: () => StressSeedResult;
    __ishborClearStressSeed?: () => void;
  };
  w.__ishborStressSeed = () => runStressSeed();
  w.__ishborClearStressSeed = () => clearStressSeed();
}

if (typeof window !== "undefined") {
  installStressSeedGlobals();
}
