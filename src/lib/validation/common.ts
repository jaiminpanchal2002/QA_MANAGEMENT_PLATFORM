import { z } from "zod";

/** Reusable Zod primitives shared across feature validation schemas. */
export const uuidSchema = z.string().uuid("Invalid identifier");

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type Pagination = z.infer<typeof paginationSchema>;

export const sortOrderSchema = z.enum(["asc", "desc"]).default("desc");

/** Parse URLSearchParams into a plain object for Zod parsing. */
export function searchParamsToObject(
  params: URLSearchParams
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of params.entries()) out[key] = value;
  return out;
}

export function buildPageMeta(
  page: number,
  pageSize: number,
  total: number
) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/** A bounded, trimmed non-empty string. */
export const nonEmptyString = (max = 255) =>
  z.string().trim().min(1, "Required").max(max);

/** Project keys: 2–10 uppercase alphanumerics, e.g. SHOP, CRM2. */
export const projectKeySchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z][A-Z0-9]{1,9}$/, "2–10 chars, letters/numbers, starts with a letter");
