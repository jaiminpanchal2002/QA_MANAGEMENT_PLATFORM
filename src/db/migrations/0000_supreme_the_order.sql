CREATE TYPE "public"."attachment_entity_type" AS ENUM('TEST_CASE', 'TEST_EXECUTION', 'DEFECT', 'COMMENT', 'REQUIREMENT');--> statement-breakpoint
CREATE TYPE "public"."automation_status" AS ENUM('MANUAL', 'AUTOMATED', 'TO_BE_AUTOMATED', 'CANNOT_AUTOMATE');--> statement-breakpoint
CREATE TYPE "public"."comment_entity_type" AS ENUM('TEST_CASE', 'TEST_RUN', 'DEFECT', 'PROJECT', 'REQUIREMENT');--> statement-breakpoint
CREATE TYPE "public"."defect_status" AS ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'REOPENED', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."execution_status" AS ENUM('NOT_EXECUTED', 'PASSED', 'FAILED', 'BLOCKED', 'SKIPPED', 'RETEST', 'IN_PROGRESS');--> statement-breakpoint
CREATE TYPE "public"."integration_provider" AS ENUM('PLAYWRIGHT', 'CYPRESS', 'SELENIUM', 'PYTEST', 'JUNIT', 'GITHUB_ACTIONS', 'GITLAB_CI', 'JENKINS', 'GENERIC_API');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('INVITATION', 'MENTION', 'DEFECT_ASSIGNED', 'TEST_RUN_COMPLETED', 'ROLE_CHANGED', 'SYSTEM');--> statement-breakpoint
CREATE TYPE "public"."organization_role" AS ENUM('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');--> statement-breakpoint
CREATE TYPE "public"."project_role" AS ENUM('PROJECT_ADMIN', 'QA_LEAD', 'QA_ENGINEER', 'DEVELOPER', 'VIEWER');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('ACTIVE', 'ARCHIVED', 'ON_HOLD');--> statement-breakpoint
CREATE TYPE "public"."requirement_status" AS ENUM('DRAFT', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'DEPRECATED');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('TRIVIAL', 'MINOR', 'MAJOR', 'CRITICAL', 'BLOCKER');--> statement-breakpoint
CREATE TYPE "public"."test_case_status" AS ENUM('DRAFT', 'ACTIVE', 'DEPRECATED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."test_case_type" AS ENUM('FUNCTIONAL', 'REGRESSION', 'SMOKE', 'INTEGRATION', 'E2E', 'PERFORMANCE', 'SECURITY', 'USABILITY', 'API', 'ACCESSIBILITY');--> statement-breakpoint
CREATE TYPE "public"."test_plan_status" AS ENUM('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."test_run_status" AS ENUM('NOT_STARTED', 'QUEUED', 'RUNNING', 'PASSED', 'FAILED', 'BLOCKED', 'CANCELLED', 'COMPLETED');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"active_organization_id" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" "organization_role" DEFAULT 'MEMBER' NOT NULL,
	"token" text NOT NULL,
	"status" "invitation_status" DEFAULT 'PENDING' NOT NULL,
	"invited_by" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" "organization_role" DEFAULT 'MEMBER' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_org_user_unique" UNIQUE("organization_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"logo_url" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_members_team_user_unique" UNIQUE("team_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "teams_org_name_unique" UNIQUE("organization_id","name")
);
--> statement-breakpoint
CREATE TABLE "project_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" "project_role" DEFAULT 'QA_ENGINEER' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_members_project_user_unique" UNIQUE("project_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"key" text NOT NULL,
	"description" text,
	"status" "project_status" DEFAULT 'ACTIVE' NOT NULL,
	"owner_id" text NOT NULL,
	"test_case_seq" integer DEFAULT 0 NOT NULL,
	"defect_seq" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "projects_org_key_unique" UNIQUE("organization_id","key")
);
--> statement-breakpoint
CREATE TABLE "requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"reference" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "requirement_status" DEFAULT 'DRAFT' NOT NULL,
	"priority" "priority" DEFAULT 'MEDIUM' NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "requirements_project_ref_unique" UNIQUE("project_id","reference")
);
--> statement-breakpoint
CREATE TABLE "test_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"seq" integer NOT NULL,
	"reference" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"preconditions" text,
	"expected_result" text,
	"priority" "priority" DEFAULT 'MEDIUM' NOT NULL,
	"severity" "severity" DEFAULT 'MINOR' NOT NULL,
	"status" "test_case_status" DEFAULT 'DRAFT' NOT NULL,
	"type" "test_case_type" DEFAULT 'FUNCTIONAL' NOT NULL,
	"automation_status" "automation_status" DEFAULT 'MANUAL' NOT NULL,
	"component" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"requirement_id" uuid,
	"assigned_to" text,
	"created_by" text NOT NULL,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "test_cases_project_ref_unique" UNIQUE("project_id","reference")
);
--> statement-breakpoint
CREATE TABLE "test_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"test_case_id" uuid NOT NULL,
	"step_number" integer NOT NULL,
	"action" text NOT NULL,
	"expected_result" text,
	"test_data" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "test_steps_case_number_unique" UNIQUE("test_case_id","step_number")
);
--> statement-breakpoint
CREATE TABLE "test_suite_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"suite_id" uuid NOT NULL,
	"test_case_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "test_suite_cases_unique" UNIQUE("suite_id","test_case_id")
);
--> statement-breakpoint
CREATE TABLE "test_suites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "test_suites_project_name_unique" UNIQUE("project_id","name")
);
--> statement-breakpoint
CREATE TABLE "test_plan_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"test_plan_id" uuid NOT NULL,
	"test_case_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "test_plan_items_unique" UNIQUE("test_plan_id","test_case_id")
);
--> statement-breakpoint
CREATE TABLE "test_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"version" text,
	"environment" text,
	"status" "test_plan_status" DEFAULT 'DRAFT' NOT NULL,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"owner_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "test_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"test_run_id" uuid NOT NULL,
	"test_case_id" uuid NOT NULL,
	"status" "execution_status" DEFAULT 'NOT_EXECUTED' NOT NULL,
	"environment" text,
	"browser" text,
	"device" text,
	"duration_ms" integer,
	"executed_by" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"error_message" text,
	"logs" text,
	"artifacts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"test_plan_id" uuid,
	"name" text NOT NULL,
	"environment" text,
	"status" "test_run_status" DEFAULT 'NOT_STARTED' NOT NULL,
	"is_automated" text,
	"provider" "integration_provider",
	"external_job_id" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "defects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"seq" integer NOT NULL,
	"reference" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "defect_status" DEFAULT 'OPEN' NOT NULL,
	"priority" "priority" DEFAULT 'MEDIUM' NOT NULL,
	"severity" "severity" DEFAULT 'MAJOR' NOT NULL,
	"environment" text,
	"steps_to_reproduce" text,
	"expected_result" text,
	"actual_result" text,
	"assigned_to" text,
	"reported_by" text NOT NULL,
	"test_execution_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "defects_project_ref_unique" UNIQUE("project_id","reference")
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"project_id" uuid,
	"entity_type" "attachment_entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" bigint NOT NULL,
	"storage_key" text NOT NULL,
	"url" text NOT NULL,
	"uploaded_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"project_id" uuid,
	"entity_type" "comment_entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"body" text NOT NULL,
	"mentions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"author_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"actor_id" text,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"provider" "integration_provider" NOT NULL,
	"token_hash" text NOT NULL,
	"token_prefix" text NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"link" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_requirement_id_requirements_id_fk" FOREIGN KEY ("requirement_id") REFERENCES "public"."requirements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_assigned_to_user_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_steps" ADD CONSTRAINT "test_steps_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_steps" ADD CONSTRAINT "test_steps_test_case_id_test_cases_id_fk" FOREIGN KEY ("test_case_id") REFERENCES "public"."test_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_suite_cases" ADD CONSTRAINT "test_suite_cases_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_suite_cases" ADD CONSTRAINT "test_suite_cases_suite_id_test_suites_id_fk" FOREIGN KEY ("suite_id") REFERENCES "public"."test_suites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_suite_cases" ADD CONSTRAINT "test_suite_cases_test_case_id_test_cases_id_fk" FOREIGN KEY ("test_case_id") REFERENCES "public"."test_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_suites" ADD CONSTRAINT "test_suites_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_suites" ADD CONSTRAINT "test_suites_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_suites" ADD CONSTRAINT "test_suites_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_plan_items" ADD CONSTRAINT "test_plan_items_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_plan_items" ADD CONSTRAINT "test_plan_items_test_plan_id_test_plans_id_fk" FOREIGN KEY ("test_plan_id") REFERENCES "public"."test_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_plan_items" ADD CONSTRAINT "test_plan_items_test_case_id_test_cases_id_fk" FOREIGN KEY ("test_case_id") REFERENCES "public"."test_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_plans" ADD CONSTRAINT "test_plans_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_plans" ADD CONSTRAINT "test_plans_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_plans" ADD CONSTRAINT "test_plans_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_executions" ADD CONSTRAINT "test_executions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_executions" ADD CONSTRAINT "test_executions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_executions" ADD CONSTRAINT "test_executions_test_run_id_test_runs_id_fk" FOREIGN KEY ("test_run_id") REFERENCES "public"."test_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_executions" ADD CONSTRAINT "test_executions_test_case_id_test_cases_id_fk" FOREIGN KEY ("test_case_id") REFERENCES "public"."test_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_executions" ADD CONSTRAINT "test_executions_executed_by_user_id_fk" FOREIGN KEY ("executed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_runs" ADD CONSTRAINT "test_runs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_runs" ADD CONSTRAINT "test_runs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_runs" ADD CONSTRAINT "test_runs_test_plan_id_test_plans_id_fk" FOREIGN KEY ("test_plan_id") REFERENCES "public"."test_plans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_runs" ADD CONSTRAINT "test_runs_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "defects" ADD CONSTRAINT "defects_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "defects" ADD CONSTRAINT "defects_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "defects" ADD CONSTRAINT "defects_assigned_to_user_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "defects" ADD CONSTRAINT "defects_reported_by_user_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "defects" ADD CONSTRAINT "defects_test_execution_id_test_executions_id_fk" FOREIGN KEY ("test_execution_id") REFERENCES "public"."test_executions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_token_idx" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "invitations_org_email_idx" ON "invitations" USING btree ("organization_id","email");--> statement-breakpoint
