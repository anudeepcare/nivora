/** Convert an existing research snapshot into the point-in-time valuation boundary. */

export type ValuationObservation = {
  symbol: string;
  metric: string;
  periodEnd: string;
  periodType: "instant" | "Q" | "FY";
  value: number;
  unit: string;
  currency: string | null;
  source: string;
  sourceRef: string | null;
  filedAt: string;
  status?: "clean" | "disputed";
  basis?: string | null;
};

export type ValuationInputSnapshot = {
  symbol: string;
  asOf: string;
  observations: ValuationObservation[];
  corporateActions: Array<{ symbol: string; actionType: string; effectiveDate: string; ratio: number }>;
  metadata: Record<string, string | number | boolean | null>;
};

const SYMBOL = /^[A-Z0-9][A-Z0-9./_-]{0,14}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function dateOnly(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const day = value.slice(0, 10);
  return DATE.test(day) ? day : null;
}

function addObservation(
  rows: ValuationObservation[],
  symbol: string,
  metric: string,
  value: unknown,
  periodEnd: unknown,
  asOf: string,
  currency: unknown,
  periodType: ValuationObservation["periodType"] = "instant",
  source = "research-snapshot",
  filedAt: unknown = periodEnd,
  sourceRef: unknown = null,
  unit = "reported",
  basis: unknown = null,
) {
  if (!finite(value)) return;
  const end = dateOnly(periodEnd);
  if (!end || end > asOf) return;
  const code = typeof currency === "string" && currency.trim() ? currency.trim().toUpperCase() : null;
  const filed = dateOnly(filedAt);
  if (!filed || filed > asOf) return;
  rows.push({ symbol, metric, periodEnd: end, periodType, value, unit, currency: code, source, sourceRef: typeof sourceRef === "string" ? sourceRef : null, filedAt: filed, status: "clean", basis: typeof basis === "string" ? basis : null });
}

export function researchToValuationInput(research: unknown): ValuationInputSnapshot {
  if (!research || typeof research !== "object") throw new TypeError("A research object is required.");
  const source = research as Record<string, any>;
  const company = source.company && typeof source.company === "object" ? source.company : {};
  const symbol = typeof company.symbol === "string" ? company.symbol.trim().toUpperCase() : typeof source.symbol === "string" ? source.symbol.trim().toUpperCase() : "";
  const quote = source.quote && typeof source.quote === "object" ? source.quote : {};
  const asOf = dateOnly(source.asOf ?? quote.asOf ?? source.retrievedAt);
  if (!SYMBOL.test(symbol) || !asOf) throw new TypeError("A valid symbol and asOf date are required.");
  const rows: ValuationObservation[] = [];
  const financials = source.financials && typeof source.financials === "object" ? source.financials : {};
  const balance = source.balanceSheet && typeof source.balanceSheet === "object" ? source.balanceSheet : {};
  const assetType = typeof company.assetType === "string" ? company.assetType : typeof source.assetType === "string" ? source.assetType : "stock";
  const quoteCurrency = quote.currency ?? company.currency ?? source.currency ?? null;
  const observedDay = dateOnly(quote.asOf ?? quote.observedAt);
  if (observedDay) addObservation(rows, symbol, "price", quote.price, observedDay, asOf, quoteCurrency, "instant", "quote", observedDay, null, "price");
  if (assetType.toLowerCase() !== "crypto") {
    const facts = Array.isArray(source.facts) ? source.facts : [];
    for (const fact of facts) {
      if (!fact || typeof fact !== "object") continue;
      const metricMap: Record<string, string> = { operatingCashFlow: "ocf", capex: "capex", shares: "sharesDiluted", weightedShares: "sharesDiluted", revenue: "revenue", cash: "cash", debt: "debt", operatingIncome: "ebit", ebitda: "ebitda", interestExpense: "interestExpense", depreciation: "depreciation", equity: "bookEquity", affo: "affo", nav: "nav" };
      const metric = metricMap[fact.metric] ?? null;
      if (!metric) continue;
      const scope = fact.scope === "quarterly" ? "Q" : fact.scope === "annual" ? "FY" : fact.scope === "instant" ? "instant" : null;
      if (!scope) continue;
      addObservation(rows, symbol, metric, fact.value, fact.end, asOf, fact.currency, scope, "reported", fact.filed, fact.id ?? fact.accession ?? null, fact.unit ?? "reported", fact.basis ?? null);
    }
    addObservation(rows, symbol, "revenue", financials.revenue, financials.revenuePeriodEnd ?? financials.periodEnd, asOf, financials.currency ?? quoteCurrency, financials.periodType === "FY" ? "FY" : "Q");
    addObservation(rows, symbol, "ocf", financials.ocf ?? financials.operatingCashFlow, financials.ocfPeriodEnd ?? financials.periodEnd, asOf, financials.currency ?? quoteCurrency, financials.periodType === "FY" ? "FY" : "Q");
    addObservation(rows, symbol, "capex", financials.capex ?? financials.capitalExpenditure, financials.capexPeriodEnd ?? financials.periodEnd, asOf, financials.currency ?? quoteCurrency, financials.periodType === "FY" ? "FY" : "Q");
    addObservation(rows, symbol, "sharesDiluted", financials.sharesDiluted ?? balance.sharesDiluted, financials.sharesPeriodEnd ?? financials.periodEnd ?? observedDay, asOf, "shares");
    addObservation(rows, symbol, "marketCap", quote.marketCap ?? financials.marketCap, observedDay, asOf, quoteCurrency);
    addObservation(rows, symbol, "cash", balance.cash ?? financials.cash, balance.periodEnd ?? financials.periodEnd ?? observedDay, asOf, balance.currency ?? financials.currency ?? quoteCurrency);
    addObservation(rows, symbol, "debt", balance.debt ?? financials.debt, balance.periodEnd ?? financials.periodEnd ?? observedDay, asOf, balance.currency ?? financials.currency ?? quoteCurrency);
  }
  const pace = source.pace && typeof source.pace === "object" ? source.pace.confirmed : null;
  const metadata: ValuationInputSnapshot["metadata"] = {
    assetType,
    sector: typeof company.sector === "string" ? company.sector : typeof source.sector === "string" ? source.sector : null,
    industry: typeof company.industry === "string" ? company.industry : typeof source.industry === "string" ? source.industry : null,
    paceConfirmed: typeof pace === "string" ? pace : null,
  };
  return { symbol, asOf, observations: rows, corporateActions: [], metadata };
}

