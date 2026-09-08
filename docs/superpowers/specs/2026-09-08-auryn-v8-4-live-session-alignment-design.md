# AURYN V8.4 Live Session Alignment Design

## Goal
Make price semantics explicit and session-aware so AURYN never confuses a live market price with a completed daily-bar analysis anchor, while preserving strict execution safety and closed-market consistency checks.

## Problem
The V8.3 live 100-stock audit flagged 24 canonical/analyze gaps of roughly 3–9% during the regular session. The canonical Market Truth price is a live quote, while `/api/analyze/:symbol` currently exposes the latest completed daily-bar close as `price`. Those values are allowed to diverge intraday, so treating every gap above 3% as critical creates false failures. At the same time, the system still needs to detect stale analysis anchors, incorrect close semantics, and execution use of non-live prices.

## Architecture
### Canonical price roles
Market Truth must expose explicit roles and timestamps:
- `regularClosePrice` / `regularCloseAsOf`
- `liveMarketPrice` / `liveMarketPriceAsOf`
- `decisionPrice` / `decisionPriceAsOf`
- `decisionPriceRole`: `LIVE_MARKET | REGULAR_CLOSE | NONE`
- `executionPrice` / `executionPriceAsOf`; populated only for `LIVE_VERIFIED`

The analysis API must expose:
- `analysisAnchorPrice`
- `analysisAnchorAsOf`
- `analysisAnchorRole: COMPLETED_DAILY_BAR`
- legacy `price` retained as an alias of `analysisAnchorPrice` for compatibility

### Session-aware audit policy
When the market is open:
- live decision price vs completed daily-bar anchor divergence is informational (`intradayMovePct`), never a critical mismatch by itself;
- audit instead validates the analysis anchor role/timestamp and that execution price is only present for execution-tradable Market Truth.

When the market is closed:
- canonical regular close and completed daily-bar anchor should refer to the same completed session;
- a material mismatch remains critical.

At all times:
- blocked Market Truth cannot expose a usable decision/execution price;
- `executionTradable=true` requires `LIVE_VERIFIED` and a finite execution price;
- quote timestamps and roles are explicit rather than inferred from labels.

### 500-stock audit sampling
The expanded universe must not degrade into alphabetical symbols. The audit-universe endpoint should return a deterministic diversified sample from its candidate pool. When market-cap data is available, sample across market-cap strata and across the full symbol list; fallback universe selection must use deterministic spread sampling rather than `ORDER BY symbol LIMIT n` behavior.

### UI / downstream contracts
Existing stock UI continues to use canonical `decisionPrice` for current price-sensitive decisions and daily bars for completed-bar indicators. No new live intraday RSI/technical recomputation is introduced in V8.4; the UI should simply expose correct semantics where diagnostics are shown.

## Safety invariants
1. `executionPrice` exists iff `executionTradable=true` and state is `LIVE_VERIFIED`.
2. `decisionPriceRole=LIVE_MARKET` only for live/single-source live research states.
3. `decisionPriceRole=REGULAR_CLOSE` only for official-close research state.
4. `analysisAnchorPrice` is the last completed daily bar and is never labeled live.
5. Live-vs-anchor movement is not treated as corruption during an open session.
6. Closed-session close-vs-anchor mismatch remains critical.
7. Expanded audit universe is diversified deterministically rather than alphabetically concentrated.
