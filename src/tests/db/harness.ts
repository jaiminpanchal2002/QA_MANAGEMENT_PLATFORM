import { randomUUID } from "node:crypto";
import { neonConfig } from "@neondatabase/serverless";
import { db } from "@/db";
import {
  attachments,
  defects,
  memberships,
  organizations,
  projectMembers,
  projects,
  testCases,
  testExecutions,
  testRuns,
  user,
} from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Test harness for DB-backed integration tests.
 *
 * DB tests are gated on DATABASE_URL: when it is absent they are skipped so
 * `pnpm test` still passes in environments without a database. When present,
 * the schema must already be migrated (`pnpm db:migrate`).
 */
export const hasDb = Boolean(process.env.DATABASE_URL);

// Neon serverless driver needs a WebSocket constructor in Node.
if (typeof (globalThis as { WebSocket?: unknown }).WebSocket === "function") {
  neonConfig.webSocketConstructor = (
    globalThis as unknown as { WebSocket: unknown }
  ).WebSocket as never;
}

const createdUserIds: string[] = [];
const createdOrgIds: string[] = [];

export async function makeUser(name: string): Promise<string> {
  const id = `test_user_${randomUUID()}`;
  await db.insert(user).values({
    id,
    name,
    email: `${id}@test.local`,
    emailVerified: true,
  });
  createdUserIds.push(id);
  return id;
}

export async function makeOrg(name: string, createdBy: string): Promise<string> {
  const [org] = await db
    .insert(organizations)
    .values({
      name,
      slug: `${name.toLowerCase().replace(/\W+/g, "-")}-${randomUUID().slice(0, 8)}`,
      createdBy,
    })
    .returning({ id: organizations.id });
  createdOrgIds.push(org!.id);
  return org!.id;
}

export async function addMember(
  organizationId: string,
  userId: string,
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER"
): Promise<void> {
  await db.insert(memberships).values({ organizationId, userId, role });
}

export async function makeProject(
  organizationId: string,
  ownerId: string,
  key: string
): Promise<string> {
  const [project] = await db
    .insert(projects)
    .values({ organizationId, name: `${key} Project`, key, ownerId })
    .returning({ id: projects.id });
  await db.insert(projectMembers).values({
    organizationId,
    projectId: project!.id,
    userId: ownerId,
    role: "PROJECT_ADMIN",
  });
  return project!.id;
}

export async function makeTestCase(
  organizationId: string,
  projectId: string,
  createdBy: string,
  seq = 1
): Promise<string> {
  const [tc] = await db
    .insert(testCases)
    .values({
      organizationId,
      projectId,
      seq,
      reference: `TC-${seq}-${randomUUID().slice(0, 6)}`,
      title: "Sample test case",
      createdBy,
    })
    .returning({ id: testCases.id });
  return tc!.id;
}

export async function makeDefect(
  organizationId: string,
  projectId: string,
  reportedBy: string,
  seq = 1
): Promise<string> {
  const [defect] = await db
    .insert(defects)
    .values({
      organizationId,
      projectId,
      seq,
      reference: `BUG-${seq}-${randomUUID().slice(0, 6)}`,
      title: "Sample defect",
      reportedBy,
    })
    .returning({ id: defects.id });
  return defect!.id;
}

export async function makeTestRun(
  organizationId: string,
  projectId: string,
  createdBy: string
): Promise<string> {
  const [run] = await db
    .insert(testRuns)
    .values({ organizationId, projectId, name: "Sample run", createdBy })
    .returning({ id: testRuns.id });
  return run!.id;
}

export async function makeExecution(
  organizationId: string,
  projectId: string,
  testRunId: string,
  testCaseId: string
): Promise<string> {
  const [exec] = await db
    .insert(testExecutions)
    .values({ organizationId, projectId, testRunId, testCaseId })
    .returning({ id: testExecutions.id });
  return exec!.id;
}

export async function makeAttachment(
  organizationId: string,
  projectId: string,
  entityId: string,
  uploadedBy: string
): Promise<string> {
  const [att] = await db
    .insert(attachments)
    .values({
      organizationId,
      projectId,
      entityType: "DEFECT",
      entityId,
      filename: "screenshot.png",
      mimeType: "image/png",
      size: 1024,
      storageKey: `test/${randomUUID()}.png`,
      url: "https://blob.example/test.png",
      uploadedBy,
    })
    .returning({ id: attachments.id });
  return att!.id;
}

/** Remove all fixtures created during the run (org cascade cleans children). */
export async function cleanupFixtures(): Promise<void> {
  for (const id of createdOrgIds.splice(0)) {
    await db.delete(organizations).where(eq(organizations.id, id));
  }
  for (const id of createdUserIds.splice(0)) {
    await db.delete(user).where(eq(user.id, id));
  }
}
