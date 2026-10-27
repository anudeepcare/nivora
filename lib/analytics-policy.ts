const pages = new Set([
  "/",
  "/sample",
  "/pricing",
  "/about",
  "/pace",
  "/help",
  "/contact",
  "/methodology",
  "/terms",
  "/privacy",
  "/risk",
  "/reliability",
  "/login",
  "/reset-password",
  "/overview",
  "/research",
  "/portfolio",
  "/watchlist",
  "/settings",
  "/plans",
  "/compare",
  "/alerts",
  "/research-lab",
  "/trading",
  "/discover",
]);
export function analyticsPath(path: string): string | null {
  const clean = path.split(/[?#]/, 1)[0];
  if (clean.startsWith("/preview")) return null;
  const coarse = clean.startsWith("/research/") ? "/research" : clean;
  return pages.has(coarse) ? coarse : null;
}
export function validMeasurementId(id: string) {
  return /^G-[A-Z0-9]{4,20}$/.test(id);
}
export function safeAnalyticsEvent(
  name: string,
  input: Record<string, unknown> = {},
) {
  if (
    ["signup_start", "plans_view", "research_open", "search_select"].includes(
      name,
    )
  )
    return { name, params: {} };
  if (
    name === "search_result" &&
    ["success", "empty", "error"].includes(String(input.outcome))
  ) {
    const n =
      typeof input.duration === "number" && Number.isFinite(input.duration)
        ? Math.max(0, input.duration)
        : null;
    return {
      name,
      params: {
        outcome: String(input.outcome),
        duration_bucket:
          n == null
            ? ["<300ms", "300ms–1s", "1–3s", ">3s"].includes(
                String(input.duration_bucket),
              )
              ? String(input.duration_bucket)
              : "unknown"
            : n < 300
              ? "<300ms"
              : n < 1000
                ? "300ms–1s"
                : n < 3000
                  ? "1–3s"
                  : ">3s",
      },
    };
  }
  if (
    name === "page_performance" &&
    ["LCP", "CLS", "INP"].includes(String(input.metric)) &&
    ["good", "needs-improvement", "poor"].includes(String(input.rating))
  )
    return {
      name,
      params: { metric: String(input.metric), rating: String(input.rating) },
    };
  return null;
}
export function trackAnalytics(
  name: string,
  params: Record<string, unknown> = {},
) {
  if (typeof window === "undefined") return;
  const safe = safeAnalyticsEvent(name, params);
  if (safe)
    window.dispatchEvent(new CustomEvent("auryn:analytics", { detail: safe }));
}
