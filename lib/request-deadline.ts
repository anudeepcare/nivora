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
  else options.signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(() => controller.abort(new Error('The connection timed out. Please try again.')), timeoutMs);
  try { return await fetcher(url, { ...options, signal: controller.signal }); }
  finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', abort);
  }
}
