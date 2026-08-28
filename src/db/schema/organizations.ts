import {
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import {
  invitationStatus,
  organizationRole,
  timestamps,
  softDelete,
} from "./_shared";

/**
 * An organization is the tenant boundary. Every tenant-owned entity carries
 * `organizationId` and all data access is scoped by it.
 */
export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    logoUrl: text("logo_url"),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    ...timestamps,
    ...softDelete,
  },
  (t) => ({
    slugIdx: index("organizations_slug_idx").on(t.slug),
  })
);

/**
 * Membership links a user to an organization with an org-level role.
 * A user may belong to many organizations (multi-tenant switching).
 */
export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: organizationRole("role").notNull().default("MEMBER"),
    ...timestamps,
  },
  (t) => ({
    uniqueMember: unique("memberships_org_user_unique").on(
      t.organizationId,
      t.userId
    ),
    orgIdx: index("memberships_org_idx").on(t.organizationId),
    userIdx: index("memberships_user_idx").on(t.userId),
  })
);

/** Pending invitations to join an organization. */
export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: organizationRole("role").notNull().default("MEMBER"),
    token: text("token").notNull().unique(),
    status: invitationStatus("status").notNull().default("PENDING"),
    invitedBy: text("invited_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => ({
    orgEmailIdx: index("invitations_org_email_idx").on(
      t.organizationId,
      t.email
    ),
    tokenIdx: index("invitations_token_idx").on(t.token),
  })
);

/** Teams group users within an organization (org-scoped). */
export const teams = pgTable(
  "teams",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    ...timestamps,
    ...softDelete,
  },
  (t) => ({
    uniqueName: unique("teams_org_name_unique").on(t.organizationId, t.name),
    orgIdx: index("teams_org_idx").on(t.organizationId),
  })
);

export const teamMembers = pgTable(
  "team_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (t) => ({
    uniqueMember: unique("team_members_team_user_unique").on(
      t.teamId,
      t.userId
    ),
    teamIdx: index("team_members_team_idx").on(t.teamId),
    userIdx: index("team_members_user_idx").on(t.userId),
  })
);

export type Organization = typeof organizations.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
export type Invitation = typeof invitations.$inferSelect;
export type Team = typeof teams.$inferSelect;
