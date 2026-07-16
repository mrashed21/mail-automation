import * as fs from 'fs';
import * as path from 'path';
import { Candidate, RunSummary, SendResult } from '../types';
import { Logger } from '../logger/logger';

/**
 * Writes all result files into the output/ directory:
 *
 *   output/
 *     success-emails.txt
 *     failed-emails.txt
 *     success-emails.csv
 *     failed-emails.csv
 *     failed-recipients.json
 *     summary.json
 *     email-log.txt   (written continuously by the Logger)
 */
export class ExportService {
  constructor(private readonly outputDir: string, private readonly logger: Logger) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  private writeFile(fileName: string, content: string): string {
    const filePath = path.join(this.outputDir, fileName);
    fs.writeFileSync(filePath, content, 'utf-8');
    return filePath;
  }

  /** One email address per line. */
  private toTxt(emails: string[]): string {
    return emails.join('\n') + (emails.length > 0 ? '\n' : '');
  }

  /** Spreadsheet-friendly CSV with name, email, status and attempt details. */
  private toCsv(results: SendResult[]): string {
    const header = 'email,name,status,attempts,sent_at,error';
    const escape = (value: string): string => `"${value.replace(/"/g, '""')}"`;
    const rows = results.map((r) =>
      [
        escape(r.candidate.email),
        escape(r.candidate.name),
        r.success ? 'success' : 'failed',
        String(r.attempts),
        escape(r.sentAt ?? ''),
        escape(r.error ?? ''),
      ].join(',')
    );
    return [header, ...rows].join('\n') + '\n';
  }

  /** Export every result file and log the paths. */
  exportAll(params: {
    successEmails: string[];
    failedEmails: string[];
    failedRecipients: Candidate[];
    results: SendResult[];
    summary: RunSummary;
  }): void {
    const { successEmails, failedEmails, failedRecipients, results, summary } = params;

    const successResults = results.filter((r) => r.success);
    const failedResults = results.filter((r) => !r.success);

    const files: string[] = [];

    files.push(this.writeFile('success-emails.txt', this.toTxt(successEmails)));
    files.push(this.writeFile('failed-emails.txt', this.toTxt(failedEmails)));
    files.push(this.writeFile('success-emails.csv', this.toCsv(successResults)));
    files.push(this.writeFile('failed-emails.csv', this.toCsv(failedResults)));
    files.push(
      this.writeFile('failed-recipients.json', JSON.stringify(failedRecipients, null, 2) + '\n')
    );
    files.push(this.writeFile('summary.json', JSON.stringify(summary, null, 2) + '\n'));

    this.logger.info('Exported result files:');
    files.forEach((f) => this.logger.raw(`   • ${f}`));
  }
}
