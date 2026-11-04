# Evidence-led research build — 19 October 2026

## What changed
- `/` is now the public product storefront; `/sample` is an interactive fictional walkthrough with no market-data requests. Signed-in root visitors are handed to `/overview`. `/login?mode=signup` opens registration. Private workspace routes retain authentication, and the old localhost-only preview remains restricted.
- The stock Overview shows business, conditional value, original monthly contribution condition and a priority risk. Supporting/counter evidence, observation dates, model suitability and listing reconciliation are one level deeper. The repeated compact accumulation card has been removed. Held instruments get a compact position-aware strip; its denominator is priced listed assets, not net equity or managed assets.
- Technicals includes a monthly candle view, eligible-zone legend, settled-close touch information, original-v1/candidate-v2 selection, explicit candidate bands and an opt-in historical comparison. No amount-entry workflow is required.
- Missing evidence no longer crashes shared ownership/profile/earnings analysis. Original production signals, portfolio pricing, margin accounting, refresh preferences and PWA geometry are preserved.

## Models and validation
Original monthly-v1 remains the default. `monthly-v2-candidate` is a fixed, transparent experiment: 36 consecutive month-end closes, robust Theil–Sen log-price trend, median-centred residuals and MAD scale with a 3% floor. 2×/3×/4× need both pullback and robust-deviation conditions; a pause and a trim review have separate definitions. Methodology and all thresholds are published in the source and in-app help. Corporate business quality and valuation are separate from this price-only policy.

The comparator deposits the same 100 model units each eligible month in normal DCA, original and candidate accounts. Cash carries forward without interest and caps spending; no borrowing, leverage or automatic sales. Signals precede next-month first observed opens. Flow-adjusted month-end NAV marks existing units at the opening price before the new deposit, so opening losses are not diluted by new money. Costs are configurable from 0 to 200bps. The last chronological 30% is reported separately with accounts restarted at zero; rules are not optimized on either segment.

The small observed-data check uses MCD, MSFT, APP, IREN and ETH/USD daily histories supplied through the connected Twelve Data tool. Requested endpoint: 2026-10-16; actual observation dates are recorded individually. Candidate finished above normal DCA on IREN/ETH, below on APP, and matched on MSFT/MCD over the eligible periods and stated budget assumptions. This selected sample does not establish an edge. Raw vendor histories are not redistributed in the source archive. See `verification/policy-observed-summary.json`; reproduce with licensed local histories via `scripts/evaluate-policy-data.mjs`.

## Deliberate limits
No new specialist intrinsic-value models, autonomous orders, commercial billing or point-in-time fundamental backtests are claimed. Existing sector/model guards withhold unsupported values. Analyst consensus is not relabelled as modelled fair value. The public sample is fictional, and no marketing win-rate is inferred from synthetic tests or selected examples.

The focus review found opening-gap NAV dilution and unavailable candles styled as 1×. Both were corrected; regression coverage pins opening-gap accounting and a distinct unavailable legend. Browser rendering and a physical iPhone PWA were not available for final visual confirmation. Production provider entitlements, live service deployment and the full commercial product remain separate verification work.
