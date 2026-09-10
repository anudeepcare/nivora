# AURYN V9.3.4 Market Intelligence Core — Design

## Goal
Build one deterministic, session-aware, multi-timeframe market-intelligence snapshot that powers Research, Portfolio, Monitor/Alerts, and Trading Lab while keeping AURYN usable 24/7 and preserving strict execution safety.

## Product contract
AURYN must answer five questions clearly for every supported symbol: what is the verified/reference price now; what is the confirmed technical state; what is changing live; where are the actionable zones/levels; and what evidence would upgrade or invalidate the decision. The same canonical answers must appear across all app surfaces.

Stocks remain research-usable 24/7. When no new stock trade exists, AURYN shows the last verified extended/regular reference with exact timestamp rather than inventing a live price. Crypto remains continuous.

## Architecture
### 1. Canonical Market Intelligence Snapshot
Introduce `AurynMarketIntelligenceSnapshot` as the shared read model. It contains:
- symbol identity, exchange/currency, as-of/session metadata;
- canonical Market Truth price/reference fields;
- completed-bar multi-timeframe states for 15m, 1h, 4h, 1d, 1w;
- live preview state kept separate from confirmed state;
- technical consensus/components;
- stable structural zones and levels with evidence/reasons;
- relative strength, participation, volatility and benchmark context;
- one deterministic fingerprint and version.

Every production surface consumes this snapshot or a projection of it. No surface recomputes levels or current technical state independently.

### 2. Multi-timeframe Technical Engine
Build pure deterministic computations over already point-in-time bars. For each timeframe calculate a compact technical consensus from a documented set of moving averages and oscillators. The first production implementation includes SMA/EMA 10/20/30/50/100/200 where enough history exists, RSI14, MACD(12,26,9), stochastic(14,3,3), CCI20, Williams %R14, ROC12, momentum10, ADX14/DMI, ATR14, Bollinger position, OBV/volume participation, and relative strength to benchmark.

The consensus is not treated as truth by vote. It exposes `BUY/NEUTRAL/SELL` counts and a normalized score, while the structural engine remains independently visible. This gives AURYN enough evidence to explain agreement/disagreement with a TradingView-style daily rating without copying proprietary indicators.

### 3. Completed State vs Live Preview
Confirmed 1D/1W state only changes when a completed bar exists. During premarket/regular/after-hours, an unfinished daily bar may produce `livePreview`, but it must never silently rewrite `confirmed`. Every transition records the evidence and completed-bar timestamp that caused it.

### 4. Structural Zone Engine
Replace nearest-high/low plus ATR-only levels with deterministic confluence zones. Candidate prices come from swing pivots, high-volume acceptance proxies, EMA/SMA clusters, anchored VWAP proxies from major pivots, gap edges, Fibonacci retracement clusters, and repeated rejection/touch areas. Candidates are ATR-normalized, clustered, scored, and labeled as support/demand or resistance/supply.

Canonical action map always exposes:
- preferred entry zone;
- confirmation level;
- nearest support;
- major support / invalidation;
- T1 and T2 scenario targets;
- evidence list and confidence for every level/zone.

Levels are based on completed bars and are stable within the same canonical completed-bar snapshot.

### 5. Cross-surface projections
Research renders the full stock intelligence. Portfolio uses the exact same call/price/level snapshot and adds portfolio-specific sizing/concentration context. Monitor/Alerts only emits meaningful state/zone/catalyst changes from canonical snapshots. Trading Lab accepts only the canonical snapshot plus stricter execution Market Truth and fails closed on snapshot mismatch.

### 6. 24/7 session semantics
- PRE_MARKET: verified extended quote when available; confirmed daily structure remains prior completed daily bar; live preview may be shown separately.
- REGULAR: verified live quote; confirmed daily structure remains prior completed daily bar until close; live preview separate.
- AFTER_HOURS: verified extended quote/reference when available; completed daily bar can become confirmed after session close.
- CLOSED/WEEKEND/HOLIDAY/overnight reference: last verified extended trade if trustworthy plus regular close and timestamps; research active; no fabricated price.
- execution eligibility remains a distinct stricter contract.

### 7. UI information hierarchy
One visual language across Research, Portfolio, Monitor, Trading Lab. No KPI wall. Important information stays directly visible: call, confirmed/live timeframe tape, action levels, why/against/what changed. Deep metrics live in the relevant tab, not global expanders.

### 8. Reliability Lab / gates
V9.3.4 cannot pass on compilation alone. Automated acceptance must prove:
- multi-timeframe determinism;
- completed-bar stability under intraday refresh;
- live-preview isolation;
- stable zone/level output for identical completed bars;
- technical formula fixture correctness;
- cross-surface snapshot identity;
- 24/7 session matrix;
- provider disagreement/stale/missing fail-closed behavior;
- no direct canonical-price bypass in production surfaces;
- no unexplained decision/level changes;
- existing V8/V9.2/V9.3/V9.3.1 gates remain green.

A deployed live audit remains required before production validation; local code tests cannot prove provider behavior on real credentials.

## Non-goals
- Do not claim proprietary TradingView indicator parity or copy proprietary scripts.
- Do not add paid AI/runtime dependencies.
- Do not enable live-money automatic trading.
- Do not advance to V9.4 until V9.3.4 and the rerun V9.3 tournament pass.
