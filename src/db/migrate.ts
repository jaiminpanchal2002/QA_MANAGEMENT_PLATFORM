/* eslint-disable no-console */
/**
 * Standalone migration runner: `pnpm db:migrate`.
 *
 * Applies all generated SQL migrations in src/db/migrations. Uses the Neon
 * serverless Pool over WebSockets (Node 20+ ships a global WebSocket).
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";

async function main() {
  const connectionString =
    process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to run migrations.");
  }

  // Node 20+ (and Vercel) ship a global WebSocket used by the Neon driver.
  if (typeof (globalThis as { WebSocket?: unknown }).WebSocket === "function") {
    neonConfig.webSocketConstructor = (
      globalThis as unknown as { WebSocket: unknown }
    ).WebSocket as never;
  } else {
    throw new Error(
      "No global WebSocket found. Run migrations on Node 20+ (or supply a WebSocket polyfill)."
    );
  }

  const pool = new Pool({ connectionString });
  const db = drizzle(pool);

  console.log("Running migrations...");
  await migrate(db, { migrationsFolder: "./src/db/migrations" });
  console.log("Migrations applied successfully.");
  await pool.end();
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
