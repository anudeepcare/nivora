# Broad-market study — 10 November 2026

Run with `scripts/market-study.mjs` on ten years of adjusted daily closes for 1,305 US-listed stocks: S&P 500 members, the owner's holdings and watchlist, and about 900 randomly drawn Nasdaq common stocks (68 more had under 300 sessions and were skipped). Prices from Yahoo Finance's public chart endpoint; raw files are not included in the source ZIP.

## Coverage
Scenario cross-check produced a view for 1,305 of 1,305, with 0 unordered or non-positive cases. 243 histories carry a split/bad-tick warning.

## How often ranges held (designed for 80%)
| Range | 1 month | 3 months | 1 year |
|---|---|---|---|
| Raw historical percentiles | 73.6% | 70.8% | 58.9% |
| Volatility-adjusted | 78.5% | 77.9% | 69.5% |
Scored walk-forward, non-overlapping: 138,433 one-month, 42,869 three-month and 8,902 one-year tests.

## Twelve months after each monthly Pace level, by business check (point-in-time)
34,297 stock-months, signals March 2022 to October 2025. The business check used only the latest annual report at least 90 days old on the signal date. Pass: operating profit, positive free cash flow, share count up 10% or less, revenue not down more than 5%. Fail: operating loss and negative free cash flow.

| Level | Check passes: median / positive | Check fails: median / positive |
|---|---|---|
| P0 | +12.5% / 61% | −25.1% / 32% |
| P1 | +9.6% / 63% | −11.9% / 42% |
| P2 | +6.4% / 56% | −26.1% / 37% |
| P3 | +3.8% / 53% | −31.8% / 34% |
| P4 | −5.0% / 46% | −23.9% / 38% |

Reading:
- The business check separated outcomes strongly: about 60% positive years when it passed, about 37% when it failed.
- Deeper Pace zones did not improve outcomes in this period, even for companies passing the check. P1 (no pullback) had the best record; P4 the worst.
- An earlier split by today's S&P 500 membership showed the opposite (deeper zones better). That split is hindsight-biased, because today's members are companies that recovered, and it is discarded.

## Design comparison (same data)
| State on the signal date | Cases | Higher a year later | Beat the typical stock | Median |
|---|---|---|---|---|
| All stocks | 34,291 | 53% | 50% | +3.1% |
| Check passes, above 200-day average | 9,169 | 63% | 61% | +10.0% |
| Check passes, within 5% of one-year high | 4,367 | 66% | 65% | +10.6% |
| Check passes, below 200-day average | 6,042 | 58% | 53% | +7.4% |
| Check passes, 30%+ below one-year high | 2,424 | 53% | 50% | +4.4% |
| Check passes, pullback 20%+ and back above 50-day | 1,346 | 56% | 53% | +6.8% |
| Check fails, above 200-day average | 4,272 | 40% | 39% | −15.2% |
| Check fails, below 200-day average | 7,496 | 37% | 36% | −24.1% |

- Business first: the check is the largest separator and held in each of 2023, 2024 and 2025.
- Trend second: within passing businesses, strength beat weakness. A "recovering pullback" rule did not help.
- Sell side: failing the check is a supported reason to step back. Stretched prices in passing businesses kept rising more often than not, so stretch alone is not a supported reason to sell.

The app now shows each stock the measured record of its own state (`lib/evidence-odds.ts`, table in `lib/evidence-table.ts`).

## Automated page crawl
68 page views (10 pages and 8 research tabs for 3 demo companies, at 1280px and 390px) checked for failed loads, NaN/undefined text, horizontal overflow, duplicate headings and repeated bear/base/bull. Findings: a nested-paragraph markup error on the Labs page (`/research-lab`), and development-only hydration attribute warnings on one demo company. Nothing else. Demo data only.

## Limits
- Survivorship: only companies listed today.
- The business check is a proxy from four years of annual statements, not the app's full decision engine, and covers 2022 to 2025 only: one bear market and a narrow recovery.
- The monthly history is the rule-based policy that preceded the current classifier; the classifier itself has no out-of-sample history yet.
- Means are omitted: a few extreme small-cap moves dominate them.
