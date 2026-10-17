export type Candle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};
export type Metric =
  | "revenue"
  | "netIncome"
  | "operatingIncome"
  | "operatingCashFlow"
  | "capex"
  | "cash"
  | "debt"
  | "assets"
  | "liabilities"
  | "shares"
  | "eps";
export type Fact = {
  id: string;
  metric: Metric;
  value: number;
  unit: string;
  currency: string | null;
  start: string | null;
  end: string;
  filed: string;
  accession: string;
  form: string;
  sourceUrl: string;
  basis: "GAAP" | "IFRS";
  scope: "annual" | "quarterly" | "instant" | "ytd";
  derivedFrom?: string[];
  sourceUrls?: string[];
};
export type FinancialPeriod = {
  end: string;
  start: string;
  currency: string;
  basis: string;
  filed: string;
  sourceUrl: string;
  revenue: number | null;
  netIncome: number | null;
  operatingIncome: number | null;
  operatingCashFlow: number | null;
  capex: number | null;
  fcf: number | null;
  margin: number | null;
};
export type Quote = {
  price: number | null;
  changePct: number | null;
  currency: string;
  asOf: string | null;
  session: string;
  source: string;
  stale: boolean;
};
export type Company = {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  assetType: "stock" | "crypto";
  description?: string;
  website?: string;
  sector?: string;
  logoUrl?: string;
};
export type Filing = { form: string; date: string; url: string; title: string };
export type Research = {
  company: Company;
  quote: Quote;
  history: Candle[];
  facts: Fact[];
  filings: Filing[];
  retrievedAt: string;
  issues: string[];
  snapshot?: import("./canonical").Canonical;
  demo?: boolean;
};
export type Position = {
  id: string;
  symbol: string;
  quantity: number;
  cost: number;
  currency?: string | null;
  assetType: "stock" | "crypto" | "cash";
};
export type Watch = { symbol: string; note: string; createdAt: string };
export type Workspace = {
  positions: Position[];
  watchlist: Watch[];
  email: string;
};
export type Signal = {
  month: string;
  multiplier: 0 | 1 | 2 | 3 | 4;
  close: number;
  drawdown: number;
  deviation: number;
  reason: string;
};
