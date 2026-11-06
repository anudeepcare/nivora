# Decision differentiation and research drawer corrections — 27 October 2026

This release continues the approved AURYN design and includes the visible Pace, Strategy Lab parity and earnings lifecycle corrections described in [the preceding release](PACE_EARNINGS_RELEASE_20261027.md). It has not been deployed to production.

## Reproduced decision issue

Adding eligible analyst coverage could replace an independent cash-flow valuation with a sensitivity anchored to the current forward P/E. When the multiple and EPS reconstruct the current price, the result can become Wait even though the separately eligible cash-flow case qualifies. A deterministic regression reproduces this behavior; this is not a diagnosis of every live ticker the user saw.

Decision version `auryn-decision-v4` now prefers the existing cash-flow model only when the mature-business eligibility rules pass. Dated EPS sensitivity remains the fallback. Infrastructure, foreign listings and other specialist restrictions remain in force. The price thresholds have not been relaxed and no target distribution of Buy/Sell labels is imposed. Monthly-v5 Pace thresholds are unchanged.

The displayed entry threshold now satisfies both constraints: cash-flow uses the lower of 80% of base value and bear value / 0.65; earnings uses the lower of base target / 1.12^years and bear target / 0.65. Direct price comparison preserves the exact boundary without floating-point return-rounding disagreement.

Review exposed an additional risk: tied, conflicting outstanding-share observations could inflate cash flow per share depending on array order. The selected share observation date is now checked independently of the financial-period date. Material same-date/same-filing conflicts block the denominator; later amendments supersede earlier filings; different currencies/accounting bases remain separate. This applies to derived market multiples as well. Eligible EPS sensitivity can still be used without that share denominator.

## Clear action and reason

The action and explanation use the same ordered decision gates. Research displays the specific reason near the main action: entry conditions met, entry price not met, momentum stretched, P0 pause, funding risk, deterioration, incomplete valuation, or report/price refresh. Incomplete valuation is not represented as evidence that the company is expensive.

New-purchase and existing-holding actions stay separate. Qualified entry is Buy/Add; supported existing holdings can be Hold while new purchases Wait; funding deterioration can be Avoid/Reduce; the acute funding rule is Avoid/Sell. Pace contribution levels remain visible with forming/confirmed dates and names.

## Research interactions

- Desktop shows all available header metrics without a redundant expansion link. Mobile starts with four and expands/collapses the remaining metrics.
- Evidence drawer layout now receives the chart-column spacing previously scoped only to the ordinary content container.
- Both drawer headers use a consistent 44×44 close control.
- The anchors dialog is centered, has a fixed header and a scrollable body, and places the chart above a compact responsive level grid.
- Closing a child dialog no longer resets the parent research tab through a bubbled close event.

## Validation

- 807 unit/integration tests passed, zero failures or skips.
- TypeScript check passed.
- Optimized production build passed (34 static pages). All nine API verification scripts passed using controlled transports/database fixtures; no real payment or message was sent. Logs are included in `decision-fixes-validation/`.
- Fresh independent review passed 40 focused tests and confirmed the conflicting-share reproduction was resolved.
- Browser checked 360, 390, 430, 768 and 1280 pixel frames. No page horizontal overflow at those widths.
- Observed mobile metrics 4 → 8 → 4, desktop/tablet eight with no toggle.
- Nested X and Escape each closed only the anchors dialog; parent X closed the research drawer.
- Custom low/high 100/200 produced a 0.5 retracement at 150, 1.272 extension at 227.20 and 1.618 extension at 261.80.
- Measured 18 pixel separation between the chart container and risk card. Close targets measured 44×44.

The [browser image](decision-fixes-validation/research-illustrative-qa.jpg) uses explicitly labelled synthetic QA data, including a low price that exercises Buy/Add and P4-forming/P2-confirmed. It is not live Microsoft analysis. Temporary fixtures, framing headers and preview configuration were restored before final validation and packaging.

## Limits and release requirements

No new dependency, environment variable or database migration is required. The decision rules remain disclosed heuristics, not calibrated return probabilities. These checks establish software behavior, not profitability or universal live data coverage. The earlier [Pace trust and launch report](PACE_TRUST_AND_LAUNCH_20261027.md) remains applicable: the archived backtests have a different policy hash and must not be marketed as validation of the current revision. Production deployment, live-universe revalidation and the documented data-rights/legal review have not been performed by this source handoff.
