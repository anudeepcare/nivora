/** Total application budget below the platform's sixty-second limit. */
export function createAskDeadline(
  parent?: AbortSignal,
  budgetMs = 55000,
  now = Date.now,
) {
  const controller = new AbortController(),
    end = now() + budgetMs;
  const abort = () =>
    controller.abort(Error("Ask request deadline or cancellation reached."));
  const timer = setTimeout(abort, budgetMs);
  parent?.addEventListener("abort", abort, { once: true });
  if (parent?.aborted) abort();
  const remaining = () =>
    controller.signal.aborted ? 0 : Math.max(0, end - now());
  const check = (minimum = 1) => {
    if (remaining() < minimum)
      throw Error("Ask request deadline has insufficient time remaining.");
  };
  return {
    signal: controller.signal,
    remaining,
    check,
    async run<T>(work: () => Promise<T>): Promise<T> {
      check();
      let rejectAbort: (() => void) | undefined;
      const stopped = new Promise<never>((_, reject) => {
        rejectAbort = () =>
          reject(Error("Ask request deadline or cancellation reached."));
        controller.signal.addEventListener("abort", rejectAbort, {
          once: true,
        });
      });
      try {
        return await Promise.race([work(), stopped]);
      } finally {
        if (rejectAbort)
          controller.signal.removeEventListener("abort", rejectAbort);
      }
    },
    close() {
      clearTimeout(timer);
      parent?.removeEventListener("abort", abort);
    },
  };
}
export function askModelTimeout(
  deadline: Pick<ReturnType<typeof createAskDeadline>, "remaining" | "check">,
  phase: "generation" | "review",
) {
  // Keep review + parsing/response time available before generating any prose.
  const reserve = phase === "generation" ? 8500 : 500;
  deadline.check(reserve + 2500);
  return Math.min(
    phase === "generation" ? 18000 : 15000,
    deadline.remaining() - reserve,
  );
}
