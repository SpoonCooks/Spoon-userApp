/**
 * Single-flight helper: concurrent callers share one in-flight promise.
 *
 * This is the one genuinely tricky piece of the transport layer and it is design-independent:
 * N concurrent 401s must produce ONE refresh, not N. (FRONTEND_FOUNDATION_PLAN.md §5, §8)
 */
export function singleFlight<T>(operation: () => Promise<T>): () => Promise<T> {
  let inFlight: Promise<T> | null = null;

  return async function run(): Promise<T> {
    if (inFlight !== null) {
      return inFlight;
    }

    inFlight = operation().finally(() => {
      inFlight = null;
    });

    return inFlight;
  };
}
