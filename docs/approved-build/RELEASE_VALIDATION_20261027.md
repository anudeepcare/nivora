# AURYN decision experience — release verification

Approved scope: the user's “Lets build it” instruction on 27 October 2026. Baseline: `95a8b98`, branch `feat/approved-mockup`.

## Result

Research now opens with the dated company price, one explicit AURYN action, concrete operating reasons and a prominent Pace card. Deeper business, valuation, price and catalyst evidence remains accessible through compact controls and disclosures. Public home, account access, mobile navigation and Settings share the revised typography and spacing. Settings has first-level Back and Sign out. Home combines followed companies' news and groups all returned events by date/session.

The provider layer retains successful datasets when an optional source fails, evaluates SEC recovery for sparse/stale EOD statements, and searches the complete eligible provider directories before limiting displayed results. Financial comparisons respect period, currency and accounting basis. The accompanying metric register records formulas and limits.

## Automated and browser checks

`npm run verify` completed successfully: **748 tests passed; 0 failed, skipped or todo**, TypeScript passed, and the Next.js production build passed. The initial build emitted two CSS compatibility warnings; `align-items: start` in the new workspace stylesheet was changed to its compatible `flex-start` equivalent, followed by another production build. Saved logs in `verification/` record the final results.

The controlled tests use real calculation/provider routing code with synthetic or recorded fixtures and replaced external HTTP boundaries where required. They cover source recovery, currency/period isolation, filing provenance, listing identities, stale/future prices, model applicability, annualized scenarios, continuous dilution, cash runway, financial conflicts, Pace history gaps, holiday weekly averages, news batching and same-date events. These checks establish software behavior; they do not establish investment performance.

Browser inspection used the running Next.js development app, including desktop and 360/390/430-pixel phone viewports. Public home, login/signup, Research, Home, Settings, Watchlist and Portfolio were inspected. Exercised controls included research drawers, Settings return navigation, primary navigation, Watchlist/holdings filtering and the position editor. Light and dark appearances were checked. No application console error was observed; the browser extension emitted unrelated metadata errors.

Browser defects corrected during this pass: research header wrapping, Pace/button contrast, oversized Settings identity, unavailable weekly averages despite sufficient history, and inherited mobile rules hiding every approved holdings/watchlist cell. The latter was confirmed before and after through rendered cell visibility, accessible rows, filtering and the holding editor. The mobile watchlist banner was shortened so the first company is visible sooner. All five cells remain available in mobile card rows.

The temporary viewport harness and its local-only environment were removed before production verification. `next.config.ts` is restored to the baseline `X-Frame-Options: DENY`. No browser screenshots or private credentials are included in the source archive. Responsive browser checks are not physical-device Safari/PWA installation tests.

## Decision policy and safeguards

Actions are deterministic screening rules, not probabilities or verified investment advice. Ownership changes Buy to Add and distinguishes Reduce/Sell from Avoid; ownership alone cannot produce Hold. Hold requires usable financials, usable price, a supported operating case and an available price assessment. Missing or conflicting required inputs pause the decision while independent valid facts remain visible.

Positive operating cash after capital spending, positive operating profit and nonnegative comparable revenue growth support the generic operating-business classification. Financial companies use a separate book-return screen. REITs, specialized sectors, infrastructure, frontier companies and foreign listings do not inherit the generic cash-flow model indiscriminately. Descriptive metrics remain available where applicable.

The earnings sensitivity uses the actual forecast horizon and annualizes the base return. The entry screen requires at least 12% base annualized return, bear downside no worse than 35%, and no stretched RSI condition. The cash-flow alternative requires three consecutive positive annual cash-flow observations, a current valid share count, a supported domestic operating-company classification and matching currency/basis. It normalizes cash generation to the lower of the latest amount and three-year median. Growth fades over ten years; annual dilution affects every forecast year and the terminal value. Bear/base/bull discount rates are 15/12/10%, with terminal company growth 1/2/3%. Entry requires a 20% discount to the base value and the same bear-downside constraint. Missing comparable dilution is explicitly disclosed as a 0% assumption.

Funding stress and material operating deterioration take precedence over entry screens. Negative capex-driven FCF alone is not called insolvency. These thresholds are transparent heuristics. The historical Pace evidence included with the project does not demonstrate consistent outperformance; no new investment-accuracy or superiority claim is made.

Review regressions cover: continuous dilution instead of fading dilution away; rejecting generic cash-flow valuation for infrastructure/frontier companies; aging share counts against the assessment clock; selecting a completed close over an earlier intraday quote from the same day; withholding decisions with conflicting critical financial observations; preserving a supported entry as price falls; and matching US share-class aliases in ownership and earnings events.

## Live scope and operational limits

The app's enabled universe is **USD-quoted US listings and USD crypto pairs**. Native international exchanges/currencies, all delisted securities and worldwide coverage are not enabled or claimed. An ETF or crypto asset does not receive fabricated corporate financial evidence. Optional missing metrics remain distinct from negative business results.

An authenticated Twelve Data connector supplied matching dated USD quotes and profiles for **11/11** representative instruments: MSFT, JPM, O, IREN, CIFR, BE, ZETA, APP, ASTS, BRK.B and QQQ. Identity, venue, currency, OHLC bounds and percentage-change arithmetic passed. The connected plan denied statement/statistics endpoints, so no live FCF/margin reconciliation is claimed. This connector was independent of the application runtime.

The resumable full-universe audit is included, with credit ceilings and explicit not-tested outcomes. A live full-universe run, production provider wiring, real Supabase sign-in/signup, billing transactions and production deployment still require the target environment's credentials and entitlements. No production account mutation, deployment, remote push, purchase or subscription change was performed. Regular US close precedence handles DST; exceptional early-close sessions are not newly modeled by this change.

See `METRIC_REGISTER_20261027.md`, `FINANCIAL_VALIDATION_20261027.md`, `PACE_VALIDATION_20261027.md` and `COVERAGE_VALIDATION_20261027.md` for detailed formulas and evidence.
