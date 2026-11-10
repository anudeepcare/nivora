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

## Twelve months after each monthly Pace level (121,115 stock-months, price only)
| Level | S&P 500 members: median / positive | Other Nasdaq ≥ $5: median / positive |
|---|---|---|
| P0 | +17.6% / 69% | −15.5% / 38% |
| P1 | +10.6% / 66% | −3.9% / 46% |
| P2 | +18.2% / 70% | −10.1% / 43% |
| P3 | +31.8% / 74% | −24.3% / 36% |
| P4 | +55.9% / 77% | −32.1% / 32% |

Reading: deeper Pace zones were followed by better years for established companies and by worse years for the rest. Timing without a business check points the wrong way for weaker companies.

## Limits
- Survivorship: only companies listed today. Hindsight: S&P membership is today's list, which favours past winners; the established-company column is flattered by this.
- Price only. The app's business checks could not be replayed because historical fundamentals were not available.
- The monthly history is the rule-based policy that preceded the current classifier; the classifier itself has no out-of-sample history yet.
- Means are omitted: a few extreme small-cap moves dominate them.
