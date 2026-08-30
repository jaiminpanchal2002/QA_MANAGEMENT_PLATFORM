import { describe, expect, it } from "vitest";
import {
  can,
  canAssignOrgRole,
  hasOrgPermission,
  hasProjectPermission,
} from "./rbac";

/**
 * Pure RBAC unit tests. These prove the role→permission model without any
 * database, covering several mandated security scenarios:
 *   TEST 5  — Viewer cannot perform admin operations
 *   TEST 6  — QA Engineer cannot change organization settings
 *   TEST 9  — A user cannot escalate their own role
 */
describe("organization RBAC", () => {
  it("OWNER can update and delete the organization", () => {
    expect(hasOrgPermission("OWNER", "organization.update")).toBe(true);
    expect(hasOrgPermission("OWNER", "organization.delete")).toBe(true);
    expect(hasOrgPermission("OWNER", "settings.update")).toBe(true);
  });

  it("ADMIN can manage members but cannot delete the organization", () => {
    expect(hasOrgPermission("ADMIN", "organization.manage_members")).toBe(true);
    expect(hasOrgPermission("ADMIN", "organization.delete")).toBe(false);
  });

  it("TEST 5: VIEWER cannot perform admin operations", () => {
    expect(hasOrgPermission("VIEWER", "organization.update")).toBe(false);
    expect(hasOrgPermission("VIEWER", "organization.manage_members")).toBe(false);
    expect(hasOrgPermission("VIEWER", "settings.update")).toBe(false);
    expect(hasOrgPermission("VIEWER", "project.create")).toBe(false);
  });

  it("MEMBER can create projects but not manage the org", () => {
    expect(hasOrgPermission("MEMBER", "project.create")).toBe(true);
    expect(hasOrgPermission("MEMBER", "organization.update")).toBe(false);
  });
});

describe("project RBAC", () => {
  it("PROJECT_ADMIN has full project control", () => {
    expect(hasProjectPermission("PROJECT_ADMIN", "project.delete")).toBe(true);
    expect(hasProjectPermission("PROJECT_ADMIN", "testcase.delete")).toBe(true);
  });

  it("QA_ENGINEER can author and execute test cases", () => {
    expect(hasProjectPermission("QA_ENGINEER", "testcase.create")).toBe(true);
    expect(hasProjectPermission("QA_ENGINEER", "testcase.execute")).toBe(true);
  });

  it("QA_ENGINEER cannot delete a project", () => {
    expect(hasProjectPermission("QA_ENGINEER", "project.delete")).toBe(false);
  });

  it("DEVELOPER can report defects but not author test cases", () => {
    expect(hasProjectPermission("DEVELOPER", "defect.create")).toBe(true);
    expect(hasProjectPermission("DEVELOPER", "testcase.create")).toBe(false);
  });

  it("project VIEWER is read-only", () => {
    expect(hasProjectPermission("VIEWER", "testcase.view")).toBe(true);
    expect(hasProjectPermission("VIEWER", "testcase.create")).toBe(false);
    expect(hasProjectPermission("VIEWER", "defect.create")).toBe(false);
  });
});

describe("combined permission resolution (can)", () => {
  it("org OWNER/ADMIN implicitly hold all project permissions", () => {
    expect(can({ orgRole: "OWNER", projectRole: null }, "testcase.delete")).toBe(
      true
    );
    expect(can({ orgRole: "ADMIN", projectRole: null }, "project.delete")).toBe(
      true
    );
  });

  it("TEST 6: a QA Engineer cannot change organization settings", () => {
    expect(
      can({ orgRole: "MEMBER", projectRole: "QA_ENGINEER" }, "settings.update")
    ).toBe(false);
    expect(
      can(
        { orgRole: "MEMBER", projectRole: "QA_ENGINEER" },
        "organization.update"
      )
    ).toBe(false);
  });

  it("TEST 10: project-level permission restrictions are enforced", () => {
    // A plain org MEMBER with a project VIEWER role cannot create test cases.
    expect(
      can({ orgRole: "MEMBER", projectRole: "VIEWER" }, "testcase.create")
    ).toBe(false);
    // But a QA_LEAD on the same project can.
    expect(
      can({ orgRole: "MEMBER", projectRole: "QA_LEAD" }, "testcase.create")
    ).toBe(true);
  });

  it("an org member can read project data but not mutate without a project role", () => {
    // Read is org-wide (collaboration): members see projects in their tenant.
    expect(
      can({ orgRole: "MEMBER", projectRole: null }, "project.view")
    ).toBe(true);
    expect(
      can({ orgRole: "MEMBER", projectRole: null }, "testcase.view")
    ).toBe(true);
    expect(
      can({ orgRole: "MEMBER", projectRole: null }, "defect.view")
    ).toBe(true);
    // But mutations still require a project role.
    expect(
      can({ orgRole: "MEMBER", projectRole: null }, "testcase.create")
    ).toBe(false);
    expect(
      can({ orgRole: "MEMBER", projectRole: null }, "project.delete")
    ).toBe(false);
  });

  it("an org VIEWER can read but never mutate project data", () => {
    expect(
      can({ orgRole: "VIEWER", projectRole: null }, "testcase.view")
    ).toBe(true);
    expect(
      can({ orgRole: "VIEWER", projectRole: null }, "testcase.create")
    ).toBe(false);
  });
});

describe("privilege escalation guard (TEST 9)", () => {
  it("a MEMBER cannot assign any elevated role", () => {
    expect(canAssignOrgRole("MEMBER", "ADMIN")).toBe(false);
    expect(canAssignOrgRole("MEMBER", "OWNER")).toBe(false);
    expect(canAssignOrgRole("MEMBER", "MEMBER")).toBe(false);
  });

  it("an ADMIN cannot grant OWNER (only OWNER can)", () => {
    expect(canAssignOrgRole("ADMIN", "OWNER")).toBe(false);
    expect(canAssignOrgRole("OWNER", "OWNER")).toBe(true);
  });

  it("an ADMIN can assign ADMIN and below", () => {
    expect(canAssignOrgRole("ADMIN", "ADMIN")).toBe(true);
    expect(canAssignOrgRole("ADMIN", "MEMBER")).toBe(true);
    expect(canAssignOrgRole("ADMIN", "VIEWER")).toBe(true);
  });

  it("a VIEWER cannot escalate their own role to ADMIN", () => {
    expect(canAssignOrgRole("VIEWER", "ADMIN")).toBe(false);
  });
});
