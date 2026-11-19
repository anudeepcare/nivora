/** Display-only slicing of already validated account equity. Never backfill observations. */
export function accountHistoryWindow(dates: string[], period: string) {
  const valid = dates
    .filter(
      (d) =>
        /^\d{4}-\d{2}-\d{2}$/.test(d) &&
        Number.isFinite(Date.parse(d)) &&
        new Date(d).toISOString().slice(0, 10) === d,
    )
    .sort();
  const end = valid.at(-1) ?? null;
  let cutoff = -Infinity;
  const months = (
    { "1M": 1, "3M": 3, "6M": 6, "1Y": 12, "2Y": 24 } as Record<string, number>
  )[period];
  if (end) {
    const time = Date.parse(end);
    if (months) {
      const d = new Date(time),
        target = new Date(
          Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - months, 1),
        );
      const lastDay = new Date(
        Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
      ).getUTCDate();
      target.setUTCDate(Math.min(d.getUTCDate(), lastDay));
      cutoff = target.getTime();
    } else if (period === "YTD")
      cutoff = Date.parse(end.slice(0, 4) + "-01-01");
  }
  const actual = valid.filter((d) => Date.parse(d) >= cutoff);
  return {
    cutoff,
    requestedStart: Number.isFinite(cutoff)
      ? new Date(cutoff).toISOString().slice(0, 10)
      : null,
    actualStart: actual[0] ?? null,
    actualEnd: actual.at(-1) ?? null,
    shortHistory:
      !!end && Number.isFinite(cutoff) && Date.parse(valid[0]) > cutoff,
  };
}
