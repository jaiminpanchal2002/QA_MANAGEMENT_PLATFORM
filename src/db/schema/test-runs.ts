import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { organizations } from "./organizations";
import { projects } from "./projects";
import { testPlans } from "./test-plans";
import { testCases } from "./test-cases";
import {
  executionStatus,
  integrationProvider,
  testRunStatus,
  timestamps,
} from "./_shared";

/**
 * A test run is an execution instance of a plan or an ad-hoc set of cases.
 * Automated runs reference a provider and store an external job id so the
 * automation adapter can poll status / collect results asynchronously.
 */
export const testRuns = pgTable(
  "test_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    testPlanId: uuid("test_plan_id").references(() => testPlans.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    environment: text("environment"),
    status: testRunStatus("status").notNull().default("NOT_STARTED"),
    isAutomated: text("is_automated"),
    provider: integrationProvider("provider"),
    externalJobId: text("external_job_id"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    ...timestamps,
  },
  (t) => ({
    orgIdx: index("test_runs_org_idx").on(t.organizationId),
    projectIdx: index("test_runs_project_idx").on(t.projectId),
    statusIdx: index("test_runs_status_idx").on(t.status),
    createdAtIdx: index("test_runs_created_at_idx").on(t.createdAt),
  })
);

/**
 * A single test case execution within a run. Stores the concrete result,
 * environment/browser, timing, logs and artifact metadata (screenshots/video
 * live in Blob storage; only references are stored here).
 */
export const testExecutions = pgTable(
  "test_executions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    testRunId: uuid("test_run_id")
      .notNull()
      .references(() => testRuns.id, { onDelete: "cascade" }),
    testCaseId: uuid("test_case_id")
      .notNull()
      .references(() => testCases.id, { onDelete: "cascade" }),
    status: executionStatus("status").notNull().default("NOT_EXECUTED"),
    environment: text("environment"),
    browser: text("browser"),
    device: text("device"),
    durationMs: integer("duration_ms"),
    executedBy: text("executed_by").references(() => user.id, {
      onDelete: "set null",
    }),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    errorMessage: text("error_message"),
    logs: text("logs"),
    /** Artifact references: [{ type, url, name }]. Files live in Blob. */
    artifacts: jsonb("artifacts")
      .$type<Array<{ type: string; url: string; name: string }>>()
      .notNull()
      .default([]),
    comment: text("comment"),
    ...timestamps,
  },
  (t) => ({
    orgIdx: index("test_executions_org_idx").on(t.organizationId),
    runIdx: index("test_executions_run_idx").on(t.testRunId),
    caseIdx: index("test_executions_case_idx").on(t.testCaseId),
    statusIdx: index("test_executions_status_idx").on(t.status),
  })
);

export type TestRun = typeof testRuns.$inferSelect;
export type TestExecution = typeof testExecutions.$inferSelect;
