import { z } from "zod";
import {
  nonEmptyString,
  paginationSchema,
  uuidSchema,
} from "@/lib/validation/common";

export const defectPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const defectSeverityEnum = z.enum([
  "TRIVIAL",
  "MINOR",
  "MAJOR",
  "CRITICAL",
  "BLOCKER",
]);
export const defectStatusEnum = z.enum([
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "REOPENED",
  "CLOSED",
]);

export const createDefectSchema = z.object({
  title: nonEmptyString(200),
  description: z.string().trim().max(5000).optional().nullable(),
  priority: defectPriorityEnum.default("MEDIUM"),
  severity: defectSeverityEnum.default("MAJOR"),
  environment: z.string().trim().max(120).optional().nullable(),
  stepsToReproduce: z.string().trim().max(5000).optional().nullable(),
  expectedResult: z.string().trim().max(2000).optional().nullable(),
  actualResult: z.string().trim().max(2000).optional().nullable(),
  assignedTo: uuidSchema.optional().nullable(),
  testExecutionId: uuidSchema.optional().nullable(),
});

export const updateDefectStatusSchema = z.object({
  status: defectStatusEnum,
});

export const listDefectsSchema = paginationSchema.extend({
  search: z.string().trim().max(200).optional(),
  status: defectStatusEnum.optional(),
  severity: defectSeverityEnum.optional(),
});

export type CreateDefectInput = z.infer<typeof createDefectSchema>;
export type ListDefectsInput = z.infer<typeof listDefectsSchema>;
