import { describe, expect, it } from "vitest";
import {
  createProjectSchema,
  listProjectsSchema,
  updateProjectSchema,
} from "@/features/projects/schema";
import {
  createTestCaseSchema,
  listTestCasesSchema,
} from "@/features/test-cases/schema";
import { createOrganizationSchema } from "@/features/organizations/schema";
import { testResultsPayloadSchema } from "@/features/integrations/schema";
import {
  createDefectSchema,
  updateDefectStatusSchema,
} from "@/features/defects/schema";
import { createRunSchema, executeSchema } from "@/features/test-runs/schema";
import {
  emailSchema,
  passwordSchema,
  signUpSchema,
} from "@/features/auth/schema";

/**
 * Input-validation tests for every user-facing schema. Covers happy path,
 * required/empty, boundary lengths, format rules, enum guards and coercion.
 * These are the guarantees behind "all inputs are validated".
 */
describe("createProjectSchema", () => {
  it("accepts a valid project", () => {
    const r = createProjectSchema.safeParse({
      name: "Shop Checkout",
      key: "SHOP",
      description: "desc",
    });
    expect(r.success).toBe(true);
  });

  it("uppercases the key", () => {
    const r = createProjectSchema.parse({ name: "X", key: "shop" });
    expect(r.key).toBe("SHOP");
  });

  it("rejects empty name", () => {
    expect(createProjectSchema.safeParse({ name: "", key: "SHOP" }).success).toBe(
      false
    );
  });

  it("rejects a key that is too short", () => {
    expect(createProjectSchema.safeParse({ name: "X", key: "S" }).success).toBe(
      false
    );
  });

  it("rejects a key with invalid characters", () => {
    expect(
      createProjectSchema.safeParse({ name: "X", key: "SH OP!" }).success
    ).toBe(false);
  });

  it("rejects a key longer than 10 chars", () => {
    expect(
      createProjectSchema.safeParse({ name: "X", key: "ABCDEFGHIJK" }).success
    ).toBe(false);
  });

  it("rejects a key starting with a number", () => {
    expect(
      createProjectSchema.safeParse({ name: "X", key: "1SHOP" }).success
    ).toBe(false);
  });

  it("rejects a name over 120 chars", () => {
    expect(
      createProjectSchema.safeParse({ name: "a".repeat(121), key: "SHOP" })
        .success
    ).toBe(false);
  });
});

describe("updateProjectSchema", () => {
  it("allows partial updates", () => {
    expect(updateProjectSchema.safeParse({ status: "ARCHIVED" }).success).toBe(
      true
    );
    expect(updateProjectSchema.safeParse({}).success).toBe(true);
  });
  it("rejects an unknown status", () => {
    expect(
      updateProjectSchema.safeParse({ status: "DELETED" }).success
    ).toBe(false);
  });
});

describe("listProjectsSchema (pagination coercion + defaults)", () => {
  it("applies defaults", () => {
    const r = listProjectsSchema.parse({});
    expect(r.page).toBe(1);
    expect(r.pageSize).toBe(20);
  });
  it("coerces string query params to numbers", () => {
    const r = listProjectsSchema.parse({ page: "3", pageSize: "50" });
    expect(r.page).toBe(3);
    expect(r.pageSize).toBe(50);
  });
  it("clamps pageSize to the max via rejection", () => {
    expect(listProjectsSchema.safeParse({ pageSize: "1000" }).success).toBe(
      false
    );
  });
  it("rejects page < 1", () => {
    expect(listProjectsSchema.safeParse({ page: "0" }).success).toBe(false);
  });
});

