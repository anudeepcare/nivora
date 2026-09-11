# AURYN V9.4.5 — iPhone PWA Root-Cause Fix

Root cause addressed:
- iOS Home Screen mode used `black-translucent`, allowing content behind the status bar.
- Mobile header was sticky while the page applied overflow constraints, which is fragile on iOS standalone scrolling.
- Previous portfolio patches often hid overflow rather than forcing desktop grids to become genuine mobile layouts.

Changes:
- App shell now has an explicit `aurynAppShell` root.
- iOS status bar style changed to opaque black.
- Mobile header is viewport-fixed.
- App shell reserves one exact header/safe-area slot.
- Portfolio direct children are forced to `min-width:0; max-width:100%`.
- Portfolio hero is an actual single-column grid.
- Allocation, performance, visual intelligence, capital queue and holdings reflow instead of being clipped.
- Holdings remain compact mobile cards with essential price/return context.
- Auth top spacing remains independent from authenticated app chrome.

Engine, scoring, Market Truth, portfolio math and Trading Lab decision logic are unchanged.

Verification:
- `npm run gate:v945` passes.
- Full Next.js production build could not be executed in this working copy because the Next.js runtime dependency is not present/executable in the mounted environment.
