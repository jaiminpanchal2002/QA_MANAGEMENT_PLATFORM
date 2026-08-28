import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { organizations } from "./organizations";
import { projects } from "./projects";
import { integrationProvider, notificationType, timestamps } from "./_shared";

/**
 * Integrations connect an external automation/CI provider to a project.
 * `tokenHash` stores a hash of the API token used to authenticate inbound
 * webhooks — the raw token is shown once at creation and never persisted.
 */
export const integrations = pgTable(
  "integrations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    provider: integrationProvider("provider").notNull(),
    tokenHash: text("token_hash").notNull(),
    tokenPrefix: text("token_prefix").notNull(),
    config: jsonb("config").$type<Record<string, unknown>>().default({}),
    isActive: boolean("is_active").notNull().default(true),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    ...timestamps,
  },
  (t) => ({
    orgIdx: index("integrations_org_idx").on(t.organizationId),
    projectIdx: index("integrations_project_idx").on(t.projectId),
    prefixIdx: index("integrations_prefix_idx").on(t.tokenPrefix),
  })
);

/** In-app notifications (invitations, mentions, assignments, ...). */
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: notificationType("type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    link: text("link"),
    readAt: timestamp("read_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => ({
    userIdx: index("notifications_user_idx").on(t.userId),
    orgIdx: index("notifications_org_idx").on(t.organizationId),
  })
);

export type Integration = typeof integrations.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
