import * as dotenv from 'dotenv';
import { AppConfig } from '../types';

dotenv.config();

/** Read an environment variable with an optional default. */
function env(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value !== undefined && value.trim() !== '') {
    return value.trim();
  }
  if (defaultValue !== undefined) {
    return defaultValue;
  }
  throw new Error(
    `Missing required environment variable: ${key}\n` +
      `→ Copy .env.example to .env and fill in your values.`
  );
}

/** Read a positive integer environment variable with a default. */
function envInt(key: string, defaultValue: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw.trim() === '') return defaultValue;
  const parsed = parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    throw new Error(`Environment variable ${key} must be a non-negative integer (got "${raw}")`);
  }
  return parsed;
}

/**
 * Load and validate application configuration from environment variables.
 * Throws a descriptive error if required values are missing.
 */
export function loadConfig(): AppConfig {
  const gmailUser = env('GMAIL_USER');
  const gmailAppPassword = env('GMAIL_APP_PASSWORD').replace(/\s+/g, ''); // App passwords are often copied with spaces

  const minDelaySeconds = envInt('MIN_DELAY_SECONDS', 5);
  const maxDelaySeconds = envInt('MAX_DELAY_SECONDS', 10);
  if (maxDelaySeconds < minDelaySeconds) {
    throw new Error('MAX_DELAY_SECONDS must be greater than or equal to MIN_DELAY_SECONDS');
  }

  const logoUrl = process.env.COMPANY_LOGO_URL?.trim();

  return {
    gmailUser,
    gmailAppPassword,
    emailSubject: env('EMAIL_SUBJECT', 'Regarding Your Job Application'),
    senderName: env('SENDER_NAME', 'Admin & HR Department'),
    company: {
      companyName: env('COMPANY_NAME', 'SRP Garments ERP'),
      hrName: env('HR_NAME', 'Muhammad Rashed'),
      hrTitle: env('HR_TITLE', 'Admin & HR Department'),
      hrEmail: env('HR_EMAIL', 'hr@company.com'),
      hrPhone: env('HR_PHONE', '+8801XXXXXXXXX'),
      website: env('COMPANY_WEBSITE', 'https://www.company.com'),
      logoUrl: logoUrl && logoUrl.length > 0 ? logoUrl : undefined,
    },
    sending: {
      minDelaySeconds,
      maxDelaySeconds,
      maxRetries: envInt('MAX_RETRIES', 3),
      retryDelaySeconds: envInt('RETRY_DELAY_SECONDS', 3),
    },
  };
}
