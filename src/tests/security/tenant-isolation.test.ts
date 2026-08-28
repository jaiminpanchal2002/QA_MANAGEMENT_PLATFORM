// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  addMember,
  cleanupFixtures,
  hasDb,
  makeAttachment,
  makeDefect,
  makeExecution,
  makeOrg,
  makeProject,
  makeTestCase,
  makeTestRun,
  makeUser,
} from "@/tests/db/harness";
import { getProjectById } from "@/server/repositories/project-repository";
import { getTestCaseById } from "@/server/repositories/test-case-repository";
import { getDefectById } from "@/server/repositories/defect-repository";
import { getTestRunById } from "@/server/repositories/test-run-repository";
import { getAttachmentById } from "@/server/repositories/attachment-repository";

/**
 * DB-backed multi-tenant isolation tests (mandated TEST 1–4, 7, 8).
 *
 * These prove the STRUCTURAL guarantee: tenant-scoped repository reads for one
 * organization can never return another organization's rows — even with a
 * valid, existing resource id. This is the anti-IDOR property enforced in the
 * data-access layer, independent of any UI.
 *
 * Requires DATABASE_URL + a migrated schema; skipped otherwise.
 */
const describeDb = hasDb ? describe : describe.skip;

describeDb("multi-tenant data isolation", () => {
  const ctx = {
    orgA: "",
    orgB: "",
    userA: "",
    userB: "",
    projectA: "",
    projectB: "",
    testCaseB: "",
    defectB: "",
    runB: "",
    attachmentB: "",
  };

  beforeAll(async () => {
    ctx.userA = await makeUser("Owner A");
    ctx.userB = await makeUser("Owner B");
    ctx.orgA = await makeOrg("Acme QA", ctx.userA);
    ctx.orgB = await makeOrg("Globex Testing", ctx.userB);
    await addMember(ctx.orgA, ctx.userA, "OWNER");
    await addMember(ctx.orgB, ctx.userB, "OWNER");

    ctx.projectA = await makeProject(ctx.orgA, ctx.userA, "ACME");
    ctx.projectB = await makeProject(ctx.orgB, ctx.userB, "GLBX");

    ctx.testCaseB = await makeTestCase(ctx.orgB, ctx.projectB, ctx.userB);
    ctx.defectB = await makeDefect(ctx.orgB, ctx.projectB, ctx.userB);
    ctx.runB = await makeTestRun(ctx.orgB, ctx.projectB, ctx.userB);
    const execB = await makeExecution(
      ctx.orgB,
      ctx.projectB,
      ctx.runB,
      ctx.testCaseB
    );
    ctx.attachmentB = await makeAttachment(
      ctx.orgB,
      ctx.projectB,
      execB,
      ctx.userB
    );
  }, 60_000);

  afterAll(async () => {
    await cleanupFixtures();
  }, 60_000);

  it("TEST 1: Org A cannot read Org B's project", async () => {
    expect(await getProjectById(ctx.orgB, ctx.projectB)).not.toBeNull();
    expect(await getProjectById(ctx.orgA, ctx.projectB)).toBeNull();
  });

  it("TEST 2: Org A cannot read Org B's test case", async () => {
    expect(await getTestCaseById(ctx.orgB, ctx.testCaseB)).not.toBeNull();
    expect(await getTestCaseById(ctx.orgA, ctx.testCaseB)).toBeNull();
  });

  it("TEST 3: Org A cannot read Org B's test run", async () => {
    expect(await getTestRunById(ctx.orgB, ctx.runB)).not.toBeNull();
    expect(await getTestRunById(ctx.orgA, ctx.runB)).toBeNull();
  });

  it("TEST 4: Org A cannot read Org B's defect", async () => {
    expect(await getDefectById(ctx.orgB, ctx.defectB)).not.toBeNull();
    expect(await getDefectById(ctx.orgA, ctx.defectB)).toBeNull();
  });

  it("TEST 7: Org A cannot read Org B's private attachment", async () => {
    expect(await getAttachmentById(ctx.orgB, ctx.attachmentB)).not.toBeNull();
    expect(await getAttachmentById(ctx.orgA, ctx.attachmentB)).toBeNull();
  });

  it("TEST 8: swapping a valid id across tenants yields no access", async () => {
    // Even though projectB is a real, existing id, requesting it in Org A's
    // scope returns null — id-substitution cannot cross the tenant boundary.
    const asTenantA = await getProjectById(ctx.orgA, ctx.projectB);
    const asTenantB = await getProjectById(ctx.orgB, ctx.projectB);
    expect(asTenantA).toBeNull();
    expect(asTenantB?.id).toBe(ctx.projectB);
  });
});
