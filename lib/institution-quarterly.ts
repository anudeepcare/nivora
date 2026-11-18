export type QuarterlyQuery = { view: "bonds" | "options"; reportDate: string };
const obj = (v: unknown): Record<string, unknown> | null =>
  v !== null && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
const date = (v: unknown, now: number) =>
  typeof v === "string" &&
  /^\d{4}-(03-31|06-30|09-30|12-31)$/.test(v) &&
  Number.isFinite(Date.parse(v)) &&
  Date.parse(v) <= now;
export function quarterlyQuery(p: URLSearchParams): QuarterlyQuery {
  for (const k of p.keys())
    if (!["view", "reportDate"].includes(k) || p.getAll(k).length !== 1)
      throw Error("Invalid quarterly request.");
  const view = p.get("view");
  if (view !== "bonds" && view !== "options")
    throw Error("Select bonds or options.");
  const reportDate = p.get("reportDate") || "";
  if (reportDate && !date(reportDate, Date.now()))
    throw Error("Invalid reporting quarter.");
  return { view, reportDate };
}
export function selectQuarter(
  raw: unknown,
  requested = "",
  now = Date.now(),
): string {
  // /quarters is documented as an unwrapped array.
  if (!Array.isArray(raw) || raw.length > 100)
    throw Error("Available quarters unavailable.");
  const dates = [
    ...new Set(
      raw.flatMap((v) => {
        const r = obj(v);
        return r?.pending === false && date(r.reportDate, now)
          ? [r.reportDate as string]
          : [];
      }),
    ),
  ]
    .sort()
    .reverse();
  if (requested && !dates.includes(requested))
    throw Error("Requested quarter is not available and settled.");
  if (!dates.length) throw Error("No settled reporting quarter returned.");
  return requested || dates[0];
}
export function projectQuarterly(
  raw: unknown,
  q: QuarterlyQuery,
  reportDate: string,
  now = Date.now(),
) {
  const r = obj(raw);
  if (
    !r ||
    typeof r.isPreview !== "boolean" ||
    !Array.isArray(r.data) ||
    r.data.length > (r.isPreview ? 3 : 5000) ||
    !date(reportDate, now)
  )
    throw Error("Quarterly response cannot be verified.");
  const metric = (
    row: Record<string, unknown>,
    key: string,
    label: string,
    signed = false,
  ) => ({
    label,
    value:
      typeof row[key] === "number" &&
      Number.isSafeInteger(row[key]) &&
      (signed || (row[key] as number) >= 0)
        ? (row[key] as number)
        : null,
  });
  const seen = new Set<string>();
  let omitted = 0;
  const rows = r.data.flatMap((v) => {
    const x = obj(v);
    const ticker = x?.[q.view === "bonds" ? "baseTicker" : "ticker"];
    if (x?.reportDate !== undefined && x.reportDate !== reportDate)
      throw Error("Reporting quarter mismatch.");
    if (
      !x ||
      typeof ticker !== "string" ||
      !/^[A-Z][A-Z0-9.-]{0,14}$/.test(ticker) ||
      seen.has(ticker)
    ) {
      omitted++;
      return [];
    }
    seen.add(ticker);
    return [
      {
        ticker,
        companyName:
          typeof x.companyName === "string"
            ? x.companyName.slice(0, 200)
            : null,
        notation:
          q.view === "bonds" && typeof x.bondTickers === "string"
            ? x.bondTickers.slice(0, 2000)
            : null,
        metrics:
          q.view === "bonds"
            ? [
                metric(x, "positionCount", "Reported positions"),
                metric(x, "totalValue", "Reported value (USD)"),
                metric(
                  x,
                  "netSharesChange",
                  "Change in reported shares/units",
                  true,
                ),
                metric(x, "hedgeFundCount", "Hedge funds"),
              ]
            : [
                metric(x, "callValue", "Reported call exposure (USD)"),
                metric(x, "putValue", "Reported put exposure (USD)"),
                metric(x, "callPositions", "Call positions"),
                metric(x, "putPositions", "Put positions"),
                metric(
                  x,
                  "callNetChange",
                  "Change in call underlying shares",
                  true,
                ),
                metric(
                  x,
                  "putNetChange",
                  "Change in put underlying shares",
                  true,
                ),
                metric(x, "hedgeFundCount", "Hedge funds"),
              ],
      },
    ];
  });
  return {
    view: q.view,
    reportDate,
    isPreview: r.isPreview,
    retrievedAt: new Date(now).toISOString(),
    returnedCount: r.data.length,
    omitted,
    rows,
  };
}
export type QuarterlyResult = ReturnType<typeof projectQuarterly>;
