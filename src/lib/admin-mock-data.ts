import {
  freelancers,
  clients,
  projects,
  services,
  orders,
  applications,
  escrowWorkflows,
  transactions,
  reviews,
  categories,
} from "./mock-data";

export type AdminUserStatus = "active" | "suspended" | "banned" | "pending";
export type AdminUserRole = "freelancer" | "client" | "admin";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  verified: boolean;
  hue: number;
  username?: string;
  company?: string;
  joined: string;
  lastActive: string;
  gmv: number;
  trustScore: number;
  orders: number;
  walletBalance: number;
};

export type VerificationRequest = {
  id: string;
  userId: string;
  userName: string;
  userHue: number;
  type: "identity" | "business" | "payment";
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  documents: { label: string; type: string }[];
  history: { action: string; by: string; date: string }[];
};

export type Dispute = {
  id: string;
  orderId: string;
  project: string;
  client: string;
  clientHue: number;
  freelancer: string;
  freelancerHue: number;
  amount: number;
  status: "open" | "pending" | "closed";
  reason: string;
  openedAt: string;
  assignedTo?: string;
};

export type PaymentRecord = {
  id: string;
  type: "deposit" | "withdrawal" | "escrow_transfer" | "failed";
  user: string;
  userHue: number;
  amount: number;
  status: "completed" | "pending" | "failed" | "held";
  method: string;
  date: string;
};

export type SupportTicket = {
  id: string;
  subject: string;
  user: string;
  userHue: number;
  priority: "low" | "normal" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  assignedTo?: string;
  createdAt: string;
  lastReply: string;
  messages: number;
};

export type ModerationItem = {
  id: string;
  type: "user" | "service" | "project" | "review";
  title: string;
  reportedBy: string;
  reason: string;
  status: "pending" | "approved" | "hidden" | "removed";
  reportedAt: string;
  hue: number;
};

export type SystemService = {
  name: string;
  status: "healthy" | "degraded" | "down";
  latency?: string;
  uptime?: string;
};

export type ActivityEvent = {
  id: string;
  type: "registration" | "order" | "escrow" | "dispute" | "report";
  title: string;
  description: string;
  time: string;
  hue?: number;
};

export const adminStats = {
  totalUsers: 14820,
  activeUsers: 9234,
  freelancers: 8420,
  clients: 6400,
  openProjects: 1402,
  activeOrders: 3847,
  escrowVolume: 2840000,
  revenue: 842200,
  withdrawals: 128400,
  disputes: 6,
  verificationRequests: 23,
};

export const chartData = {
  revenue: [
    { month: "Iyl", value: 52000 },
    { month: "Avg", value: 61000 },
    { month: "Sen", value: 58000 },
    { month: "Okt", value: 72000 },
    { month: "Noy", value: 68000 },
    { month: "Dek", value: 84000 },
    { month: "Yan", value: 79000 },
    { month: "Fev", value: 92000 },
    { month: "Mart", value: 88000 },
    { month: "Aprel", value: 102000 },
    { month: "May", value: 98000 },
    { month: "Iyn", value: 112000 },
  ],
  users: [
    { month: "Iyl", value: 8200 },
    { month: "Avg", value: 9100 },
    { month: "Sen", value: 9800 },
    { month: "Okt", value: 10500 },
    { month: "Noy", value: 11200 },
    { month: "Dek", value: 12100 },
    { month: "Yan", value: 12800 },
    { month: "Fev", value: 13400 },
    { month: "Mart", value: 13900 },
    { month: "Aprel", value: 14200 },
    { month: "May", value: 14500 },
    { month: "Iyn", value: 14820 },
  ],
  orders: [
    { month: "Iyl", value: 2100 },
    { month: "Avg", value: 2400 },
    { month: "Sen", value: 2600 },
    { month: "Okt", value: 2900 },
    { month: "Noy", value: 3100 },
    { month: "Dek", value: 3300 },
    { month: "Yan", value: 3400 },
    { month: "Fev", value: 3600 },
    { month: "Mart", value: 3700 },
    { month: "Aprel", value: 3750 },
    { month: "May", value: 3800 },
    { month: "Iyn", value: 3847 },
  ],
  escrow: [
    { month: "Iyl", value: 1.2 },
    { month: "Avg", value: 1.4 },
    { month: "Sen", value: 1.6 },
    { month: "Okt", value: 1.8 },
    { month: "Noy", value: 2.0 },
    { month: "Dek", value: 2.2 },
    { month: "Yan", value: 2.3 },
    { month: "Fev", value: 2.5 },
    { month: "Mart", value: 2.6 },
    { month: "Aprel", value: 2.7 },
    { month: "May", value: 2.8 },
    { month: "Iyn", value: 2.84 },
  ],
};

