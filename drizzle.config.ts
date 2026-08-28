import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

// A placeholder lets `db:generate` (schema → SQL) run offline. Commands that
// actually connect (migrate/push/studio) fail clearly at connect time if the
// real DATABASE_URL is missing.
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://placeholder:placeholder@localhost:5432/placeholder";

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: { url: databaseUrl },
  strict: true,
  verbose: true,
});
