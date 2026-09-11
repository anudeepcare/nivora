# AURYN V9.4.7 — Final Mobile UX Consolidation

## What changed
- Removed the stacked V9.4.4/V9.4.5/V9.4.6 mobile stylesheet imports.
- Replaced them with one authoritative `app/auryn-mobile.css`.
- Added a purpose-built mobile stock masthead instead of shrinking the desktop masthead.
- Mobile stock hierarchy is now: logo/ticker/position → live price → company/detail → four market facts → tabs.
- Ownership badge is secondary and no longer creates its own centered row.
- Search/header/app-shell keep the fixed PWA/safe-area architecture.
- Research landing, Technicals, Portfolio, Monitor, Trading Lab, Profile and Auth retain explicit mobile viewport contracts.
- Portfolio holdings remain compact and keep View/Edit/Delete actions.
- Added an explicit desktop decision footer so ownership note, watch/track actions and plan/confirm levels stay together with no giant dead band before the thesis.

## Data/engine
No decision-engine, scoring, Market Truth, quote, portfolio-math or Trading Lab logic changes.

## Verification
- `npm run gate:v947` passes.
- Modified TSX/TS files pass TypeScript syntax transpilation.
- Full Next.js production build is not runnable in this mounted copy because project runtime dependencies are not installed here; Vercel remains the final dependency-aware build confirmation.
