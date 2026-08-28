import { z } from "zod";
import {
  nonEmptyString,
  paginationSchema,
  uuidSchema,
} from "@/lib/validation/common";

export const priorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const severityEnum = z.enum([
  "TRIVIAL",
  "MINOR",
  "MAJOR",
  "CRITICAL",
  "BLOCKER",
]);
export const testCaseStatusEnum = z.enum([
  "DRAFT",
  "ACTIVE",
  "DEPRECATED",
  "ARCHIVED",
]);
export const testCaseTypeEnum = z.enum([
  "FUNCTIONAL",
  "REGRESSION",
  "SMOKE",
  "INTEGRATION",
  "E2E",
  "PERFORMANCE",
  "SECURITY",
  "USABILITY",
  "API",
  "ACCESSIBILITY",
]);
export const automationStatusEnum = z.enum([
  "MANUAL",
  "AUTOMATED",
  "TO_BE_AUTOMATED",
  "CANNOT_AUTOMATE",
]);

export const stepSchema = z.object({
  action: nonEmptyString(1000),
  expectedResult: z.string().trim().max(1000).optional().nullable(),
  testData: z.string().trim().max(1000).optional().nullable(),
});

export const createTestCaseSchema = z.object({
  title: nonEmptyString(200),
  description: z.string().trim().max(5000).optional().nullable(),
  preconditions: z.string().trim().max(2000).optional().nullable(),
  expectedResult: z.string().trim().max(2000).optional().nullable(),
  priority: priorityEnum.default("MEDIUM"),
  severity: severityEnum.default("MINOR"),
  type: testCaseTypeEnum.default("FUNCTIONAL"),
  status: testCaseStatusEnum.default("DRAFT"),
  automationStatus: automationStatusEnum.default("MANUAL"),
  component: z.string().trim().max(120).optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  assignedTo: uuidSchema.optional().nullable(),
  requirementId: uuidSchema.optional().nullable(),
  steps: z.array(stepSchema).max(100).default([]),
});

export const listTestCasesSchema = paginationSchema.extend({
  search: z.string().trim().max(200).optional(),
  status: testCaseStatusEnum.optional(),
  priority: priorityEnum.optional(),
  type: testCaseTypeEnum.optional(),
  sortBy: z.enum(["createdAt", "title", "priority"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const bulkDeleteSchema = z.object({
  ids: z.array(uuidSchema).min(1).max(200),
});

export type CreateTestCaseInput = z.infer<typeof createTestCaseSchema>;
export type ListTestCasesInput = z.infer<typeof listTestCasesSchema>;
