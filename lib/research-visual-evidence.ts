/** Presentation-only evidence transforms. Dates and relationships are never inferred. */
const obj = (x: unknown): Record<string, unknown> =>
  x && typeof x === "object" && !Array.isArray(x)
    ? (x as Record<string, unknown>)
    : {};
const rows = (x: unknown): Record<string, unknown>[] =>
  Array.isArray(x) ? x.map(obj) : [];
const day = (x: unknown): x is string =>
  typeof x === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(x) &&
  Number.isFinite(Date.parse(x)) &&
  new Date(x).toISOString().slice(0, 10) === x;
export type CalendarEvent = {
  date: string;
  kind: "earnings" | "transaction" | "filing";
  label: string;
  detail: string;
};
export function calendarEvents(research: unknown): CalendarEvent[] {
  const r = obj(research),
    e = obj(r.evidence),
    out: CalendarEvent[] = [];
  for (const x of rows(e.earnings))
    if (day(x.date))
      out.push({
        date: x.date,
        kind: "earnings",
        label: "Earnings",
        detail:
          typeof x.actual === "number"
            ? "Reported results"
            : "Scheduled date · subject to change",
      });
  for (const x of rows(e.insiders))
    if (day(x.date) && typeof x.name === "string" && x.name.trim())
      out.push({
        date: x.date,
        kind: "transaction",
        label: x.name,
        detail:
          x.code === "P"
            ? "Reported purchase"
            : x.code === "S"
              ? "Reported sale"
              : "Reported transaction",
      });
  for (const x of rows(r.filings))
    if (day(x.date) && typeof x.form === "string")
      out.push({
        date: x.date,
        kind: "filing",
        label: x.form,
        detail: "Filing date",
      });
  return [
    ...new Map(
      out.map((x) => [`${x.date}:${x.kind}:${x.label}:${x.detail}`, x]),
    ).values(),
  ].sort((a, b) => a.date.localeCompare(b.date));
}
export function monthCells(month: string): (string | null)[] {
  if (!/^\d{4}-\d{2}$/.test(month) || !day(month + "-01")) return [];
  const first = new Date(month + "-01T00:00:00Z"),
    count = new Date(
      Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
    ).getUTCDate();
  return [
    ...Array((first.getUTCDay() + 6) % 7).fill(null),
    ...Array.from(
      { length: count },
      (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`,
    ),
  ];
}
export function ownershipLinks(data: unknown, symbol: string) {
  const d = obj(data),
    asOf = day(d.reportDate) ? d.reportDate : null;
  if (
    !asOf ||
    (typeof d.ticker === "string" &&
      d.ticker.toUpperCase() !== symbol.toUpperCase().replace(/\.US$/, ""))
  )
    return { asOf: null, rows: [] };
  const seen = new Set<string>();
  const result = rows(d.holders).flatMap((x) => {
    if (
      typeof x.filerName !== "string" ||
      !x.filerName.trim() ||
      seen.has(x.filerName.trim())
    )
      return [];
    const name = x.filerName.trim();
    seen.add(name);
    const p = x.pctOfClassOutstanding;
    return [
      {
        name,
        ownership:
          typeof p === "number" && Number.isFinite(p) && p >= 0 && p <= 100
            ? p
            : null,
        category:
          typeof x.filerCategory === "string"
            ? x.filerCategory.replaceAll("_", " ")
            : null,
      },
    ];
  });
  return { asOf, rows: result };
}
