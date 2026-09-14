# AURYN V9.9.9.2 — Premium Portfolio UX

Rebuilt the Portfolio Cockpit to match the approved mockup's information density and visual hierarchy.

- One primary Performance surface; duplicate visual-intelligence performance section removed.
- Rich portfolio area chart + SPY/QQQ benchmark lines + hover readout.
- Compact period summary: return, dollar change, vs SPY, vs QQQ.
- Drivers use contribution bars with semantic green/red.
- Allocation & Risk uses Stocks/Crypto/Cash donut plus concentration bars.
- Opportunity Map only uses opportunity when enough holdings have scores; otherwise it becomes Position Matrix using weight and P/L so an empty one-dot chart is never shown.
- One action surface only: What needs attention? Capital Queue duplication removed.
- Portfolio Health methodology moved into compact Health detail popover.
- First-screen metrics: Today P/L, Total P/L, Invested, Cash, Positions, Health.
- Mobile remains single-column and touch-friendly.
- Consolidated same-ticker weighted-average behavior from V9.9.9.1 preserved.
- No SQL or Supabase migration required.
- V9.9.8 Market Price Authority and hidden workflows preserved.
