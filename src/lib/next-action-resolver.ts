import type { AuthUser } from "./auth";
import type { WorkspaceRole } from "./active-role-store";
import { getMyPublishedProjects } from "./projects-store";
import { getMyPublishedServices } from "./services-store";
import { getPublishedPortfoliosByUsername } from "./portfolio-store";
import { readStoredApplications } from "./applications-store";
import { getOrdersForUser, getOrdersForFreelancer } from "./orders-store";
import { getPendingProposalsForClient } from "./client-dashboard-utils";
import { getAgenciesForUser } from "./agency-store";
import { getCaseStudiesByAgency } from "./agency-portfolio-store";
import { adminStats } from "./admin-mock-data";
import {
  getPendingReviewOrders,
  getClientRepeatHireStats,
  getSavedFavoriteFreelancers,
} from "./ecosystem-progress";

export type NextAction = {
  title: string;
  description: string;
  href: string;
  cta: string;
  urgent?: boolean;
};

export function resolveContextualNextAction(
  user: AuthUser,
  role: WorkspaceRole,
): NextAction | null {
  if (role === "client") return resolveClientAction(user);
  if (role === "freelancer") return resolveFreelancerAction(user);
  if (role === "agency") return resolveAgencyAction(user);
  return null;
}

function resolveClientAction(user: AuthUser): NextAction {
  const pendingReviews = getPendingReviewOrders(user);
  if (pendingReviews.length > 0) {
    const o = pendingReviews[0]!;
    return {
      title: "Sharh qoldiring",
      description: `"${o.title}" yakunlandi — sharh ishonchingizni va keyingi yollashni oshiradi.`,
      href: `/orders/${o.id}`,
      cta: "Sharh yozish",
      urgent: true,
    };
  }

  const projects = getMyPublishedProjects(user.id);
  const pending = getPendingProposalsForClient(user);
  const orders = getOrdersForUser(
    user.id,
    user.username,
    user.companySlug,
    user.company ?? user.fullName,
  );
  const reviewOrders = orders.filter((o) => o.status === "review" || o.status === "revision");
  const activeOrders = orders.filter((o) => o.status === "in_progress");

  if (projects.length === 0) {
    return {
      title: "Birinchi loyihani joylang",
      description: "Frilanserlar taklif yuborishni boshlaydi — 24 soat ichida birinchi javoblar keladi.",
      href: "/projects/create",
      cta: "Loyiha joylash",
    };
  }
  if (pending.length > 0) {
    const first = pending[0]!;
    return {
      title: `${pending.length} ta yangi taklifni ko'rib chiqing`,
      description: `${first.freelancerName ?? "Frilanser"} — ${first.projectTitle} loyihasiga taklif yubordi.`,
      href: `/projects/${first.projectSlug ?? ""}`,
      cta: "Takliflarni ko'rish",
      urgent: true,
    };
  }
  if (reviewOrders.length > 0) {
    return {
      title: "Buyurtmani yakunlang",
      description: `${reviewOrders.length} ta buyurtma tasdiqlashingizni kutmoqda — to'lov frilanserga o'tadi.`,
      href: `/orders/${reviewOrders[0]!.id}`,
      cta: "Buyurtmani ko'rish",
      urgent: true,
    };
  }
  if (activeOrders.length > 0) {
    return {
      title: "Faol buyurtmalarni kuzating",
      description: `${activeOrders.length} ta buyurtma jarayonda — frilanser bilan aloqada bo'ling.`,
      href: "/orders",
      cta: "Buyurtmalarga o'tish",
      urgent: true,
    };
  }

  const repeat = getClientRepeatHireStats(user);
  if (repeat.priorFreelancerUsernames.length > 0) {
    const username = repeat.priorFreelancerUsernames[0]!;
    return {
      title: "Tanish frilanserni qayta yollang",
      description: "Oldingi hamkoringiz bilan tezroq yangi buyurtma oching.",
      href: `/freelancers/${username}`,
      cta: "Qayta yollash",
    };
  }

  const saved = getSavedFavoriteFreelancers(user.id);
  if (saved.length > 0) {
    return {
      title: "Saqlangan frilanserlarni ko'ring",
      description: `${saved.length} ta saqlangan mutaxassis — tez yollash uchun tayyor.`,
      href: `/freelancers/${saved[0]!.id}`,
      cta: "Profilni ko'rish",
    };
  }

  return {
    title: "Bozordan mutaxassis qidiring",
    description: "Kalit so'z, ko'nikma yoki kategoriya bo'yicha eng mos natijalar.",
    href: "/search",
    cta: "Qidiruvni boshlash",
  };
}

