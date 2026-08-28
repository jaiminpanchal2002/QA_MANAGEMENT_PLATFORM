import { describe, expect, it } from "vitest";
import {
  extractPrefix,
  generateIntegrationToken,
  hashToken,
  tokensMatch,
} from "./tokens";

describe("integration tokens", () => {
  it("generates a token with prefix + hash and never stores raw", () => {
    const { token, prefix, hash } = generateIntegrationToken();
    expect(token).toMatch(/^qa_[0-9a-f]{12}_[0-9a-f]{48}$/);
    expect(prefix).toHaveLength(12);
    expect(hash).toBe(hashToken(token));
    expect(hash).not.toContain(token);
  });

  it("extracts the prefix from a token", () => {
    const { token, prefix } = generateIntegrationToken();
    expect(extractPrefix(token)).toBe(prefix);
  });

  it("returns null prefix for malformed tokens", () => {
    expect(extractPrefix("garbage")).toBeNull();
    expect(extractPrefix("qa_short_x")).toBeNull();
  });

  it("verifies matching tokens in constant time", () => {
    const { token, hash } = generateIntegrationToken();
    expect(tokensMatch(token, hash)).toBe(true);
    expect(tokensMatch(token + "x", hash)).toBe(false);
    expect(tokensMatch("qa_000000000000_deadbeef", hash)).toBe(false);
  });
});
