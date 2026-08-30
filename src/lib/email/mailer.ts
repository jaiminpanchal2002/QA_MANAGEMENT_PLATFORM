import "server-only";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import { getServerEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

/**
 * Email abstraction with three transports, chosen at startup:
 *   1. SMTP (nodemailer) — when SMTP_HOST + SMTP_USER + SMTP_PASSWORD are set
 *      (e.g. Gmail with an app password).
 *   2. Resend — when RESEND_API_KEY is set.
 *   3. Console — otherwise (local dev / tests), so the app runs with no
 *      provider configured. Swapping providers only touches this file.
 */
export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface Mailer {
  send(input: SendEmailInput): Promise<{ id: string | null; delivered: boolean }>;
}

function smtpMailer(env: ReturnType<typeof getServerEnv>): Mailer {
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    // Implicit TLS on 465; STARTTLS on 587 (secure=false lets nodemailer
    // upgrade the connection).
    secure: env.SMTP_SECURE || env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
  });

  return {
    async send(input) {
      try {
        const info = await transport.sendMail({
          from: env.EMAIL_FROM,
          to: input.to,
          subject: input.subject,
          html: input.html,
          text: input.text ?? stripHtml(input.html),
        });
        return { id: info.messageId ?? null, delivered: true };
      } catch (error) {
        logger.error("SMTP transport error", {
          error: error instanceof Error ? error.message : "unknown",
        });
        return { id: null, delivered: false };
      }
    },
  };
}

function createMailer(): Mailer {
  const env = getServerEnv();

  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD) {
    logger.info("Email transport: SMTP", { host: env.SMTP_HOST });
    return smtpMailer(env);
  }

  if (!env.RESEND_API_KEY) {
    return {
      async send(input) {
        logger.info("Email (dev console transport)", {
          to: input.to,
          subject: input.subject,
        });
        return { id: null, delivered: false };
      },
    };
  }

  const resend = new Resend(env.RESEND_API_KEY);
  return {
    async send(input) {
      try {
        const result = await resend.emails.send({
          from: env.EMAIL_FROM,
          to: input.to,
          subject: input.subject,
          html: input.html,
          text: input.text ?? stripHtml(input.html),
        });
        if (result.error) {
          logger.error("Email send failed", { message: result.error.message });
          return { id: null, delivered: false };
        }
        return { id: result.data?.id ?? null, delivered: true };
      } catch (error) {
        logger.error("Email transport error", {
          error: error instanceof Error ? error.message : "unknown",
        });
        return { id: null, delivered: false };
      }
    },
  };
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export const mailer = createMailer();
