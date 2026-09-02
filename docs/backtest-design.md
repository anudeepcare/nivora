# NIVORA Backtest Harness — Design Notes

## What this adds
- `lib/nivora-technical-engine.ts` — the technical scoring math extracted out of
  `app/api/analyze/[symbol]/route.ts` into a pure function, so live and backtest share one
  code path. **Action for you:** update the live route to import and call this instead of
  keeping the duplicate logic inline, or the two will drift the first time either is edited.
- `lib/nivora-quant-v2.ts` — Wilder-smoothed RSI/ATR, matching TradingView/broker platforms.
  Not wired in by default (see file header for the deliberate migration steps).
- `lib/nivora-backtest-fundamentals.ts` — point-in-time SEC fundamentals, filtered by actual
  `filed` date, not fiscal period end.
- `lib/nivora-backtest-replay.ts` — runs your real `buildInvestorDecision` against
  point-in-time inputs and measures forward alpha vs benchmark.
- `lib/nivora-backtest-report.ts` — aggregation using your existing `summarizeCalibration`,
  plus cost adjustment, walk-forward date splitting, and a random-baseline comparison.
- `scripts/run_backtest.mjs` — CLI orchestrator.

## The rules (read before running anything)

1. **Point-in-time or it's not a backtest.** Every input to a decision at date X must have
   been publicly knowable on or before date X. This harness enforces it for price bars (index
   truncation) and SEC fundamentals (`filed` date filter). It does **not** yet enforce it for
   analyst estimates / Street price targets — those are passed as `null` (see
   `nivora-backtest-replay.ts` header). Don't backfill today's analyst data into historical
   dates as a shortcut; that's a direct lookahead leak on exactly the factors your veto logic
   and `forward` score weight most heavily.

2. **Survivorship bias lives in your universe file, not your code.** `universe.json` must
   include companies that were later delisted, acquired, or went bankrupt if they were in your
   target index at the time. A universe built from "S&P 500 constituents today" will make every
   strategy look better than it is.

3. **Pre-register the bar before you look at results.** Suggested starting bar, write it down
   and don't move it after seeing numbers:
   - Thesis-score bucket 70+: out-of-sample hit rate meaningfully above 50%, average alpha > 0,
     and the Wilson 95% CI lower bound > 50% hit rate.
   - Result holds across at least 3 distinct chunks of history that include a drawdown period
     (e.g. 2022) and a strong bull period (e.g. 2023-2024) separately, not just pooled.
   - Result must beat `vsRandomBaseline` from `buildBacktestReport`, not just beat zero.

4. **Walk-forward, one out-of-sample look only.** Use `walkForwardSplit` to hold out the last
   ~40% of your date range. Tune weights only against the in-sample side. Score out-of-sample
   exactly once per `WEIGHTS_VERSION`. If you change weights, that's a new version and needs a
   fresh out-of-sample window — don't reuse a window you've already scored against.

5. **Costs are subtracted before you evaluate, not after.** `applyCosts` runs before
   `buildBacktestReport` in the CLI script for this reason. Adjust `DEFAULT_COST_MODEL` to
   something realistic for the market caps you're testing (small caps need a wider slippage
   assumption than mega caps).

## Known gaps in this scaffold (don't pretend these are solved)

- **No point-in-time analyst/earnings-estimate data.** This is the biggest remaining hole.
  Free APIs (including Finnhub) only expose current recommendation/estimate data, not a
  historical snapshot as of a past date. Either run without it (current default — understates
  live performance) or budget for a vendor with historical IBES/estimize-style data before
  claiming the full engine (not just the fundamentals+technical core) is validated.
- **No point-in-time filing-risk (dilution/S-3) reconstruction** — currently returns `null`,
  meaning the veto logic loses one of its four triggers in backtest mode.
- **No intraday/execution-quality modeling** — replay uses daily close-to-close, which is fine
  for validating the thesis/score logic but won't validate live-fill quality on its own; that's
  still the job of your existing Alpaca paper-trading loop.
- **Crypto and non-US-equity archetypes aren't covered** — SEC XBRL only applies to US filers.

## Suggested sequence
1. Add the new files to `tsconfig.engine.json`'s `include` array, run `npm run test:engine`
   style compile to confirm they type-check against your real `nivora-investor.ts`.
2. Build a real, survivorship-bias-free `universe.json` for one sector first (cheaper to
   validate the pipeline before spending API budget on the full market).
3. Run `run_backtest.mjs` on a short date range (6 months) first, purely to sanity-check the
   pipeline (no lookahead crashes, reasonable-looking scores) before spending on a multi-year run.
4. Once the pipeline is trustworthy, run the full range, apply the pre-registered bar, and only
   then decide whether to route the RSI/ATR fix and any weight changes into production.
