export type AdminRole = "super_admin" | "finance_admin" | "support_admin" | "moderator";

export type AdminSection =
  | "dashboard"
  | "users"
  | "verifications"
  | "projects"
  | "services"
  | "orders"
  | "applications"
  | "escrow"
  | "disputes"
  | "payments"
  | "moderation"
  | "support"
  | "analytics"
  | "audit"
  | "system";

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  finance_admin: "Finance Admin",
  support_admin: "Support Admin",
  moderator: "Moderator",
};

const ROLE_PERMISSIONS: Record<AdminRole, AdminSection[]> = {
  super_admin: [
    "dashboard", "users", "verifications", "projects", "services", "orders",
    "applications", "escrow", "disputes", "payments", "moderation", "support",
    "analytics", "audit", "system",
  ],
  finance_admin: ["dashboard", "orders", "escrow", "disputes", "payments", "analytics", "audit"],
  support_admin: ["dashboard", "users", "verifications", "orders", "escrow", "disputes", "support", "audit"],
  moderator: ["dashboard", "projects", "services", "orders", "applications", "moderation", "audit"],
};

export function canAccessSection(role: AdminRole, section: AdminSection): boolean {
  return ROLE_PERMISSIONS[role].includes(section);
}

export function getAccessibleSections(role: AdminRole): AdminSection[] {
  return ROLE_PERMISSIONS[role];
}
