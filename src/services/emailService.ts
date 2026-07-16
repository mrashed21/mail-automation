import nodemailer, { Transporter } from 'nodemailer';
import { AppConfig, Candidate, SendResult } from '../types';
import { renderRejectionEmail } from '../templates/rejectionEmail';
import { Logger } from '../logger/logger';
import { randomDelay, sleep } from '../utils/delay';

/**
 * Handles the Gmail SMTP connection and the one-by-one sending loop
 * with retries, random delays and per-recipient tracking.
 */
export class EmailService {
  private readonly transporter: Transporter;

  /** Email addresses that were sent successfully. */
  public readonly successEmails: string[] = [];

  /** Email addresses that failed after all retries. */
  public readonly failedEmails: string[] = [];

  /** Full candidate objects that failed (for failed-recipients.json). */
  public readonly failedRecipients: Candidate[] = [];

  /** Detailed per-recipient results. */
  public readonly results: SendResult[] = [];

  constructor(private readonly config: AppConfig, private readonly logger: Logger) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.gmailUser,
        pass: config.gmailAppPassword,
      },
    });
  }

  /** Verify the SMTP connection and credentials before sending anything. */
  async verifyConnection(): Promise<void> {
    this.logger.info('Verifying Gmail SMTP connection...');
    try {
      await this.transporter.verify();
      this.logger.success(`Connected to Gmail as ${this.config.gmailUser}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Gmail connection failed: ${message}`);
      throw new Error(
        'Could not authenticate with Gmail. Check GMAIL_USER and GMAIL_APP_PASSWORD in your .env file.\n' +
          'Note: you must use an App Password (https://myaccount.google.com/apppasswords), not your normal password.'
      );
    }
  }

  /**
   * Send one email with up to `maxRetries` attempts.
   * Each recipient is addressed INDIVIDUALLY — never grouped —
   * so no candidate can see any other candidate's address.
   */
  private async sendWithRetry(candidate: Candidate, index: number, total: number): Promise<SendResult> {
    const { maxRetries, retryDelaySeconds } = this.config.sending;
    const { html, text } = renderRejectionEmail(candidate, this.config.company);

    let lastError = '';

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (attempt === 1) {
          this.logger.info(`[${index}/${total}] Sending... → ${candidate.name} <${candidate.email}>`);
        } else {
          this.logger.retry(
            `[${index}/${total}] Retry ${attempt - 1}/${maxRetries - 1} → ${candidate.email}`
          );
        }

        await this.transporter.sendMail({
          from: `"${this.config.senderName}" <${this.config.gmailUser}>`,
          to: `"${candidate.name}" <${candidate.email}>`, // single recipient only
          subject: this.config.emailSubject,
          html,
          text,
        });

        this.logger.success(`[${index}/${total}] Success ✓ ${candidate.email} (attempt ${attempt})`);
        return {
          candidate,
          success: true,
          attempts: attempt,
          sentAt: new Date().toISOString(),
        };
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        this.logger.warn(`[${index}/${total}] Attempt ${attempt} failed for ${candidate.email}: ${lastError}`);

        if (attempt < maxRetries) {
          await sleep(retryDelaySeconds * 1000);
        }
      }
    }

    this.logger.error(
      `[${index}/${total}] Failed ✗ ${candidate.email} after ${maxRetries} attempts. Skipping.`
    );
    return {
      candidate,
      success: false,
      attempts: maxRetries,
      error: lastError,
    };
  }

  /**
   * Send emails to all candidates, one by one, with a random
   * 5–10 second delay between each send. Failed emails are skipped
   * after retries and the loop continues with the remaining recipients.
   */
  async sendToAll(candidates: Candidate[]): Promise<void> {
    const { minDelaySeconds, maxDelaySeconds } = this.config.sending;
    const total = candidates.length;

    for (let i = 0; i < total; i++) {
      const candidate = candidates[i];
      const result = await this.sendWithRetry(candidate, i + 1, total);
      this.results.push(result);

      if (result.success) {
        this.successEmails.push(candidate.email);
      } else {
        this.failedEmails.push(candidate.email);
        this.failedRecipients.push(candidate);
      }

      // Wait between emails (never between the last email and completion).
      const isLast = i === total - 1;
      if (!isLast) {
        const waited = await this.waitBetweenEmails(minDelaySeconds, maxDelaySeconds);
        this.logger.info(`Waited ${waited}s before next email.`);
      }
    }
  }

  private async waitBetweenEmails(min: number, max: number): Promise<number> {
    return randomDelay(min, max);
  }
}
