import { getSaved } from "./saved-store";
import { readStoredOrders } from "./orders-store";
import { freelancers } from "./mock-data";
import { getSession } from "./auth";

export type CrmFreelancer = {
  username: string;
  name: string;
  hue: number;
  title: string;
  rating: number;
  totalSpent: number;
  hireCount: number;
  lastHireDate?: string;
  saved: boolean;
};

export type CrmClient = {
  slug: string;
  name: string;
  hue: number;
  totalPaid: number;
  orderCount: number;
  lastOrderDate?: string;
  isRepeat: boolean;
};

export function getClientCrmData(userId: string, clientSlug?: string, clientName?: string) {
  const saved = getSaved(userId);
  const savedUsernames = new Set(saved.freelancers.map((e) => e.id));

  const orders = readStoredOrders().filter(
    (o) => o.clientSlug === clientSlug || (clientName && o.client === clientName),
  );

  const byFreelancer = new Map<string, { spent: number; count: number; lastDate?: string }>();
  for (const o of orders) {
    const un = o.freelancerUsername;
    if (!un) continue;
    const cur = byFreelancer.get(un) ?? { spent: 0, count: 0 };
    cur.spent += o.amount;
    cur.count += 1;
    if (o.completedAt && (!cur.lastDate || o.completedAt > cur.lastDate)) {
      cur.lastDate = o.completedAt;
    }
    byFreelancer.set(un, cur);
  }

  const previouslyHired: CrmFreelancer[] = [];
  for (const [username, stats] of byFreelancer) {
    const f = freelancers.find((x) => x.username === username);
    if (!f) continue;
    previouslyHired.push({
      username,
      name: f.name,
      hue: f.hue,
      title: f.title,
      rating: f.rating,
      totalSpent: stats.spent,
      hireCount: stats.count,
      lastHireDate: stats.lastDate,
      saved: savedUsernames.has(username),
    });
  }

  const savedFreelancers: CrmFreelancer[] = saved.freelancers
    .map((e) => {
      const f = freelancers.find((x) => x.username === e.id);
      if (!f) return null;
      const stats = byFreelancer.get(e.id);
      return {
        username: f.username,
        name: f.name,
        hue: f.hue,
        title: f.title,
        rating: f.rating,
        totalSpent: stats?.spent ?? 0,
        hireCount: stats?.count ?? 0,
        lastHireDate: stats?.lastDate,
        saved: true,
      };
    })
    .filter(Boolean) as CrmFreelancer[];

  const topFreelancers = [...previouslyHired].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);

  return {
    savedFreelancers,
    previouslyHired: previouslyHired.sort((a, b) => (b.lastHireDate ?? "").localeCompare(a.lastHireDate ?? "")),
    topFreelancers,
    totalHires: orders.length,
    totalSpend: orders.reduce((s, o) => s + o.amount, 0),
  };
}

export function getFreelancerCrmData(username: string) {
  const orders = readStoredOrders().filter((o) => o.freelancerUsername === username);
  const session = getSession();
  const saved = session ? getSaved(session.user.id) : { freelancers: [], services: [], projects: [], portfolios: [] };

  const byClient = new Map<string, { paid: number; count: number; lastDate?: string; name: string; hue: number }>();
  for (const o of orders) {
    const key = o.clientSlug ?? o.client;
    const cur = byClient.get(key) ?? { paid: 0, count: 0, name: o.client, hue: o.clientHue };
    cur.paid += o.amount;
    cur.count += 1;
    if (o.completedAt && (!cur.lastDate || o.completedAt > cur.lastDate)) {
      cur.lastDate = o.completedAt;
    }
    byClient.set(key, cur);
  }

  const previousClients: CrmClient[] = [...byClient.entries()].map(([slug, stats]) => ({
    slug,
    name: stats.name,
    hue: stats.hue,
    totalPaid: stats.paid,
    orderCount: stats.count,
    lastOrderDate: stats.lastDate,
    isRepeat: stats.count >= 2,
  }));

  const repeatClients = previousClients.filter((c) => c.isRepeat);
  const topPaying = [...previousClients].sort((a, b) => b.totalPaid - a.totalPaid).slice(0, 5);

  const followUps = previousClients.filter(
    (c) => c.lastOrderDate && Date.now() - new Date(c.lastOrderDate).getTime() > 30 * 86400000,
  );

  return {
    previousClients: previousClients.sort((a, b) => (b.lastOrderDate ?? "").localeCompare(a.lastOrderDate ?? "")),
    repeatClients,
    topPaying,
    followUps,
    totalEarned: orders.filter((o) => o.status === "completed").reduce((s, o) => s + o.amount, 0),
    savedCount: saved.freelancers.length,
  };
}
