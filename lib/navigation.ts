export class NavigationMemory {
  private readonly positions = new Map<string, number>();
  remember(path: string, y: number) {
    this.positions.set(path, Math.max(0, Number.isFinite(y) ? y : 0));
  }
  navigate(from: string, to: string, y: number): number | null {
    if (from === to) return null;
    this.remember(from, y);
    return this.positions.get(to) ?? 0;
  }
  position(path: string) {
    return this.positions.get(path) ?? 0;
  }
}
export type ScrollEnvironment = {
  readTop?: () => number;
  onScroll?: (notify: () => void) => () => void;
  isSettled?: () => boolean;
  maxScroll: () => number;
  scrollTo: (top: number) => void;
  observe: (notify: () => void) => () => void;
  onIntent: (notify: () => void) => () => void;
  delay: (notify: () => void) => () => void;
};
export function restoreWhenReady(target: number, env: ScrollEnvironment) {
  const top = Math.max(0, Number.isFinite(target) ? target : 0);
  let stopped = false;
  let deadlineReached = false;
  const cleanups: (() => void)[] = [];
  const dispose = () => {
    if (stopped) return;
    stopped = true;
    cleanups.splice(0).forEach((cleanup) => cleanup());
  };
  const attempt = (deadline = false) => {
    if (stopped) return;
    deadlineReached ||= deadline;
    if (top > 0 && env.isSettled && !env.isSettled()) return;
    const available = Math.max(0, env.maxScroll());
    if (available >= top || deadlineReached) {
      env.scrollTo(Math.min(top, available));
      dispose();
    }
  };
  attempt();
  if (!stopped) {
    cleanups.push(env.observe(() => attempt()));
    cleanups.push(env.onIntent(dispose));
    cleanups.push(env.delay(() => attempt(true)));
  }
  return dispose;
}
export function browserScrollEnvironment(): ScrollEnvironment {
  const content = document.getElementById("content");
  return {
    readTop: () => window.scrollY,
    onScroll: (notify) => {
      const target = window;
      target.addEventListener("scroll", notify, { passive: true });
      return () => target.removeEventListener("scroll", notify);
    },
    isSettled: () =>
      !document.querySelector(
        '#content [aria-busy="true"], #content [data-scroll-pending="true"]',
      ),
    maxScroll: () =>
      Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
    scrollTo: (top) =>
      window.scrollTo({
        top,
        left: 0,
        behavior: "instant",
      }),
    observe: (notify) => {
      const observer = new ResizeObserver(notify);
      observer.observe(document.body);
      if (content)
        Array.from(content.children).forEach((child) =>
          observer.observe(child),
        );
      const mutations = new MutationObserver(notify);
      mutations.observe(document.getElementById("content") ?? document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["aria-busy", "data-scroll-pending"],
      });
      window.addEventListener("resize", notify);
      return () => {
        observer.disconnect();
        mutations.disconnect();
        window.removeEventListener("resize", notify);
      };
    },
    onIntent: (notify) => {
      const keys = new Set([
        "ArrowUp",
        "ArrowDown",
        "PageUp",
        "PageDown",
        "Home",
        "End",
        " ",
      ]);
      const key = (event: KeyboardEvent) => {
        if (keys.has(event.key)) notify();
      };
      window.addEventListener("wheel", notify, { passive: true });
      window.addEventListener("touchstart", notify, { passive: true });
      window.addEventListener("pointerdown", notify, { passive: true });
      window.addEventListener("keydown", key);
      return () => {
        window.removeEventListener("wheel", notify);
        window.removeEventListener("touchstart", notify);
        window.removeEventListener("pointerdown", notify);
        window.removeEventListener("keydown", key);
      };
    },
    delay: (notify) => {
      const timer = window.setTimeout(notify, 3000);
      return () => window.clearTimeout(timer);
    },
  };
}
