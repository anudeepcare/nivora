// US month-end schedule only. Exceptional closures are not inferred: missing expected closes withhold a signal.
// Published holiday reference: https://www.nyse.com/trade/hours-calendars
export function monthEndSession(
  month: string,
  market: "us-equity" | "crypto" = "us-equity",
): string {
  const year = Number(month.slice(0, 4)),
    m = Number(month.slice(5));
  const end = new Date(Date.UTC(year, m, 0));
  if (market === "crypto") return end.toISOString().slice(0, 10);
  // Gregorian Easter determines Good Friday, the movable holiday that can end March.
  const a = year % 19,
    b = Math.floor(year / 100),
    c = year % 100,
    d = Math.floor(b / 4),
    e = b % 4,
    f = Math.floor((b + 8) / 25),
    g = Math.floor((b - f + 1) / 3),
    h = (19 * a + b - d - g + 15) % 30,
    i = Math.floor(c / 4),
    k = c % 4,
    l = (32 + 2 * e + 2 * i - h - k) % 7,
    n = Math.floor((a + 11 * h + 22 * l) / 451);
  const easterMonth = Math.floor((h + l - 7 * n + 114) / 31),
    easterDay = ((h + l - 7 * n + 114) % 31) + 1;
  const goodFriday = new Date(Date.UTC(year, easterMonth - 1, easterDay - 2))
    .toISOString()
    .slice(0, 10);
  while (
    end.getUTCDay() === 0 ||
    end.getUTCDay() === 6 ||
    end.toISOString().slice(0, 10) === goodFriday ||
    (end.getUTCMonth() === 4 && end.getUTCDay() === 1 && end.getUTCDate() >= 25)
  )
    end.setUTCDate(end.getUTCDate() - 1);
  return end.toISOString().slice(0, 10);
}
