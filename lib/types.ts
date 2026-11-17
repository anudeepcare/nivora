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
  | "eps"
  | "grossProfit"
  | "costOfRevenue"
  | "researchExpense"
  | "stockCompensation"
  | "buybacks"
  | "dividends"
  | "weightedShares"
  | "equity"
  | "currentAssets"
  | "currentLiabilities"
  | "interestExpense"
  | "depreciation"
  | "receivables"
  | "inventory"
  | "payables"
  | "retainedEarnings";
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
  basis: "GAAP" | "IFRS" | "Provider";
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
  grossProfit?: number | null;
  costOfRevenue?: number | null;
  researchExpense?: number | null;
  stockCompensation?: number | null;
  buybacks?: number | null;
  dividends?: number | null;
  weightedShares?: number | null;
  eps?: number | null;
  cash?: number | null;
  debt?: number | null;
  equity?: number | null;
  assets?: number | null;
  liabilities?: number | null;
  currentAssets?: number | null;
  currentLiabilities?: number | null;
  interestExpense?: number | null;
  depreciation?: number | null;
  receivables?: number | null;
  inventory?: number | null;
  payables?: number | null;
  retainedEarnings?: number | null;
  grossMargin?: number | null;
  netMargin?: number | null;
  fcfMargin?: number | null;
  sbcRevenue?: number | null;
  capexRevenue?: number | null;
  fcfPerShare?: number | null;
  sbcAdjustedFcfPerShare?: number | null;
  currentRatio?: number | null;
  debtEquity?: number | null;
  netDebt?: number | null;
  interestCoverage?: number | null;
  cashConversion?: number | null;
  sourceUrls?: string[];
};
export type Quote = {
  previousClose?: number | null;
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
  foreignListing?: boolean;
  description?: string;
  website?: string;
  sector?: string;
  logoUrl?: string;
};
export type Filing = { form: string; date: string; url: string; title: string };
export type DatasetCoverage = Record<
  "quote" | "history" | "profile" | "fundamentals" | "filings",
  {
    status: "available" | "partial" | "unavailable" | "not-applicable";
    reason?: string;
    source?: string;
    asOf?: string;
  }
>;
export type Research = {
  coverage?: DatasetCoverage;
  company: Company;
  quote: Quote;
  history: Candle[];
  historySource?: string;
  facts: Fact[];
  filings: Filing[];
  retrievedAt: string;
  /** Clock used to validate the current quote, independent of statement retrieval. */
  priceObservedAt?: string;
  issues: string[];
  evidence?: import("./eodhd-normalize").EodEvidence;
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
