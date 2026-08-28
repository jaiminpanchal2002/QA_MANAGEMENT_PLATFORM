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
import { projectRole, projectStatus, timestamps, softDelete } from "./_shared";

/**
 * Projects belong to an organization. The `key` (e.g. SHOP, CRM) is unique
 * within the organization and is used to build human-readable IDs such as
 * SHOP-TC-001. `sequenceCounter` provides gap-free per-project numbering for
 * test cases / defects, incremented transactionally.
 */
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    key: text("key").notNull(),
    description: text("description"),
    status: projectStatus("status").notNull().default("ACTIVE"),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    testCaseSeq: integer("test_case_seq").notNull().default(0),
    defectSeq: integer("defect_seq").notNull().default(0),
    ...timestamps,
    ...softDelete,
  },
  (t) => ({
    // Project key must be unique per organization (scoped uniqueness).
    uniqueKey: unique("projects_org_key_unique").on(t.organizationId, t.key),
    orgIdx: index("projects_org_idx").on(t.organizationId),
    statusIdx: index("projects_status_idx").on(t.status),
  })
);

/**
 * Project membership assigns a project-level role to a user. This is layered
 * on top of the org role: org OWNER/ADMIN have implicit access; other users
 * need an explicit project membership to access a project.
 */
export const projectMembers = pgTable(
  "project_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: projectRole("role").notNull().default("QA_ENGINEER"),
    ...timestamps,
  },
  (t) => ({
    uniqueMember: unique("project_members_project_user_unique").on(
      t.projectId,
      t.userId
    ),
    projectIdx: index("project_members_project_idx").on(t.projectId),
    userIdx: index("project_members_user_idx").on(t.userId),
    orgIdx: index("project_members_org_idx").on(t.organizationId),
  })
);

export type Project = typeof projects.$inferSelect;
export type ProjectMember = typeof projectMembers.$inferSelect;
