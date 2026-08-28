/**
 * Barrel export of the full database schema. Drizzle Kit reads this file
 * (see drizzle.config.ts) to generate migrations, and the app imports tables
 * from here.
 */
export * from "./_shared";
export * from "./auth";
export * from "./organizations";
export * from "./projects";
export * from "./requirements";
export * from "./test-cases";
export * from "./test-plans";
export * from "./test-runs";
export * from "./defects";
export * from "./collaboration";
export * from "./audit";
export * from "./integrations";
