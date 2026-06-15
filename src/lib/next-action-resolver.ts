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

export type NextAction = {
  title: string;
  description: string;
  href: string;
  cta: string;
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
    };
  }
  if (reviewOrders.length > 0) {
    return {
      title: "Buyurtmani yakunlang",
      description: `${reviewOrders.length} ta buyurtma tasdiqlashingizni kutmoqda — to'lov frilanserga o'tadi.`,
      href: `/orders/${reviewOrders[0]!.id}`,
      cta: "Buyurtmani ko'rish",
    };
  }
  if (activeOrders.length > 0) {
    return {
      title: "Faol buyurtmalarni kuzating",
      description: `${activeOrders.length} ta buyurtma jarayonda — frilanser bilan aloqada bo'ling.`,
      href: "/orders",
      cta: "Buyurtmalarga o'tish",
    };
  }
  return {
    title: "Frilanser yollang",
    description: "Tasdiqlangan mutaxassislarni toping yoki saqlangan frilanserlaringizni ko'ring.",
    href: "/freelancers",
    cta: "Frilanser topish",
  };
}

function resolveFreelancerAction(user: AuthUser): NextAction {
  const username = user.username ?? "";
  const portfolios = username ? getPublishedPortfoliosByUsername(username) : [];
  const services = getMyPublishedServices(user.id);
  const apps = readStoredApplications().filter(
    (a) => !a.archived && a.freelancerUsername === username,
  );
  const pending = apps.filter((a) => a.status === "pending" || a.status === "shortlisted");
  const orders = username ? getOrdersForFreelancer(username) : [];
  const activeOrders = orders.filter((o) => o.status === "in_progress" || o.status === "review");

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
  if (pending.length > 0) {
    return {
      title: "Kutilayotgan arizalarni kuzating",
      description: `${pending.length} ta taklif javob kutmoqda — mijoz tezda qaror qiladi.`,
      href: "/applications",
      cta: "Arizalarim",
    };
  }
  if (activeOrders.length > 0) {
    return {
      title: "Faol buyurtmani bajaring",
      description: `${activeOrders.length} ta buyurtma jarayonda — muddatga rioya qiling va natija yuboring.`,
      href: `/orders/${activeOrders[0]!.id}`,
      cta: "Buyurtmaga o'tish",
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
