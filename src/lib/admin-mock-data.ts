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
    { month: "Jul", value: 52000 },
    { month: "Aug", value: 61000 },
    { month: "Sep", value: 58000 },
    { month: "Oct", value: 72000 },
    { month: "Nov", value: 68000 },
    { month: "Dec", value: 84000 },
    { month: "Jan", value: 79000 },
    { month: "Feb", value: 92000 },
    { month: "Mar", value: 88000 },
    { month: "Apr", value: 102000 },
    { month: "May", value: 98000 },
    { month: "Jun", value: 112000 },
  ],
  users: [
    { month: "Jul", value: 8200 },
    { month: "Aug", value: 9100 },
    { month: "Sep", value: 9800 },
    { month: "Oct", value: 10500 },
    { month: "Nov", value: 11200 },
    { month: "Dec", value: 12100 },
    { month: "Jan", value: 12800 },
    { month: "Feb", value: 13400 },
    { month: "Mar", value: 13900 },
    { month: "Apr", value: 14200 },
    { month: "May", value: 14500 },
    { month: "Jun", value: 14820 },
  ],
  orders: [
    { month: "Jul", value: 2100 },
    { month: "Aug", value: 2400 },
    { month: "Sep", value: 2600 },
    { month: "Oct", value: 2900 },
    { month: "Nov", value: 3100 },
    { month: "Dec", value: 3300 },
    { month: "Jan", value: 3400 },
    { month: "Feb", value: 3600 },
    { month: "Mar", value: 3700 },
    { month: "Apr", value: 3750 },
    { month: "May", value: 3800 },
    { month: "Jun", value: 3847 },
  ],
  escrow: [
    { month: "Jul", value: 1.2 },
    { month: "Aug", value: 1.4 },
    { month: "Sep", value: 1.6 },
    { month: "Oct", value: 1.8 },
    { month: "Nov", value: 2.0 },
    { month: "Dec", value: 2.2 },
    { month: "Jan", value: 2.3 },
    { month: "Feb", value: 2.5 },
    { month: "Mar", value: 2.6 },
    { month: "Apr", value: 2.7 },
    { month: "May", value: 2.8 },
    { month: "Jun", value: 2.84 },
  ],
};

export const activityFeed: ActivityEvent[] = [
  { id: "ae1", type: "registration", title: "New registration", description: "Rustam Khalilov joined as freelancer", time: "3m ago", hue: 160 },
  { id: "ae2", type: "order", title: "New order", description: "Asaka Capital placed order — Fintech App Redesign ($12,000)", time: "18m ago", hue: 215 },
  { id: "ae3", type: "escrow", title: "Escrow funded", description: "$6,000 funded for Prototype & handoff milestone", time: "45m ago", hue: 250 },
  { id: "ae4", type: "dispute", title: "Dispute opened", description: "Soliq Pro vs Nargiza — Webflow Marketing Site", time: "2h ago", hue: 210 },
  { id: "ae5", type: "report", title: "Content report", description: "Service flagged for misleading pricing", time: "3h ago", hue: 270 },
  { id: "ae6", type: "registration", title: "New registration", description: "Soliq Pro registered as client company", time: "5h ago", hue: 210 },
  { id: "ae7", type: "order", title: "Order completed", description: "Growth Strategy Audit — $850 released", time: "6h ago", hue: 160 },
  { id: "ae8", type: "escrow", title: "Funds released", description: "$4,000 released to Nargiza Akhmedova", time: "8h ago", hue: 250 },
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
    lastActive: "Today",
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
    lastActive: i < 2 ? "Today" : "2d ago",
    gmv: c.spent,
    trustScore: c.verified ? 92 : 68,
    orders: c.hires,
    walletBalance: Math.round(c.spent * 0.05),
  })),
];

export const verificationRequests: VerificationRequest[] = [
  {
    id: "vr1", userId: "f3", userName: "Dilnoza Kim", userHue: 270, type: "identity", status: "pending",
    submittedAt: "2h ago",
    documents: [{ label: "Passport — front", type: "image" }, { label: "Passport — back", type: "image" }, { label: "Selfie verification", type: "image" }],
    history: [{ action: "Submitted", by: "Dilnoza Kim", date: "Jun 13" }],
  },
  {
    id: "vr2", userId: "f8", userName: "Rustam Khalilov", userHue: 160, type: "business", status: "pending",
    submittedAt: "5h ago",
    documents: [{ label: "Business license", type: "pdf" }, { label: "Tax registration", type: "pdf" }],
    history: [{ action: "Submitted", by: "Rustam Khalilov", date: "Jun 13" }],
  },
  {
    id: "vr3", userId: "c5", userName: "Rustam Aliyev", userHue: 210, type: "identity", status: "pending",
    submittedAt: "1d ago",
    documents: [{ label: "National ID", type: "image" }],
    history: [{ action: "Submitted", by: "Rustam Aliyev", date: "Jun 12" }],
  },
  {
    id: "vr4", userId: "f1", userName: "Nargiza Akhmedova", userHue: 250, type: "identity", status: "approved",
    submittedAt: "Jan 2023",
    documents: [{ label: "Passport", type: "image" }],
    history: [
      { action: "Submitted", by: "Nargiza Akhmedova", date: "Jan 10" },
      { action: "Approved", by: "Admin", date: "Jan 12" },
    ],
  },
  {
    id: "vr5", userId: "f4", userName: "Temur Ismoilov", userHue: 230, type: "business", status: "rejected",
    submittedAt: "Mar 2024",
    documents: [{ label: "Business registration", type: "pdf" }],
    history: [
      { action: "Submitted", by: "Temur Ismoilov", date: "Mar 01" },
      { action: "Rejected — incomplete docs", by: "Admin", date: "Mar 03" },
    ],
  },
];

