export type AnalystSnapshot = {
  symbol: string;
  currency: string;
  closeDate: string;
  close: number;
  low: number;
  consensus: number;
  high: number;
  analysts: number;
};
/** Whole-cohort agreement: absent rows remain in the denominator. No model substitution. */
export function compareAnalystSnapshots(
  symbols: string[],
  reference: AnalystSnapshot[],
  actual: AnalystSnapshot[],
) {
  if (new Set(symbols).size !== symbols.length)
    throw Error("Duplicate cohort symbol");
  const index = (rows: AnalystSnapshot[]) => {
    const map = new Map<string, AnalystSnapshot>();
    for (const row of rows) {
      if (map.has(row.symbol))
        throw Error(`Duplicate observation: ${row.symbol}`);
      map.set(row.symbol, row);
    }
    return map;
  };
  const refs = index(reference),
    observed = index(actual);
  const valid = (r: AnalystSnapshot) =>
    r.currency.length === 3 &&
    /^\d{4}-\d{2}-\d{2}$/.test(r.closeDate) &&
    [r.close, r.low, r.consensus, r.high].every(
      (x) => Number.isFinite(x) && x > 0,
    ) &&
    r.low <= r.consensus &&
    r.consensus <= r.high &&
    Number.isInteger(r.analysts) &&
    r.analysts > 0;
  const rows = symbols.map((symbol) => {
    const a = observed.get(symbol),
      b = refs.get(symbol);
    if (!a || !b)
      return {
        symbol,
        status: "missing" as const,
        missingReference: !b,
        missingActual: !a,
        match: false,
      };
    if (!valid(a) || !valid(b))
      return { symbol, status: "invalid" as const, match: false };
    const fields = [
      "currency",
      "closeDate",
      "close",
      "low",
      "consensus",
      "high",
      "analysts",
    ] as const;
    const mismatches = fields.filter((key) => a[key] !== b[key]);
    const percentages = (r: AnalystSnapshot) =>
      [r.low, r.consensus, r.high].map((x) =>
        Math.round((x / r.close - 1) * 100),
      );
    return {
      symbol,
      status: "compared" as const,
      match: !mismatches.length,
      mismatches,
      referencePercentages: percentages(b),
      actualPercentages: percentages(a),
    };
  });
  const matches = rows.filter((r) => r.match).length;
  return {
    requested: symbols.length,
    compared: rows.filter((r) => r.status === "compared").length,
    matches,
    agreement: symbols.length ? matches / symbols.length : null,
    completeExactMatch: symbols.length > 0 && matches === symbols.length,
    rows,
  };
}
