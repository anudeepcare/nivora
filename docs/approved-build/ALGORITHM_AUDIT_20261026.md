# AURYN algorithm audit — 26 October 2026

## Conclusion

AURYN has useful research calculations and data safeguards, but the available evidence does not establish a top-tier stock-selection or accumulation algorithm. Passing software tests verifies specified behavior; it does not verify the current provider data, establish fair value, or prove superior investment returns.

This review examined the supplied HIMS, FPS, META, AMZN, NBIS and IREN screenshots, the active research/valuation/Pace source, existing test suites, and stored historical evaluations. It reproduced several defects with controlled inputs. It did not independently retrieve and reconcile the exact live financial responses behind the screenshots. The findings below distinguish confirmed software behavior from unverified causes in those particular stocks.

This delivery adds a compact movement-context section only. It does not recalibrate or repair the investment algorithms described below. No production deployment, trades, database changes, or credentials were involved.

## What the confusing headings mean

| Current heading | Actual trigger | Better presentation |
| --- | --- | --- |
| Start with the latest dated close. | The quote fails freshness requirements and does not qualify as a matching settled close. | Price update needed; show the actual price date, why it was rejected, and a refresh action. Keep verified historical evidence visible. |
| A strong case needs the right price. | The earnings-sensitivity result fails the entry thresholds. This heading does not itself prove the business is strong. | Show the modeled upside, downside, horizon, and exact failed rule. |
| Test the price assumptions. | A usable earnings scenario was not established, or another entry gate is unmet. | Name the missing or unsuitable input. Distinguish incomplete valuation from an unfavorable valuation. |
| Reconcile the financial evidence. | Provider market cap differs by more than 10% from shares multiplied by the current quote. | Price/share data check, with affected fields and dates. Do not erase unrelated operating evidence or imply business deterioration. |
| Hold. Be selective adding. | An existing position plus strong operating signals, with valuation or entry limitations. | Explicitly label ownership context and the condition limiting additions. |

Source: `lib/approved-research.ts`, `lib/auryn-edge.ts`, `lib/edge-research.ts`.

The HIMS screenshot shows a 27.71 chart close and a 27.63 quote marked older. The code's fallback does not independently pick the newest settled historical close: it requires the quote itself to match a historical close and have a close-labelled session. That explains how a populated chart can coexist with a paused entry reading; the exact provider freshness failure remains unverified.

## Confirmed weaknesses and defects

### 1. A price-date mismatch can suppress good financial evidence — high priority

`lib/research-brief.ts:49` compares provider market cap with current price × outstanding shares, without matching their observation dates. Normalization retains a general update date, not field-specific dates, and this check does not use even that date.

Reproduction: market cap 10,000 and 100 shares at an older price of 100; current price becomes 120. The code reports conflicting financial evidence. This can be a legitimate price move rather than inconsistent statements. `approved-research.ts` then suppresses cash-flow, revenue-growth and margin factors whenever that flag is true. META/FPS/NBIS screenshots show this branch; the exact underlying mismatch for each ticker is not established by screenshots alone.

Corrective direction: align dates, share classes, units, splits and currency; limit an unresolved issue to the calculations that actually depend on it. Retain unrelated reported financial metrics. Missing or inconsistent source evidence belongs in a data-status message, separate from investment pros and cons.

### 2. The valuation entry rule ignores time horizon — high priority

`lib/edge-research.ts` calls value supported when base-case total upside is at least 15% and bear-case loss is no worse than 40%, with extra rejection rules when base upside exceeds 100% or the bear target exceeds today's price. It does not use the forecast horizon in that classification.

Verified with identical price 100, forward P/E 20, EPS range 5/6/7: targets are 80/120/168. Both a one-year and a three-year forecast are classified supported, although 20% total upside is approximately 20% annualized versus 6.3% annualized. The rule is a heuristic, not a calibrated expected-return test.

`lib/outlook.ts` constructs earnings targets from provider EPS estimates and 0.8×/1×/1.2× the reported forward P/E. This is explicitly a sensitivity, not an independent intrinsic valuation. Its base multiple is anchored to market pricing. Future funding, growth investment, and a complete operating model are absent. Revenue sensitivities use assumed 20%/10%/0% dilution, and are excluded from the main eligible earnings valuation gate.

