/** Measured on 10 November 2026 with scripts/market-study.mjs: 1,305 US-listed stocks
 * (S&P 500 members, the owner's holdings and about 900 randomly drawn Nasdaq common stocks),
 * ten years of split- and dividend-adjusted daily closes from a public source.
 * Limits: only companies listed today are included (survivorship), the business-check test covers
 * 2022 to 2025 only, and the monthly Pace history is the rule-based policy that preceded the
 * current classifier. An earlier split by today's S&P 500 membership was discarded as hindsight-biased.
 * Evidence, not a promise. */
export const MARKET_STUDY = {
  date: "2026-11-10",
  stocks: 1305,
  paceMonths: 121115,
  /** Share of past ranges that contained the outcome; a 10th-90th range is designed for 80%. */
  rangeHeld: {
    empirical: { 20: 73.6, 63: 70.8, 252: 58.9 },
    /** After the fitted widening, measured on the half of the stocks not used to fit it. */
    riskAdjusted: { 20: 80.2, 63: 79.7, 252: 80.4 },
  },
  /** Twelve months after each monthly Pace level, split by a business check that used only the
   * latest annual report at least 90 days old on the signal date (34,297 stock-months, signals
   * March 2022 to October 2025). Pass: operating profit, positive free cash flow, share count up
   * 10% or less, revenue not down more than 5%. Fail: operating loss and negative free cash flow.
   * This proxy is not the app's full decision engine. */
  pace12m: {
    months: 34297,
    pass: {
      median: [12.5, 9.6, 6.4, 3.8, -5.0],
      win: [60.5, 63.1, 56.2, 53.0, 46.2],
    },
    fail: {
      median: [-25.1, -11.9, -26.1, -31.8, -23.9],
      win: [32.4, 42.3, 37.1, 34.2, 38.2],
    },
  },
} as const;
