import { sameProviderSymbol } from "./provider-symbol.ts";
export const growDatasets = {
  profile: { endpoint: "profile", credits: 10, ttl: 86400000 },
  earnings: { endpoint: "earnings", credits: 20, ttl: 21600000 },
  dividends: { endpoint: "dividends", credits: 20, ttl: 86400000 },
  splits: { endpoint: "splits", credits: 20, ttl: 86400000 },
  announcements: { endpoint: "press_releases", credits: 1, ttl: 3600000 },
} as const;
export type GrowDataset = keyof typeof growDatasets;
export type GrowData = {
  symbol: string;
  dataset: GrowDataset;
  source: string;
  retrievedAt: string;
  currency: string | null;
  profile: {
    name: string;
    description: string;
    sector: string;
    industry: string;
    ceo: string;
    employees: number | null;
    country: string;
    website: string | null;
  } | null;
  earnings: {
    date: string;
    time: string;
    actual: number | null;
    estimate: number | null;
    surprise: number | null;
  }[];
  dividends: { date: string; amount: number | null }[];
  splits: { date: string; description: string }[];
  announcements: { date: string; title: string }[];
};
const number = (v: unknown) =>
  v != null && v !== "" && typeof v !== "boolean" && Number.isFinite(Number(v))
    ? Number(v)
    : null;
const text = (v: unknown) => (typeof v === "string" ? v.slice(0, 8000) : "");
const date = (v: unknown) =>
  typeof v === "string" &&
  /^\d{4}-\d{2}-\d{2}/.test(v) &&
  Number.isFinite(Date.parse(v))
    ? v.slice(0, 10)
    : null;
export function websiteUrl(value: unknown) {
  try {
    const u = new URL(String(value));
    return ["https:", "http:"].includes(u.protocol) &&
      !u.username &&
      !u.password
      ? u.href
      : null;
  } catch {
    return null;
  }
}
export function normalizeGrow(
  symbol: string,
  dataset: GrowDataset,
  data: any,
  asOf: string,
): GrowData {
  const identity = dataset === "profile" ? data?.symbol : data?.meta?.symbol;
  // Press-release responses have no instrument metadata. The endpoint is always queried for one validated symbol.
  if (dataset !== "announcements" && !sameProviderSymbol(identity, symbol))
    throw Error("Dataset belongs to a different instrument");
  const result: GrowData = {
    symbol,
    dataset,
    source: "Twelve Data",
    retrievedAt: asOf,
    currency: /^[A-Z]{3}$/.test(data.meta?.currency ?? "")
      ? data.meta.currency
      : null,
    profile: null,
    earnings: [],
    dividends: [],
    splits: [],
    announcements: [],
  };
  if (dataset === "profile")
    result.profile = {
      name: text(data.name),
      description: text(data.description),
      sector: text(data.sector),
      industry: text(data.industry),
      ceo: text(data.CEO),
      employees: number(data.employees),
      country: text(data.country),
      website: websiteUrl(data.website),
    };
  if (dataset === "earnings")
    result.earnings = (Array.isArray(data.earnings) ? data.earnings : [])
      .filter((x: any) => date(x.date))
      .slice(0, 40)
      .map((x: any) => {
        const actual =
            date(x.date)! <= asOf.slice(0, 10) ? number(x.eps_actual) : null,
          estimate = number(x.eps_estimate);
        return {
          date: date(x.date)!,
          time: text(x.time),
          actual,
          estimate,
          surprise:
            actual != null && estimate != null && estimate !== 0
              ? ((actual - estimate) / Math.abs(estimate)) * 100
              : null,
        };
      })
      .sort(
        (a: GrowData["earnings"][number], b: GrowData["earnings"][number]) =>
          b.date.localeCompare(a.date),
      );
  if (dataset === "dividends")
    result.dividends = (Array.isArray(data.dividends) ? data.dividends : [])
      .filter((x: any) => date(x.ex_date))
      .slice(0, 40)
      .map((x: any) => ({ date: date(x.ex_date)!, amount: number(x.amount) }))
      .sort((a: any, b: any) => b.date.localeCompare(a.date));
  if (dataset === "splits")
    result.splits = (Array.isArray(data.splits) ? data.splits : [])
      .filter((x: any) => date(x.date))
      .slice(0, 40)
      .map((x: any) => ({
        date: date(x.date)!,
        description: text(x.description) || "Split reported",
      }))
      .sort((a: any, b: any) => b.date.localeCompare(a.date));
  if (dataset === "announcements")
    result.announcements = (
      Array.isArray(data.press_releases) ? data.press_releases : []
    )
      .filter(
        (x: any) => date(x.datetime) && date(x.datetime)! <= asOf.slice(0, 10),
      )
      .slice(0, 10)
      .map((x: any) => ({ date: date(x.datetime)!, title: text(x.title) }));
  return result;
}
