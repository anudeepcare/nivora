# AURYN V8.4 — Live Session Alignment

V8.4 fixes the live-market price-semantic problem exposed by the deployed 100-stock regular-session audit. During the open session, AURYN was comparing a current canonical quote to the latest completed daily-bar analysis anchor and treating normal intraday moves above 3% as price corruption. V8.4 makes every price role explicit and makes the audit session-aware instead of weakening Market Truth.

## Explicit price semantics

Canonical Market Truth now exposes:

- `regularClosePrice` / `regularCloseAsOf`
- `liveMarketPrice` / `liveMarketPriceAsOf`
- `decisionPrice` / `decisionPriceAsOf`
- `decisionPriceRole`: `LIVE_MARKET | REGULAR_CLOSE | NONE`
- `executionPrice` / `executionPriceAsOf`

`executionPrice` exists only when the canonical state is independently verified and `executionTradable=true`.

The `/api/analyze/:symbol` response now exposes:

- `analysisAnchorPrice`
- `analysisAnchorAsOf`
- `analysisAnchorRole: COMPLETED_DAILY_BAR`
- `priceRole: ANALYSIS_ANCHOR`

The legacy `price` field remains for compatibility but is explicitly the completed daily-bar analysis anchor, not a live quote.

## Completed-bar technicals

During PRE_MARKET and REGULAR sessions, if the history provider includes today's partial daily candle, AURYN removes that partial candle before computing daily technicals. AFTER_HOURS and closed sessions may use the completed current regular-session candle.

This prevents a partial daily bar from silently contaminating completed-bar indicators, support/resistance, and technical state.

## Session-aware live audit

The deployed audit no longer declares a live-vs-completed-close move critical merely because it exceeds 3%.

During PRE_MARKET / REGULAR / AFTER_HOURS:

- live canonical price vs completed daily anchor is tracked as `intradayMovePct`
- large intraday moves are diagnostic context, not automatic corruption
- execution safety still requires `LIVE_VERIFIED`

During CLOSED sessions:

- the official regular close and completed daily anchor must refer to the same completed session
- material close-vs-anchor mismatches remain critical

The audit summary now includes `intradayDivergences`, `alignmentWarnings`, `priceStates`, and `executionBlockReasons`, making it possible to diagnose why `executionReady` is low without weakening the broker gate.

## Diversified 500-stock audit universe

The expanded audit no longer falls back to an alphabetical A* prefix. V8.4 uses deterministic diversified sampling across the full candidate list and market-cap rank when available. The fallback active universe is paginated before sampling, so 500-symbol validation covers a broad cross-section of symbols rather than the first alphabetical block.

## Validation after deployment

Run 100 live:

```bash
AURYN_BASE_URL=https://getauryn.vercel.app npm run audit:v84-live | tee audit-100-v84-live.txt
```

If clean, run the diversified 500:

```bash
AURYN_BASE_URL=https://getauryn.vercel.app npm run audit:v84-live -- --limit=500 | tee audit-500-v84-live.txt
```

Target:

- zero true critical price-role/alignment violations
- normal intraday moves reported as intraday context, not false criticals
- `executionReady` only for independently verified live prices
- diversified 500-symbol coverage
- clean quarantines/retries remain separate from critical failures

Live-money autonomous execution remains disabled. Alpaca Paper remains the execution proving ground.
