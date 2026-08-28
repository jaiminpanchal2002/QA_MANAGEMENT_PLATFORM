import { index, pgTable, text, unique, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { organizations } from "./organizations";
import { projects } from "./projects";
import { priority, requirementStatus, timestamps, softDelete } from "./_shared";

/**
 * Requirements are the top of the QA lifecycle. Test cases can be linked to a
 * requirement for traceability (coverage). Human-readable key: <PROJ>-REQ-001.
 */
export const requirements = pgTable(
  "requirements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    reference: text("reference").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    status: requirementStatus("status").notNull().default("DRAFT"),
    priority: priority("priority").notNull().default("MEDIUM"),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    ...timestamps,
    ...softDelete,
  },
  (t) => ({
    uniqueRef: unique("requirements_project_ref_unique").on(
      t.projectId,
      t.reference
    ),
    orgIdx: index("requirements_org_idx").on(t.organizationId),
    projectIdx: index("requirements_project_idx").on(t.projectId),
    statusIdx: index("requirements_status_idx").on(t.status),
  })
);

export type Requirement = typeof requirements.$inferSelect;
