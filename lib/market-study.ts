/** Measured on 10 November 2026 with scripts/market-study.mjs: 1,305 US-listed stocks
 * (S&P 500 members, the owner's holdings and about 900 randomly drawn Nasdaq common stocks),
 * ten years of split- and dividend-adjusted daily closes from a public source.
 * Limits: only companies listed today are included (survivorship), S&P membership is today's
 * list (hindsight), prices only (no historical fundamentals), and the monthly Pace history is the
 * rule-based policy that preceded the current classifier. Evidence, not a promise. */
export const MARKET_STUDY = {
  date: "2026-11-10",
  stocks: 1305,
  paceMonths: 121115,
  /** Share of past ranges that contained the outcome; a 10th-90th range is designed for 80%. */
  rangeHeld: {
    empirical: { 20: 73.6, 63: 70.8, 252: 58.9 },
    riskAdjusted: { 20: 78.5, 63: 77.9, 252: 69.5 },
  },
  /** Median 12-month return and share of positive outcomes after each monthly Pace level. */
  pace12m: {
    established: {
      label: "S&P 500 members",
      median: [17.6, 10.6, 18.2, 31.8, 55.9],
      win: [69.2, 65.6, 70.3, 74.4, 76.5],
    },
    other: {
      label: "other Nasdaq stocks priced $5 or more",
      median: [-15.5, -3.9, -10.1, -24.3, -32.1],
      win: [37.9, 45.8, 42.8, 35.8, 32.3],
    },
  },
} as const;
