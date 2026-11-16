import type { MarketEvent } from "./home-feed";
import type { CongressDisclosure } from "./congress-disclosures";

const object = (v: unknown): Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
const text = (v: unknown, max = 300) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";
const number = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) ? v : null;
const day = (v: unknown) =>
  typeof v === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  Number.isFinite(Date.parse(v)) &&
  new Date(v).toISOString().slice(0, 10) === v
    ? v
    : null;
const url = (v: unknown) => {
  try {
    const u = new URL(String(v));
    return u.protocol === "https:" && !u.username && !u.password
      ? u.href
      : null;
  } catch {
    return null;
  }
};

/** SentiSense document API supplies source links, not publisher headlines. */
export function normalizeSentiSenseNews(
  raw: unknown,
  symbol: string,
  now = Date.now(),
) {
  const root = object(raw);
  if (!Array.isArray(root.documents))
    throw Error("Company news response is unavailable.");
  const items = (Array.isArray(root.documents) ? root.documents : []).flatMap(
    (v) => {
      const row = object(v),
        stamp = number(row.published),
        link = url(row.url);
      if (
        !link ||
        stamp === null ||
        stamp <= 0 ||
        stamp * 1000 > now ||
        row.source !== "NEWS"
      )
        return [];
      const mentions = Array.isArray(row.sentiment)
        ? row.sentiment.map(object)
        : [];
      if (!mentions.some((m) => m.ticker === symbol)) return [];
      const publisher = text(row.sourceName, 100) || new URL(link).hostname;
      const sentiment = number(row.averageSentiment);
      return [
        {
          date: new Date(stamp * 1000).toISOString(),
          title: `${symbol} · News from ${publisher}`,
          url: link,
          sentiment:
            sentiment !== null && sentiment >= -1 && sentiment <= 1
              ? sentiment
              : null,
          titleKind: "publisher-link" as const,
        },
      ];
    },
  );
  return {
    items: [...new Map(items.map((x) => [x.url, x])).values()].sort((a, b) =>
      b.date.localeCompare(a.date),
    ),
    source: "Publisher links · original headlines not supplied",
    retrievedAt: new Date(now).toISOString(),
  };
}

export function normalizeSentiSenseCalendar(
  raw: unknown,
  symbols: string[],
  from: string,
  to: string,
): MarketEvent[] {
  const root = object(raw);
  if (root.isPreview === true)
    throw Error("Calendar access returned a limited preview.");
  const data = object(root.data);
  if (!Array.isArray(data.earnings))
    throw Error("Earnings calendar response is unavailable.");
  return data.earnings
    .flatMap((v) => {
      const r = object(v),
        symbol = text(r.ticker),
        date = day(r.earningsDate);
      if (!symbols.includes(symbol) || !date || date < from || date > to)
        return [];
      const session =
        (
          {
            before_open: "Before market open",
            after_close: "After market close",
            during_market: "During market hours",
          } as Record<string, string>
        )[text(r.earningsTime)] || "Time not announced";
      return [
        {
          symbol,
          date,
          kind: "earnings",
          detail: [
            session,
            text(r.fiscalQuarter),
            r.confirmed === true ? "Confirmed" : "Estimated date",
          ]
            .filter(Boolean)
            .join(" · "),
          actual: number(r.actualEps),
          estimate: number(r.estimatedEps),
        },
      ];
    })
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) || a.symbol.localeCompare(b.symbol),
    );
}

/** Source API does not supply official filing URLs. Never synthesize one. */
export function normalizeSentiSenseCongress(
  raw: unknown,
  symbol: string,
  today: string,
): CongressDisclosure[] {
  const root = object(raw);
  if (root.isPreview === true)
    throw Error("Congressional data access returned a limited preview.");
  if (!Array.isArray(root.data))
    throw Error("Congressional disclosure response is unavailable.");
  const rows = root.data.flatMap((v) => {
    const r = object(v),
      traded = day(r.transactionDate),
      disclosed = day(r.disclosureDate),
      member = text(r.politicianName),
      chamber = text(r.chamber).toLowerCase(),
      action = text(r.transactionType).toLowerCase();
    if (
      r.ticker !== symbol ||
      !traded ||
      !disclosed ||
      traded > today ||
      disclosed > today ||
      disclosed < traded ||
      !member ||
      !["house", "senate"].includes(chamber) ||
      !["purchase", "sale", "exchange"].includes(action)
    )
      return [];
    const assetDescription = text(r.assetDescription, 500),
      assetType = text(r.assetType),
      amountRange = text(r.amountRange) || "Amount range not reported",
      owner = text(r.owner) || null;
    const id = JSON.stringify([
      symbol,
      member,
      traded,
      disclosed,
      action,
      amountRange,
      owner,
      assetDescription,
      assetType,
    ]);
    return [
      {
        id,
        member,
        chamber: chamber as "house" | "senate",
        symbol,
        action,
        assetDescription,
        assetType,
        comment: null,
        traded,
        disclosed,
        lagDays: Math.round(
          (Date.parse(disclosed) - Date.parse(traded)) / 86400000,
        ),
        amountRange,
        owner,
        filingUrl: "",
      },
    ];
  });
  return [...new Map(rows.map((x) => [x.id, x])).values()].sort((a, b) =>
    b.disclosed.localeCompare(a.disclosed),
  );
}

