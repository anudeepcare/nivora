# AURYN design refinement — 18 October 2026

Reference: design/research-refinement-20261018.png. It contains illustrative Salesforce values and is a visual reference, not a source of market facts.

## Implemented in this pass
- Distinct company header, underlined research tab navigation, section headings.
- Compact decision evidence in one inline row; removed repeated nested evidence cards.
- Home compact portfolio summary, coloured value/concentration/session figures, existing holdings updates and catalyst feed retained.
- Compact technical rows, financial table controls and spacing; news/filings grid isolated from dataset coverage grid.
- Existing shared light/dark surfaces retained; subtle navigation glass with reduced blur cost; short colour transitions and reduced-motion support.
- Login/signup/reset reuse the same branded form; busy requests disable mode changes; accessible busy state and larger input/button geometry.
- Existing normal document scrolling, safe-area header and keyboard-aware dock retained. No new viewport height manipulation.

## Scope retained from the broad build
Financial trends and metric tables, earnings, ownership, comparison, coverage, observed research changes, confirmed/forming DCA history, hypothetical equal-budget comparison, holdings context, alerts and paper safeguards remain included. No new provider entitlements or numerical models were added in this refinement.

## Verification limits
Automated tests, API fixtures and production compilation are not visual acceptance. Exact pixel parity, smoothness on hardware and installed iPhone PWA clipping have not been verified. No production deployment, real broker order or paid provider call was performed for this pass. Scenarios remain conditional mechanical sensitivities, not validated company-specific intrinsic values. Missing evidence is never replaced with preview numbers.

## Deploy from your extracted source folder
```sh
cd ~/Downloads/AURYN &&
npm ci &&
npm run verify &&
npm run test:api &&
git add -A &&
(git diff --cached --quiet || git commit -m "Refine AURYN Home, research hierarchy and shared interface") &&
git push origin main
```
Run on main only after confirming `git branch --show-current`. Do not force-push if the remote has moved. Keep existing local environment variables; the ZIP excludes secrets.
