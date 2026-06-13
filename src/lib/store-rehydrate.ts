import { rehydrateFromStorage as rehydrateOrders } from "./orders-store";
import { rehydrateFromStorage as rehydrateProjects } from "./projects-store";
import { rehydrateFromStorage as rehydrateServices } from "./services-store";
import { rehydrateFromStorage as rehydratePortfolios } from "./portfolio-store";
import { rehydrateFromStorage as rehydrateEscrow } from "./escrow-store";
import { rehydrateFromStorage as rehydrateApplications } from "./applications-store";
import { rehydrateFromStorage as rehydrateReviews } from "./reviews-store";
import { rehydrateFromStorage as rehydrateNotifications } from "./notifications-store";
import { rehydrateFromStorage as rehydrateMessages } from "./messages-store";
import { rehydrateFromStorage as rehydrateAgencies } from "./agency-store";

/** Flush in-memory store caches after direct localStorage writes (stress seed, imports). */
export function rehydrateAllStores(userId?: string) {
  rehydrateOrders();
  rehydrateProjects();
  rehydrateServices();
  rehydratePortfolios();
  rehydrateEscrow();
  rehydrateApplications();
  rehydrateReviews();
  rehydrateNotifications();
  rehydrateMessages(userId);
  rehydrateAgencies();
}
