import {
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { organizations } from "./organizations";
import { projects } from "./projects";
import { testCases } from "./test-cases";
import { testPlanStatus, timestamps, softDelete } from "./_shared";

/**
 * A test plan represents a testing objective / release cycle
 * (e.g. "Release 2.4 Regression"). Test cases are attached via plan items.
 */
export const testPlans = pgTable(
  "test_plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    version: text("version"),
    environment: text("environment"),
    status: testPlanStatus("status").notNull().default("DRAFT"),
    startDate: timestamp("start_date", { withTimezone: true }),
    endDate: timestamp("end_date", { withTimezone: true }),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    ...timestamps,
    ...softDelete,
  },
  (t) => ({
    orgIdx: index("test_plans_org_idx").on(t.organizationId),
    projectIdx: index("test_plans_project_idx").on(t.projectId),
    statusIdx: index("test_plans_status_idx").on(t.status),
  })
);

/** Test cases included in a plan. */
export const testPlanItems = pgTable(
  "test_plan_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    testPlanId: uuid("test_plan_id")
      .notNull()
      .references(() => testPlans.id, { onDelete: "cascade" }),
    testCaseId: uuid("test_case_id")
      .notNull()
      .references(() => testCases.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (t) => ({
    uniquePair: unique("test_plan_items_unique").on(
      t.testPlanId,
      t.testCaseId
    ),
    planIdx: index("test_plan_items_plan_idx").on(t.testPlanId),
  })
);

export type TestPlan = typeof testPlans.$inferSelect;
