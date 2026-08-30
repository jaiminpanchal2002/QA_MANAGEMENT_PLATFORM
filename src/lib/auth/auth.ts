import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { getServerEnv } from "@/lib/env";
import { mailer } from "@/lib/email/mailer";
import { verifyEmailHtml, resetPasswordEmailHtml } from "@/lib/email/templates";
import { publicEnv } from "@/lib/env";
import { signUpServerSchema } from "@/features/auth/schema";

const env = getServerEnv();

/**
 * Better Auth instance. Owns identity: email/password sign-up & sign-in,
 * sessions (secure http-only cookies), email verification and password reset.
 *
 * Domain authorization (org membership, RBAC) is layered on top in
 * src/lib/auth/context.ts — Better Auth is intentionally kept to identity only.
 */
export const auth = betterAuth({
  appName: "QA Management Platform",
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  hooks: {
    // Server-side enforcement of the auth validation policy — cannot be
    // bypassed by calling the API directly (client validation is only UX).
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email") {
        const result = signUpServerSchema.safeParse(ctx.body);
        if (!result.success) {
          throw new APIError("BAD_REQUEST", {
            message:
              result.error.issues[0]?.message ?? "Invalid sign-up details",
          });
        }
      }
    }),
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    // Accounts must verify their email before they can sign in. Better Auth
    // blocks sign-in for unverified users and (re)sends the verification mail,
    // so this is enforced server-side — a client can't bypass it.
    requireEmailVerification: true,
    async sendResetPassword({ user, url }) {
      await mailer.send({
        to: user.email,
        subject: "Reset your QA Platform password",
        html: resetPasswordEmailHtml({ name: user.name ?? user.email, url }),
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    async sendVerificationEmail({ user, url }) {
      await mailer.send({
        to: user.email,
        subject: "Verify your email for QA Platform",
        html: verifyEmailHtml({ name: user.name ?? user.email, url }),
      });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh daily
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  advanced: {
    // Keep the default cookie prefix so middleware's getSessionCookie()
    // resolves the same cookie name without extra configuration.
    useSecureCookies: env.NODE_ENV === "production",
  },
  trustedOrigins: Array.from(
    new Set(
      [
        env.BETTER_AUTH_URL,
        publicEnv.NEXT_PUBLIC_APP_URL,
        process.env.VERCEL_PROJECT_PRODUCTION_URL
          ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
          : null,
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
      ].filter((v): v is string => Boolean(v))
    )
  ),
  plugins: [nextCookies()],
});

export type AuthSession = typeof auth.$Infer.Session;
