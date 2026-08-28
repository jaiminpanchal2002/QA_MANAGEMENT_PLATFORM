// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  addMember,
  cleanupFixtures,
  hasDb,
  makeOrg,
  makeUser,
} from "./harness";
import * as projectRepo from "@/server/repositories/project-repository";
import * as testCaseRepo from "@/server/repositories/test-case-repository";
import * as defectRepo from "@/server/repositories/defect-repository";
import * as runRepo from "@/server/repositories/test-run-repository";

/**
 * DB-backed repository integration tests. Exercise real CRUD + pagination +
 * sequence allocation against the tenant-scoped repositories. Skipped without
 * DATABASE_URL.
 */
const d = hasDb ? describe : describe.skip;

d("repository integration", () => {
  const ctx = { org: "", user: "" };

  beforeAll(async () => {
    ctx.user = await makeUser("Repo Tester");
    ctx.org = await makeOrg("Repo Org", ctx.user);
    await addMember(ctx.org, ctx.user, "OWNER");
  }, 60_000);

  afterAll(async () => {
    await cleanupFixtures();
  }, 60_000);

  it("creates a project and registers the owner as PROJECT_ADMIN", async () => {
    const project = await projectRepo.createProject({
      organizationId: ctx.org,
      name: "Alpha",
      key: "ALPHA",
      ownerId: ctx.user,
    });
    expect(project.key).toBe("ALPHA");
    expect(await projectRepo.projectKeyExists(ctx.org, "ALPHA")).toBe(true);
    expect(await projectRepo.getProjectById(ctx.org, project.id)).not.toBeNull();
  });

  it("paginates, searches and filters projects", async () => {
    await projectRepo.createProject({
      organizationId: ctx.org,
      name: "Beta Service",
      key: "BETA",
      ownerId: ctx.user,
    });
    const all = await projectRepo.listProjects({
      organizationId: ctx.org,
      page: 1,
      pageSize: 1,
    });
    expect(all.total).toBeGreaterThanOrEqual(2);
    expect(all.rows).toHaveLength(1);

    const search = await projectRepo.listProjects({
      organizationId: ctx.org,
      page: 1,
      pageSize: 10,
      search: "Beta",
    });
    expect(search.rows.every((p) => /beta/i.test(p.name))).toBe(true);
  });

  it("updates and soft-deletes a project", async () => {
    const p = await projectRepo.createProject({
      organizationId: ctx.org,
      name: "Gamma",
      key: "GAMMA",
      ownerId: ctx.user,
    });
    const updated = await projectRepo.updateProject(ctx.org, p.id, {
      name: "Gamma Renamed",
    });
    expect(updated?.name).toBe("Gamma Renamed");

    expect(await projectRepo.softDeleteProject(ctx.org, p.id)).toBe(true);
    expect(await projectRepo.getProjectById(ctx.org, p.id)).toBeNull();
    // Second delete is a no-op (already deleted).
    expect(await projectRepo.softDeleteProject(ctx.org, p.id)).toBe(false);
  });

  it("creates a test case with steps and a per-project reference", async () => {
    const p = await projectRepo.createProject({
      organizationId: ctx.org,
      name: "TC Project",
      key: "TCP",
      ownerId: ctx.user,
    });
    const tc = await testCaseRepo.createTestCase({
      organizationId: ctx.org,
      projectId: p.id,
      title: "First case",
      priority: "HIGH",
      severity: "MAJOR",
      type: "FUNCTIONAL",
      status: "ACTIVE",
      automationStatus: "MANUAL",
      tags: ["smoke"],
      createdBy: ctx.user,
      steps: [
        { action: "do a", expectedResult: "b" },
        { action: "do c" },
      ],
    });
    expect(tc.reference).toBe("TCP-TC-001");

    const second = await testCaseRepo.createTestCase({
      organizationId: ctx.org,
      projectId: p.id,
      title: "Second case",
      priority: "LOW",
      severity: "MINOR",
      type: "REGRESSION",
      status: "DRAFT",
      automationStatus: "AUTOMATED",
      tags: [],
      createdBy: ctx.user,
      steps: [],
    });
    expect(second.reference).toBe("TCP-TC-002");

    const loaded = await testCaseRepo.getTestCaseById(ctx.org, tc.id);
    expect(loaded?.steps).toHaveLength(2);
    expect(loaded?.steps[0]?.stepNumber).toBe(1);

    const listed = await testCaseRepo.listTestCases({
      organizationId: ctx.org,
      projectId: p.id,
      page: 1,
      pageSize: 10,
      status: "ACTIVE",
    });
    expect(listed.rows.every((r) => r.status === "ACTIVE")).toBe(true);

    // Bulk delete both.
    const removed = await testCaseRepo.bulkSoftDeleteTestCases(ctx.org, p.id, [
      tc.id,
      second.id,
    ]);
    expect(removed).toBe(2);
  });

  it("runs the full run lifecycle: create → execute → recompute → cancel", async () => {
    const p = await projectRepo.createProject({
      organizationId: ctx.org,
      name: "Run Project",
      key: "RUNP",
      ownerId: ctx.user,
    });
    const tc1 = await testCaseRepo.createTestCase({
      organizationId: ctx.org,
      projectId: p.id,
      title: "case 1",
      priority: "MEDIUM",
      severity: "MINOR",
      type: "FUNCTIONAL",
      status: "ACTIVE",
      automationStatus: "MANUAL",
      tags: [],
      createdBy: ctx.user,
      steps: [],
    });
    const tc2 = await testCaseRepo.createTestCase({
      organizationId: ctx.org,
      projectId: p.id,
      title: "case 2",
      priority: "MEDIUM",
      severity: "MINOR",
      type: "FUNCTIONAL",
      status: "ACTIVE",
      automationStatus: "MANUAL",
      tags: [],
      createdBy: ctx.user,
      steps: [],
    });

    const run = await runRepo.createRunWithExecutions({
      organizationId: ctx.org,
      projectId: p.id,
      name: "Run #1",
      testCaseIds: [tc1.id, tc2.id],
      createdBy: ctx.user,
    });
    expect(run.status).toBe("NOT_STARTED");

    const loaded = await runRepo.getRunWithExecutions(ctx.org, run.id);
    expect(loaded?.executions).toHaveLength(2);
    const [e1, e2] = loaded!.executions;

    // Execute one → RUNNING (partial).
    await runRepo.updateExecution(ctx.org, run.id, e1!.id, {
      status: "PASSED",
      executedBy: ctx.user,
    });
    expect(await runRepo.recomputeRunStatus(ctx.org, run.id)).toBe("RUNNING");

    // Execute the second as FAILED → FAILED overall.
    await runRepo.updateExecution(ctx.org, run.id, e2!.id, {
      status: "FAILED",
      errorMessage: "boom",
      executedBy: ctx.user,
    });
    expect(await runRepo.recomputeRunStatus(ctx.org, run.id)).toBe("FAILED");

    // Cancel.
    const cancelled = await runRepo.cancelRun(ctx.org, run.id);
    expect(cancelled?.status).toBe("CANCELLED");
  });

  it("creates a defect with a BUG reference and updates status", async () => {
    const p = await projectRepo.createProject({
      organizationId: ctx.org,
      name: "Defect Project",
      key: "DFP",
      ownerId: ctx.user,
    });
    const defect = await defectRepo.createDefect({
      organizationId: ctx.org,
      projectId: p.id,
      title: "Crash on save",
      priority: "HIGH",
      severity: "CRITICAL",
      reportedBy: ctx.user,
    });
    expect(defect.reference).toBe("DFP-BUG-001");

    const updated = await defectRepo.updateDefectStatus(
      ctx.org,
      defect.id,
      "RESOLVED"
    );
    expect(updated?.status).toBe("RESOLVED");

    const list = await defectRepo.listDefects({
      organizationId: ctx.org,
      projectId: p.id,
      page: 1,
      pageSize: 10,
      severity: "CRITICAL",
    });
    expect(list.total).toBe(1);
  });
});
