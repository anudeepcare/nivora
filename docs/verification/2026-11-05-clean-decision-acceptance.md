# AURYN 1.0.0 — clean decision workspace acceptance

## Delivered source changes

- Public Home presents the decision workflow with an interactive illustrative example and concrete product links. Signed-in Home removes oversized introductory panels and puts contribution comparison and followed-company updates first.
- Compare up to three followed companies on business evidence, Pace, valuation and position fit. Optional additional-cash previews compare each company independently; they do not allocate money or execute orders. Invalid amounts are rejected.
- Research adds Business & price, Price expectations, and Earnings & next step. The expectation calculator exposes the horizon, exit P/E and return assumption; same-period analyst EPS is compared only when supported. Earnings comparisons retain their observation periods and do not invent guidance.
- Pace occupies 55% of the desktop overview, comes before the chart on narrow layouts, uses larger highlighted action text and opens shared accessible help in a dialog. P0–P4 explanations avoid mandatory contribution multipliers.
- Mobile navigation removes the selected arch/box; research tabs retain horizontal scrolling without the visible scrollbar. PWA icons have opaque backgrounds, safe padding and versioned asset paths.
- Stock context adds dated market cap where available, a qualified closing-price range, relative volume and next supplied earnings date. Contextual help describes the measurements.
- Targets tables use fiscal years, aligned numbers and simpler selection styling. Historical outcomes are labelled percentiles/median. Automatic earnings scenarios check forward-P/E consistency against near-term EPS; an explicit user multiple remains an assumption.
- Redundant overview panels are removed. Version stays 1.0.0 and the in-app release entry remains a candidate.

## Verification

- Final unit/component suite: 969 passed, zero failures.
- Production build, including TypeScript validation: passed. All nine API regression scripts passed using mocked/synthetic transport; no live-provider accuracy certification.
- Browser: public Home and desktop MSFT synthetic preview rendered. Pace help opened; Escape closed it and returned focus. Price expectations updated from required EPS 21.60 at 25x to 18.00 at 30x for the same example assumptions.
- Independent code review found invalid contribution handling, forecast freshness and foreign-listing comparison issues; all three were corrected.
- Narrow 390px iframe review was blocked by frame loading/security and was not accepted as mobile visual proof. Responsive CSS and component checks do not replace installed-iPhone testing.

## Boundaries and remaining acceptance

No deployment or production data mutation was performed. Preview evidence uses synthetic fixtures, not current market prices. PWA icon pixel bounds were checked, but installed iOS masking, safe-area behavior, physical touch and Safari scroll acceptance remain pending.

DCAOptimizer Charts redirected to sign-in. Exact external values and methodologies for APP, NOW, MSFT, META, SOFI, IREN, ASTS and NBIS remain unverified; see the separate reconciliation matrix. No rule was tuned to force agreement with a competitor screenshot.

The new tools reuse available financial/earnings data. They do not add licensed transcripts, independently verified forward guidance, automated trading or proven excess-return claims. Alerts retain supported existing rule types; arbitrary AI thesis monitoring is not claimed.
