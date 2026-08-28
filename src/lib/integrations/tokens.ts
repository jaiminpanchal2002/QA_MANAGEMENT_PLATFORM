import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Integration API tokens.
 *
 * Format: `qa_<prefix>_<secret>`. Only a SHA-256 hash of the full token and a
 * lookup prefix are stored — the raw token is shown once at creation and never
 * persisted. Verification is constant-time to avoid timing attacks.
 */
export interface GeneratedToken {
  token: string;
  prefix: string;
  hash: string;
}

export function generateIntegrationToken(): GeneratedToken {
  const prefix = randomBytes(6).toString("hex"); // 12 chars
  const secret = randomBytes(24).toString("hex");
  const token = `qa_${prefix}_${secret}`;
  return { token, prefix, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function extractPrefix(token: string): string | null {
  const match = /^qa_([0-9a-f]{12})_/.exec(token);
  return match ? match[1]! : null;
}

export function tokensMatch(token: string, storedHash: string): boolean {
  const computed = Buffer.from(hashToken(token));
  const stored = Buffer.from(storedHash);
  if (computed.length !== stored.length) return false;
  return timingSafeEqual(computed, stored);
}
