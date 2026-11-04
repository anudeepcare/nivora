# Full Overview and model calculation reuse

## Overview correction

Simple and Pro both retain the full Overview: decision snapshot, key financial metrics, price/scenario context, detailed business lenses and risk thresholds. Key financial numbers precede the chart. Simple keeps calculation checks collapsed; Pro opens the checks and the valuation workbench. Neither mode removes core research content. The existing separate Financials, Value, Technicals, Thesis, Analysts, News and Advanced pages remain available.

## Calculation improvement

The decision lens engine now memoizes its complete result by immutable Research snapshot and research style. Components asking for the same evidence reuse one calculation. A new quote or evidence snapshot recomputes the result, and styles remain separate. Weak references release results when the snapshot is no longer retained. Existing historical-study and financial-period caches remain intact.

`verification/decision-reuse-benchmark.json` records a local fixture microbenchmark, not page loading or physical-device performance. It confirms identical outputs and less repeated calculation. The existing per-snapshot calculation is already small; network, rendering and missing-provider data remain separate performance constraints.

## Model audit boundaries

| Area | Current implementation and boundary |
| --- | --- |
| Input integrity | Currency/share/listing reconciliation gates and dated financial periods; unresolved conflicts withhold scenario estimates |
| Business vs timing | Separate financial lenses and price studies; weak technicals do not establish weak business fundamentals |
| Valuation | Sector suitability gates, conditional earnings/revenue sensitivities and a fading-growth DCF workbench; not universally verified intrinsic value |
| Accumulation | Default monthly-v1 and optional monthly-v2 candidate; confirmed and forming readings remain separate |
| Historical evaluation | Equal-deposit comparator, fees/slippage, chronological later slice and gap-aware drawdowns; selected real-history results are mixed |
| Validation gaps | No market-wide point-in-time/survivorship-controlled outcome study or calibrated buy/sell probabilities has been completed |

No new best-in-class, profit-probability or superiority claim is made. This update changes presentation and calculation reuse, not valuation coefficients or the accumulation rules. It does not add speculative complexity or replace tested baseline policies.

## Control placement

The depth selector is aligned with the research tab bar on desktop. On narrow screens it appears beside the decision snapshot heading, leaving the horizontal tab strip free for navigation. It is no longer nested under the company name. These are research-content changes; PWA viewport/safe-area rules are untouched.
