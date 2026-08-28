import { z } from "zod";

/** Inbound CI/CD test-result payload (POST /api/v1/test-results). */
export const resultItemSchema = z.object({
  testRef: z.string().trim().min(1).max(120),
  status: z.enum(["PASSED", "FAILED", "BLOCKED", "SKIPPED", "RETEST"]),
  durationMs: z.number().int().min(0).optional(),
  errorMessage: z.string().max(5000).optional(),
  logs: z.string().max(20000).optional(),
});

export const testResultsPayloadSchema = z.object({
  runName: z.string().trim().min(1).max(120).default("CI Run"),
  environment: z.string().trim().max(60).optional(),
  provider: z
    .enum([
      "PLAYWRIGHT",
      "CYPRESS",
      "SELENIUM",
      "PYTEST",
      "JUNIT",
      "GITHUB_ACTIONS",
      "GITLAB_CI",
      "JENKINS",
      "GENERIC_API",
    ])
    .optional(),
  results: z.array(resultItemSchema).min(1).max(1000),
});

export type TestResultsPayload = z.infer<typeof testResultsPayloadSchema>;
