import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

/**
 * Database connection — LibSQL/SQLite.
 *
 * Local dev:  file:./local.db (zero setup, persistent on disk)
 * Production: Turso (libsql://…) via TURSO_DATABASE_URL + TURSO_AUTH_TOKEN.
 *             Turso runs on the free tier and works with serverless/Netlify.
 *
 * A single client instance is cached across hot reloads in dev.
 */

const url =
  process.env.TURSO_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "file:./local.db";

const authToken = process.env.TURSO_AUTH_TOKEN;

const globalForDb = globalThis as unknown as {
  __restaurantDbClient?: ReturnType<typeof createClient>;
};

export const client =
  globalForDb.__restaurantDbClient ??
  createClient({
    url,
    authToken,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__restaurantDbClient = client;
}

export const db = drizzle(client, { schema });
export { schema };
