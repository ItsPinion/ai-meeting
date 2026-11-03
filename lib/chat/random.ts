/**
 * Randomness helpers used by the mock reply API.
 *
 * Kept tiny and dependency free so the whole "who replies, and when" behaviour
 * is easy to reason about (and easy to delete once a real backend exists).
 */

/** Inclusive on both ends. */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Picks `count` distinct items, clamped to what is available. */
export function pickMany<T>(items: readonly T[], count: number): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swap = randomInt(0, index);
    [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]];
  }
  return shuffled.slice(0, Math.max(0, Math.min(count, shuffled.length)));
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
