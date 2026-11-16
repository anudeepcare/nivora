import type { GrowData, GrowDataset } from "./grow-data";
import { normalizeSentiSenseCalendar } from "./sentisense-supporting-normalize.ts";
const object = (v: unknown): Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
const text = (v: unknown) => (typeof v === "string" ? v.slice(0, 8000) : "");
const number = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) ? v : null;
/** Map documented profile/calendar fields; do not substitute quote currency for EPS currency. */
export function normalizeSentiSenseGrow(
  symbol: string,
  dataset: GrowDataset,
  raw: unknown,
  asOf: string,
  from: string,
  to: string,
): GrowData {
  if (dataset !== "profile" && dataset !== "earnings")
    throw Error("This dataset is not supplied by the current connection.");
  const result: GrowData = {
    symbol,
    dataset,
    source: "SentiSense",
    retrievedAt: asOf,
    currency: null,
    profile: null,
    earnings: [],
    dividends: [],
    splits: [],
    announcements: [],
  };
  const root = object(raw);
  if (dataset === "profile") {
    if (root.ticker !== symbol)
      throw Error("Company profile belongs to a different instrument.");
    let website: string | null = null;
    try {
      const u = new URL(text(root.homepageUrl));
      if (u.protocol === "https:" && !u.username && !u.password)
        website = u.href;
    } catch {}
    const currency = text(root.currency).toUpperCase();
    result.currency = /^[A-Z]{3}$/.test(currency) ? currency : null;
    result.profile = {
      name: text(root.name),
      description: text(root.description),
      sector: text(root.sector),
      industry: text(root.industry),
      ceo: text(root.ceo),
      employees: number(root.employees),
      country: text(root.country),
      website,
    };
  } else {
    normalizeSentiSenseCalendar(raw, [symbol], from, to); // validates envelope/access
    const rows = object(root.data).earnings as unknown[];
    result.earnings = rows
      .flatMap((v) => {
        const r = object(v);
        const event = normalizeSentiSenseCalendar(
          { data: { earnings: [r] } },
          [symbol],
          from,
          to,
        )[0];
        if (!event) return [];
        const actual =
            event.date <= asOf.slice(0, 10) ? (event.actual ?? null) : null,
          estimate = event.estimate ?? null;
        return [
          {
            date: event.date,
            time: text(r.earningsTime),
            actual,
            estimate,
            surprise:
              actual !== null && estimate !== null && estimate !== 0
                ? ((actual - estimate) / Math.abs(estimate)) * 100
                : null,
          },
        ];
      })
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 40);
  }
  return result;
}