describe("createTestCaseSchema", () => {
  const base = { title: "Login works" };

  it("accepts minimal input and applies enum defaults", () => {
    const r = createTestCaseSchema.parse(base);
    expect(r.priority).toBe("MEDIUM");
    expect(r.type).toBe("FUNCTIONAL");
    expect(r.status).toBe("DRAFT");
    expect(r.steps).toEqual([]);
  });

  it("rejects empty title", () => {
    expect(createTestCaseSchema.safeParse({ title: "" }).success).toBe(false);
  });

  it("rejects an invalid priority enum", () => {
    expect(
      createTestCaseSchema.safeParse({ ...base, priority: "URGENT" }).success
    ).toBe(false);
  });

  it("rejects a non-uuid assignedTo", () => {
    expect(
      createTestCaseSchema.safeParse({ ...base, assignedTo: "not-a-uuid" })
        .success
    ).toBe(false);
  });

  it("accepts a valid uuid assignedTo", () => {
    expect(
      createTestCaseSchema.safeParse({
        ...base,
        assignedTo: "11111111-1111-4111-8111-111111111111",
      }).success
    ).toBe(true);
  });

  it("rejects a step with an empty action", () => {
    expect(
      createTestCaseSchema.safeParse({ ...base, steps: [{ action: "" }] })
        .success
    ).toBe(false);
  });

  it("rejects more than 20 tags", () => {
    expect(
      createTestCaseSchema.safeParse({
        ...base,
        tags: Array.from({ length: 21 }, (_, i) => `t${i}`),
      }).success
    ).toBe(false);
  });
});

describe("listTestCasesSchema", () => {
  it("rejects an invalid sortBy", () => {
    expect(
      listTestCasesSchema.safeParse({ sortBy: "random" }).success
    ).toBe(false);
  });
  it("accepts valid sort", () => {
    expect(
      listTestCasesSchema.safeParse({ sortBy: "title", sortOrder: "asc" })
        .success
    ).toBe(true);
  });
});

describe("createOrganizationSchema", () => {
  it("requires a non-empty name", () => {
    expect(createOrganizationSchema.safeParse({ name: "" }).success).toBe(false);
    expect(createOrganizationSchema.safeParse({ name: "Acme" }).success).toBe(
      true
    );
  });
});

describe("createDefectSchema", () => {
  it("accepts a minimal defect with enum defaults", () => {
    const r = createDefectSchema.parse({ title: "Crash" });
    expect(r.priority).toBe("MEDIUM");
    expect(r.severity).toBe("MAJOR");
  });
  it("rejects an empty title", () => {
    expect(createDefectSchema.safeParse({ title: "" }).success).toBe(false);
  });
  it("rejects an invalid severity", () => {
    expect(
      createDefectSchema.safeParse({ title: "X", severity: "HUGE" }).success
    ).toBe(false);
  });
  it("rejects a non-uuid assignedTo", () => {
    expect(
      createDefectSchema.safeParse({ title: "X", assignedTo: "nope" }).success
    ).toBe(false);
  });
});

describe("updateDefectStatusSchema", () => {
  it("accepts valid statuses and rejects others", () => {
    expect(updateDefectStatusSchema.safeParse({ status: "RESOLVED" }).success).toBe(
      true
    );
    expect(updateDefectStatusSchema.safeParse({ status: "DONE" }).success).toBe(
      false
    );
  });
});

describe("auth: emailSchema", () => {
  it("accepts a normal email and lowercases it", () => {
    const r = emailSchema.safeParse("Ada.Lovelace@Company.com");
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe("ada.lovelace@company.com");
  });
  it("rejects malformed emails", () => {
    for (const bad of ["notanemail", "a@", "@b.com", "a b@c.com"]) {
      expect(emailSchema.safeParse(bad).success).toBe(false);
    }
  });
  it("rejects disposable email domains", () => {
    expect(emailSchema.safeParse("x@mailinator.com").success).toBe(false);
    expect(emailSchema.safeParse("x@yopmail.com").success).toBe(false);
  });
  it("rejects placeholder / test local-parts on real domains", () => {
    for (const bad of [
      "abc@gmail.com",
      "test@gmail.com",
      "asdf@gmail.com",
      "a.b.c@gmail.com", // gmail dots normalize to "abc"
      "abc+promo@gmail.com", // +tag stripped -> "abc"
      "aaaa@company.com",
      "12345@company.com",
      "demo@outlook.com",
    ]) {
      expect(emailSchema.safeParse(bad).success).toBe(false);
    }
  });
  it("accepts genuine-looking addresses", () => {
    for (const ok of [
      "ada.lovelace@gmail.com",
      "jaimin.panchal@company.com",
      "qa-lead@acme.io",
    ]) {
      expect(emailSchema.safeParse(ok).success).toBe(true);
    }
  });
});

