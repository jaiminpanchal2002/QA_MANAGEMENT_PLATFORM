import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { organizations } from "./organizations";
import { projects } from "./projects";
import { requirements } from "./requirements";
import {
  automationStatus,
  priority,
  severity,
  testCaseStatus,
  testCaseType,
  timestamps,
  softDelete,
} from "./_shared";

/**
 * Test suites organize test cases (Regression, Smoke, ...). A test case can
 * belong to many suites via the join table — no duplicate case records.
 */
export const testSuites = pgTable(
  "test_suites",
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
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    ...timestamps,
    ...softDelete,
  },
  (t) => ({
    uniqueName: unique("test_suites_project_name_unique").on(
      t.projectId,
      t.name
    ),
    orgIdx: index("test_suites_org_idx").on(t.organizationId),
    projectIdx: index("test_suites_project_idx").on(t.projectId),
  })
);

export const testCases = pgTable(
  "test_cases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    /** Per-project sequence number, e.g. 1 -> SHOP-TC-001. */
    seq: integer("seq").notNull(),
    reference: text("reference").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    preconditions: text("preconditions"),
    expectedResult: text("expected_result"),
    priority: priority("priority").notNull().default("MEDIUM"),
    severity: severity("severity").notNull().default("MINOR"),
    status: testCaseStatus("status").notNull().default("DRAFT"),
    type: testCaseType("type").notNull().default("FUNCTIONAL"),
    automationStatus: automationStatus("automation_status")
      .notNull()
      .default("MANUAL"),
    component: text("component"),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    requirementId: uuid("requirement_id").references(() => requirements.id, {
      onDelete: "set null",
    }),
    assignedTo: text("assigned_to").references(() => user.id, {
      onDelete: "set null",
    }),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    updatedBy: text("updated_by").references(() => user.id, {
      onDelete: "set null",
    }),
    ...timestamps,
    ...softDelete,
  },
  (t) => ({
    uniqueRef: unique("test_cases_project_ref_unique").on(
      t.projectId,
      t.reference
    ),
    orgIdx: index("test_cases_org_idx").on(t.organizationId),
    projectIdx: index("test_cases_project_idx").on(t.projectId),
    statusIdx: index("test_cases_status_idx").on(t.status),
    priorityIdx: index("test_cases_priority_idx").on(t.priority),
    assignedIdx: index("test_cases_assigned_idx").on(t.assignedTo),
    createdAtIdx: index("test_cases_created_at_idx").on(t.createdAt),
  })
);

/** Ordered steps belonging to a test case. */
export const testSteps = pgTable(
  "test_steps",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    testCaseId: uuid("test_case_id")
      .notNull()
      .references(() => testCases.id, { onDelete: "cascade" }),
    stepNumber: integer("step_number").notNull(),
    action: text("action").notNull(),
    expectedResult: text("expected_result"),
    testData: text("test_data"),
    ...timestamps,
  },
  (t) => ({
    caseIdx: index("test_steps_case_idx").on(t.testCaseId),
    uniqueStep: unique("test_steps_case_number_unique").on(
      t.testCaseId,
      t.stepNumber
    ),
  })
);

/** Many-to-many: test cases <-> suites. */
export const testSuiteCases = pgTable(
  "test_suite_cases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    suiteId: uuid("suite_id")
      .notNull()
      .references(() => testSuites.id, { onDelete: "cascade" }),
    testCaseId: uuid("test_case_id")
      .notNull()
      .references(() => testCases.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
    ...timestamps,
  },
  (t) => ({
    uniquePair: unique("test_suite_cases_unique").on(t.suiteId, t.testCaseId),
    suiteIdx: index("test_suite_cases_suite_idx").on(t.suiteId),
    caseIdx: index("test_suite_cases_case_idx").on(t.testCaseId),
  })
);

export type TestSuite = typeof testSuites.$inferSelect;
export type TestCase = typeof testCases.$inferSelect;
export type TestStep = typeof testSteps.$inferSelect;
