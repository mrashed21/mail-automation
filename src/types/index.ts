/**
 * Shared type definitions for the Gmail Recruitment Email Sender.
 */

/** A single email recipient. */
export interface Candidate {
  email: string;
  name: string;
}

/** Result of attempting to send one email. */
export interface SendResult {
  candidate: Candidate;
  success: boolean;
  attempts: number;
  error?: string;
  sentAt?: string; // ISO timestamp
}

/** Aggregated statistics for a full sending run. */
export interface RunSummary {
  totalEmails: number;
  successCount: number;
  failedCount: number;
  executionTimeMs: number;
  executionTimeFormatted: string;
  startedAt: string; // ISO timestamp
  finishedAt: string; // ISO timestamp
}

/** Application configuration resolved from environment variables. */
export interface AppConfig {
  gmailUser: string;
  gmailAppPassword: string;
  emailSubject: string;
  senderName: string;
  company: CompanyInfo;
  sending: SendingConfig;
}

/** Company / signature details used in the email template. */
export interface CompanyInfo {
  companyName: string;
  hrName: string;
  hrTitle: string;
  hrEmail: string;
  hrPhone: string;
  website: string;
  logoUrl?: string;
}

/** Sending behaviour configuration. */
export interface SendingConfig {
  minDelaySeconds: number;
  maxDelaySeconds: number;
  maxRetries: number;
  retryDelaySeconds: number;
}

/** Log severity levels. */
export type LogLevel = 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'RETRY';
