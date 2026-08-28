import {
  index,
  integer,
  pgTable,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { organizations } from "./organizations";
import { projects } from "./projects";
import { testExecutions } from "./test-runs";
import {
  defectStatus,
  priority,
  severity,
  timestamps,
  softDelete,
} from "./_shared";

/**
 * Defects (bugs). Human-readable key: <PROJ>-BUG-001. May be linked to the
 * failed test execution that surfaced them.
 */
export const defects = pgTable(
  "defects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    seq: integer("seq").notNull(),
    reference: text("reference").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    status: defectStatus("status").notNull().default("OPEN"),
    priority: priority("priority").notNull().default("MEDIUM"),
    severity: severity("severity").notNull().default("MAJOR"),
    environment: text("environment"),
    stepsToReproduce: text("steps_to_reproduce"),
    expectedResult: text("expected_result"),
    actualResult: text("actual_result"),
    assignedTo: text("assigned_to").references(() => user.id, {
      onDelete: "set null",
    }),
    reportedBy: text("reported_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    testExecutionId: uuid("test_execution_id").references(
      () => testExecutions.id,
      { onDelete: "set null" }
    ),
    ...timestamps,
    ...softDelete,
  },
  (t) => ({
    uniqueRef: unique("defects_project_ref_unique").on(
      t.projectId,
      t.reference
    ),
    orgIdx: index("defects_org_idx").on(t.organizationId),
    projectIdx: index("defects_project_idx").on(t.projectId),
    statusIdx: index("defects_status_idx").on(t.status),
    severityIdx: index("defects_severity_idx").on(t.severity),
    assignedIdx: index("defects_assigned_idx").on(t.assignedTo),
    createdAtIdx: index("defects_created_at_idx").on(t.createdAt),
  })
);

export type Defect = typeof defects.$inferSelect;