function resolveFreelancerAction(user: AuthUser): NextAction {
  const username = user.username ?? "";
  const pendingReviews = getPendingReviewOrders(user);
  if (pendingReviews.length > 0) {
    const o = pendingReviews[0]!;
    return {
      title: "Sharh qoldiring",
      description: `"${o.title}" yakunlandi — sharh reytingingizni va ko'rinishni oshiradi.`,
      href: `/orders/${o.id}`,
      cta: "Sharh yozish",
      urgent: true,
    };
  }

  const portfolios = username ? getPublishedPortfoliosByUsername(username) : [];
  const services = getMyPublishedServices(user.id);
  const apps = readStoredApplications().filter(
    (a) => !a.archived && a.freelancerUsername === username,
  );
  const pending = apps.filter((a) => a.status === "pending" || a.status === "shortlisted");
  const orders = username ? getOrdersForFreelancer(username) : [];
  const activeOrders = orders.filter(
    (o) => o.status === "in_progress" || o.status === "review" || o.status === "revision",
  );

  if (portfolios.length === 0) {
    return {
      title: "Portfolio yarating",
      description: "Ish natijalaringizni ko'rsating — ishonch balli +8 ga oshadi va mijozlar sizni tanlaydi.",
      href: "/portfolio/create",
      cta: "Portfolio yaratish",
    };
  }
  if (services.length === 0) {
    return {
      title: "Xizmat paketi yarating",
      description: "Tayyor xizmat bilan passiv daromad oling — mijozlar to'g'ridan-to'g'ri sotib olishadi.",
      href: "/services/create",
      cta: "Xizmat yaratish",
    };
  }
  if (activeOrders.length > 0) {
    const deliver = activeOrders.find((o) => o.status === "in_progress" || o.status === "revision");
    const target = deliver ?? activeOrders[0]!;
    return {
      title: deliver ? "Buyurtmani bajaring" : "Faol buyurtmani ko'ring",
      description: `${activeOrders.length} ta buyurtma jarayonda — muddatga rioya qiling va natija yuboring.`,
      href: `/orders/${target.id}`,
      cta: "Buyurtmaga o'tish",
      urgent: true,
    };
  }
  if (pending.length > 0) {
    return {
      title: "Kutilayotgan arizalarni kuzating",
      description: `${pending.length} ta taklif javob kutmoqda — mijoz tezda qaror qiladi.`,
      href: "/applications",
      cta: "Arizalarim",
    };
  }
  if (apps.length === 0) {
    return {
      title: "Loyihaga taklif yuboring",
      description: "Ochiq loyihalarni ko'ring va AI yordamida professional taklif yozing.",
      href: "/projects",
      cta: "Ish topish",
    };
  }
  return {
    title: "Yangi loyihalarni ko'ring",
    description: "Ko'nikmalaringizga mos loyihalar — har kuni yangi imkoniyatlar qo'shiladi.",
    href: "/projects",
    cta: "Loyihalarni ko'rish",
  };
}

function resolveAgencyAction(user: AuthUser): NextAction {
  const agencies = getAgenciesForUser(user.id);
  const agency = agencies[0];

  if (!agency) {
    return {
      title: "Agentlik yarating",
      description: "Jamoa, portfolio va mijozlar bilan professional agentlik markazini boshlang.",
      href: "/agencies/create",
      cta: "Agentlik yaratish",
    };
  }

  const activeMembers = agency.members.filter((m) => m.status === "active").length;
  const caseStudies = getCaseStudiesByAgency(agency.slug);

  if (agency.status === "draft") {
    return {
      title: "Agentlikni e'lon qiling",
      description: "Profil to'ldirilgach e'lon qiling — mijozlar agentlikni topa boshlaydi.",
      href: "/dashboard/agency",
      cta: "E'lon qilish",
    };
  }
  if (activeMembers < 2) {
    return {
      title: "Jamoa a'zolarini qo'shing",
      description: "Kamida 2 ta faol a'zo tasdiqlangan daraja va ishonch uchun kerak.",
      href: "/dashboard/agency",
      cta: "Jamoa taklif qilish",
    };
  }
  if (caseStudies.length === 0) {
    return {
      title: "Portfolio hikoyasi qo'shing",
      description: "Muvaffaqiyatli loyihalarni ko'rsating — agentlik ishonchini oshiradi.",
      href: "/dashboard/agency",
      cta: "Portfolio qo'shish",
    };
  }
  return {
    title: "Mijozlar bilan ishlang",
    description: "CRM orqali loyihalar, buyurtmalar va jamoa faolligini boshqaring.",
    href: "/agency/clients",
    cta: "CRM ga o'tish",
  };
}

export function resolveAdminNextAction(): NextAction {
  if (adminStats.verificationRequests > 0) {
    return {
      title: `${adminStats.verificationRequests} ta tasdiqlash so'rovi`,
      description: "Kutilayotgan tasdiqlashlarni ko'rib chiqing — foydalanuvchilar javob kutmoqda.",
      href: "/admin/verifications",
      cta: "Ko'rib chiqish",
    };
  }
  if (adminStats.disputes > 0) {
    return {
      title: `${adminStats.disputes} ta ochiq nizo`,
      description: "Nizolarni tezda hal qiling — platforma ishonchi shu yerda shakllanadi.",
      href: "/admin/disputes",
      cta: "Nizolarni ko'rish",
    };
  }
  return {
    title: "Platform faolligini kuzating",
    description: "Audit jurnali va analitika orqali tizim holatini nazorat qiling.",
    href: "/admin/audit",
    cta: "Audit jurnali",
  };
}
