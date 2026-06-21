/** Email lifecycle outbox — demo queue for future Resend integration. */

export type EmailTemplate =
  | "welcome"
  | "verification"
  | "order_update"
  | "review_request"
  | "re_engagement";

export type EmailOutboxItem = {
  id: string;
  template: EmailTemplate;
  to: string;
  subject: string;
  body: string;
  createdAt: number;
  status: "queued" | "sent" | "failed";
  metadata?: Record<string, string>;
};

const OUTBOX_KEY = "ishbor-email-outbox";

function readOutbox(): EmailOutboxItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(OUTBOX_KEY);
    return raw ? (JSON.parse(raw) as EmailOutboxItem[]) : [];
  } catch {
    return [];
  }
}

function writeOutbox(items: EmailOutboxItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(OUTBOX_KEY, JSON.stringify(items.slice(-200)));
}

function enqueue(item: Omit<EmailOutboxItem, "id" | "createdAt" | "status">): void {
  const outbox = readOutbox();
  outbox.push({
    ...item,
    id: `email-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    status: "queued",
  });
  writeOutbox(outbox);
}

export function getEmailOutbox(): EmailOutboxItem[] {
  return readOutbox().sort((a, b) => b.createdAt - a.createdAt);
}

export function queueWelcomeEmail(to: string, name: string): void {
  enqueue({
    template: "welcome",
    to,
    subject: "Ishbor'ga xush kelibsiz!",
    body: `Salom ${name}! Ishbor'da xavfsiz eskrou va mahalliy to'lovlar bilan ish toping yoki ijrochi toping.`,
    metadata: { name },
  });
}

export function queueVerificationEmail(to: string, code: string): void {
  enqueue({
    template: "verification",
    to,
    subject: "Ishbor tasdiqlash kodi",
    body: `Tasdiqlash kodingiz: ${code}. Kod 10 daqiqa amal qiladi.`,
    metadata: { code },
  });
}

export function queueOrderUpdateEmail(
  to: string,
  orderTitle: string,
  status: string,
): void {
  enqueue({
    template: "order_update",
    to,
    subject: `Buyurtma yangilandi: ${orderTitle}`,
    body: `"${orderTitle}" buyurtmasi holati: ${status}. Ishbor'da batafsil ko'ring.`,
    metadata: { orderTitle, status },
  });
}

export function queueReviewRequestEmail(to: string, targetName: string): void {
  enqueue({
    template: "review_request",
    to,
    subject: "Tajribangizni baholang",
    body: `${targetName} bilan ishingiz yakunlandi. Iltimos, sharh qoldiring — bu boshqalarga yordam beradi.`,
    metadata: { targetName },
  });
}

export function queueReEngagementEmail(to: string, name: string): void {
  enqueue({
    template: "re_engagement",
    to,
    subject: "Ishbor'da yangi imkoniyatlar",
    body: renderEmailText(`Salom ${name}!`, `Sizni sog'indik. Yangi loyihalar va xizmatlar sizni kutmoqda.`),
    metadata: { name },
  });
}

export function queueNotificationEmail(to: string, title: string, body: string): void {
  enqueue({
    template: "order_update",
    to,
    subject: title,
    body: renderEmailText(title, body),
    metadata: { kind: "notification" },
  });
}

function renderEmailText(title: string, body: string): string {
  return `${title}\n\n${body}\n\n— Ishbor jamoasi\nhttps://ishbor.uz`;
}

export function markEmailStatus(id: string, status: EmailOutboxItem["status"]): void {
  const outbox = readOutbox();
  writeOutbox(outbox.map((e) => (e.id === id ? { ...e, status } : e)));
}

/** Flush queued emails to Resend when API key is configured on server. */
export async function flushEmailOutbox(): Promise<{ sent: number; mode: string }> {
  const queued = readOutbox().filter((e) => e.status === "queued");
  if (queued.length === 0) return { sent: 0, mode: "empty" };

  try {
    const { processEmailOutbox } = await import("./api/email.functions");
    const { callServerFn } = await import("./api-client");
    const result = await callServerFn(
      () =>
        processEmailOutbox({
          data: {
            items: queued.map((e) => ({
              id: e.id,
              to: e.to,
              subject: e.subject,
              body: e.body,
            })),
          },
        }),
      { label: "processEmailOutbox" },
    );
    if (result.sent > 0) {
      for (const item of queued.slice(0, result.sent)) {
        markEmailStatus(item.id, "sent");
      }
    }
    return { sent: result.sent, mode: result.mode };
  } catch {
    return { sent: 0, mode: "error" };
  }
}
