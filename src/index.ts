import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { loadConfig } from './config/env';
import { candidates as defaultCandidates } from './data/candidates';
import { Logger } from './logger/logger';
import { EmailService } from './services/emailService';
import { ExportService } from './services/exportService';
import { Candidate, RunSummary } from './types';
import { formatDuration } from './utils/time';
import { copyToClipboard } from './utils/clipboard';
import { openFolder } from './utils/openFolder';

const OUTPUT_DIR = path.resolve(process.cwd(), 'output');
const FAILED_RECIPIENTS_FILE = path.join(OUTPUT_DIR, 'failed-recipients.json');

/**
 * Resolve the recipient list.
 * With `--retry-failed` (npm run retry), only the recipients from the
 * previous run's failed-recipients.json are loaded — successful
 * recipients are never emailed twice.
 */
function resolveRecipients(logger: Logger): Candidate[] {
  const retryMode = process.argv.includes('--retry-failed');

  if (!retryMode) {
    return defaultCandidates;
  }

  if (!fs.existsSync(FAILED_RECIPIENTS_FILE)) {
    logger.error(`Retry mode requested but ${FAILED_RECIPIENTS_FILE} does not exist.`);
    logger.info('Run a normal send first: npm run dev');
    process.exit(1);
  }

  const raw = fs.readFileSync(FAILED_RECIPIENTS_FILE, 'utf-8');
  const parsed: unknown = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    logger.error('failed-recipients.json is not a valid recipient array.');
    process.exit(1);
  }

  const recipients = (parsed as Candidate[]).filter(
    (c) => typeof c?.email === 'string' && typeof c?.name === 'string'
  );

  logger.info(`Retry mode: loaded ${recipients.length} failed recipient(s) from previous run.`);
  return recipients;
}

/** Print the completion banner exactly as specified. */
function printSummary(logger: Logger, summary: RunSummary): void {
  logger.raw('');
  logger.raw('====================================');
  logger.raw('     Email Sending Completed');
  logger.raw('====================================');
  logger.raw('');
  logger.raw(`Total Emails   : ${summary.totalEmails}`);
  logger.raw(`Success        : ${summary.successCount}`);
  logger.raw(`Failed         : ${summary.failedCount}`);
  logger.raw(`Execution Time : ${summary.executionTimeFormatted}`);
  logger.raw('');
}

/**
 * Copy a list to the clipboard if possible; otherwise print it to the
 * console (a corresponding file already exists in output/).
 */
async function copyList(logger: Logger, label: string, emails: string[]): Promise<void> {
  if (emails.length === 0) {
    logger.warn(`${label}: nothing to copy (list is empty).`);
    return;
  }

  const text = emails.join('\n');
  const copied = await copyToClipboard(text);

  if (copied) {
    logger.success(`${label}: ${emails.length} address(es) copied to clipboard.`);
  } else {
    logger.warn(`${label}: clipboard not available on this system. Printing instead:`);
    logger.raw('');
    logger.raw(text);
    logger.raw('');
    logger.info('The same list is saved in the output/ folder.');
  }
}

/** Interactive keypress menu shown after completion. */
function interactiveMenu(
  logger: Logger,
  successEmails: string[],
  failedEmails: string[],
  allEmails: string[]
): void {
  logger.raw('Press:');
  logger.raw('');
  logger.raw('[S] → Copy Successful Emails');
  logger.raw('[F] → Copy Failed Emails');
  logger.raw('[A] → Copy All Recipient Emails');
  logger.raw('[O] → Open Output Folder');
  logger.raw('[Q] → Quit');
  logger.raw('');

  if (!process.stdin.isTTY) {
    logger.info('Non-interactive terminal detected — skipping menu. All results are in output/.');
    process.exit(0);
  }

  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();

  process.stdin.on('keypress', async (_str: string | undefined, key: { name?: string; ctrl?: boolean }) => {
    const name = (key.name ?? '').toLowerCase();

    if ((key.ctrl && name === 'c') || name === 'q' || name === 'escape') {
      logger.info('Goodbye.');
      process.exit(0);
    }

    switch (name) {
      case 's':
        await copyList(logger, 'Successful emails', successEmails);
        break;
      case 'f':
        await copyList(logger, 'Failed emails', failedEmails);
        break;
      case 'a':
        await copyList(logger, 'All recipient emails', allEmails);
        break;
      case 'o': {
        const opened = await openFolder(OUTPUT_DIR);
        if (opened) {
          logger.success(`Opened output folder: ${OUTPUT_DIR}`);
        } else {
          logger.warn(`Could not open a file explorer. Output folder: ${OUTPUT_DIR}`);
        }
        break;
      }
      default:
        // Ignore other keys
        break;
    }
  });
}

async function main(): Promise<void> {
  const logger = new Logger(OUTPUT_DIR);

  logger.raw('====================================');
  logger.raw('  Gmail Recruitment Email Sender');
  logger.raw('====================================');
  logger.raw('');

  // 1. Load configuration
  const config = loadConfig();

  // 2. Resolve recipients (normal run or --retry-failed)
  const recipients = resolveRecipients(logger);
  if (recipients.length === 0) {
    logger.warn('No recipients found. Add candidates in src/data/candidates.ts');
    process.exit(0);
  }

  logger.info(`Recipients : ${recipients.length}`);
  logger.info(`Subject    : "${config.emailSubject}"`);
  logger.info(`From       : "${config.senderName}" <${config.gmailUser}>`);
  logger.info(
    `Delay      : ${config.sending.minDelaySeconds}-${config.sending.maxDelaySeconds}s between emails, ` +
      `${config.sending.maxRetries} attempts max per email`
  );
  logger.raw('');

  // 3. Verify SMTP connection before starting
  const emailService = new EmailService(config, logger);
  await emailService.verifyConnection();
  logger.raw('');

  // 4. Send one by one
  const startedAt = new Date();
  await emailService.sendToAll(recipients);
  const finishedAt = new Date();

  // 5. Build summary
  const executionTimeMs = finishedAt.getTime() - startedAt.getTime();
  const summary: RunSummary = {
    totalEmails: recipients.length,
    successCount: emailService.successEmails.length,
    failedCount: emailService.failedEmails.length,
    executionTimeMs,
    executionTimeFormatted: formatDuration(executionTimeMs),
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
  };

  printSummary(logger, summary);

  // 6. Export all result files
  const exportService = new ExportService(OUTPUT_DIR, logger);
  exportService.exportAll({
    successEmails: emailService.successEmails,
    failedEmails: emailService.failedEmails,
    failedRecipients: emailService.failedRecipients,
    results: emailService.results,
    summary,
  });
  logger.raw('');

  if (emailService.failedEmails.length > 0) {
    logger.info('To resend ONLY to failed recipients later, run: npm run retry');
    logger.raw('');
  }

  // 7. Interactive menu
  interactiveMenu(
    logger,
    emailService.successEmails,
    emailService.failedEmails,
    recipients.map((r) => r.email)
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\n\x1b[31m[FATAL]\x1b[0m ${message}\n`);
  process.exit(1);
});
