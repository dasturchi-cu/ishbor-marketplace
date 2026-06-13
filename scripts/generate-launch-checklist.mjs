import fs from "fs";

const routes = {
  guest: [
    "/", "/login", "/register", "/forgot-password", "/reset-password",
    "/verify-email", "/verify-otp", "/terms", "/privacy", "/pricing",
    "/services", "/services/$slug", "/projects", "/projects/$slug",
    "/freelancers", "/freelancers/$username", "/agencies", "/agencies/$slug",
    "/portfolio/$slug", "/clients/$company", "/welcome", "/onboarding",
  ],
  client: [
    "/dashboard", "/my-projects", "/projects/create", "/checkout",
    "/orders", "/orders/$id", "/escrow", "/escrow/$id", "/clients/manage",
    "/analytics/client", "/wallet", "/messages", "/notifications",
    "/settings", "/saved", "/subscription", "/profile",
  ],
  freelancer: [
    "/dashboard/freelancer", "/my-services", "/services/create",
    "/applications", "/applications/$id", "/portfolio", "/portfolio/create",
    "/portfolio/edit/$slug", "/freelancers/manage", "/analytics/freelancer",
    "/promotions", "/ai", "/ai/proposal-assistant", "/ai/project-generator",
    "/ai/portfolio-optimizer", "/ai/trust-coach", "/ai/onboarding",
  ],
  agency: ["/agencies/create", "/dashboard/agency", "/agency/clients"],
  admin: [
    "/admin", "/admin/users", "/admin/users/$id", "/admin/verifications",
    "/admin/projects", "/admin/services", "/admin/portfolios", "/admin/orders",
    "/admin/escrow", "/admin/escrow/$id", "/admin/disputes", "/admin/payments",
    "/admin/moderation", "/admin/support", "/admin/analytics", "/admin/audit",
    "/admin/system", "/admin/founder", "/admin/ai", "/revenue",
  ],
};

const checks = [
  "loads without crash",
  "correct access for role",
  "primary CTA works",
  "secondary CTA works",
  "empty state has CTA",
  "mobile layout OK (375px)",
  "no dead buttons",
  "forms validate",
  "error state shown",
  "success feedback shown",
];

const global = [
  "Build passes (npm run build)",
  "No console errors on home",
  "AuthGate redirects guest from /dashboard",
  "RoleGate blocks client from /my-services",
  "RoleGate blocks freelancer from /checkout",
  "AdminOnlyGate blocks non-admin from /admin",
  "Stress seed runs (100 notifications)",
  "Notifications pagination works",
  "Messages list pagination works",
  "Wallet CSV export downloads",
  "Package save persists to /saved",
  "Cross-tab logout syncs",
  "No infinite render on /notifications",
  "No infinite render on /analytics/client",
  "Entity 404 for fake order id",
  "Entity 404 for fake agency slug",
  "Login redirect preserves deep link",
  "Logout clears session",
  "Role switcher persists in localStorage",
  "O'zbek copy on all toasts",
];

const modals = [
  "DepositModal", "WithdrawModal", "SendOfferModal", "EscrowActionModal",
  "FileAttachModal", "EmojiPickerModal", "ChangePasswordModal", "TwoFactorModal",
  "VerificationUploadModal", "Payment modals", "confirmDestructive", "Admin confirm",
];

const lines = [
  "# LAUNCH_CHECKLIST.md",
  "",
  "**Ishbor pre-launch verification checklist**",
  "",
  "Check each item before release. Role = minimum persona required.",
  "",
  "## Global platform",
  "",
];

let count = 0;
for (const g of global) {
  lines.push(`- [ ] **GLOBAL** — ${g}`);
  count++;
}

for (const [role, paths] of Object.entries(routes)) {
  lines.push("", `## ${role.charAt(0).toUpperCase() + role.slice(1)} routes`, "");
  for (const path of paths) {
    for (const check of checks) {
      lines.push(`- [ ] **${role.toUpperCase()}** \`${path}\` — ${check}`);
      count++;
    }
  }
}

lines.push("", "## Modals & dialogs", "");
for (const m of modals) {
  for (const c of ["opens", "closes on cancel", "primary action mutates state", "mobile usable", "focus visible"]) {
    lines.push(`- [ ] **MODAL** \`${m}\` — ${c}`);
    count++;
  }
}

lines.push("", "---", "", `**Total checklist items: ${count}**`, "");

fs.writeFileSync("docs/LAUNCH_CHECKLIST.md", lines.join("\n"));
console.log("Generated", count, "items");
