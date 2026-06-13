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
  { id: "al1", who: "Sardor M.", what: "Nargiza Akhmedova tasdiqlashini tasdiqladi", when: "2 daqiqa oldin", category: "admin", target: "f1" },
  { id: "al2", who: "Tizim", what: "Eskrou to'ldirildi — Fintech App Redesign uchun $6,000", when: "12 daqiqa oldin", category: "escrow", target: "ew1" },
  { id: "al3", who: "Aisha K.", what: "Bosqich mablag'lari chiqarildi — Brand Identity $400", when: "1 soat oldin", category: "escrow", target: "ew2" },
  { id: "al4", who: "Daniyar B.", what: "Yechib olish so'rovi rad etildi — Uzcard $3,000", when: "2 soat oldin", category: "payment", target: "t6" },
  { id: "al5", who: "Laylo R.", what: "Foydalanuvchi hisobi to'xtatildi — spam arizalar", when: "3 soat oldin", category: "moderation", target: "u-spam" },
  { id: "al6", who: "Tizim", what: "Yangi ro'yxatdan o'tish — Dilnoza Kim (freelancer)", when: "4 soat oldin", category: "user", target: "f3" },
  { id: "al7", who: "Bobur N.", what: "Nizo hal qilindi — to'lov 60/40 bo'lib taqsimlandi", when: "5 soat oldin", category: "escrow", target: "ew4" },
  { id: "al8", who: "Elena V.", what: "Loyiha e'lon tasdiqlandi — Series A Pitch Deck", when: "6 soat oldin", category: "moderation", target: "p3" },
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
    when: "Hozirgina",
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
    const msg = opts.successMessage ?? `${opts.action} muvaffaqiyatli bajarildi`;
    toast.success(msg);
    return { success: true, message: msg };
  } catch {
    const msg = opts.errorMessage ?? `${opts.action.toLowerCase()} bajarilmadi`;
    toast.error(msg);
    return { success: false, message: msg };
  }
}
