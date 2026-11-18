export type EodContextKind = "dividends" | "economy" | "treasury";
const object = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
const text = (v: unknown) =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, 200) : null;
const number = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) ? v : null;
const date = (v: unknown) =>
  typeof v === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  Number.isFinite(Date.parse(v)) &&
  new Date(v).toISOString().slice(0, 10) === v
    ? v
    : null;
export function normalizeDividendDates(
  raw: unknown,
  symbol: string,
  from: string,
  to: string,
) {
  const root = object(raw),
    meta = object(root?.meta),
    links = object(root?.links);
  if (!root || !Array.isArray(root.data))
    throw Error("Dividend calendar response is unavailable.");
  if (meta?.symbol && meta.symbol !== symbol)
    throw Error("Dividend identity does not match the selected company.");
  const rows: { date: string }[] = [];
  for (const value of root.data) {
    const row = object(value);
    if (row?.symbol !== symbol)
      throw Error("Dividend identity does not match the selected company.");
    const day = date(row.date);
    if (day && day >= from && day <= to && !rows.some((r) => r.date === day))
      rows.push({ date: day });
  }
  rows.sort((a, b) => a.date.localeCompare(b.date));
  const total = number(meta?.total);
  return {
    kind: "dividends" as const,
    rows: rows.slice(0, 100),
    total:
      total !== null && Number.isInteger(total) && total >= 0 ? total : null,
    truncated:
      !!links?.next ||
      (total !== null && total > root.data.length) ||
      rows.length > 100,
  };
}
export function normalizeEconomicEvents(
  raw: unknown,
  from: string,
  to: string,
) {
  if (!Array.isArray(raw))
    throw Error("Economic calendar response is unavailable.");
  const rows = raw
    .flatMap((v) => {
      const r = object(v),
        stamp = text(r?.date),
        name = text(r?.type),
        day = date(stamp?.slice(0, 10));
      if (
        !r ||
        r.country !== "US" ||
        !name ||
        !day ||
        day < from ||
        day > to ||
        !/^\d{4}-\d{2}-\d{2} (?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(stamp!)
      )
        return [];
      return [
        {
          name,
          date: day,
          reportedTime: stamp!.slice(11),
          period: text(r.period),
          comparison: text(r.comparison),
          actual: number(r.actual),
          estimate: number(r.estimate),
          previous: number(r.previous),
        },
      ];
    })
    .sort((a, b) =>
      `${a.date} ${a.reportedTime}`.localeCompare(
        `${b.date} ${b.reportedTime}`,
      ),
    );
  return {
    kind: "economy" as const,
    rows: rows.slice(0, 100),
    truncated: raw.length >= 100,
  };
}
export function normalizeTreasuryCurve(raw: unknown, through: string) {
  const root = object(raw);
  if (!root || !Array.isArray(root.data))
    throw Error("Treasury curve response is unavailable.");
  const order = ["3M", "6M", "1Y", "2Y", "5Y", "10Y", "30Y"];
  const values = root.data.flatMap((v) => {
    const r = object(v),
      day = date(r?.date),
      tenor = text(r?.tenor),
      rate = number(r?.rate);
    return day &&
      day <= through &&
      tenor &&
      order.includes(tenor) &&
      rate !== null
      ? [{ date: day, tenor, rate }]
      : [];
  });
  const latest =
    values
      .map((r) => r.date)
      .sort()
      .at(-1) ?? null;
  const rows = order.flatMap((tenor) => {
    const found = values.filter((r) => r.date === latest && r.tenor === tenor);
    return found.length && found.every((r) => r.rate === found[0].rate)
      ? [{ tenor, rate: found[0].rate }]
      : [];
  });
  const two = rows.find((r) => r.tenor === "2Y"),
    ten = rows.find((r) => r.tenor === "10Y");
  return {
    kind: "treasury" as const,
    date: latest,
    rows,
    spread10y2y: two && ten ? ten.rate - two.rate : null,
  };
}
export type EodContextData = (
  | ReturnType<typeof normalizeDividendDates>
  | ReturnType<typeof normalizeEconomicEvents>
  | ReturnType<typeof normalizeTreasuryCurve>
) & {
  source: "EODHD";
  checkedAt: string;
  cacheMaxAgeSeconds: number;
  from: string;
  to: string;
};