export const activityFeed: ActivityEvent[] = [
  { id: "ae1", type: "registration", title: "Yangi ro'yxatdan o'tish", description: "Rustam Khalilov freelancer sifatida qo'shildi", time: "3 daqiqa oldin", hue: 160 },
  { id: "ae2", type: "order", title: "Yangi buyurtma", description: "Asaka Capital buyurtma berdi — Fintech App Redesign ($12,000)", time: "18 daqiqa oldin", hue: 215 },
  { id: "ae3", type: "escrow", title: "Eskrou to'ldirildi", description: "Prototype & handoff bosqichi uchun $6,000 to'ldirildi", time: "45 daqiqa oldin", hue: 250 },
  { id: "ae4", type: "dispute", title: "Nizo ochildi", description: "Soliq Pro vs Nargiza — Webflow Marketing Site", time: "2 soat oldin", hue: 210 },
  { id: "ae5", type: "report", title: "Kontent shikoyati", description: "Xizmat noto'g'ri narx ko'rsatish uchun belgilandi", time: "3 soat oldin", hue: 270 },
  { id: "ae6", type: "registration", title: "Yangi ro'yxatdan o'tish", description: "Soliq Pro mijoz kompaniya sifatida ro'yxatdan o'tdi", time: "5 soat oldin", hue: 210 },
  { id: "ae7", type: "order", title: "Buyurtma yakunlandi", description: "Growth Strategy Audit — $850 chiqarildi", time: "6 soat oldin", hue: 160 },
  { id: "ae8", type: "escrow", title: "Mablag' chiqarildi", description: "Nargiza Akhmedovaga $4,000 chiqarildi", time: "8 soat oldin", hue: 250 },
];

export const adminUsers: AdminUser[] = [
  ...freelancers.map((f) => ({
    id: f.id,
    name: f.name,
    email: `${f.username}@ishbor.uz`,
    role: "freelancer" as const,
    status: (f.available ? "active" : "suspended") as AdminUserStatus,
    verified: f.identityVerified,
    hue: f.hue,
    username: f.username,
    joined: f.memberSince ?? "2022",
    lastActive: "Bugun",
    gmv: f.earned,
    trustScore: f.successScore,
    orders: f.jobs,
    walletBalance: Math.round(f.earned * 0.15),
  })),
  ...clients.map((c, i) => ({
    id: `c${i + 1}`,
    name: c.team[0]?.name ?? c.name,
    email: `team@${c.slug}.uz`,
    role: "client" as const,
    status: (c.verified ? "active" : "pending") as AdminUserStatus,
    verified: c.verified,
    hue: c.hue,
    company: c.name,
    joined: c.memberSince,
    lastActive: i < 2 ? "Bugun" : "2 kun oldin",
    gmv: c.spent,
    trustScore: c.verified ? 92 : 68,
    orders: c.hires,
    walletBalance: Math.round(c.spent * 0.05),
  })),
];

export const verificationRequests: VerificationRequest[] = [
  {
    id: "vr1", userId: "f3", userName: "Dilnoza Kim", userHue: 270, type: "identity", status: "pending",
    submittedAt: "2 soat oldin",
    documents: [{ label: "Pasport — old tomoni", type: "image" }, { label: "Pasport — orqa tomoni", type: "image" }, { label: "Selfi tasdiqlash", type: "image" }],
    history: [{ action: "Yuborildi", by: "Dilnoza Kim", date: "13-iyun" }],
  },
  {
    id: "vr2", userId: "f8", userName: "Rustam Khalilov", userHue: 160, type: "business", status: "pending",
    submittedAt: "5 soat oldin",
    documents: [{ label: "Biznes litsenziyasi", type: "pdf" }, { label: "Soliq ro'yxatdan o'tish", type: "pdf" }],
    history: [{ action: "Yuborildi", by: "Rustam Khalilov", date: "13-iyun" }],
  },
  {
    id: "vr3", userId: "c5", userName: "Rustam Aliyev", userHue: 210, type: "identity", status: "pending",
    submittedAt: "1 kun oldin",
    documents: [{ label: "Milliy ID", type: "image" }],
    history: [{ action: "Yuborildi", by: "Rustam Aliyev", date: "12-iyun" }],
  },
  {
    id: "vr4", userId: "f1", userName: "Nargiza Akhmedova", userHue: 250, type: "identity", status: "approved",
    submittedAt: "2023-yil yanvar",
    documents: [{ label: "Pasport", type: "image" }],
    history: [
      { action: "Yuborildi", by: "Nargiza Akhmedova", date: "10-yanvar" },
      { action: "Tasdiqlandi", by: "Admin", date: "12-yanvar" },
    ],
  },
  {
    id: "vr5", userId: "f4", userName: "Temur Ismoilov", userHue: 230, type: "business", status: "rejected",
    submittedAt: "2024-yil mart",
    documents: [{ label: "Biznes ro'yxatdan o'tish", type: "pdf" }],
    history: [
      { action: "Yuborildi", by: "Temur Ismoilov", date: "01-mart" },
      { action: "Rad etildi — hujjatlar to'liq emas", by: "Admin", date: "03-mart" },
    ],
  },
];

