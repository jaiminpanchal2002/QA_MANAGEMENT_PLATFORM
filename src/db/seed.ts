/**
 * Deterministic development seed: `pnpm db:seed`.
 *
 * Creates two isolated tenants (Acme QA, Globex Testing) with users, roles,
 * projects, suites, test cases, a plan, a run with executions, and defects —
 * enough to make every dashboard and list meaningful.
 *
 * Runs with node's `react-server` condition so `server-only` modules import
 * cleanly outside Next (see the db:seed script). NEVER uses production
 * credentials. Dev credentials are documented in README.md.
 */
/* eslint-disable no-console */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { neonConfig } from "@neondatabase/serverless";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  memberships,
  organizations,
  projectMembers,
  testExecutions,
  testPlanItems,
  testPlans,
  testRuns,
  testSuiteCases,
  testSuites,
  user,
} from "@/db/schema";
import { auth } from "@/lib/auth/auth";
import { createOrganizationWithOwner } from "@/server/repositories/organization-repository";
import { createProject } from "@/server/repositories/project-repository";
import { createTestCase } from "@/server/repositories/test-case-repository";
import { createDefect } from "@/server/repositories/defect-repository";

if (typeof (globalThis as { WebSocket?: unknown }).WebSocket === "function") {
  neonConfig.webSocketConstructor = (
    globalThis as unknown as { WebSocket: unknown }
  ).WebSocket as never;
}

const PASSWORD = "Password123!";

const SEED_USERS = [
  { email: "owner@acme.test", name: "Olivia Owner", org: "acme", role: "OWNER" },
  { email: "admin@acme.test", name: "Adam Admin", org: "acme", role: "ADMIN" },
  { email: "qa@acme.test", name: "Quinn QA", org: "acme", role: "MEMBER" },
  { email: "viewer@acme.test", name: "Vera Viewer", org: "acme", role: "VIEWER" },
  { email: "owner@globex.test", name: "Gina Globex", org: "globex", role: "OWNER" },
  { email: "qa@globex.test", name: "Gary QA", org: "globex", role: "MEMBER" },
] as const;

async function ensureUser(email: string, name: string): Promise<string> {
  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);
  if (existing[0]) return existing[0].id;

  const result = await auth.api.signUpEmail({
    body: { email, password: PASSWORD, name },
  });
  // Mark seed users as verified so they can sign in immediately.
  await db
    .update(user)
    .set({ emailVerified: true })
    .where(eq(user.id, result.user.id));
  return result.user.id;
}

async function reset() {
  console.log("Clearing previous seed data…");
  const orgs = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(inArray(organizations.slug, ["acme-qa", "globex-testing"]));
  for (const o of orgs) {
    await db.delete(organizations).where(eq(organizations.id, o.id));
  }
  // Delete seed users (cascades account/session) so each run recreates
  // credential accounts cleanly and stays idempotent.
  const emails = SEED_USERS.map((u) => u.email);
  await db.delete(user).where(inArray(user.email, emails));
}

