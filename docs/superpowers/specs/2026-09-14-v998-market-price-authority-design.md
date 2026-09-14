# AURYN V9.9.8 Market Price Authority Design

## Goal
One visible market price across AURYN, selected by a session-aware authority rather than component/provider races.

## Display contract
The presentation layer receives exactly one MarketDisplayQuote:
- symbol
- price
- session: PRE_MARKET | REGULAR | AFTER_HOURS | OVERNIGHT | CLOSED
- label: PRE-MARKET PRICE | LIVE MARKET PRICE | AFTER-HOURS PRICE | LAST OFFICIAL CLOSE | PRICE VERIFYING
- asOf
- source
- freshness: LIVE | RECENT | STALE | VERIFYING
- confidence: VERIFIED | SINGLE_SOURCE | CONTESTED

Research/canonical decision price is separate and may never overwrite display price.

## Authority rules
1. Reject symbol mismatch, nonpositive prices, missing/invalid timestamps.
2. During REGULAR, current quote must be <=60 seconds old to become live authority.
3. During PRE_MARKET/AFTER_HOURS, use session-appropriate fresh quote; never substitute regular close as if it were live session price.
4. CLOSED/OVERNIGHT may use the last official close and label it explicitly.
5. With two fresh providers, compare prices. If disagreement >1.5%, return PRICE VERIFYING/CONTESTED rather than choosing one.
6. If providers agree, choose the newest timestamp; source response speed has no authority.
7. A last-good quote may be retained briefly during transient refresh failure, but its label/freshness must age honestly.
8. Header, overview, Trust/Freshness, chart current-price marker, live distance-to-trigger, portfolio live valuation, and other display-price consumers use this one authority object.
9. CIO canonical decision/execution verification remains independently gated.

## Reliability/performance
Provider requests execute concurrently. Arbitration happens after results settle. UI keeps last-good authority during refresh; no page-wide fallback oscillation.

## Non-goals
No CIO formula/weight/threshold changes. No Supabase schema change. No Vercel cron. No validation-queue redesign.