export const disputes: Dispute[] = [
  {
    id: "d1", orderId: "o5", project: "Webflow Marketing Site", client: "Soliq Pro", clientHue: 210,
    freelancer: "Nargiza Akhmedova", freelancerHue: 250, amount: 6000, status: "open",
    reason: "Deliverables not matching agreed scope", openedAt: "May 15", assignedTo: "Aisha K.",
  },
  {
    id: "d2", orderId: "o2", project: "Brand Identity System", client: "Hunar Bazaar", clientHue: 290,
    freelancer: "Nargiza Akhmedova", freelancerHue: 250, amount: 400, status: "pending",
    reason: "Revision dispute on brand guidelines", openedAt: "Jun 10",
  },
  {
    id: "d3", orderId: "o3", project: "iOS App — On-demand delivery", client: "Tezda", clientHue: 250,
    freelancer: "Farrukh Saidov", freelancerHue: 210, amount: 2200, status: "closed",
    reason: "Timeline extension disagreement", openedAt: "May 28", assignedTo: "Bobur N.",
  },
];

export const paymentRecords: PaymentRecord[] = [
  ...transactions.map((t) => ({
    id: t.id,
    type: (t.kind === "in" ? "deposit" : t.kind === "out" ? "withdrawal" : "escrow_transfer") as PaymentRecord["type"],
    user: "Platform User",
    userHue: 250,
    amount: Math.abs(t.amount),
    status: (t.status === "Completed" ? "completed" : t.status === "Pending" ? "pending" : "failed") as PaymentRecord["status"],
    method: t.project,
    date: t.date,
  })),
  { id: "pr-fail", type: "failed", user: "Unknown", userHue: 200, amount: 500, status: "failed", method: "Uzcard •••• 9912", date: "Jun 11" },
];

export const supportTickets: SupportTicket[] = [
  { id: "st1", subject: "Cannot release escrow funds", user: "Asaka Capital", userHue: 215, priority: "urgent", status: "open", createdAt: "1h ago", lastReply: "30m ago", messages: 4 },
  { id: "st2", subject: "Verification taking too long", user: "Dilnoza Kim", userHue: 270, priority: "high", status: "in_progress", assignedTo: "Laylo R.", createdAt: "3h ago", lastReply: "1h ago", messages: 6 },
  { id: "st3", subject: "Withdrawal not received", user: "Azamat Usmanov", userHue: 215, priority: "high", status: "open", createdAt: "5h ago", lastReply: "4h ago", messages: 3 },
  { id: "st4", subject: "How to dispute an order?", user: "Soliq Pro", userHue: 210, priority: "normal", status: "resolved", assignedTo: "Elena V.", createdAt: "1d ago", lastReply: "18h ago", messages: 8 },
  { id: "st5", subject: "Account suspended incorrectly", user: "Unknown User", userHue: 180, priority: "normal", status: "closed", assignedTo: "Bobur N.", createdAt: "2d ago", lastReply: "1d ago", messages: 5 },
];

export const moderationQueue: ModerationItem[] = [
  { id: "mq1", type: "service", title: "3D Product Renders — misleading pricing", reportedBy: "Client #4421", reason: "Bait-and-switch pricing", status: "pending", reportedAt: "2h ago", hue: 270 },
  { id: "mq2", type: "review", title: "Fake 5-star review on iOS App Development", reportedBy: "System", reason: "Suspicious pattern detected", status: "pending", reportedAt: "4h ago", hue: 210 },
  { id: "mq3", type: "project", title: "B2B SaaS Marketing Site — spam content", reportedBy: "Moderator", reason: "Duplicate listing", status: "pending", reportedAt: "6h ago", hue: 210 },
  { id: "mq4", type: "user", title: "Spam application bot account", reportedBy: "System", reason: "50 applications in 1 hour", status: "pending", reportedAt: "8h ago", hue: 180 },
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
  { date: "Jun 13, 08:42", ip: "185.139.22.14", device: "Chrome / macOS", location: "Tashkent" },
  { date: "Jun 12, 19:15", ip: "185.139.22.14", device: "Safari / iOS", location: "Tashkent" },
  { date: "Jun 11, 09:30", ip: "91.196.10.8", device: "Chrome / Windows", location: "Samarkand" },
  { date: "Jun 09, 14:22", ip: "185.139.22.14", device: "Chrome / macOS", location: "Tashkent" },
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
