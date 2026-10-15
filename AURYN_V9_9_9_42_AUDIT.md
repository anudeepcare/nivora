# AURYN 9.9.9.42 — Appearance contract repair

## Implemented
- Replaced the newest stylesheet's fixed navy/blue/white backgrounds with existing semantic theme variables.
- Connected density, text size, and reduced-motion attributes to styling.
- Added `node scripts/audit-appearance.mjs` static regression check.

## Verified
- `node scripts/audit-appearance.mjs` passed.

## Not yet verified
- Next.js production build (dependencies not installed in the current environment).
- Visual browser testing at mobile and desktop breakpoints.
- All page routes, actions, data feeds, BTC pricing, Alpaca paper trading, and financial metrics.

## Deployment
Run `npm ci`, `npm run build`, `node scripts/audit-appearance.mjs`, relevant tests, then Git commit and push. Keep production unchanged until checks pass.
