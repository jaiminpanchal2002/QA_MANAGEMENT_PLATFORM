import { describe, expect, it } from "vitest";
import { cn, formatBytes, slugify, clamp, percent } from "./utils";

describe("cn", () => {
  it("merges and dedupes tailwind classes", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-sm", false && "hidden", "font-bold")).toBe(
      "text-sm font-bold"
    );
  });
});

describe("formatBytes", () => {
  it("formats zero", () => {
    expect(formatBytes(0)).toBe("0 B");
  });
  it("formats KB and MB", () => {
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1024 * 1024)).toBe("1 MB");
    expect(formatBytes(1536)).toBe("1.5 KB");
  });
});

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Acme QA Team!")).toBe("acme-qa-team");
  });
  it("trims leading/trailing separators", () => {
    expect(slugify("  --Hello--  ")).toBe("hello");
  });
  it("returns empty string for non-alphanumeric input", () => {
    expect(slugify("!!!")).toBe("");
  });
});

describe("clamp", () => {
  it("clamps within bounds", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });
});

describe("percent", () => {
  it("avoids division by zero", () => {
    expect(percent(5, 0)).toBe(0);
  });
  it("computes rounded percentage", () => {
    expect(percent(1, 3)).toBe(33.3);
    expect(percent(2, 4)).toBe(50);
  });
});
