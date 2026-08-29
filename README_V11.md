# NIVORA V11 — Mobile-First Investor OS

This version is intentionally decision-first and mobile-first.

## UX hierarchy
1. Choose the use case: Now / Swing / Long term / I own it.
2. See one action: BUY / WAIT / DO NOT CHASE / HOLD / REDUCE RISK.
3. See the three prices that matter: Better Entry / Confirmation / Protect-Reassess.
4. See the chart.
5. Open evidence only if wanted: Overview / Fundamentals / Catalysts / News / Technical detail.

## Speed
- Local company/crypto aliases resolve immediately for common searches.
- Search prefetches likely result pages.
- Core market decision loads independently from SEC fundamentals and news.
- API requests use timeouts instead of leaving the UI indefinitely loading.

## Mobile
- Dedicated bottom navigation.
- Sticky compact search on stock pages.
- Single-column action plan.
- Touch targets and safe-area support.
- Evidence collapses into tabs rather than long dashboard grids.

## Setup
Copy your existing `.env.local` into this project. It is intentionally not included in the ZIP.

Then:
`npm install`
`npm run dev`

No new Supabase migration is required from V4+.
