/** Conservative weighted call estimates. Unknown datasets reserve 10, never zero. */
export function eodCallCost(path: string, params: Record<string, string> = {}) {
  const clean = path.replace(/^v1\.1\//, "");
  if (clean === "user") return 0;
  const root = clean.split("/")[0];
  const base = [
    "fundamentals",
    "insider-transactions",
    "options",
    "sec-companies",
  ].includes(root)
    ? 10
    : ["news", "intraday", "technical", "screener"].includes(root)
      ? 5
      : [
            "eod",
            "real-time",
            "search",
            "exchanges-list",
            "exchange-symbol-list",
            "calendar",
            "splits",
            "div",
          ].includes(root)
        ? 1
        : 10;
  const multi =
    String(params.s ?? params.symbols ?? "")
      .split(",")
      .filter(Boolean).length || 1;
  return Math.min(10000, base * multi);
}
export function eodUsage(raw: unknown, now = Date.now()) {
  const r = raw as Record<string, unknown> | null;
  const integer = (v: unknown) =>
    typeof v === "number" || (typeof v === "string" && v.trim())
      ? Number(v)
      : NaN;
  const ceiling = integer(r?.dailyRateLimit),
    used = integer(r?.apiRequests),
    date = String(r?.apiRequestsDate ?? "").slice(0, 10),
    today = new Date(now).toISOString().slice(0, 10);
  if (
    !Number.isInteger(ceiling) ||
    ceiling <= 0 ||
    !Number.isInteger(used) ||
    used < 0 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    date > today
  )
    return null;
  return { limit: ceiling, used: date === today ? used : 0, date: today };
}
export function safeMarketCap(
  configured: unknown,
  providerLimit: number | null,
) {
  const n = Number(configured),
    cap = Number.isInteger(n) && n > 0 ? n : 8000;
  return providerLimit
    ? Math.max(1, Math.min(cap, Math.floor(providerLimit * 0.8)))
    : cap;
}
export function canonicalMarketKey(
  path: string,
  params: Record<string, string>,
) {
  return (
    path +
    (path === "calendar/earnings" ? "@release-v2" : "") +
    "?" +
    new URLSearchParams(
      Object.entries(params).sort(([a], [b]) => a.localeCompare(b)),
    ).toString()
  );
}
