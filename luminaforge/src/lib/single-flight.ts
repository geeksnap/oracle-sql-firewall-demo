/** Prevents overlapping identical API calls (double-click, Strict Mode, etc.). */
export function createSingleFlight() {
  let inFlight = false;

  return async function runSingleFlight<T>(
    fn: () => Promise<T>,
  ): Promise<T | undefined> {
    if (inFlight) return undefined;
    inFlight = true;
    try {
      return await fn();
    } finally {
      inFlight = false;
    }
  };
}
