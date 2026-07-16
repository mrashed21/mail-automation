import * as fs from 'fs';
import * as path from 'path';
import { LogLevel } from '../types';

/** ANSI colour codes for console output. */
const COLORS: Record<LogLevel, string> = {
  INFO: '\x1b[36m', // cyan
  SUCCESS: '\x1b[32m', // green
  WARN: '\x1b[33m', // yellow
  ERROR: '\x1b[31m', // red
  RETRY: '\x1b[35m', // magenta
};
const RESET = '\x1b[0m';
const DIM = '\x1b[2m';

/**
 * Simple logger that writes to the console (with colours) and
 * appends every line to output/email-log.txt.
 */
export class Logger {
  private readonly logFilePath: string;

  constructor(outputDir: string, fileName = 'email-log.txt') {
    fs.mkdirSync(outputDir, { recursive: true });
    this.logFilePath = path.join(outputDir, fileName);

    const header =
      `\n============================================================\n` +
      `Run started: ${new Date().toISOString()}\n` +
      `============================================================\n`;
    fs.appendFileSync(this.logFilePath, header, 'utf-8');
  }

  private write(level: LogLevel, message: string): void {
    const timestamp = new Date().toISOString();
    const color = COLORS[level];

    // Console (coloured)
    console.log(`${DIM}${timestamp}${RESET} ${color}[${level.padEnd(7)}]${RESET} ${message}`);

    // File (plain)
    fs.appendFileSync(this.logFilePath, `${timestamp} [${level}] ${message}\n`, 'utf-8');
  }

  info(message: string): void {
    this.write('INFO', message);
  }

  success(message: string): void {
    this.write('SUCCESS', message);
  }

  warn(message: string): void {
    this.write('WARN', message);
  }

  error(message: string): void {
    this.write('ERROR', message);
  }

  retry(message: string): void {
    this.write('RETRY', message);
  }

  /** Print a raw line to console AND the log file (no level/timestamp). */
  raw(message: string): void {
    console.log(message);
    fs.appendFileSync(this.logFilePath, `${message}\n`, 'utf-8');
  }
}
