// Seeded synthetic market: hundreds of instruments covering the shapes real tickers take.
// Synthetic by design — it proves the engines never break or mislabel, not that any forecast is right.
import { demoData } from "../fixtures/demo.ts";

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const gauss = (r) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
const END = Date.UTC(2026, 10, 6);
const template = demoData.research.MSFT;

export const ARCHETYPES = [
  "large-cap", "high-growth", "penny", "sub-cent", "mega-price", "recent-ipo", "new-listing",
  "meme-volatile", "flat-utility", "crashed", "halted-gaps", "split-unadjusted", "bad-ticks",
  "descending-order", "duplicate-dates", "crypto", "non-usd-listing", "stale-quote", "no-quote",
  "analyst-full", "analyst-consensus-only", "analyst-unordered", "analyst-stale", "etf",
];

export function instrument(kind, seed) {
  const r = rng(seed);
  const crypto = kind === "crypto";
  const sessions =
    kind === "new-listing" ? 20 + Math.floor(r() * 50)
    : kind === "recent-ipo" ? 85 + Math.floor(r() * 160)
    : 260 + Math.floor(r() * 1500);
  const start =
    kind === "penny" ? 0.2 + r() * 3
    : kind === "sub-cent" ? 0.00001 + r() * 0.004
    : kind === "mega-price" ? 3000 + r() * 600000
    : crypto ? 0.05 + r() * 60000
    : 5 + r() * 600;
  const vol =
    kind === "meme-volatile" ? 0.07 + r() * 0.05
    : kind === "flat-utility" ? 0.004 + r() * 0.004
    : crypto ? 0.03 + r() * 0.04
    : 0.01 + r() * 0.03;
  const drift = kind === "crashed" ? -0.004 : kind === "high-growth" ? 0.0015 : (r() - 0.45) * 0.001;
  const dates = [];
  for (let t = END; dates.length < sessions; t -= 86400000) {
    const d = new Date(t);
    if (crypto || ![0, 6].includes(d.getUTCDay())) dates.unshift(d.toISOString().slice(0, 10));
  }
  let price = start, regime = 1;
  let history = dates.map((time, i) => {
    if (r() < 0.01) regime = 0.5 + r() * 2;
    let step = drift + vol * regime * gauss(r);
    if (r() < 0.004) step += (r() - 0.5) * 0.5; // earnings-style gap
    price = Math.max(price * Math.exp(step), 1e-9);
    const open = price * Math.exp(vol * 0.3 * gauss(r));
    return { time, open, high: Math.max(open, price) * (1 + r() * vol), low: Math.min(open, price) * (1 - r() * vol * 0.9), close: price, volume: Math.floor(r() * 5e6) };
  });
  if (kind === "halted-gaps") history = history.filter((_, i) => !(i > 60 && i < 60 + 5 + Math.floor(r() * 30)) && r() > 0.03);
  if (kind === "split-unadjusted") {
    const k = Math.floor(history.length * (0.3 + r() * 0.5)), f = [2, 4, 10, 20, 0.1][Math.floor(r() * 5)];
    history = history.map((b, i) => (i < k ? { ...b, open: b.open * f, high: b.high * f, low: b.low * f, close: b.close * f } : b));
  }
  if (kind === "bad-ticks")
    history = history.map((b) => (r() < 0.02 ? { ...b, close: [NaN, 0, -1, Infinity, b.close * 100][Math.floor(r() * 5)] } : b));
  const last = [...history].reverse().find((b) => Number.isFinite(b.close) && b.close > 0) ?? history.at(-1);
  if (kind === "descending-order") history = [...history].reverse();
  if (kind === "duplicate-dates") history = history.flatMap((b) => (r() < 0.05 ? [b, { ...b }] : [b]));
  const currency = kind === "non-usd-listing" ? ["GBP", "EUR", "JPY", "CAD"][Math.floor(r() * 4)] : "USD";
  const date = last.time;
  const px = last.close * (1 + (r() - 0.5) * 0.02);
  const quote = {
    ...template.quote,
    price: kind === "no-quote" ? null : px,
    changePct: (r() - 0.5) * 8,
    currency,
    asOf: kind === "stale-quote" ? "2026-09-01T20:00:00Z" : date + "T21:00:00Z",
    stale: kind === "stale-quote",
  };
  const consensus =
    kind === "analyst-full" ? { target: px * 1.3, low: px * 0.7, high: px * 2.2 }
    : kind === "analyst-consensus-only" ? { target: px * (0.6 + r()) }
    : kind === "analyst-unordered" ? { target: px, low: px * 2, high: px * 0.5 }
    : kind === "analyst-stale" ? { target: px * 1.2, low: px, high: px * 1.5 }
    : !crypto && r() < 0.5 ? { target: px * (0.7 + r() * 1.5) } : undefined;
  return {
    ...template,
    company: {
      ...template.company,
      symbol: `${kind.slice(0, 4).toUpperCase()}${seed}`,
      currency,
      exchange: kind === "non-usd-listing" ? "LSE" : "NASDAQ",
      assetType: crypto ? "crypto" : "stock",
    },
    quote,
    history,
    retrievedAt: date + "T23:00:00Z",
    priceObservedAt: date + "T23:00:00Z",
    evidence: {
      estimates: [],
      ...(template.evidence ?? {}),
      updatedAt: kind === "analyst-stale" ? "2025-01-01" : date,
      consensus: consensus ?? {},
    },
  };
}

export function universe(perKind = 16, base = 1000) {
  return ARCHETYPES.flatMap((kind, k) => Array.from({ length: perKind }, (_, i) => ({ kind, research: instrument(kind, base + k * 1000 + i) })));
}