describe("auth: passwordSchema (strong policy)", () => {
  it("accepts a strong password", () => {
    expect(passwordSchema.safeParse("Password123!").success).toBe(true);
  });
  it("rejects weak passwords", () => {
    for (const bad of [
      "short1!", // too short
      "alllowercase1!", // no uppercase
      "ALLUPPERCASE1!", // no lowercase
      "NoNumbers!!", // no digit
      "NoSpecial123", // no special char
    ]) {
      expect(passwordSchema.safeParse(bad).success).toBe(false);
    }
  });
});

describe("auth: signUpSchema", () => {
  it("rejects a weak password even with a valid email/name", () => {
    expect(
      signUpSchema.safeParse({
        name: "Ada Lovelace",
        email: "ada@example.com",
        password: "weak",
      }).success
    ).toBe(false);
  });
  it("accepts a fully valid sign-up", () => {
    expect(
      signUpSchema.safeParse({
        name: "Ada Lovelace",
        email: "ada@example.com",
        password: "Password123!",
      }).success
    ).toBe(true);
  });
});

describe("createRunSchema", () => {
  const uuid = "11111111-1111-4111-8111-111111111111";
  it("accepts a run with at least one case", () => {
    expect(
      createRunSchema.safeParse({ name: "Run 1", testCaseIds: [uuid] }).success
    ).toBe(true);
  });
  it("rejects a run with no cases", () => {
    expect(
      createRunSchema.safeParse({ name: "Run 1", testCaseIds: [] }).success
    ).toBe(false);
  });
  it("rejects non-uuid case ids", () => {
    expect(
      createRunSchema.safeParse({ name: "Run 1", testCaseIds: ["x"] }).success
    ).toBe(false);
  });
});

describe("executeSchema", () => {
  it("accepts a terminal status", () => {
    expect(executeSchema.safeParse({ status: "PASSED" }).success).toBe(true);
  });
  it("rejects NOT_EXECUTED (not a recordable result)", () => {
    expect(executeSchema.safeParse({ status: "NOT_EXECUTED" }).success).toBe(
      false
    );
  });
  it("rejects a negative duration", () => {
    expect(
      executeSchema.safeParse({ status: "PASSED", durationMs: -5 }).success
    ).toBe(false);
  });
});

describe("testResultsPayloadSchema (webhook ingestion)", () => {
  it("accepts a valid payload with defaults", () => {
    const r = testResultsPayloadSchema.parse({
      results: [{ testRef: "SHOP-TC-001", status: "PASSED" }],
    });
    expect(r.runName).toBe("CI Run");
    expect(r.results).toHaveLength(1);
  });

  it("rejects an empty results array", () => {
    expect(
      testResultsPayloadSchema.safeParse({ results: [] }).success
    ).toBe(false);
  });

  it("rejects an invalid result status", () => {
    expect(
      testResultsPayloadSchema.safeParse({
        results: [{ testRef: "X", status: "MAYBE" }],
      }).success
    ).toBe(false);
  });

  it("rejects a negative duration", () => {
    expect(
      testResultsPayloadSchema.safeParse({
        results: [{ testRef: "X", status: "PASSED", durationMs: -1 }],
      }).success
    ).toBe(false);
  });

  it("rejects more than 1000 results (DoS bound)", () => {
    expect(
      testResultsPayloadSchema.safeParse({
        results: Array.from({ length: 1001 }, () => ({
          testRef: "X",
          status: "PASSED" as const,
        })),
      }).success
    ).toBe(false);
  });
});
