import { Candidate, CompanyInfo } from "../types";

export interface RenderedEmail {
  html: string;
  text: string;
}

/** Escape user-provided values before injecting into HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Build the professional HTML + plain-text versions of the
 * recruitment outcome email, personalised for one candidate.
 *
 * The HTML is table-based with fully inline CSS so it renders
 * correctly in Gmail (web + mobile), Outlook and other clients.
 */
export function renderRejectionEmail(
  candidate: Candidate,
  company: CompanyInfo,
): RenderedEmail {
  const name = escapeHtml(candidate.name);
  const companyName = escapeHtml(company.companyName);
  const hrName = escapeHtml(company.hrName);
  const hrTitle = escapeHtml(company.hrTitle);
  const hrEmail = escapeHtml(company.hrEmail);
  const hrPhone = escapeHtml(company.hrPhone);
  const website = escapeHtml(company.website);
  const websiteLabel = website.replace(/^https?:\/\//, "");
  const year = new Date().getFullYear();

  const headerBrand = company.logoUrl
    ? `<img src="${escapeHtml(company.logoUrl)}" alt="${companyName}" width="160" style="display:block; max-width:160px; height:auto; border:0; margin:0 auto;" />`
    : `<span style="font-family:Georgia, 'Times New Roman', serif; font-size:22px; font-weight:bold; color:#ffffff; letter-spacing:1px;">${companyName}</span>`;

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Regarding Your Job Application</title>
</head>
<body style="margin:0; padding:0; background-color:#eef1f4; -webkit-text-size-adjust:100%;">
  <!-- Preheader (hidden preview text) -->
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
    An update regarding your recent application to ${companyName}.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eef1f4;">
    <tr>
      <td align="center" style="padding:32px 12px;">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:100%; background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(20,40,60,0.08);">

          <!-- Header -->
          <tr>
            <td align="center" style="background-color:#1f3a5f; padding:28px 24px;">
              ${headerBrand}
              <div style="font-family:Arial, Helvetica, sans-serif; font-size:12px; color:#b9c7d8; letter-spacing:3px; text-transform:uppercase; padding-top:8px;">
                Human Resources
              </div>
            </td>
          </tr>

          <!-- Accent bar -->
          <tr>
            <td style="background-color:#c9a24b; height:4px; line-height:4px; font-size:0;">&nbsp;</td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 8px 40px; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#333f4d;">
              <p style="margin:0 0 18px 0; font-size:16px; color:#1f3a5f;"><strong>Dear ${name},</strong></p>

              <p style="margin:0 0 16px 0;">
              Thank you for your interest in joining <strong>${companyName}</strong> and for taking the time to participate in our recruitment process.
                </p>

            <p style="margin:0 0 16px 0;">
            We appreciate the time, effort, and enthusiasm you demonstrated throughout the interview process.
          </p>

        <p style="margin:0 0 16px 0;">
      Our recruitment process has now been completed, and after careful evaluation of all applications, your application was not selected for this position.
      </p>

      <p style="margin:0 0 16px 0;">
     This decision was made after careful consideration and does not diminish your skills or potential.
     We received applications from many qualified candidates, making the selection process highly competitive.
      </p>

      <p style="margin:0 0 16px 0;">
      We sincerely appreciate your interest in ${companyName} and encourage you to apply for future opportunities that match your experience and qualifications.
      </p>

      <p style="margin:0 0 24px 0;">
      We wish you every success in your career and thank you once again for considering ${companyName} as part of your professional journey.
    </p>

        <p style="margin:0 0 8px 0;">Best regards,</p>
            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td style="padding:8px 40px 32px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-left:3px solid #c9a24b;">
                <tr>
                  <td style="padding:12px 0 12px 16px; font-family:Arial, Helvetica, sans-serif;">
                    <div style="font-size:16px; font-weight:bold; color:#1f3a5f;">${hrName}</div>
                    <div style="font-size:13px; color:#5a6b7d; padding:2px 0 8px 0;">${hrTitle} &nbsp;|&nbsp; ${companyName}</div>
                    <div style="font-size:13px; line-height:1.8; color:#5a6b7d;">
                      &#128231;&nbsp; <a href="mailto:${hrEmail}" style="color:#1f6fb2; text-decoration:none;">${hrEmail}</a><br />
                      &#128222;&nbsp; <a href="tel:${hrPhone.replace(/\s+/g, "")}" style="color:#1f6fb2; text-decoration:none;">${hrPhone}</a><br />
                      &#127760;&nbsp; <a href="${website}" style="color:#1f6fb2; text-decoration:none;">${websiteLabel}</a>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color:#f5f7f9; border-top:1px solid #e3e8ee; padding:20px 24px; font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:1.6; color:#8a97a5;">
              &copy; ${year} ${companyName}. All rights reserved.<br />
              This message was sent by the ${hrTitle} regarding your job application.
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    `Dear ${candidate.name},`,
    "",
    "Thank you for taking the time to participate in our recruitment process.",
    "",
    "We sincerely appreciate your interest in joining our company and the effort you put into the interview process.",
    "",
    "After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match the current requirements of the role.",
    "",
    "This decision was not easy, as we received applications from many talented individuals.",
    "",
    "We encourage you to apply again for future opportunities that match your skills and experience.",
    "",
    "We truly appreciate your interest in our organization and wish you every success in your future career.",
    "",
    "Best regards,",
    "",
    company.hrName,
    `${company.hrTitle} | ${company.companyName}`,
    `Email: ${company.hrEmail}`,
    `Phone: ${company.hrPhone}`,
    `Web:   ${company.website}`,
  ].join("\n");

  return { html, text };
}
