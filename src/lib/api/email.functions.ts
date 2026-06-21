import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerConfig } from "../config.server";

const outboxSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      to: z.string().email(),
      subject: z.string(),
      body: z.string(),
    }),
  ),
});

/** Process queued emails via Resend when RESEND_API_KEY is configured. */
export const processEmailOutbox = createServerFn({ method: "POST" })
  .validator(outboxSchema)
  .handler(async ({ data }) => {
    const config = getServerConfig();
    const apiKey = config.resendApiKey;
    const from = config.emailFrom;

    if (!apiKey) {
      return {
        ok: true,
        mode: "demo" as const,
        sent: 0,
        message: "RESEND_API_KEY yo'q — outbox demo rejimida",
      };
    }

    let sent = 0;
    const errors: string[] = [];

    for (const item of data.items) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: item.to,
            subject: item.subject,
            text: item.body,
          }),
        });
        if (res.ok) {
          sent += 1;
        } else {
          errors.push(`${item.id}: ${res.status}`);
        }
      } catch (err) {
        errors.push(`${item.id}: ${err instanceof Error ? err.message : "unknown"}`);
      }
    }

    return {
      ok: errors.length === 0,
      mode: "resend" as const,
      sent,
      errors,
    };
  });
