# Readable workspace — AURYN 1.0.0

## Changes
- Main header shows available market cap, comparable revenue growth, sector-appropriate profitability and next supplied earnings. Previous close is explained inside quote help; completed price ranges/volume are inside chart context. Existing shared business classifications prevent generic cash-flow margin for financial businesses. REIT/specialized-financial categories withhold unsuitable generic profitability cards.
- Options owns its carbon banner and light/dark contrast; tinted gamma/concentration cards, responsive grid, expiry controls, contract-table styling and focus treatment preserve existing calculations and missing-data guards.
- Decision cards use distinct evidence/assumption surfaces, a same-period required/supplied EPS comparison and compact next-checkpoint tiles. The repeated supporting section no longer repeats the complete action explanation.
- Analyst consensus is shown once in Targets & Estimates. Rating distribution remains available.
- Long cash-runway methodology is accessible through contextual help; detailed financial sections use clearer labels and the optional assessment is collapsed initially.
- Portfolio CSV import controls are removed. Manual position management, saved holdings and APIs are preserved. Incomplete portfolio fit is a compact status with a useful holdings link.
- Home comparison banner is shorter; earnings/alert/review cards have semantic color accents. Earnings cards expose finite supplied actual/estimate EPS, with future actuals withheld.
- Shared controls retain native select behavior, readable contrast and visible focus states. The redesign introduces no new dependencies.

## Verification
- Production build and all API regression scripts passed. Final Pace disclosure CSS passed parser validation.
- 975 unit/component tests passed, including new business-header classification and populated/empty Options render checks.
- Browser: refreshed illustrative research; business header and navigation rendered, Options tab opened. A populated synthetic Options snapshot was rendered using the actual loaded component styles and inspected in light/dark themes; the range, gamma coverage, underlying price and cards were readable. Dark expiry control computed foreground #eef2f8 on #24272b.
- Independent review identified two important issues: quote help could describe a different previous-close basis, and a narrow sector regex missed financial businesses. Both were corrected; header classification regression was observed failing and then passing. Existing movement-context tests cover historical-reference behavior.
- Source output excludes generated build/dependency files, local environment configuration and temporary browser QA pages.

## Limits
Browser evidence is desktop illustrative/synthetic data. Physical iPhone/PWA and authenticated live-provider acceptance were not performed. The test suite covers affected interactions, not a manual click of every legacy control. Existing forecasts, options coverage and missing inputs retain their limitations. No extra data subscription or production deployment was performed.

## Design decisions
Native selects remain for mobile/keyboard reliability. Existing financial classifications are reused. CSV removal applies to the import UI; underlying account data and backend are retained. Scope is the approved presentation/refinement plan; no automated business-condition monitoring or trading is introduced.
