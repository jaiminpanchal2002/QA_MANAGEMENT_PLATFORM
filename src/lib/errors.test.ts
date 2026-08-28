import { describe, expect, it } from "vitest";
import { z } from "zod";
import { AppError, Errors, isAppError, toErrorResponse } from "./errors";

describe("Errors factory + AppError", () => {
  it("maps codes to status and exposes 4xx", () => {
    expect(Errors.notFound().status).toBe(404);
    expect(Errors.forbidden().status).toBe(403);
    expect(Errors.conflict().status).toBe(409);
    expect(Errors.rateLimited().status).toBe(429);
    expect(Errors.notFound().expose).toBe(true);
  });

  it("does not expose 5xx", () => {
    expect(Errors.internal().expose).toBe(false);
  });

  it("isAppError narrows correctly", () => {
    expect(isAppError(Errors.badRequest())).toBe(true);
    expect(isAppError(new Error("plain"))).toBe(false);
  });
});

describe("toErrorResponse", () => {
  it("converts a ZodError to a 400 with field details", () => {
    const err = z.object({ email: z.string().email() }).safeParse({
      email: "nope",
    });
    const zerr = (err as { error: z.ZodError }).error;
    const { status, body } = toErrorResponse(zerr);
    expect(status).toBe(400);
    expect(body.error.code).toBe("VALIDATION");
    expect(body.success).toBe(false);
  });

  it("passes through an exposed AppError message", () => {
    const { status, body } = toErrorResponse(Errors.conflict("dupe key"));
    expect(status).toBe(409);
    expect(body.error.message).toBe("dupe key");
  });

  it("hides internal error messages (no leak)", () => {
    const { status, body } = toErrorResponse(
      new AppError("INTERNAL", "database exploded: secret detail")
    );
    expect(status).toBe(500);
    expect(body.error.message).toBe("Internal server error");
    expect(body.error.message).not.toContain("secret");
  });

  it("handles unknown thrown values safely", () => {
    const { status, body } = toErrorResponse("a string was thrown");
    expect(status).toBe(500);
    expect(body.error.code).toBe("INTERNAL");
  });
});