async function main() {
  if (process.env.ALLOW_SEED !== "true") {
    throw new Error(
      "Seeding is disabled. Set ALLOW_SEED=true in .env.local to run the seed."
    );
  }

  await reset();

  console.log("Creating users…");
  const userIds = new Map<string, string>();
  for (const u of SEED_USERS) {
    userIds.set(u.email, await ensureUser(u.email, u.name));
  }
  const id = (email: string) => userIds.get(email)!;

  console.log("Creating organizations…");
  const acme = await createOrganizationWithOwner({
    name: "Acme QA",
    slug: "acme-qa",
    description: "Quality assurance for Acme's flagship commerce suite.",
    ownerId: id("owner@acme.test"),
  });
  const globex = await createOrganizationWithOwner({
    name: "Globex Testing",
    slug: "globex-testing",
    description: "Globex Corporation QA workspace.",
    ownerId: id("owner@globex.test"),
  });

  // Additional Acme members with org roles.
  await db.insert(memberships).values([
    { organizationId: acme.id, userId: id("admin@acme.test"), role: "ADMIN" },
    { organizationId: acme.id, userId: id("qa@acme.test"), role: "MEMBER" },
    { organizationId: acme.id, userId: id("viewer@acme.test"), role: "VIEWER" },
  ]);
  await db.insert(memberships).values({
    organizationId: globex.id,
    userId: id("qa@globex.test"),
    role: "MEMBER",
  });

  console.log("Creating projects…");
  const shop = await createProject({
    organizationId: acme.id,
    name: "Shop Checkout",
    key: "SHOP",
    description: "Storefront checkout and payments.",
    ownerId: id("owner@acme.test"),
  });
  const crm = await createProject({
    organizationId: acme.id,
    name: "CRM Platform",
    key: "CRM",
    description: "Customer relationship management.",
    ownerId: id("admin@acme.test"),
  });
  const glbx = await createProject({
    organizationId: globex.id,
    name: "Globex Portal",
    key: "GLBX",
    description: "Internal partner portal.",
    ownerId: id("owner@globex.test"),
  });

  // Assign Acme QA + viewer to SHOP with project roles.
  await db.insert(projectMembers).values([
    {
      organizationId: acme.id,
      projectId: shop.id,
      userId: id("qa@acme.test"),
      role: "QA_ENGINEER",
    },
    {
      organizationId: acme.id,
      projectId: shop.id,
      userId: id("viewer@acme.test"),
      role: "VIEWER",
    },
    {
      organizationId: acme.id,
      projectId: shop.id,
      userId: id("admin@acme.test"),
      role: "QA_LEAD",
    },
  ]);

  console.log("Creating test suites…");
  const [smokeSuite, regressionSuite] = await db
    .insert(testSuites)
    .values([
      {
        organizationId: acme.id,
        projectId: shop.id,
        name: "Smoke",
        description: "Critical happy-path checks.",
        createdBy: id("owner@acme.test"),
      },
      {
        organizationId: acme.id,
        projectId: shop.id,
        name: "Regression",
        description: "Full regression coverage.",
        createdBy: id("owner@acme.test"),
      },
    ])
    .returning();

  console.log("Creating test cases…");
  const caseDefs = [
    {
      title: "User can add item to cart",
      priority: "HIGH" as const,
      type: "FUNCTIONAL" as const,
      status: "ACTIVE" as const,
      automation: "AUTOMATED" as const,
      steps: [
        { action: "Open a product page", expectedResult: "Product is shown" },
        { action: "Click Add to cart", expectedResult: "Cart count is 1" },
      ],
    },
    {
      title: "Checkout with valid card succeeds",
      priority: "CRITICAL" as const,
      type: "E2E" as const,
      status: "ACTIVE" as const,
      automation: "AUTOMATED" as const,
      steps: [
        { action: "Proceed to checkout", expectedResult: "Checkout form shown" },
        { action: "Enter valid card", expectedResult: "Payment accepted" },
        { action: "Confirm order", expectedResult: "Order confirmation shown" },
      ],
    },
    {
      title: "Invalid coupon is rejected",
      priority: "MEDIUM" as const,
      type: "FUNCTIONAL" as const,
      status: "ACTIVE" as const,
      automation: "MANUAL" as const,
      steps: [
        { action: "Apply an invalid coupon", expectedResult: "Error message shown" },
      ],
    },
    {
      title: "Cart persists across sessions",
      priority: "LOW" as const,
      type: "REGRESSION" as const,
      status: "DRAFT" as const,
      automation: "TO_BE_AUTOMATED" as const,
      steps: [{ action: "Reload the page", expectedResult: "Cart is retained" }],
    },
  ];

  const createdCases = [];
  for (const c of caseDefs) {
    const tc = await createTestCase({
      organizationId: acme.id,
      projectId: shop.id,
      title: c.title,
      priority: c.priority,
      severity: "MAJOR",
      type: c.type,
      status: c.status,
      automationStatus: c.automation,
      tags: ["checkout"],
      createdBy: id("qa@acme.test"),
      steps: c.steps,
    });
    createdCases.push(tc);
  }

  // Attach the first two cases to the Smoke suite, all to Regression.
  await db.insert(testSuiteCases).values([
    {
      organizationId: acme.id,
      suiteId: smokeSuite!.id,
      testCaseId: createdCases[0]!.id,
      position: 0,
    },
    {
      organizationId: acme.id,
      suiteId: smokeSuite!.id,
      testCaseId: createdCases[1]!.id,
      position: 1,
    },
    ...createdCases.map((c, i) => ({
      organizationId: acme.id,
      suiteId: regressionSuite!.id,
      testCaseId: c.id,
      position: i,
    })),
  ]);

  console.log("Creating test plan…");
  const [plan] = await db
    .insert(testPlans)
    .values({
      organizationId: acme.id,
      projectId: shop.id,
      name: "Release 2.4 Regression",
      description: "Regression pass for the 2.4 release.",
      version: "2.4.0",
      environment: "staging",
      status: "ACTIVE",
      ownerId: id("admin@acme.test"),
    })
    .returning();
  await db.insert(testPlanItems).values(
    createdCases.map((c) => ({
      organizationId: acme.id,
      testPlanId: plan!.id,
      testCaseId: c.id,
    }))
  );

  console.log("Creating test run + executions…");
  const [run] = await db
    .insert(testRuns)
    .values({
      organizationId: acme.id,
      projectId: shop.id,
      testPlanId: plan!.id,
      name: "Regression Run #42",
      environment: "staging",
      status: "COMPLETED",
      startedAt: new Date(Date.now() - 3600_000),
      completedAt: new Date(),
      createdBy: id("qa@acme.test"),
    })
    .returning();

  const execStatuses = ["PASSED", "PASSED", "FAILED", "BLOCKED"] as const;
  const executions = await db
    .insert(testExecutions)
    .values(
      createdCases.map((c, i) => ({
        organizationId: acme.id,
        projectId: shop.id,
        testRunId: run!.id,
        testCaseId: c.id,
        status: execStatuses[i]!,
        environment: "staging",
        browser: "chromium",
        durationMs: 500 + i * 320,
        executedBy: id("qa@acme.test"),
        startedAt: new Date(Date.now() - 1800_000),
        completedAt: new Date(),
        errorMessage:
          execStatuses[i] === "FAILED"
            ? "Payment gateway returned 502 during confirmation."
            : null,
      }))
    )
    .returning();

  console.log("Creating defect linked to the failed execution…");
  const failedExec = executions.find((e) => e.status === "FAILED");
  await createDefect({
    organizationId: acme.id,
    projectId: shop.id,
    title: "Checkout fails intermittently with 502 at payment confirmation",
    description: "Payment confirmation returns a 502 under load.",
    priority: "HIGH",
    severity: "CRITICAL",
    environment: "staging",
    stepsToReproduce: "Complete checkout with a valid card during peak load.",
    expectedResult: "Order is confirmed.",
    actualResult: "502 Bad Gateway is returned.",
    reportedBy: id("qa@acme.test"),
    assignedTo: id("admin@acme.test"),
    testExecutionId: failedExec?.id ?? null,
  });

  // A little data for Globex so its dashboard isn't empty (and stays isolated).
  const gc = await createTestCase({
    organizationId: globex.id,
    projectId: glbx.id,
    title: "Partner can log in to the portal",
    priority: "HIGH",
    severity: "MAJOR",
    type: "FUNCTIONAL",
    status: "ACTIVE",
    automationStatus: "MANUAL",
    tags: ["auth"],
    createdBy: id("owner@globex.test"),
    steps: [{ action: "Sign in", expectedResult: "Dashboard is shown" }],
  });
  void crm;
  void gc;

  console.log("\nSeed complete.");
  console.log("Dev credentials (password for all):", PASSWORD);
  for (const u of SEED_USERS) console.log(`  ${u.email}  [${u.org}/${u.role}]`);
  process.exit(0);
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
