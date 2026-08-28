import { pgEnum, timestamp } from "drizzle-orm/pg-core";

/**
 * Shared column builders and enums used across the schema.
 * Centralizing these keeps timestamp/soft-delete conventions consistent.
 */

// --- Timestamp conventions -------------------------------------------------
export const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
};

/** Soft-delete marker for entities that must be recoverable / auditable. */
export const softDelete = {
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
};

// --- Domain enums ----------------------------------------------------------
export const organizationRole = pgEnum("organization_role", [
  "OWNER",
  "ADMIN",
  "MEMBER",
  "VIEWER",
]);

export const projectRole = pgEnum("project_role", [
  "PROJECT_ADMIN",
  "QA_LEAD",
  "QA_ENGINEER",
  "DEVELOPER",
  "VIEWER",
]);

export const invitationStatus = pgEnum("invitation_status", [
  "PENDING",
  "ACCEPTED",
  "REVOKED",
  "EXPIRED",
]);

export const projectStatus = pgEnum("project_status", [
  "ACTIVE",
  "ARCHIVED",
  "ON_HOLD",
]);

export const requirementStatus = pgEnum("requirement_status", [
  "DRAFT",
  "APPROVED",
  "IN_PROGRESS",
  "COMPLETED",
  "DEPRECATED",
]);

export const priority = pgEnum("priority", [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);

export const severity = pgEnum("severity", [
  "TRIVIAL",
  "MINOR",
  "MAJOR",
  "CRITICAL",
  "BLOCKER",
]);

export const testCaseStatus = pgEnum("test_case_status", [
  "DRAFT",
  "ACTIVE",
  "DEPRECATED",
  "ARCHIVED",
]);

export const testCaseType = pgEnum("test_case_type", [
  "FUNCTIONAL",
  "REGRESSION",
  "SMOKE",
  "INTEGRATION",
  "E2E",
  "PERFORMANCE",
  "SECURITY",
  "USABILITY",
  "API",
  "ACCESSIBILITY",
]);

export const automationStatus = pgEnum("automation_status", [
  "MANUAL",
  "AUTOMATED",
  "TO_BE_AUTOMATED",
  "CANNOT_AUTOMATE",
]);

export const testPlanStatus = pgEnum("test_plan_status", [
  "DRAFT",
  "ACTIVE",
  "COMPLETED",
  "ARCHIVED",
]);

export const testRunStatus = pgEnum("test_run_status", [
  "NOT_STARTED",
  "QUEUED",
  "RUNNING",
  "PASSED",
  "FAILED",
  "BLOCKED",
  "CANCELLED",
  "COMPLETED",
]);

export const executionStatus = pgEnum("execution_status", [
  "NOT_EXECUTED",
  "PASSED",
  "FAILED",
  "BLOCKED",
  "SKIPPED",
  "RETEST",
  "IN_PROGRESS",
]);

export const defectStatus = pgEnum("defect_status", [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "REOPENED",
  "CLOSED",
]);

export const commentEntityType = pgEnum("comment_entity_type", [
  "TEST_CASE",
  "TEST_RUN",
  "DEFECT",
  "PROJECT",
  "REQUIREMENT",
]);

export const attachmentEntityType = pgEnum("attachment_entity_type", [
  "TEST_CASE",
  "TEST_EXECUTION",
  "DEFECT",
  "COMMENT",
  "REQUIREMENT",
]);

export const integrationProvider = pgEnum("integration_provider", [
  "PLAYWRIGHT",
  "CYPRESS",
  "SELENIUM",
  "PYTEST",
  "JUNIT",
  "GITHUB_ACTIONS",
  "GITLAB_CI",
  "JENKINS",
  "GENERIC_API",
]);

export const notificationType = pgEnum("notification_type", [
  "INVITATION",
  "MENTION",
  "DEFECT_ASSIGNED",
  "TEST_RUN_COMPLETED",
  "ROLE_CHANGED",
  "SYSTEM",
]);
