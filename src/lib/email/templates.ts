/**
 * Branded transactional email templates.
 *
 * Table-based, fully inline-styled HTML (the only reliable path across email
 * clients). The palette mirrors the app's design tokens — indigo #4f46e5
 * primary, slate neutrals, an 8px card radius and the "Q" logo mark — so email
 * and product feel like one product.
 */

const COLORS = {
  page: "#f1f5f9", // slate-100
  card: "#ffffff",
  border: "#e2e8f0", // slate-200
  ink: "#0f172a", // slate-900
  muted: "#64748b", // slate-500
  faint: "#94a3b8", // slate-400
  primary: "#4f46e5", // indigo-600 (matches --primary)
  primarySoft: "#eef2ff", // indigo-50
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface LayoutOptions {
  preheader: string;
  heading: string;
  /** Body HTML (already escaped where needed). */
  body: string;
  cta?: { label: string; url: string };
  /** Optional plain-text fallback link shown under the button. */
  fallbackUrl?: string;
  footnote?: string;
}

/** Shared shell: page background → centered card → logo header → content. */
function layout(o: LayoutOptions): string {
  const font =
    "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${COLORS.page};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${escapeHtml(o.preheader)}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.page};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:480px;max-width:100%;background:${COLORS.card};border:1px solid ${COLORS.border};border-radius:14px;overflow:hidden;">
            <!-- Header -->
            <tr>
              <td style="padding:24px 32px 0 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <span style="display:inline-block;width:30px;height:30px;background:${COLORS.primary};border-radius:8px;color:#ffffff;font-family:${font};font-weight:700;font-size:16px;line-height:30px;text-align:center;">Q</span>
                    </td>
                    <td style="vertical-align:middle;padding-left:10px;font-family:${font};font-weight:600;font-size:16px;color:${COLORS.ink};">
                      QA Platform
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Content -->
            <tr>
              <td style="padding:24px 32px 8px 32px;font-family:${font};">
                <h1 style="margin:0 0 12px 0;font-size:22px;line-height:1.3;font-weight:700;color:${COLORS.ink};">
                  ${escapeHtml(o.heading)}
                </h1>
                <div style="font-size:15px;line-height:1.6;color:${COLORS.muted};">
                  ${o.body}
                </div>
              </td>
            </tr>
            ${
              o.cta
                ? `<tr>
              <td style="padding:20px 32px 8px 32px;font-family:${font};">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background:${COLORS.primary};border-radius:8px;">
                      <a href="${o.cta.url}" style="display:inline-block;padding:12px 22px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;font-family:${font};">
                        ${escapeHtml(o.cta.label)}
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>`
                : ""
            }
            ${
              o.fallbackUrl
                ? `<tr>
              <td style="padding:8px 32px 0 32px;font-family:${font};font-size:12px;line-height:1.6;color:${COLORS.faint};">
                Or paste this link into your browser:<br/>
                <a href="${o.fallbackUrl}" style="color:${COLORS.primary};word-break:break-all;text-decoration:none;">${escapeHtml(o.fallbackUrl)}</a>
              </td>
            </tr>`
                : ""
            }
            ${
              o.footnote
                ? `<tr>
              <td style="padding:20px 32px 0 32px;font-family:${font};font-size:12px;line-height:1.6;color:${COLORS.faint};">
                ${escapeHtml(o.footnote)}
              </td>
            </tr>`
                : ""
            }
            <!-- Footer -->
            <tr>
              <td style="padding:28px 32px 24px 32px;">
                <div style="border-top:1px solid ${COLORS.border};padding-top:16px;font-family:${font};font-size:12px;color:${COLORS.faint};">
                  QA Management Platform — quality assurance for modern teams.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Role pill used inline in body copy. */
function rolePill(role: string): string {
  return `<span style="display:inline-block;padding:2px 8px;background:${COLORS.primarySoft};color:${COLORS.primary};border-radius:9999px;font-size:12px;font-weight:600;">${escapeHtml(role)}</span>`;
}

export function invitationEmailHtml(opts: {
  orgName: string;
  inviterName: string;
  role: string;
  acceptUrl: string;
  ttlDays: number;
}): string {
  return layout({
    preheader: `Join ${opts.orgName} on QA Platform`,
    heading: `You've been invited to ${opts.orgName}`,
    body: `<strong style="color:${COLORS.ink};">${escapeHtml(
      opts.inviterName
    )}</strong> invited you to join <strong style="color:${COLORS.ink};">${escapeHtml(
      opts.orgName
    )}</strong> as ${rolePill(opts.role)}.`,
    cta: { label: "Accept invitation", url: opts.acceptUrl },
    fallbackUrl: opts.acceptUrl,
    footnote: `This invitation expires in ${opts.ttlDays} days. If you didn't expect it, you can safely ignore this email.`,
  });
}

export function verifyEmailHtml(opts: { name: string; url: string }): string {
  return layout({
    preheader: "Confirm your email to activate your QA Platform account",
    heading: `Welcome, ${opts.name}`,
    body: "Confirm your email address to activate your account and start managing your team's quality assurance.",
    cta: { label: "Verify email", url: opts.url },
    fallbackUrl: opts.url,
    footnote: "If you didn't create this account, you can ignore this email.",
  });
}

export function resetPasswordEmailHtml(opts: {
  name: string;
  url: string;
}): string {
  return layout({
    preheader: "Reset your QA Platform password",
    heading: "Reset your password",
    body: `Hi ${escapeHtml(
      opts.name
    )}, use the button below to choose a new password.`,
    cta: { label: "Reset password", url: opts.url },
    fallbackUrl: opts.url,
    footnote:
      "This link expires shortly. If you didn't request it, you can ignore this email.",
  });
}
