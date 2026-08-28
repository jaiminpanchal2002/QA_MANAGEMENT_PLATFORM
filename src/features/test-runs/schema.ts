import { z } from "zod";
import {
  nonEmptyString,
  paginationSchema,
  uuidSchema,
} from "@/lib/validation/common";

export const executionStatusEnum = z.enum([
  "NOT_EXECUTED",
  "PASSED",
  "FAILED",
  "BLOCKED",
  "SKIPPED",
  "RETEST",
  "IN_PROGRESS",
]);

export const createRunSchema = z.object({
  name: nonEmptyString(120),
  environment: z.string().trim().max(60).optional().nullable(),
  testPlanId: uuidSchema.optional().nullable(),
  testCaseIds: z.array(uuidSchema).min(1, "Select at least one test case").max(500),
});

export const executeSchema = z.object({
  status: executionStatusEnum.exclude(["NOT_EXECUTED"]),
  errorMessage: z.string().trim().max(5000).optional().nullable(),
  durationMs: z.number().int().min(0).max(86_400_000).optional().nullable(),
  browser: z.string().trim().max(60).optional().nullable(),
  comment: z.string().trim().max(2000).optional().nullable(),
});

export const listRunsSchema = paginationSchema.extend({
  status: z
    .enum([
      "NOT_STARTED",
      "QUEUED",
      "RUNNING",
      "PASSED",
      "FAILED",
      "BLOCKED",
      "CANCELLED",
      "COMPLETED",
    ])
    .optional(),
});

export type CreateRunInput = z.infer<typeof createRunSchema>;
export type ExecuteInput = z.infer<typeof executeSchema>;
