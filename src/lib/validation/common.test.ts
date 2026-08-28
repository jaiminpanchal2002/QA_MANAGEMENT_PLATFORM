import { describe, expect, it } from "vitest";
import {
  buildPageMeta,
  nonEmptyString,
  paginationSchema,
  projectKeySchema,
  searchParamsToObject,
  uuidSchema,
} from "./common";

describe("paginationSchema", () => {
  it("defaults and coerces", () => {
    expect(paginationSchema.parse({})).toEqual({ page: 1, pageSize: 20 });
    expect(paginationSchema.parse({ page: "2", pageSize: "5" })).toEqual({
      page: 2,
      pageSize: 5,
    });
  });
  it("rejects out-of-range values", () => {
    expect(paginationSchema.safeParse({ pageSize: "101" }).success).toBe(false);
    expect(paginationSchema.safeParse({ page: "0" }).success).toBe(false);
  });
});

describe("projectKeySchema", () => {
  it("uppercases valid keys", () => {
    expect(projectKeySchema.parse("shop")).toBe("SHOP");
  });
  it("rejects invalid keys", () => {
    for (const bad of ["S", "1AB", "AB CD", "TOOLONGKEY12", "sh!"]) {
      expect(projectKeySchema.safeParse(bad).success).toBe(false);
    }
  });
});

describe("nonEmptyString + uuidSchema", () => {
  it("nonEmptyString trims and enforces bounds", () => {
    expect(nonEmptyString(5).safeParse("  hi ").success).toBe(true);
    expect(nonEmptyString(5).safeParse("   ").success).toBe(false);
    expect(nonEmptyString(2).safeParse("abc").success).toBe(false);
  });
  it("uuidSchema validates uuids", () => {
    expect(
      uuidSchema.safeParse("11111111-1111-4111-8111-111111111111").success
    ).toBe(true);
    expect(uuidSchema.safeParse("nope").success).toBe(false);
  });
});

describe("searchParamsToObject + buildPageMeta", () => {
  it("flattens URLSearchParams", () => {
    const p = new URLSearchParams("a=1&b=two");
    expect(searchParamsToObject(p)).toEqual({ a: "1", b: "two" });
  });
  it("computes page meta with a floor of 1 page", () => {
    expect(buildPageMeta(1, 20, 0).totalPages).toBe(1);
    expect(buildPageMeta(2, 20, 45)).toEqual({
      page: 2,
      pageSize: 20,
      total: 45,
      totalPages: 3,
    });
  });
});
