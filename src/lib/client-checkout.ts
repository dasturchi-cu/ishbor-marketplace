import { getSession } from "./auth";
import { getActiveRole, setActiveRole } from "./active-role-store";

export type ClientCheckoutSearch = {
  type?: "service" | "hire" | "order";
  service?: string;
  freelancer?: string;
  project?: string;
  order?: string;
  package?: "essential" | "premium" | "enterprise";
};

/** Switch to client role before checkout — hire/order is a client action. */
export function ensureClientRoleForCheckout(): void {
  if (getSession() && getActiveRole() !== "client") {
    setActiveRole("client");
  }
}

export function buildCheckoutRedirectPath(search: ClientCheckoutSearch): string {
  const params = new URLSearchParams();
  if (search.type) params.set("type", search.type);
  if (search.service) params.set("service", search.service);
  if (search.freelancer) params.set("freelancer", search.freelancer);
  if (search.project) params.set("project", search.project);
  if (search.order) params.set("order", search.order);
  if (search.package) params.set("package", search.package);
  const qs = params.toString();
  return `/checkout${qs ? `?${qs}` : ""}`;
}
