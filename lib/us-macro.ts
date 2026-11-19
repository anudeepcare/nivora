export function normalizeUsGdp(raw: unknown, through: string) {
  if (!Array.isArray(raw) || raw.length > 200)
    throw Error("Annual GDP history is unavailable.");
  const seen = new Set<string>();
  const rows = raw
    .map((item: unknown) => {
      const r = item as Record<string, unknown> | null;
      if (
        !r ||
        r.CountryCode !== "USA" ||
        r.Period !== "Annual" ||
        r.Indicator !== "GDP growth (annual %)" ||
        typeof r.Date !== "string" ||
        !/^\d{4}-12-31$/.test(r.Date) ||
        r.Date > through ||
        !Number.isFinite(Date.parse(r.Date)) ||
        seen.has(r.Date) ||
        !(
          r.Value === null ||
          (typeof r.Value === "number" && Number.isFinite(r.Value))
        )
      )
        throw Error(
          "Annual GDP history has inconsistent identity, periods or units.",
        );
      seen.add(r.Date);
      return { date: r.Date, value: r.Value as number | null };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
  return {
    country: "USA" as const,
    indicator: "gdp_growth_annual" as const,
    unit: "annual %" as const,
    rows: rows.slice(-20),
    omitted: Math.max(0, rows.length - 20),
  };
}
export type UsGdp = ReturnType<typeof normalizeUsGdp> & { checkedAt: string };
