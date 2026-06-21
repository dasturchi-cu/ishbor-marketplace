import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";

import * as schema from "./schema";

type Db = PostgresJsDatabase<typeof schema>;

let queryClient: ReturnType<typeof postgres> | null = null;
let dbInstance: Db | null = null;

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getDb(): Db {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL is not configured");
  }
  if (!queryClient) {
    queryClient = postgres(url, { max: 10, prepare: false });
  }
  if (!dbInstance) {
    dbInstance = drizzle(queryClient, { schema });
  }
  return dbInstance;
}

export async function pingDatabase(): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;
  try {
    const db = getDb();
    await db.execute(sql`SELECT 1`);
    return true;
  } catch (error) {
    console.error("[db] ping failed:", error);
    return false;
  }
}

export { schema };
