/** Give stalled connections a finite lifetime while preserving caller cancellation. */
export async function fetchWithDeadline(
  url: string,
  options: RequestInit,
  timeoutMs: number,
  fetcher: typeof fetch = fetch,
): Promise<Response> {
  const controller = new AbortController();
  const abort = () => controller.abort(options.signal?.reason);
  if (options.signal?.aborted) abort();
  else options.signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(
    () =>
      controller.abort(
        new Error("The connection timed out. Please try again."),
      ),
    timeoutMs,
  );
  try {
    return await fetcher(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", abort);
  }
}

/** Bound SDK work that can stall before any network fetch deadline is reached.
 * This does not cancel the SDK operation or alter its auth state; it releases
 * the waiting view/request and lets subsequent auth events recover normally.
 */
export async function settleWithDeadline<T>(
  task: Promise<T>,
  timeoutMs: number,
  message = "The account connection timed out. Please try again.",
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      task,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
