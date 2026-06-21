import { createServerFn } from "@tanstack/react-start";

import { getServerConfig } from "../config.server";

export const getHealth = createServerFn({ method: "GET" }).handler(async () => {
  const config = getServerConfig();
  let database: "connected" | "unconfigured" | "error" = "unconfigured";

  if (config.databaseUrl) {
    try {
      const { pingDatabase } = await import("../../../server/db/index");
      database = (await pingDatabase()) ? "connected" : "error";
    } catch {
      database = "error";
    }
  }

  const email: "configured" | "demo" = config.resendApiKey ? "configured" : "demo";
  const observability: "configured" | "demo" = config.sentryDsn ? "configured" : "demo";

  return {
    status: database === "error" ? "degraded" : "ok",
    version: "1.0.0",
    environment: config.nodeEnv ?? "development",
    database,
    email,
    observability,
    timestamp: new Date().toISOString(),
  };
});

export const getReady = createServerFn({ method: "GET" }).handler(async () => {
  const config = getServerConfig();
  if (!config.databaseUrl) {
    return { ready: true, mode: "demo" as const };
  }
  try {
    const { pingDatabase } = await import("../../../server/db/index");
    const ok = await pingDatabase();
    return { ready: ok, mode: "database" as const };
  } catch {
    return { ready: false, mode: "database" as const };
  }
});
