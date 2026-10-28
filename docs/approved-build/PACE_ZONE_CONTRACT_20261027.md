# AURYN Pace zones — 27 October 2026

This release corrects v5's overbroad business-to-Buy conversion. A supported business at confirmed P1 is Watch for new purchases and Hold for existing positions. P2 starts/adds small, P3 buys/adds gradually, and P4 supports deeper planned accumulation within cash and position limits. P0 pauses purchases. Business risks and incomplete assessments still take precedence. Forming readings cannot replace the completed monthly reading.

P levels describe zones, not automatic purchase multipliers. Shared guidance reaches Research, holdings, Home and tools; public education and help use the same definitions. Confirmed Pace is also visible next to the primary action on mobile. Raw monthly-v5 price thresholds were not retuned. The standalone valuation-entry route remains explicitly separate when monthly history is unavailable.

Home excludes reported earnings from upcoming counts and its upcoming hero, renders recent reported results separately, and handles multiple companies and zero/negative actuals. Duplicate calendar rows cannot replace a known actual with a blank. The Home portfolio/Pace panel names the decision once, considers only permitted accumulation cases from research loaded in the session, and labels watchlist counts accurately. Unloaded sparklines no longer produce an empty 'History not loaded' message or extra research-request fan-out.

The Price & Pace drawer removes stacked header/section margins, uses compact cards and restrained colors per zone, and keeps close/help controls accessible. This refines the approved composition rather than replacing the design.

## What validation establishes

The incorrect fixture used `row.date` on candles whose date field is `time`, generating a flat series. It now independently asserts three price levels, confirmed P2 and forming P4. Added tests reproduce P1's incorrect Buy, distinct zone labels, risk overrides, same-day earnings separation, duplicate reported results and explicit research cash budgets. Existing numerical, data-integrity, search, navigation, settlement, metric, corporate-action and API checks remain required.

Passing software checks establish the specified behavior, not profitability or universal live coverage. No production deployment, account mutation or trade is part of this release. Local authentication layout checks do not certify live identity-provider configuration.

## Historical research: material negative evidence

`verification/pace-zone-history-20261027.json` records 32 runs: eight selected securities × two fixed example budget schedules × 10/50 basis points. Inputs are retained under `verification/pace-zone-history-inputs/` with hashes. Rerun with:

```
node --experimental-strip-types scripts/evaluate-zone-history.mjs verification/pace-zone-history-inputs
```

The selected securities are SPY, AAPL, NVDA, INTC, PYPL, PFE, F and ARKK. At 10 bps, both example schedules beat ordinary DCA in 2 of 8 securities and trailed in 6. Mean ending-value differences were −32.22% for the conservative schedule and −27.92% for the regular schedule. These are relative terminal account-value differences, not annualized returns. Cash retained through P1 is a material opportunity cost.

Each account receives equal monthly deposits; spending is capped by available cash; execution follows the prior confirmed signal. Monthly drawdown adjusts for deposits. Future prices cannot alter the evaluated prefix. Final incomplete months are excluded rather than filled. Example schedules were fixed before viewing results and were not selected for good performance.

This is price-zone research, **not a full AURYN strategy backtest**. It excludes historical point-in-time business eligibility, risk overrides, valuation, dividends, cash yield and taxes. The selected surviving universe is not independent or representative. Price adjustment conventions were not independently audited. Monthly drawdown omits intramonth losses. Later chronological windows are descriptive, not an independent holdout. These results do not establish a profitable investment edge; no return or accuracy claim was added to the product.

The older in-app contribution-multiplier simulation is labeled legacy and explicitly distinguished from current P1 Watch/Hold guidance. Its apparent success cannot be used to validate the new decision contract.

## Further evidence required before performance claims

Freeze a decision-policy version and prospective evaluation plan. Use a point-in-time universe including delisted securities, contemporaneous filings and release timestamps, adjusted total returns, realistic executable prices, costs, cash yield and portfolio limits. Compare against equal-budget DCA and passive benchmarks across complete market regimes. Track turnover, time invested, drawdowns, return differences and uncertainty; register all tested variants to avoid selecting winners after repeated trials. Run prospective shadow decisions before asserting superiority. Adding correlated RSI/MACD/trend votes is not a substitute for this evidence.

## Final independent review

A fresh reviewer checked the change against the zone contract. No Critical issues were identified. Two Important findings and one public-example inconsistency were corrected with failing-then-passing regressions: Home now admits only confirmed P2–P4 accumulation opportunities, Strategy Lab labels the P1-spending simulation as legacy, and the public P2 example says Buy small. The public-example finding was treated as Important because it contradicted the product’s core meaning. No minor findings remain deferred.

Review scope decisions: numeric thresholds remain frozen and unproven; cash amounts are user-budget choices; legacy simulations stay only with explicit exclusions; unreachable older components require copy review if reactivated. Input hashes establish reproducibility rather than independent corporate-action accuracy. Author browser checks cover the recorded responsive flows, not physical devices or live auth/provider acceptance. The reviewer independently ran the nine focused tests; full-suite/build/API execution evidence is the author’s.

Browser proof images use a temporary, explicitly illustrative price-series fixture with confirmed P2 and forming P4, restored before packaging. They demonstrate interface behavior, not real Microsoft prices or investment advice. Research/Home were checked at narrow mobile widths, public Pace and sign-in at 430px, and public home/Research at 1280px. Interval selection, nested Pace help, drawer closing and overflow measurements were checked.

Final verification: 830/830 automated tests passed, TypeScript passed, optimized Next.js production build passed, and all nine API test scripts passed after the review fixes. Controlled API transports verify integration behavior; they do not establish universal live-provider coverage or live account/payment acceptance. Temporary visual QA files, preview environment and modified demo prices were removed/restored; production frame protection is unchanged. No deployment occurred.
