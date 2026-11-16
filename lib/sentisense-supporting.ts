import { sentiSenseRequest } from "./sentisense-api";
import {
  normalizeSentiSenseInsiders,
  normalizeSentiSensePeers,
  normalizeSentiSenseNews,
  normalizeSentiSenseCalendar,
  normalizeSentiSenseCongress,
  normalizeSentiSenseOptions,
} from "./sentisense-supporting-normalize";
import { marketDay } from "./home-feed";
import { HttpError } from "./server";
const ticker = (symbol: string) => {
  if (!/^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol))
    throw new HttpError("Choose a supported US-listed stock or ETF.");
  return encodeURIComponent(symbol);
};
export async function sentiSenseNews(symbol: string) {
  const raw = await sentiSenseRequest(
    `documents/ticker/${ticker(symbol)}`,
    { source: "NEWS", days: "7", limit: "30" },
    300,
  );
  return normalizeSentiSenseNews(raw, symbol);
}
export async function sentiSenseCalendar(
  symbols: string[],
  from: string,
  to: string,
) {
  const raw = await sentiSenseRequest("calendar/earnings", { from, to }, 300);
  return normalizeSentiSenseCalendar(raw, symbols, from, to);
}
export async function sentiSenseCongress(symbol: string) {
  const raw = await sentiSenseRequest(
    `politicians/filings/${ticker(symbol)}`,
    { lookbackDays: "180" },
    3600,
  );
  return {
    rows: normalizeSentiSenseCongress(raw, symbol, marketDay()),
    asOf: new Date().toISOString(),
    windowDays: 180,
    truncated:
      typeof raw === "object" &&
      raw !== null &&
      "totalCount" in raw &&
      typeof raw.totalCount === "number" &&
      "data" in raw &&
      Array.isArray(raw.data)
        ? raw.totalCount > raw.data.length
        : false,
    issues: ["Official filing links are not supplied by this source."],
  };
}
export async function sentiSenseOptionsSummary(symbol: string) {
  const raw = await sentiSenseRequest(
    `stocks/${ticker(symbol)}/options/summary`,
    {},
    900,
  );
  return normalizeSentiSenseOptions(raw, symbol, marketDay());
}

export async function sentiSenseEnrichment(symbol: string) {
  const from = new Date(Date.now() - 180 * 86400000).toISOString().slice(0, 10),
    to = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
  const [profile, insider, calendar] = await Promise.allSettled([
    sentiSenseRequest(`stocks/${ticker(symbol)}/profile`, {}, 3600),
    sentiSenseRequest(
      `insider/trades/${ticker(symbol)}`,
      { lookbackDays: "180" },
      3600,
    ),
    sentiSenseRequest("calendar/earnings", { ticker: symbol, from, to }, 300),
  ]);
  const record = (v: unknown): Record<string, unknown> =>
    v !== null && typeof v === "object" && !Array.isArray(v)
      ? (v as Record<string, unknown>)
      : {};
  const p = profile.status === "fulfilled" ? record(profile.value) : {};
  const safe = (v: unknown) => {
    try {
      const u = new URL(String(v));
      return u.protocol === "https:" && !u.username && !u.password
        ? u.href
        : "";
    } catch {
      return "";
    }
  };
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const num = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v) ? v : null;
  const issues: string[] = [];
  let insiders: ReturnType<typeof normalizeSentiSenseInsiders> = [],
    earnings: import("./enrichment").Enrichment["earnings"] = [];
  try {
    if (insider.status !== "fulfilled") throw Error();
    insiders = normalizeSentiSenseInsiders(insider.value, symbol, marketDay());
  } catch {
    issues.push("Insider transactions could not be checked.");
  }
  try {
    if (calendar.status !== "fulfilled") throw Error();
    normalizeSentiSenseCalendar(calendar.value, [symbol], from, to);
    const rows = record(record(calendar.value).data).earnings as unknown[];
    earnings = rows.flatMap((v) => {
      const r = record(v);
      const events = normalizeSentiSenseCalendar(
        { data: { earnings: [r] } },
        [symbol],
        from,
        to,
      );
      return events.map((e) => ({
        date: e.date,
        hour: str(r.earningsTime),
        epsActual: num(r.actualEps),
        epsEstimate: num(r.estimatedEps),
        revenueActual: num(r.actualRevenue),
        revenueEstimate: num(r.estimatedRevenue),
      }));
    });
  } catch {
    issues.push("Earnings events could not be checked.");
  }
  if (p.ticker !== symbol) issues.push("Company profile could not be checked.");
  issues.push(
    "Insider rows with ambiguous share direction are omitted; tax withholding is not open-market selling.",
  );
  return {
    symbol,
    profile:
      p.ticker === symbol
        ? {
            name: str(p.name) || symbol,
            industry: str(p.industry),
            website: safe(p.homepageUrl),
            logo: safe(p.logoUrl),
          }
        : null,
    insiders,
    earnings,
    issues,
    retrievedAt: new Date().toISOString(),
    source: "SentiSense",
  };
}
export async function sentiSensePeers(symbol: string) {
  return normalizeSentiSensePeers(
    await sentiSenseRequest(
      `stocks/${ticker(symbol)}/similar`,
      { limit: "5" },
      3600,
    ),
    symbol,
  );
}
