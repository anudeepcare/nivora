# Pace and price-time validation — 27 October 2026

## Outcome

The monthly-v5 eligibility defect is repaired. Missing June 2020 no longer suppresses the January 2022 reading when July 2020–December 2021 supplies 18 consecutive completed prior months. Confirmed and forming observations remain separate. No multiplier, extension, spread, or longer-cycle threshold was recalibrated.

Movement now uses a supplied wall clock (default `Date.now()`), ages after reopening and while the page is visible, and selects a recent settled daily close when a live quote expires. The UI is one compact disclosure strip with change, relative volume, and next earnings; dated sources, publisher links, dataset-specific gaps and news retry expand below it.

## Pace mechanics

- The calculation walks backward from each observation through at most 24 consecutive completed months. It stops at a missing month or incomplete month-end observation. Fewer than 12 completed prior months still withholds that reading.
- `historyBasis: standard` requires 24 consecutive prior months. A missing 24th prior month leaves 23 and is explicitly `limited`. Older observations cannot substitute for the missing month in the slow guard.
- Existing limited-history behavior is preserved: the longer-cycle average uses the available 12–23 consecutive prior months, and `priorMonths` reports that count. This is a shorter-history approximation, not a verified 24-month comparison. A 12-month instance supplies no independent longer-window corroboration; this is an existing policy limitation, not a newly calibrated safeguard.
- The missing June 2020 fixture yields confirmed January 2022 at 1× with 18 prior months. Supplying only the post-gap segment yields the identical record. Adding a settled February 14 observation at 60 produces forming February at 4× while confirmed January stays 1×; February is absent from confirmed history.
- The entire `cycleReading` calculation matches the pre-change implementation exactly after normalizing the wording change from “Limited listing history” to “Limited consecutive history”. Its normalized comparison SHA-256 is `f5182bc86f832363f3ba639b2059e3ce9580372c71a07464c6a77d364d0d6337`.

Current policy SHA-256: `e84c1c261b7a04e5a11f96a15f9d5f4e5fb9db5df152160f7e09c237bc8b03e9`.

Unchanged evaluator SHA-256: `fa9c8f47deef1f120efecc9cedb1e48f7792be71107eb40a4bf8725215f0423f`.

## Price and movement semantics

`selectPriceReference(research, now)` in `lib/price-reference.ts` returns the positive price, source as-of date/time, currency and `quote` / `settled-close` basis. It rejects currency conflicts and invalid clocks; the historical path validates complete OHLC, excludes future observations, and rejects conflicting duplicate dates independent of input order. A newer settled source date takes precedence over an older quote still within an overnight freshness allowance. On the same US date, the quote must reach the standard 16:00 New York close to outrank that completed bar; comparison uses the New York clock with daylight saving time, rather than midnight at the start of the daily bar. A genuinely later eligible after-hours quote is retained. Exceptional/early session closes are not encoded in the existing calendar support.

US daily observations (including foreign issuers listed on verified US exchanges) become eligible after 17:00 New York; crypto observations after their UTC day ends. Unknown/non-US stock exchange clocks use a conservative following-UTC-noon cutoff. This is deliberately limited calendar support: it does not claim a verified holiday/exceptional-closure calendar for every exchange. Historical references expire four calendar days after their source date. Daily history is assumed to use the listing currency retained by the provider contract; there is no currency conversion.

A historical fallback retains its YYYY-MM-DD date and is labelled “Settled daily close”; the system does not invent an intraday timestamp. Its change compares the prior **available** settled close, and the expanded context names that earlier date. An expired original quote may remain as explicitly older context when no eligible replacement exists; it never becomes “Today’s move”. Future-dated and invalid prices cannot reappear there. Quote dates/times and the quote's original source remain visible in the expanded context.

Relative volume is the latest settled positive volume divided by the mean of 20 prior positive settled daily volumes. It has its own observation date and becomes unavailable after ten calendar days. Missing or invalid volume observations receive a specific explanation. Company news is limited to eligible HTTPS publisher links from the last seven days; future/invalid dates, unsafe URLs and duplicate URLs are excluded. News coverage is never presented as a verified cause. The next unreported supplied earnings date is selected against the wall clock, with missing calendar coverage distinguished from crypto inapplicability.

In explicitly labelled sample mode, the component uses the frozen retrieval clock consistently with the parent Research view. Production never freezes its clock at retrieval. The production component updates its clock every 30 seconds while visible and on focus, pageshow and visibility changes. Reopening after an hour also refreshes the independent news resource. This is not a live quote subscription; the existing Research data layer remains responsible for fetching new market observations.

## Repeatable synthetic evaluation

Command: `node --experimental-strip-types scripts/validate-pace-integrity.mjs`.

Machine-readable result: `verification/pace-integrity-20261027.json`. Inputs are five deterministic **synthetic** price paths with 84 completed calendar months, two observations per month, and an as-of clock of February 2, 2026. Each eligible run executes 71 months and deposits 7,100 model units in both strategies. These verify accounting and temporal behavior, not historical market returns.

At 10 bps per purchase:

| Synthetic path | Fixed ending assets | Pace ending assets | Difference | Pace ending cash |
| --- | ---: | ---: | ---: | ---: |
| Flat | 7,092.900000 | 7,092.900000 | 0.000000% | 0 |
| Steady growth | 19,072.530084 | 19,072.530084 | 0.000000% | 0 |
| Persistent decline | 1,245.397172 | 1,245.397172 | 0.000000% | 0 |
| Crash and recovery | 15,571.233030 | 13,967.220202 | −10.301129% | 700 |
| Extension and reversal | 7,037.986410 | 7,440.930975 | +5.725282% | 0 |

