const record = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
const nonnegative = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null;
const date = (v: unknown) =>
  typeof v === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  Number.isFinite(Date.parse(v)) &&
  new Date(v).toISOString().slice(0, 10) === v
    ? v
    : null;
export function optionsPositioning(value: unknown) {
  const d = record(value),
    latest = Object.keys(record(d.latest)).length ? record(d.latest) : d;
  const iv = nonnegative(latest.atmIv),
    move = nonnegative(latest.expectedMove1d);
  const call = nonnegative(latest.callVol),
    put = nonnegative(latest.putVol);
  const total = call != null && put != null ? call + put : null;
  const input = Array.isArray(d.unusual) ? d.unusual : [];
  const counts = new Map<string, number>();
  for (const value of input) {
    const r = record(value);
    if (typeof r.contract === "string")
      counts.set(r.contract, (counts.get(r.contract) ?? 0) + 1);
  }
  const contracts = input
    .flatMap((value) => {
      const r = record(value),
        expiry = date(r.expiry),
        strike = nonnegative(r.strike);
      const type = typeof r.type === "string" ? r.type.toLowerCase() : "";
      if (
        typeof r.contract !== "string" ||
        !r.contract.trim() ||
        counts.get(r.contract) !== 1 ||
        !expiry ||
        !strike ||
        !["call", "put", "c", "p"].includes(type)
      )
        return [];
      return [
        {
          contract: r.contract,
          expiry,
          strike,
          type: type === "c" || type === "call" ? "Call" : "Put",
          volume: nonnegative(r.volume),
          oi: nonnegative(r.oi),
        },
      ];
    })
    .sort(
      (a, b) =>
        a.expiry.localeCompare(b.expiry) ||
        a.strike - b.strike ||
        a.type.localeCompare(b.type),
    );
  const wallInput = record(d.oiWalls),
    expiry = date(wallInput.expiry);
  const wallRows = expiry
    ? (["callWalls", "putWalls"] as const)
        .flatMap((key) =>
          (Array.isArray(wallInput[key]) ? (wallInput[key] as unknown[]) : [])
            .slice(0, 50)
            .flatMap((value) => {
              const row = record(value),
                strike = nonnegative(row.strike),
                oi = nonnegative(row.oi);
              return strike != null &&
                strike > 0 &&
                oi != null &&
                Number.isInteger(oi)
                ? [{ strike, oi, side: key === "callWalls" ? "Call" : "Put" }]
                : [];
            }),
        )
        .sort((a, b) => a.strike - b.strike || a.side.localeCompare(b.side))
    : [];
  const printCount = nonnegative(d.largePrintCount);
  const printPercentile = nonnegative(d.largestPrintPctl);
  return {
    prints: {
      count:
        printCount !== null && Number.isSafeInteger(printCount)
          ? printCount
          : null,
      percentile:
        printPercentile !== null && printPercentile <= 100 && printCount !== 0
          ? printPercentile
          : null,
    },
    walls: {
      expiry,
      rows: wallRows,
      maxPain: expiry ? nonnegative(wallInput.maxPain) : null,
    },
    asOf: date(typeof d.asOf === "string" ? d.asOf.slice(0, 10) : null),
    metrics: {
      atmIv: iv == null ? null : iv * 100,
      pcVol: nonnegative(latest.pcVol),
      pcOi: nonnegative(latest.pcOi),
      expectedMove: move == null ? null : move * 100,
    },
    call,
    put,
    callShare:
      total != null && Number.isFinite(total) && total > 0
        ? call! / total
        : null,
    contracts,
    omitted: input.length - contracts.length,
  };
}
