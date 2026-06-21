import { createServerFn } from "@tanstack/react-start";

import { getServerConfig } from "../config.server";

/** Lightweight metrics endpoint (Prometheus-compatible text when requested). */
export const getMetrics = createServerFn({ method: "GET" }).handler(async () => {
  const config = getServerConfig();
  const uptimeSec = Math.floor(process.uptime());

  const lines = [
    "# HELP ishbor_up Process is running",
    "# TYPE ishbor_up gauge",
    "ishbor_up 1",
    "# HELP ishbor_uptime_seconds Process uptime",
    "# TYPE ishbor_uptime_seconds counter",
    `ishbor_uptime_seconds ${uptimeSec}`,
    "# HELP ishbor_database_configured Database URL present",
    "# TYPE ishbor_database_configured gauge",
    `ishbor_database_configured ${config.databaseUrl ? 1 : 0}`,
    "# HELP ishbor_email_configured Resend API key present",
    "# TYPE ishbor_email_configured gauge",
    `ishbor_email_configured ${config.resendApiKey ? 1 : 0}`,
    "# HELP ishbor_sentry_configured Sentry DSN present",
    "# TYPE ishbor_sentry_configured gauge",
    `ishbor_sentry_configured ${config.sentryDsn ? 1 : 0}`,
  ];

  return {
    contentType: "text/plain; version=0.0.4",
    body: lines.join("\n") + "\n",
  };
});