Both 10 bps and 50 bps runs assert equal contributions, nonnegative cash, execution strictly after each signal, and unchanged results after adding a future bar. Flat and persistently declining paths assert exact equality with fixed DCA. The latter confirms that larger multipliers cannot increase invested cash without reserves accumulated during previous pauses. The synthetic cases deliberately include both adverse and favorable outcomes; no thresholds were changed after inspecting them. Full-precision assets, monthly drawdowns, signal counts and the 50 bps stress results are in the JSON.

## Stored empirical evidence, separately identified

The validation script recomputes these summaries from existing per-security result rows, and verifies the 10 bps arithmetic against each stored summary. It does **not** rerun those securities from raw market data: the original OHLC inputs are not committed. Both studies used the older policy SHA-256 `ee0bcac791dba4ca9979ddaf8ab43f2b00c1b5822e963cc319201437cef81c7f`; that hash no longer matches the repaired implementation. The evaluator hash still matches. These results therefore must not be advertised as a fresh evaluation of the repaired policy.

| Stored study | Purchase cost | Eligible | Wins / losses / ties | Mean terminal-asset difference | Lower monthly drawdown |
| --- | ---: | ---: | --- | ---: | ---: |
| `dca-backtest-30.json` | 10 bps | 28 / 30 | 3 / 15 / 10 | −2.303805695866351% | 9 |
| `dca-backtest-30.json` | 50 bps | 28 / 30 | 3 / 15 / 10 | −2.3010136199744116% | 9 |
| `dca-frozen-validation.json` | 10 bps | 8 / 8 | 1 / 2 / 5 | +0.04383026186908362% | 2 |
| `dca-frozen-validation.json` | 50 bps | 8 / 8 | 1 / 2 / 5 | +0.046082817923696895% | 2 |

These are means of per-security terminal-asset differences, not annualized returns, portfolio returns, win probabilities or an accuracy score. The first study's later restarted chronological slice averaged −0.36421645670331265%; it is not an independent out-of-sample dataset.

Empirical limitations remain: selected surviving securities, partial calibration overlap, omitted dividends/cash interest/taxes, unverified corporate-action adjustment provenance, only monthly marked drawdowns, no delisted-security universe, no independent prospective evaluation, and no historical executable competitor comparison. The available evidence does not establish outperformance. A new performance claim needs the frozen repaired implementation evaluated against retained point-in-time inputs and a broader independently selected universe.

## Verification

- Regression-first run reproduced the three Pace availability defects and wall-clock/news/fallback defects before production edits. The initial price selector tests also failed before the helper existed; logs are in `verification/pace-integrity-red-20261027.log`.
- Focused command: `node --experimental-strip-types --test tests/accumulation*.test.mjs tests/movement-context*.test.mjs tests/price-reference.test.mjs tests/advanced-research.test.mjs tests/quote-health.test.mjs` — **70 passed, 0 failed**; `verification/pace-integrity-focused-20261027.log`.
- Additional regression-first checks verified future/invalid movement clocks and newer historical closes taking precedence over older overnight quotes.
- Synthetic/report script — passed all assertions; `verification/pace-integrity-evaluation-20261027.log` and JSON.
- `./node_modules/.bin/tsc --noEmit --incremental false` — passed, exit 0.
- `git diff --check` on the modified tracked task files — passed.
- No full build or live provider experiment was run by this task. Integrated full-suite/build and browser/device checks belong to the release verification, including mobile strip dimensions, disclosure interaction and reopening behavior. Exact live prices, corporate actions, publisher service uptime, and global exchange calendars remain independently unverified.

## Integrated review corrections

The review reproduced a same-date reference bug: a 90 quote from October 26 at 17:00 UTC (13:00 New York) incorrectly outranked that date's completed 110 close at an October 27 01:00 UTC wall clock. Regression-first tests now verify the 110 settled reference, retention of later after-hours quotes, and the winter EST boundary. The review also caught sample-mode clock inconsistency and prominent empty strip cells. Rendered-component tests now verify a frozen clock only in explicit demo mode, continued production expiry, omission of missing compact volume/earnings cells, and retention of their exact source status in the disclosure. When neither optional observation exists, the strip offers “News & context” rather than prominent empty metrics. Four review regressions failed before the fix; see `verification/pace-review-red-20261027.log`. The final focused suite contains 70 passing tests.

## Weekly WMA review correction

The Price & Pace browser review showed missing 50-week and 200-week WMAs despite 1,306 daily sample observations. `technicalContext` first selected the last weekday bar, then rejected a Friday-holiday week even when the expected Thursday close existed. The explicitly synthetic weekday sample includes holiday dates, exposing this ordering defect. Weekly WMA construction now selects the expected closing-session observation directly; spurious Friday-holiday rows cannot overwrite it. Missing a genuinely required close still withholds the affected consecutive-window WMA.

The exact MSFT fixture now produces **50-week WMA 409.9103649924092** and **200-week WMA 371.60682363889794**, both through **2026-10-16**. No prices or history were fabricated or filled, and no threshold changed. The regression was observed failing before the helper edit. `tests/technical-context.test.mjs`, `tests/research-depth-design.test.mjs` and `tests/ui-controls.test.mjs` then passed **66/66**, including the actual rendered dashboard tests; logs: `verification/weekly-wma-red-20261027.log` and `verification/weekly-wma-focused-20261027.log`. This correction does not expand the exchange calendar beyond its documented standard Friday closures.

Final combined Task 3/review command (all Pace, movement, reference, quote-health, advanced, technical-context, research-depth-design and UI-control suites): **136 passed, 0 failed**. See `verification/pace-review-final-20261027.log`. A fresh `tsc --noEmit --incremental false` also exited 0 after these review corrections. No build was run by this task.
