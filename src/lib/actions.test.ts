import { describe, expect, it } from "vitest";
import { z } from "zod";
import { toActionError } from "./actions";
import { Errors } from "./errors";

describe("toActionError", () => {
  it("maps a ZodError to field errors", () => {
    const parsed = z.object({ name: z.string().min(1) }).safeParse({ name: "" });
    const result = toActionError((parsed as { error: z.ZodError }).error);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION");
      expect(result.error.fields?.name).toBeTruthy();
    }
  });

  it("passes through an exposed AppError message", () => {
    const result = toActionError(Errors.conflict("key taken"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe("key taken");
  });

  it("hides internal errors", () => {
    const result = toActionError(Errors.internal("db creds leaked"));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("Something went wrong");
      expect(result.error.message).not.toContain("creds");
    }
  });

  it("handles unknown throwables", () => {
    const result = toActionError(42);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INTERNAL");
  });
});
