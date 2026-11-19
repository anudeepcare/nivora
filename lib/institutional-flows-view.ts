/** Allowlisted 13F share changes, not cash flows or a current-day trading signal. */
export function institutionalFlowsView(input: unknown) {
  const data =
    input && typeof input === "object"
      ? (input as Record<string, unknown>)
      : null;
  if (!data) return null;
  const rows = (v: unknown) =>
    Array.isArray(v)
      ? v.slice(0, 20).map((x) => {
          const r = x as Record<string, unknown>;
          return {
            ticker: r.ticker,
            companyName: r.companyName,
            netSharesChange: r.netSharesChange,
            newPositions: r.newPositions,
            soldOutPositions: r.soldOutPositions,
          };
        })
      : [];
  return {
    reportDate: data.reportDate,
    isPending: data.isPending,
    filerCount: data.filerCount,
    baselineFilerCount: data.baselineFilerCount,
    inflows: rows(data.inflows),
    outflows: rows(data.outflows),
  };
}
