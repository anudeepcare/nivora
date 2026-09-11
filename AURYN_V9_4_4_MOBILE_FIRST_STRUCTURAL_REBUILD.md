# AURYN V9.4.4 — Mobile-First Structural Rebuild

This release replaces patch-style mobile behavior with a final authoritative mobile composition layer loaded after all previous styles.

## PWA / app chrome
- Compact safe-area-aware header with fixed 56px content height.
- Search remains in normal document flow.
- Bottom navigation owns the bottom safe area exactly once.
- Account overlay is viewport-fixed and route-safe.
- Prevents horizontal overflow across authenticated route roots.

## Auth
- Login and registration use a compact standalone mobile shell.
- Removes the oversized top blank area.
- Form fields and legal links remain fully viewport-safe.

## Research
- Research landing first viewport is compact and consistent.
- Stock masthead always shows identity + current price.
- Evidence tabs scroll horizontally instead of clipping.
- AURYN Call hero is shorter on mobile.

## Technicals
- Mobile Technicals are compact semantic rows rather than equal-height grid cards.
- RSI/MACD/Volume/Bollinger visual semantics from V9.4.2 are preserved.

## Portfolio
- Portfolio intro, market intelligence, allocation, performance, visual analytics, capital queue and holdings are viewport bounded.
- Holdings are compact mobile cards.
- Essential current/return/share/average-cost context is visible without opening edit mode.
- View Research / Edit / Delete remain available through the mobile action menu.
- Period tabs scroll horizontally.
- Capital Queue and evidence text wrap safely.
- Allocation donut/legend/concentration use a dedicated mobile grid.

No scoring, Market Truth, fast-price, portfolio math or Trading Lab engine changes.

Verification: `npm run gate:v944`
