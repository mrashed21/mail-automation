/** Pause execution for the given number of milliseconds. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Random integer in [min, max] inclusive. */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Sleep a random number of seconds between minSeconds and maxSeconds.
 * Returns the number of seconds actually waited.
 */
export async function randomDelay(minSeconds: number, maxSeconds: number): Promise<number> {
  const seconds = randomInt(minSeconds, maxSeconds);
  await sleep(seconds * 1000);
  return seconds;
}