Corrective direction: use dated, sector-appropriate funded bear/base/bull cases; show annualized return, dilution, net debt, capital requirements and the effect of changing margins or exit multiples. Keep independent valuation, market-implied expectations and analyst targets separate. Avoid assigning calibrated probabilities without evidence.

### 3. Business classification and risk overrides are too coarse

The headline calls a business strong if FCF and operating margin are positive and revenue growth is nonnegative. The richer research module has more metrics, but these three signs control that classification. They do not establish durability, attractive returns on capital, competitive advantage, or good per-share economics.

Interest coverage below 2× is the severe-risk flag used by the decision module and can override positive entry evidence. It is a useful warning, but requires liquidity, debt maturity, noncash charges, committed financing and business-stage context. Negative FCF during expansion is different from operating cash burn, even though both can require funding.

IREN's displayed −148.1% operating margin is mathematically possible; a margin below −100% is not itself an arithmetic bug. The committed IREN fixture lacks operating-income facts and cannot verify that screenshot. Its exact revenue and operating-income periods, units, sources and one-off charges must be reconciled before calling the number accurate or inaccurate.

### 4. Reordering financial facts can change the selected annual metrics

Annual groups are keyed by exact start/end/currency/basis, sorted by end, then the final group is selected. Equal-end groups with different starts have no deterministic preference for the complete comparable period. A controlled reproduction changed the selected operating margin from missing to 20% by reordering identical facts.

Relevant source: `lib/engine.ts:157,248`, `lib/analysis.ts:11`. Select comparable complete periods deterministically and retain provenance.

### 5. Multiple complete currency series can erase TTM results

`lib/research-depth.ts:81` takes adjacent four-quarter windows globally before checking matching currency/basis. Four USD quarters yield revenue 400 in a reproduction; adding four valid EUR quarters removes all TTM windows. Construct windows within each comparable series first. Actual occurrence for the screenshot tickers has not been established.

### 6. SEC fallback does not independently corroborate incomplete EOD facts

`lib/providers.ts:511` accepts any nonempty EOD fact collection. A single financial metric can bypass SEC. This is a coverage/verification limitation, not proof that every provider value is wrong. Completeness, age and consistency should determine fallback or corroboration, without blending mismatched periods or accounting bases.

### 7. Displayed reason counts are not the decision algorithm

The visual scale adds fixed qualitative weights to FCF, growth, margin, Pace, value and flags. The actual verdict uses separate gating rules. Missing valuation can prevent buying without appearing as a wait factor; a data conflict can hide positive operating factors and add a generic risk factor. This explains why a visually favorable scale can accompany Hold/Wait. Generate the verdict and its explanation from the same decision record, and identify missing evidence separately.

## What the Pace evidence actually shows

Production uses monthly-v5. It compares completed monthly prices with prior monthly averages and standardized distance, producing 0–4× contribution readings. It separates confirmed from forming values and executes historical signals at the next observed month's opening price. These are useful temporal safeguards; no obvious forward-price leakage was found in the audited production Pace path.

The policy and evaluator SHA-256 hashes match the stored reports exactly:

- Policy: `ee0bcac791dba4ca9979ddaf8ab43f2b00c1b5822e963cc319201437cef81c7f`
- Evaluator: `fa9c8f47deef1f120efecc9cedb1e48f7792be71107eb40a4bf8725215f0423f`

| Stored exploratory study | Eligible securities | Wins / losses / ties vs fixed DCA | Mean terminal-asset difference |
| --- | ---: | --- | ---: |
| 30 selected securities | 28 | 3 / 15 / 10 | −2.3038% |
| 8 newly selected securities | 8 | 1 / 2 / 5 | +0.0438% |

Sources: `verification/dca-backtest-30.json`, `verification/dca-frozen-validation.json`. These are means of individual security terminal-wealth differences, not annualized returns, portfolio returns or an accuracy score. The later restarted slice of the first study averages −0.3642%; it is not independent out-of-sample validation.

