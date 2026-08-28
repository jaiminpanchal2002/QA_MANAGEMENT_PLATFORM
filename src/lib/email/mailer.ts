import "server-only";
import { Resend } from "resend";
import { getServerEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

/**
 * Email abstraction over Resend.
 *
 * When RESEND_API_KEY is absent (local dev / tests) emails are logged to the
 * console instead of being sent, so the app is fully runnable without an
 * email provider. Swapping providers only touches this file.
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

function createMailer(): Mailer {
  const env = getServerEnv();

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
