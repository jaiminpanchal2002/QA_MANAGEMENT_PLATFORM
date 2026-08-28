import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { getServerEnv } from "@/lib/env";
import { mailer } from "@/lib/email/mailer";
import { publicEnv } from "@/lib/env";

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
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: false,
    async sendResetPassword({ user, url }) {
      await mailer.send({
        to: user.email,
        subject: "Reset your QA Platform password",
        html: resetPasswordEmail(user.name ?? user.email, url),
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
        html: verifyEmail(user.name ?? user.email, url),
      });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh daily
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  advanced: {
    cookiePrefix: "qa",
    useSecureCookies: env.NODE_ENV === "production",
  },
  trustedOrigins: [env.BETTER_AUTH_URL, publicEnv.NEXT_PUBLIC_APP_URL],
  plugins: [nextCookies()],
});

export type AuthSession = typeof auth.$Infer.Session;

function verifyEmail(name: string, url: string): string {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto">
      <h2>Welcome to QA Platform, ${escapeHtml(name)}</h2>
      <p>Confirm your email address to activate your account.</p>
      <p><a href="${url}" style="background:#4f46e5;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Verify email</a></p>
      <p style="color:#64748b;font-size:12px">If you didn't create this account, you can ignore this email.</p>
    </div>`;
}

function resetPasswordEmail(name: string, url: string): string {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto">
      <h2>Password reset</h2>
      <p>Hi ${escapeHtml(name)}, use the link below to choose a new password.</p>
      <p><a href="${url}" style="background:#4f46e5;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Reset password</a></p>
      <p style="color:#64748b;font-size:12px">This link expires shortly. If you didn't request it, ignore this email.</p>
    </div>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
