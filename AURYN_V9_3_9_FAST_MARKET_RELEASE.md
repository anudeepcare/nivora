# AURYN V9.3.9 — Fast Market Lane

## What changed
- Added an independent fast market-price route: `/api/quote/[symbol]`.
- The fast lane races configured Alpaca and Twelve Data price sources server-side.
- Provider credentials remain server-side.
- The active ticker gets a research display price independently from deep `/analyze` and `/canonical` work.
- Fast price refreshes every 5 seconds while the tab is visible and reuses short-lived client/session caches.
- Search warms only the most likely result to improve first-price latency without creating a provider burst.
- Fast research price never authorizes execution and never replaces the canonical decision price.
- If change data is unavailable, the UI does not manufacture `0.00%`.
- A live research price suppresses the giant `PRICE UNVERIFIED` warning; execution verification is shown as a compact integrity note instead.
- The decision hero distinguishes `live research price` from canonical execution verification.

## Metric help fix
- Help popups now measure their actual rendered width/height.
- Placement is clamped to the viewport and recalculated after rendering, resize, and scroll.
- Mobile remains a bottom-sheet presentation.

## Verification
- `npm run gate:v939` passes.
- V9.3.9 tests: 9/9.
- V9.3.8 FIX2 regression: 4/4.
- V9.3.8 FIX1 regression: 6/6.
- V9.3.8 reliability regression: 6/6.
- V9.3.7 + portfolio/trading: 33/33.
- V9.3.6 regression: 20/20.
