import { z } from "zod";

/**
 * Shared authentication validation — used by the client forms (inline errors)
 * AND enforced server-side in Better Auth (see src/lib/auth/auth.ts), so the
 * rules cannot be bypassed by calling the API directly.
 */

// A small blocklist of common disposable / throwaway email providers. Real
// providers (gmail.com, company domains, ...) are allowed; ownership of the
// address is separately proven by email verification.
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "10minutemail.com",
  "guerrillamail.com",
  "guerrillamail.info",
  "yopmail.com",
  "tempmail.com",
  "temp-mail.org",
  "trashmail.com",
  "throwawaymail.com",
  "getnada.com",
  "sharklasers.com",
  "dispostable.com",
  "maildrop.cc",
  "fakeinbox.com",
]);

/**
 * Placeholder / throwaway local-parts (the bit before "@"). These are the
 * values people type when they are not entering a real address — the reason
 * `abc@gmail.com`, `test@…`, `asdf@…` must be rejected even though the domain
 * itself is legitimate. Compared after normalization (see `normalizeLocal`).
 */
const PLACEHOLDER_LOCALPARTS = new Set([
  "a",
  "ab",
  "abc",
  "abcd",
  "abcde",
  "abc123",
  "abcdef",
  "xyz",
  "xxx",
  "qwerty",
  "asdf",
  "asdfg",
  "asdfgh",
  "zzz",
  "test",
  "tester",
  "testing",
  "test123",
  "testtest",
  "example",
  "sample",
  "demo",
  "dummy",
  "fake",
  "invalid",
  "placeholder",
  "foo",
  "bar",
  "baz",
  "foobar",
  "qux",
  "user",
  "username",
  "someone",
  "somebody",
  "anybody",
  "email",
  "mail",
  "temp",
  "tmp",
  "trash",
  "junk",
  "none",
  "null",
  "nil",
  "na",
  "tbd",
  "n-a",
]);

/**
 * Normalize a local-part for placeholder detection: lowercase, drop the "+tag"
 * suffix, and remove dots (Gmail-style, so `a.b.c` == `abc`). This makes the
 * blocklist resilient to trivial obfuscation like `a.b.c@gmail.com`.
 */
function normalizeLocal(email: string): string {
  const local = email.split("@")[0] ?? "";
  return local.split("+")[0]!.replace(/\./g, "");
}

function isPlausibleLocal(email: string): boolean {
  const local = normalizeLocal(email);
  if (local.length === 0) return false;
  if (PLACEHOLDER_LOCALPARTS.has(local)) return false;
  // All the same character, e.g. "aaaa", "1111".
  if (/^(.)\1*$/.test(local)) return false;
  // Purely numeric, e.g. "12345".
  if (/^\d+$/.test(local)) return false;
  return true;
}

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Email is required")
  .max(254, "Email is too long")
  .email("Enter a valid email address")
  .refine(
    (email) => {
      const domain = email.split("@")[1];
      return domain ? !DISPOSABLE_DOMAINS.has(domain) : false;
    },
    { message: "Disposable email addresses are not allowed" }
  )
  .refine(isPlausibleLocal, {
    message: "Enter a real email address, not a placeholder",
  });

/** Password requirement predicates — reused by the live UI checklist. */
export const passwordRules = [
  { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { label: "One lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "One number", test: (v: string) => /[0-9]/.test(v) },
  {
    label: "One special character",
    test: (v: string) => /[^A-Za-z0-9]/.test(v),
  },
] as const;

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  .regex(/[a-z]/, "Include at least one lowercase letter")
  .regex(/[A-Z]/, "Include at least one uppercase letter")
  .regex(/[0-9]/, "Include at least one number")
  .regex(/[^A-Za-z0-9]/, "Include at least one special character");

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name is too long")
  .regex(
    /^[\p{L}\p{M}][\p{L}\p{M}'.\- ]*$/u,
    "Name contains invalid characters"
  );

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const signUpSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;

/** Server-side guard payload (email + password only) for the Better Auth hook. */
export const signUpServerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema.optional(),
});