export function normalizeSentiSenseOptions(
  raw: unknown,
  symbol: string,
  today: string,
) {
  const root = object(raw);
  if (root.isPreview === true)
    throw Error("Options analytics access returned a limited preview.");
  if (root.data === null)
    return {
      symbol,
      status: "unavailable" as const,
      message: "No options analytics snapshot is available for this listing.",
      snapshot: null,
    };
  const data = object(root.data),
    latest = object(data.latest),
    asOf = day(data.asOf);
  if (!asOf || asOf > today)
    throw Error("Options snapshot date is unavailable.");
  const allowed = [
    "callVol",
    "putVol",
    "callOi",
    "putOi",
    "pcVol",
    "pcOi",
    "atmIv",
    "atmIv60",
    "atmIv90",
    "skew25d",
    "expectedMove1d",
    "expectedMove5d",
    "expectedMove20d",
    "expectedMove1s1d",
    "expectedMove1s5d",
    "expectedMove1s20d",
    "netDelta",
    "contracts",
  ];
  if (!Object.keys(latest).length)
    throw Error("Options aggregate response is unavailable.");
  const metrics = Object.fromEntries(
    allowed.map((k) => [k, number(latest[k])]),
  );
  return {
    symbol,
    status: "available" as const,
    message:
      "End-of-day aggregate analytics, not a contract chain or trade tape.",
    snapshot: { asOf, metrics },
  };
}

export function normalizeSentiSenseInsiders(
  raw: unknown,
  symbol: string,
  today: string,
) {
  const root = object(raw);
  if (root.isPreview === true || !Array.isArray(root.data))
    throw Error("Insider transactions are unavailable.");
  return root.data.flatMap((v) => {
    const r = object(v),
      date = day(r.transactionDate),
      filed = day(r.filedDate),
      shares = number(r.sharesTransacted),
      code = text(r.transactionCode);
    if (
      r.ticker !== symbol ||
      !date ||
      !filed ||
      date > today ||
      filed > today ||
      filed < date ||
      shares === null ||
      shares < 0
    )
      return [];
    // Unknown/gift/exercise direction cannot be inferred from the lossy rollup.
    const sign = (
      { P: 1, S: -1, F: -1, D: -1, A: 1 } as Record<string, number>
    )[code];
    if (!sign) return [];
    const action = (
      {
        P: "Open-market purchase",
        S: "Open-market sale",
        F: "Tax withholding",
        D: "Disposition to issuer",
        A: "Award or grant",
      } as Record<string, string>
    )[code];
    return [
      {
        name: text(r.insiderName) || "Reported insider",
        date,
        filed,
        code,
        action:
          action + (text(r.securityBasis) ? ` · ${text(r.securityBasis)}` : ""),
        change: sign * shares,
        price: r.securityBasis ? null : number(r.pricePerShare),
      },
    ];
  });
}
export function normalizeSentiSensePeers(raw: unknown, symbol: string) {
  if (!Array.isArray(raw)) throw Error("Peer response is unavailable.");
  return raw
    .flatMap((v) => {
      const r = object(v),
        ticker = text(r.ticker);
      return /^[A-Z][A-Z0-9.-]{0,14}$/.test(ticker) && ticker !== symbol
        ? [
            {
              symbol: ticker,
              name: text(r.name) || ticker,
              marketCap: null,
              sector: "",
              industry: "",
            },
          ]
        : [];
    })
    .slice(0, 5);
}