export const disputes: Dispute[] = [
  {
    id: "d1", orderId: "o5", project: "Webflow Marketing Site", client: "Soliq Pro", clientHue: 210,
    freelancer: "Nargiza Akhmedova", freelancerHue: 250, amount: 6000, status: "open",
    reason: "Kelishilgan doira bo'yicha natijalar mos kelmadi", openedAt: "May 15", assignedTo: "Aisha K.",
  },
  {
    id: "d2", orderId: "o2", project: "Brand Identity System", client: "Hunar Bazaar", clientHue: 290,
    freelancer: "Nargiza Akhmedova", freelancerHue: 250, amount: 400, status: "pending",
    reason: "Brend qo'llanmasi bo'yicha qayta ishlash nizosi", openedAt: "Jun 10",
  },
  {
    id: "d3", orderId: "o3", project: "iOS App — On-demand delivery", client: "Tezda", clientHue: 250,
    freelancer: "Farrukh Saidov", freelancerHue: 210, amount: 2200, status: "closed",
    reason: "Muddat uzaytirish bo'yicha kelishmovchilik", openedAt: "May 28", assignedTo: "Bobur N.",
  },
];

export const paymentRecords: PaymentRecord[] = [
  ...transactions.map((t) => ({
    id: t.id,
    type: (t.kind === "in" ? "deposit" : t.kind === "out" ? "withdrawal" : "escrow_transfer") as PaymentRecord["type"],
    user: "Platforma foydalanuvchisi",
    userHue: 250,
    amount: Math.abs(t.amount),
    status: (t.status === "Completed" ? "completed" : t.status === "Pending" ? "pending" : "failed") as PaymentRecord["status"],
    method: t.project,
    date: t.date,
  })),
  { id: "pr-fail", type: "failed", user: "Noma'lum", userHue: 200, amount: 500, status: "failed", method: "Uzcard •••• 9912", date: "Jun 11" },
];

export const supportTickets: SupportTicket[] = [
  { id: "st1", subject: "Eskrou mablag'larini chiqarib bo'lmayapti", user: "Asaka Capital", userHue: 215, priority: "urgent", status: "open", createdAt: "1 soat oldin", lastReply: "30 daqiqa oldin", messages: 4 },
  { id: "st2", subject: "Tasdiqlash juda uzoq davom etmoqda", user: "Dilnoza Kim", userHue: 270, priority: "high", status: "in_progress", assignedTo: "Laylo R.", createdAt: "3 soat oldin", lastReply: "1 soat oldin", messages: 6 },
  { id: "st3", subject: "Yechib olish yetib kelmadi", user: "Azamat Usmanov", userHue: 215, priority: "high", status: "open", createdAt: "5 soat oldin", lastReply: "4 soat oldin", messages: 3 },
  { id: "st4", subject: "Buyurtmaga nizo qanday ochiladi?", user: "Soliq Pro", userHue: 210, priority: "normal", status: "resolved", assignedTo: "Elena V.", createdAt: "1 kun oldin", lastReply: "18 soat oldin", messages: 8 },
  { id: "st5", subject: "Hisob noto'g'ri to'xtatilgan", user: "Noma'lum foydalanuvchi", userHue: 180, priority: "normal", status: "closed", assignedTo: "Bobur N.", createdAt: "2 kun oldin", lastReply: "1 kun oldin", messages: 5 },
];

