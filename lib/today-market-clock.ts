import { marketDay } from "./home-feed.ts";

/** Refresh date-bound editorial content once per market day without fetching. */
export function watchMarketDay(
  onDay: (day: string) => void,
  {
    now = Date.now,
    timer = window as Pick<Window, "setInterval" | "clearInterval">,
    resume = document as EventTarget,
  } = {},
) {
  let previous: string | undefined;
  const update = () => {
    const next = marketDay(now());
    if (next === previous) return;
    previous = next;
    onDay(next);
  };
  update();
  const interval = timer.setInterval(update, 60_000);
  resume.addEventListener("visibilitychange", update);
  return () => {
    timer.clearInterval(interval);
    resume.removeEventListener("visibilitychange", update);
  };
}
