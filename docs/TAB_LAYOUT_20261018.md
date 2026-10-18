# Research organization and mobile layout correction

## Changes
- Overview: compact price/consensus/scenario context and next report date replace the large full Value panel; full EPS history removed.
- Financials: full earnings actual/estimate/surprise and forecasts placed here, after financial statements/trends; detail period buttons have an explicit active state, and metric-group button widths remain stable on selection.
- News: new company news, filings, scheduled earnings and insider activity tab. These sections were removed from Thesis. Crypto News is available; corporate fields remain missing where inapplicable.
- Thesis retains business strengths/risks, ownership, thesis review and evidence-linked AI analysis.
- Removed the duplicate outer section-heading layer across Research.
- Technicals: MACD line, MACD signal, upper and lower Bollinger values added using existing completed-price calculations. No new provider calls.
- Holdings: generic financial-table cell styling excludes the holdings table, addressing cell divider/padding collisions. Search moves below the holdings heading on small screens. Position-editor geometry tightened.
- Mobile header: solid opaque background and explicit layer/bottom border, no CSS filter/backdrop blur. Existing safe-area padding is retained. This is a mitigation, not proof that the OS blur is removed.

Upcoming historical earnings estimates no longer inherit the listing or company reporting currency when their own currency/basis is absent. A regression verifies this distinction.

## Header investigation
Apple Developer Forums has a developer report of iOS 27 forced status-bar blur in PWAs: https://developer.apple.com/forums/thread/848733 . This is not an Apple-confirmed diagnosis of AURYN and supplies no official fix. A WebKit report also discusses fixed/sticky topbar backdrop-filter tint sampling: https://bugs.webkit.org/show_bug.cgi?id=319479 . AURYN's mobile header does not use backdrop-filter. No invisible panel, synthetic scroll nudge, dynamic root resizing or experimental OS hack was introduced.

## Remaining acceptance
Physical iPhone Add to Home Screen first launch, scroll, keyboard open/close, tab navigation and light/dark header rendering need device testing. Exact visual parity, full browser acceptance of every tab/subtab/control, production latency and all requested metrics/models remain unverified. New content organization does not validate investment recommendations or company valuations. This source is not a claim that every historical request is complete.

## Deployment
```sh
cd ~/Downloads/AURYN &&
npm ci &&
npm run verify &&
npm run test:api &&
git add -A &&
(git diff --cached --quiet || git commit -m "Organize AURYN research tabs and fix mobile holdings layout") &&
git push origin main
```
Run only on your intended main branch. Preserve your existing environment. No force push.
