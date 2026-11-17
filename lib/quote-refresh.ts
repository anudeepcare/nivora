type PollingEnvironment = {
  events: Pick<EventTarget, "addEventListener" | "removeEventListener">;
  visible: () => boolean;
  now: () => number;
  every: (
    tick: () => void,
    ms: number,
  ) => ReturnType<typeof setInterval> | number;
  cancel: (timer: ReturnType<typeof setInterval> | number) => void;
};
/** REST validation remains independent of stream health, which can stop changing
 * without a React render. No page reload, hidden polling, or event-driven burst. */
export function startQuotePolling(
  refresh: () => void,
  environment: PollingEnvironment = {
    events: window,
    visible: () => document.visibilityState === "visible",
    now: Date.now,
    every: (tick, ms) => window.setInterval(tick, ms),
    cancel: (timer) => window.clearInterval(Number(timer)),
  },
) {
  let lastCheck = -Infinity;
  const tick = () => {
    if (!environment.visible() || environment.now() - lastCheck < 5000) return;
    lastCheck = environment.now();
    refresh();
  };
  const timer = environment.every(tick, 60000);
  environment.events.addEventListener("visibilitychange", tick);
  environment.events.addEventListener("pageshow", tick);
  environment.events.addEventListener("focus", tick);
  return () => {
    environment.cancel(timer);
    for (const name of ["visibilitychange", "pageshow", "focus"])
      environment.events.removeEventListener(name, tick);
  };
}
