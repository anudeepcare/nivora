import type { Company, Research, DatasetCoverage } from "./types";
import { providerSymbol, providerIdentity } from "./provider-symbol.ts";
import { supportedListing } from "./market.ts";
import { cryptoSearchSymbol } from "./search-selection.ts";
import { fundamentalCoverage } from "./fundamental-coverage.ts";
export type DirectoryStatus = {
  provider: "eodhd" | "twelve";
  market: string;
  status: "available" | "unavailable";
  total: number | null;
  eligible: number;
  reason?: string;
};
export type MarketDirectory = {
  listings: Company[];
  directories: DirectoryStatus[];
  complete: boolean;
  retrievedAt: string;
};
export function normalizeTwelveDirectory(
  raw: unknown,
  crypto = false,
): Company[] {
  if (!Array.isArray(raw)) return [];
  const rows: Company[] = [];
  for (const x of raw) {
    if (!x || typeof x !== "object") continue;
    const pair = crypto || x.instrument_type === "Digital Currency";
    if (pair ? !/^[A-Z0-9]{2,12}\/USD$/.test(x.symbol) : !supportedListing(x))
      continue;
    if (
      !pair &&
      x.type &&
      ![
        "Common Stock",
        "Preferred Stock",
        "ETF",
        "American Depositary Receipt",
        "Depositary Receipt",
        "REIT",
      ].includes(x.type)
    )
      continue;
    try {
      const symbol = providerSymbol(pair ? x.symbol : `US:${x.symbol}`);
      rows.push({
        symbol,
        name: String(x.name ?? x.instrument_name ?? symbol),
        exchange: pair ? "Crypto" : String(x.exchange),
        currency: "USD",
        assetType: pair ? "crypto" : "stock",
      });
    } catch {
      /* Leave unsupported listing identities out of the enabled universe. */
    }
  }
  return rows;
}
export function uniqueListings(rows: Company[]) {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = providerIdentity(row.symbol);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
/** Search every directory row before limiting the UI results. Exact class aliases
 * rank above company-name tokens. Exchange prefixes constrain matching venues. */
export function searchDirectory(query: string, rows: Company[], limit = 12) {
  let q = query.trim().replace(/^\$/, "").toUpperCase();
  let exchange = "";
  if (q.includes(":")) {
    [exchange, q] = q.split(":");
  }
  const crypto = cryptoSearchSymbol(q);
  let exact = q;
  try {
    exact = providerSymbol(exchange ? `${exchange}:${q}` : q);
  } catch {
    /* Company names are valid searches. */
  }
  const words = q
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/);
  const scored = rows
    .flatMap((row) => {
      if (
        exchange &&
        exchange !== "US" &&
        row.exchange.toUpperCase() !== exchange
      )
        return [];
      const symbol = row.symbol.toUpperCase(),
        name = row.name.toUpperCase();
      const rank =
        symbol === exact
          ? 0
          : providerIdentity(symbol) === providerIdentity(exact)
            ? 1
            : symbol === crypto
              ? 2
              : name === q
                ? 3
                : symbol.startsWith(q)
                  ? 4
                  : words.every((w) => `${name} ${symbol}`.includes(w))
                    ? 5
                    : Infinity;
      return Number.isFinite(rank) ? [{ row, rank }] : [];
    })
    .sort(
      (a, b) => a.rank - b.rank || a.row.symbol.localeCompare(b.row.symbol),
    );
  return uniqueListings(scored.map((x) => x.row)).slice(0, limit);
}
export function researchCoverage(
  r: Pick<
    Research,
    | "company"
    | "quote"
    | "history"
    | "historySource"
    | "facts"
    | "filings"
    | "issues"
  >,
  verifiedProfile: boolean,
  now = Date.now(),
): DatasetCoverage {
  const financial = fundamentalCoverage(r.facts, now),
    crypto = r.company.assetType === "crypto";
  const issue = (prefix: RegExp) =>
    r.issues.filter((x) => prefix.test(x)).join(" ");
  return {
    quote: {
      status:
        r.quote.price == null
          ? "unavailable"
          : r.quote.stale
            ? "partial"
            : "available",
      source: r.quote.source,
      asOf: r.quote.asOf ?? undefined,
      reason:
        issue(/^Quote:/) ||
        (r.quote.stale ? "The dated price needs a refresh." : undefined),
    },
    history: {
      status: r.history.length
        ? r.historySource?.includes("cached")
          ? "partial"
          : "available"
        : "unavailable",
      source: r.historySource,
      asOf: r.history.at(-1)?.time,
      reason: issue(/^Price history:/) || undefined,
    },
    profile: {
      status: verifiedProfile ? "available" : "unavailable",
      reason: verifiedProfile
        ? undefined
        : "A verified company profile is unavailable; independent market data is retained.",
    },
    fundamentals: {
      status: crypto
        ? "not-applicable"
        : !r.facts.length
          ? "unavailable"
          : financial.complete && financial.fresh
            ? "available"
            : "partial",
      asOf: financial.latestEnd ?? undefined,
      reason: crypto
        ? "Corporate financial statements do not apply to crypto."
        : financial.reason,
    },
    filings: {
      status: crypto
        ? "not-applicable"
        : r.filings.length
          ? "available"
          : "unavailable",
      asOf: r.filings[0]?.date,
      reason: crypto
        ? "Corporate filings do not apply to crypto."
        : issue(/Company disclosures|filing/i) ||
          (!r.filings.length
            ? "No company filings were returned by the available sources."
            : undefined),
    },
  };
}
