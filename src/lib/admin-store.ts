import { toast } from "sonner";

export type AuditCategory = "user" | "admin" | "escrow" | "payment" | "moderation" | "system";

export type AuditEntry = {
  id: string;
  who: string;
  what: string;
  when: string;
  category: AuditCategory;
  target?: string;
};

let auditLog: AuditEntry[] = [
  { id: "al1", who: "Sardor M.", what: "Approved verification for Nargiza Akhmedova", when: "2m ago", category: "admin", target: "f1" },
  { id: "al2", who: "System", what: "Escrow funded — $6,000 for Fintech App Redesign", when: "12m ago", category: "escrow", target: "ew1" },
  { id: "al3", who: "Aisha K.", what: "Released milestone funds — $400 Brand Identity", when: "1h ago", category: "escrow", target: "ew2" },
  { id: "al4", who: "Daniyar B.", what: "Rejected withdrawal request — $3,000 Uzcard", when: "2h ago", category: "payment", target: "t6" },
  { id: "al5", who: "Laylo R.", what: "Suspended user account — spam applications", when: "3h ago", category: "moderation", target: "u-spam" },
  { id: "al6", who: "System", what: "New registration — Dilnoza Kim (freelancer)", when: "4h ago", category: "user", target: "f3" },
  { id: "al7", who: "Bobur N.", what: "Resolved dispute — split payment 60/40", when: "5h ago", category: "escrow", target: "ew4" },
  { id: "al8", who: "Elena V.", what: "Approved project listing — Series A Pitch Deck", when: "6h ago", category: "moderation", target: "p3" },
];

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

export function subscribeAudit(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getAuditLog(): AuditEntry[] {
  return [...auditLog];
}

export function addAuditEntry(entry: Omit<AuditEntry, "id" | "when">) {
  const newEntry: AuditEntry = {
    ...entry,
    id: `al-${Date.now()}`,
    when: "Just now",
  };
  auditLog = [newEntry, ...auditLog].slice(0, 200);
  notify();
  return newEntry;
}

export type AdminActionResult = { success: boolean; message: string };

export function performAdminAction(opts: {
  action: string;
  target: string;
  who: string;
  category: AuditCategory;
  onExecute?: () => void | Promise<void>;
  successMessage?: string;
  errorMessage?: string;
}): AdminActionResult {
  try {
    opts.onExecute?.();
    addAuditEntry({
      who: opts.who,
      what: opts.action,
      category: opts.category,
      target: opts.target,
    });
    const msg = opts.successMessage ?? `${opts.action} completed successfully`;
    toast.success(msg);
    return { success: true, message: msg };
  } catch {
    const msg = opts.errorMessage ?? `Failed to ${opts.action.toLowerCase()}`;
    toast.error(msg);
    return { success: false, message: msg };
  }
}