Limitations explicitly include surviving selected securities, partial calibration overlap, excluded dividends/cash interest/taxes, unverified corporate-action adjustment provenance and monthly-only drawdowns. Raw historical OHLC inputs are not committed for an independent full rerun. This audit inspected stored results and source hashes; it did not rerun those historical studies from raw market data.

Both strategies deposit 100 units monthly; Pace spends at most available cash. Thus 2×/3×/4× can spend more only after previous pauses accumulated reserves. On a controlled declining-price series with all 3× signals and no reserve cash, both strategies finish identically. The evaluator measures a cash-reserve policy, not unrestricted higher contributions.

Another reproduced defect: an old gap outside the required trailing 12 months can suppress Pace because up to 24 prior months are checked for continuity. The same trailing complete observations produce 1× when supplied alone but no reading when older gapped history is included. Reconcile the stated minimum with the actual calculation.

Agreement with selected competitor screenshots is not return accuracy. Conventional RSI, SMA, MACD, Bollinger and volume calculations are descriptive indicators, not evidence of profitable prediction.

## Metrics that should drive the next version

| Business/model | Core evidence |
| --- | --- |
| Established operating companies | Revenue and margin trajectory, ROIC relative to capital cost, FCF conversion, FCF per diluted share, net debt and interest coverage. |
| High-growth software/platform businesses | Recurring growth where reported, customer retention where reported, gross/operating margin trend, stock compensation, net dilution after buybacks, per-share cash generation. |
| Capital-intensive infrastructure | Contract quality and conversion to recognized revenue, utilization, unit economics, maintenance versus growth capex where disclosed, committed funding, debt maturities and dilution scenarios. |
| Banks/insurers/REITs | Dedicated sector measures and valuation models; do not reuse generic operating-company cash-flow gates. |
| Entry and timing | Annualized scenario return and downside, investment horizon, liquidity, dated trend/volatility/volume, earnings-event exposure; timing is separate from business quality. |
| Data confidence | Filing/reporting dates, observation dates, accounting basis, units, currency, share class, source, revisions and metric-level completeness. |

For strategy validation: freeze rules before evaluation; use point-in-time fundamentals and a broader universe including delistings; test rolling out-of-sample periods; compare equal budgets and disclose total-return, cash-interest, fees and execution assumptions. Measure money-weighted returns, excess terminal wealth, deposit-adjusted daily drawdown, time underwater, cash drag, sample counts and uncertainty by sector/regime. Test each added factor's incremental value. Do not advertise a generic accuracy percentage.

Primary-method references reviewed:

- SEC EDGAR API documentation explains units and differing fiscal dates: https://www.sec.gov/search-filings/edgar-application-programming-interfaces
- Aswath Damodaran, NYU Stern, *Valuing Young, Start-up and Growth Companies*: https://pages.stern.nyu.edu/~adamodar/pdfiles/papers/younggrowth.pdf

## Delivered movement context

The approved research page now includes a compact movement card: dated price change/session, latest available completed-session volume versus the prior 20 sessions, next unreported earnings event when supplied, expandable recent publisher links and direct access to News & earnings. Unknown values remain unknown. Missing percentage change is derived only when an explicit positive previous close is available. Unsafe/future/old/duplicate headlines are excluded. Coverage is not labeled as a proven cause. Provider errors offer retry; sample mode does not invent live headlines.

No new provider integration, model thresholds, dependencies or database migrations were introduced. Existing news requests share the same cached symbol key as the deeper News view.

## Verification and remaining work

- Pre-change full suite: 640 passed, zero failed.
- Financial audit: 34 focused tests; three controlled defect reproductions.
- Pace audit: 21 focused tests plus controlled missing-history and equal-budget simulations.
- Movement context: five behavioral tests, including observed failures before implementation, covering missing/invalid prices, stale dates, safe relevant-time coverage and unreported earnings selection.
- Production build, final full-suite result and browser checks are recorded in `verification/movement-audit-checks.txt`.
- Exact live source reconciliation, live news service availability, mobile-device QA and independent prospective performance remain unverified.

Priority order: repair evidence dating and period selection; unify verdicts and reason explanations; improve sector-aware funded scenarios; then validate the investment rules. A visual polish or a larger metric count cannot substitute for those steps.
