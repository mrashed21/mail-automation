/**
 * Format a duration in milliseconds as "MMm SSs" (e.g. "08m 12s").
 * Includes hours when the run exceeds one hour (e.g. "1h 08m 12s").
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  return hours > 0 ? `${hours}h ${mm}m ${ss}s` : `${mm}m ${ss}s`;
}
