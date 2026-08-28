import "server-only";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { getServerEnv } from "@/lib/env";
import * as schema from "./schema";

/**
 * Database client (Neon serverless driver + Drizzle).
 *
 * The Neon serverless `Pool` works over WebSockets in serverless runtimes and
 * over TCP where available, so the same code path serves Vercel and Neon.
 *
 * The client is created lazily on first use (and memoized on `globalThis`),
 * so importing this module has no side effects and does not read env until a
 * query actually runs. This keeps module import safe in tooling/tests.
 */
export type Database = NeonDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  __qaPool?: Pool;
  __qaDb?: Database;
};

function createDb(): Database {
  const { DATABASE_URL } = getServerEnv();
  const pool =
    globalForDb.__qaPool ?? new Pool({ connectionString: DATABASE_URL });
  if (process.env.NODE_ENV !== "production") globalForDb.__qaPool = pool;
  return drizzle(pool, { schema, casing: "snake_case" });
}

function getDb(): Database {
  if (!globalForDb.__qaDb) globalForDb.__qaDb = createDb();
  return globalForDb.__qaDb;
}

/**
 * Proxy that initializes the real Drizzle client on first property access.
 * Consumers use `db` exactly like a normal Drizzle instance.
 */
export const db = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    const client = getDb();
    const value = Reflect.get(client as object, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export { schema };
