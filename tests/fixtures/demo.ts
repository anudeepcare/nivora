import type { Research, Fact, Candle, Workspace } from "../../lib/types";
// Synthetic data for explicitly enabled localhost preview or labelled private-beta sample mode.
// These synthetic observations never substitute for failed production requests.
const at = "2026-10-17T05:00:00Z";
function sample(
  symbol: string,
  name: string,
  price: number,
  scale: number,
): Research {
  const history: Candle[] = [];
  const end = Date.parse("2026-10-16"),
    start = Date.parse("2021-10-15");
  let previous = price * 0.48;
  for (let day = start, i = 0; day <= end; day += 86400_000, i++) {
    const d = new Date(day);
    if ([0, 6].includes(d.getUTCDay())) continue;
    const t = (day - start) / (end - start),
      close =
        price *
        (0.48 +
          t * 0.52 +
          Math.sin(i * 0.031) * 0.07 +
          Math.sin(i * 0.23) * 0.013);
    history.push({
      time: d.toISOString().slice(0, 10),
      open: previous,
      high: Math.max(close, previous) * 1.008,
      low: Math.min(close, previous) * 0.992,
      close,
      volume: 22000000 + Math.round(Math.sin(i * 0.71) * 6000000),
    });
    previous = close;
  }
  const correction = price / history.at(-1)!.close;
  for (const b of history)
    for (const k of ["open", "high", "low", "close"] as const)
      b[k] *= correction;
  const facts: Fact[] = [];
  for (let y = 2021; y <= 2026; y++) {
    const revenue = (130 + (y - 2021) * 30.34) * 1e9 * scale,
      net = revenue * 0.31,
      op = revenue * 0.452,
      cfo = revenue * 0.38,
      capex = revenue * 0.117;
    for (const [metric, value] of Object.entries({
      revenue,
      netIncome: net,
      operatingIncome: op,
      operatingCashFlow: cfo,
      capex,
    })) {
      facts.push({
        id: `demo:${symbol}:${y}:${metric}`,
        metric: metric as Fact["metric"],
        value,
        unit: "USD",
        currency: "USD",
        start: `${y - 1}-07-01`,
        end: `${y}-06-30`,
        filed: `${y}-07-30`,
        accession: `demo-${y}`,
        form: "10-K",
        sourceUrl: "",
        basis: "GAAP",
        scope: "annual",
      });
      for (let q = 0; q < 4; q++) {
        const start = new Date(Date.UTC(y - 1, 6 + q * 3, 1)),
          end = new Date(Date.UTC(y - 1, 9 + q * 3, 0)),
          filed = new Date(end.getTime() + 30 * 86400_000);
        facts.push({
          id: `demo:${symbol}:${y}:${q}:${metric}`,
          metric: metric as Fact["metric"],
          value: (value / 4) * (0.94 + q * 0.04),
          unit: "USD",
          currency: "USD",
          start: start.toISOString().slice(0, 10),
          end: end.toISOString().slice(0, 10),
          filed: filed.toISOString().slice(0, 10),
          accession: `demo-${y}-${q}`,
          form: "10-Q",
          sourceUrl: "",
          basis: "GAAP",
          scope: "quarterly",
        });
      }
    }
  }
  facts.push({
    id: `demo:${symbol}:shares`,
    metric: "shares",
    value: 7.4e9 * scale,
    unit: "shares",
    currency: null,
    start: null,
    end: "2026-09-30",
    filed: "2026-10-10",
    accession: "demo-shares",
    form: "10-Q",
    sourceUrl: "",
    basis: "GAAP",
    scope: "instant",
  });
  return {
    company: {
      symbol,
      name,
      exchange: "NASDAQ",
      currency: "USD",
      assetType: "stock",
    },
    quote: {
      price,
      changePct: symbol === "APP" ? -1.8 : 1.2,
      currency: "USD",
      asOf: "2026-10-16T20:00:00Z",
      session: "Illustrative close",
      source: "Synthetic preview",
      stale: false,
    },
    history,
    facts,
    filings: [],
    retrievedAt: at,
    issues: [],
    demo: true,
  };
}
const research = Object.fromEntries(
  [
    sample("MSFT", "Microsoft", 428.6, 1),
    sample("AAPL", "Apple", 226.4, 1.25),
    sample("NVDA", "NVIDIA", 182.4, 0.6),
    sample("APP", "AppLovin", 270.87, 0.025),
    sample("IREN", "IREN", 42.8, 0.005),
    sample("ASTS", "AST SpaceMobile", 74.79, 0.001),
  ].map((r) => [r.company.symbol, r]),
);
const workspace: Workspace = {
  email: "preview@example.invalid",
  positions: [
    {
      id: "demo-msft",
      symbol: "MSFT",
      quantity: 25,
      currency: "USD",
      cost: 365,
      assetType: "stock",
    },
    {
      id: "demo-aapl",
      symbol: "AAPL",
      quantity: 40,
      currency: "USD",
      cost: 195,
      assetType: "stock",
    },
    {
      id: "demo-nvda",
      symbol: "NVDA",
      quantity: 80,
      currency: "USD",
      cost: 121,
      assetType: "stock",
    },
    {
      id: "demo-cash",
      symbol: "USD",
      quantity: 4500,
      currency: "USD",
      cost: 1,
      assetType: "cash",
    },
  ],
  watchlist: ["MSFT", "NVDA", "APP", "IREN", "ASTS", "AAPL"].map((symbol) => ({
    symbol,
    note: "",
    createdAt: at,
  })),
};
export const demoData = { research, workspace };