CREATE INDEX "invitations_token_idx" ON "invitations" USING btree ("token");--> statement-breakpoint
CREATE INDEX "memberships_org_idx" ON "memberships" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "memberships_user_idx" ON "memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "organizations_slug_idx" ON "organizations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "team_members_team_idx" ON "team_members" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_members_user_idx" ON "team_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "teams_org_idx" ON "teams" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "project_members_project_idx" ON "project_members" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_members_user_idx" ON "project_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "project_members_org_idx" ON "project_members" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "projects_org_idx" ON "projects" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "projects_status_idx" ON "projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "requirements_org_idx" ON "requirements" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "requirements_project_idx" ON "requirements" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "requirements_status_idx" ON "requirements" USING btree ("status");--> statement-breakpoint
CREATE INDEX "test_cases_org_idx" ON "test_cases" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "test_cases_project_idx" ON "test_cases" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "test_cases_status_idx" ON "test_cases" USING btree ("status");--> statement-breakpoint
CREATE INDEX "test_cases_priority_idx" ON "test_cases" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "test_cases_assigned_idx" ON "test_cases" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "test_cases_created_at_idx" ON "test_cases" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "test_steps_case_idx" ON "test_steps" USING btree ("test_case_id");--> statement-breakpoint
CREATE INDEX "test_suite_cases_suite_idx" ON "test_suite_cases" USING btree ("suite_id");--> statement-breakpoint
CREATE INDEX "test_suite_cases_case_idx" ON "test_suite_cases" USING btree ("test_case_id");--> statement-breakpoint
CREATE INDEX "test_suites_org_idx" ON "test_suites" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "test_suites_project_idx" ON "test_suites" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "test_plan_items_plan_idx" ON "test_plan_items" USING btree ("test_plan_id");--> statement-breakpoint
CREATE INDEX "test_plans_org_idx" ON "test_plans" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "test_plans_project_idx" ON "test_plans" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "test_plans_status_idx" ON "test_plans" USING btree ("status");--> statement-breakpoint
CREATE INDEX "test_executions_org_idx" ON "test_executions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "test_executions_run_idx" ON "test_executions" USING btree ("test_run_id");--> statement-breakpoint
CREATE INDEX "test_executions_case_idx" ON "test_executions" USING btree ("test_case_id");--> statement-breakpoint
CREATE INDEX "test_executions_status_idx" ON "test_executions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "test_runs_org_idx" ON "test_runs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "test_runs_project_idx" ON "test_runs" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "test_runs_status_idx" ON "test_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "test_runs_created_at_idx" ON "test_runs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "defects_org_idx" ON "defects" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "defects_project_idx" ON "defects" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "defects_status_idx" ON "defects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "defects_severity_idx" ON "defects" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "defects_assigned_idx" ON "defects" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "defects_created_at_idx" ON "defects" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "attachments_org_idx" ON "attachments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "attachments_entity_idx" ON "attachments" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "comments_org_idx" ON "comments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "comments_entity_idx" ON "comments" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "comments_author_idx" ON "comments" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "audit_logs_org_idx" ON "audit_logs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "integrations_org_idx" ON "integrations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "integrations_project_idx" ON "integrations" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "integrations_prefix_idx" ON "integrations" USING btree ("token_prefix");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_org_idx" ON "notifications" USING btree ("organization_id");