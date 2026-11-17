# Approved compact workspace implementation

## Reference and implementation
Approved visual direction: compact light surfaces, petrol Home/research summary, distinct company identity, one-line research navigation, grouped coloured metrics. Reference images are in docs/design. Their figures, tickers, dates, ratings and graphs are illustrative, not market evidence. Pixel parity has not been established.

Implemented in this source:
- Removed visible downloads/exports from earnings, financial trends/detail, AI analysis, portfolio tools and Research Lab.
- Removed peer comparison from Financials and equal-budget comparison from the Research DCA section. Historical confirmed month readings and model rules remain.
- Analysts tab: reported buy/hold/sell recommendation counts, original rating score, current comparable consensus. Missing count remains distinct from zero; no invented dates, ranges or revision history.
- Earnings: past actual/estimate/surprise table separate from a compact forward revenue/EPS/analyst-count table. Explicit period ending dates and frequency replace opaque relative forecast codes.
- Value: three adjacent desktop scenario groups; stacked mobile rows; consensus separate from mechanical model sensitivities; existing validation guards retained.
- Portfolio: removed the second exposure/summary panel; primary balance retained with priced-coverage disclosure. No fabricated return for unpriced holdings.
- Technicals: removed the empty-column layout by stacking the reference and accumulation sections; compact study groups retain the metrics. This is not exact parity with the two-column chart/indicator reference.
- Home: teal summary, existing catalysts/headlines, one headline per available company before repeat headlines; HTML entities decoded as plain text.
- Existing login, registration, theme, safe-area and keyboard architecture retained from prior pass. No new live auth or physical device test.

## Validation and remaining limits
195 domain, database and component tests pass; TypeScript and production builds pass. 64 API fixture checks pass. Source and unit checks cannot establish exact visual matching or device smoothness. Physical installed iPhone PWA clipping/keyboard/navigation acceptance, full visual review of every tab/subtab/control, live provider and account verification, commercial redistribution and company-specific intrinsic valuations remain unverified. This package must not be described as all requested bugs resolved or production accepted.

The new Analyst tab uses existing normalized fields and makes no extra paid data calls. Original model outputs are not competitor-equivalent. Missing evidence is not filled with mock figures. No broker orders, database changes, Git push or deployment performed.

## Deploy after copying this source into your existing AURYN folder
```sh
cd ~/Downloads/AURYN &&
npm ci &&
npm run verify &&
npm run test:api &&
git add -A &&
(git diff --cached --quiet || git commit -m "Simplify AURYN research and add analyst evidence") &&
git push origin main
```
Confirm you are on main first. Keep your environment configuration. Do not force-push if the remote rejects the push.