export const moderationQueue: ModerationItem[] = [
  { id: "mq1", type: "service", title: "3D Product Renders — noto'g'ri narx ko'rsatish", reportedBy: "Mijoz #4421", reason: "Narxni aldash", status: "pending", reportedAt: "2 soat oldin", hue: 270 },
  { id: "mq2", type: "review", title: "iOS App Development bo'yicha soxta 5 yulduzli sharh", reportedBy: "Tizim", reason: "Shubhali naqsh aniqlandi", status: "pending", reportedAt: "4 soat oldin", hue: 210 },
  { id: "mq3", type: "project", title: "B2B SaaS Marketing Site — spam kontent", reportedBy: "Moderator", reason: "Takroriy e'lon", status: "pending", reportedAt: "6 soat oldin", hue: 210 },
  { id: "mq4", type: "user", title: "Spam ariza bot hisobi", reportedBy: "Tizim", reason: "1 soatda 50 ta ariza", status: "pending", reportedAt: "8 soat oldin", hue: 180 },
];

export const systemHealth: SystemService[] = [
  { name: "API Gateway", status: "healthy", latency: "12ms", uptime: "99.97%" },
  { name: "Database (PostgreSQL)", status: "healthy", latency: "3ms", uptime: "99.99%" },
  { name: "Job Queue (Redis)", status: "healthy", latency: "1ms", uptime: "99.95%" },
  { name: "Email (SendGrid)", status: "degraded", latency: "240ms", uptime: "98.2%" },
  { name: "Payments (Stripe)", status: "healthy", latency: "89ms", uptime: "99.94%" },
  { name: "Escrow Engine", status: "healthy", latency: "18ms", uptime: "99.98%" },
];

export const analyticsData = {
  gmv: 842200,
  revenue: 67376,
  platformFees: 67376,
  conversionRate: 4.2,
  retention: 68,
  activeUsers: 9234,
  topCategories: categories.slice(0, 5).map((c) => ({ name: c.name, gmv: c.count * 420, orders: Math.round(c.count * 0.3) })),
  topFreelancers: freelancers.slice(0, 5).map((f) => ({ name: f.name, hue: f.hue, earned: f.earned, orders: f.jobs, rating: f.rating })),
};

export type AdminProject = Project & { adminStatus: "approved" | "pending" | "suspended" | "rejected" };
export type AdminService = Service & { adminStatus: "approved" | "pending" | "suspended" | "rejected" };

type Project = (typeof projects)[number];
type Service = (typeof services)[number];

export const adminProjects: AdminProject[] = projects.map((p) => ({
  ...p,
  adminStatus: p.verified ? "approved" : "pending",
}));

export const adminServices: AdminService[] = services.map((s) => ({
  ...s,
  adminStatus: "approved" as const,
}));

export function getAdminUser(id: string): AdminUser | undefined {
  return adminUsers.find((u) => u.id === id);
}

export function getUserOrders(userId: string) {
  const user = getAdminUser(userId);
  if (!user) return [];
  if (user.role === "freelancer") {
    return orders.filter((o) => o.freelancerUsername === user.username);
  }
  return orders.filter((o) => o.clientSlug && clients.some((c) => c.slug === o.clientSlug && c.name === user.company));
}

export function getUserApplications(userId: string) {
  const user = getAdminUser(userId);
  if (!user || user.role !== "freelancer") return [];
  return applications;
}

export function getUserReviews(userId: string) {
  const user = getAdminUser(userId);
  if (!user?.username) return [];
  return reviews.filter((r) => r.freelancerUsername === user.username);
}

export function getUserEscrow(userId: string) {
  const user = getAdminUser(userId);
  if (!user) return [];
  const name = user.role === "freelancer" ? user.name : user.company;
  return escrowWorkflows.filter((e) => e.freelancer === name || e.client === name || e.client === user.company);
}

export const loginHistory = [
  { date: "13-iyun, 08:42", ip: "185.139.22.14", device: "Chrome / macOS", location: "Toshkent" },
  { date: "12-iyun, 19:15", ip: "185.139.22.14", device: "Safari / iOS", location: "Toshkent" },
  { date: "11-iyun, 09:30", ip: "91.196.10.8", device: "Chrome / Windows", location: "Samarqand" },
  { date: "09-iyun, 14:22", ip: "185.139.22.14", device: "Chrome / macOS", location: "Toshkent" },
];

export function getVerification(id: string) {
  return verificationRequests.find((v) => v.id === id);
}

export function getDispute(id: string) {
  return disputes.find((d) => d.id === id);
}

export function getSupportTicket(id: string) {
  return supportTickets.find((t) => t.id === id);
}
