/** -1 = selected expiry, 0 = all loaded dates; positive values are calendar months from today. */
export function exposureDates(
  dates: string[],
  months: number,
  expiry?: string,
  now = Date.now(),
) {
  const start = new Date(now);
  const today = start.toISOString().slice(0, 10);
  if (months === -1)
    return expiry ? [expiry] : [...new Set(dates)].sort().slice(0, 1);
  const end = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + months + 1, 0),
  );
  end.setUTCDate(Math.min(start.getUTCDate(), end.getUTCDate()));
  const until = end.toISOString().slice(0, 10);
  return [...new Set(dates)]
    .sort()
    .filter((date) => date >= today && (months === 0 || date <= until));
}
