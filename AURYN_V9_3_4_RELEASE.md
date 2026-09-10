# AURYN V9.3.4 — Market Intelligence Core

**Status:** `CODE_READY_LIVE_VALIDATION_REQUIRED`

V9.3.4 replaces the daily-only technical view with one deterministic, session-aware market-intelligence snapshot shared by **Research, Portfolio, Monitor, and Trading Lab**.

## What is now canonical

- Confirmed technical state across **15M, 1H, 4H, 1D, and 1W**.
- Live preview separated from completed-bar confirmed state so an unfinished bar cannot silently rewrite the swing/strategic decision.
- Evidence-backed structural action map: preferred entry, confirmation, support, major support, T1, T2, and invalidation.
- Structural zones combine pivot clusters, moving-average structure, retracement overlap, anchored volume-weighted evidence, gap edges, and repeated reactions instead of a nearest-high/low-only rule.
- Market Structure in the institutional decision consumes confirmed V9.3.4 multi-timeframe evidence; old daily-only technical scoring remains only a fail-soft fallback.
- One persisted V9.3.4 projection is reused across Research, Portfolio, Monitor, and Trading Lab.
- Trading Lab fails closed when the canonical V9.3.4 market-intelligence proof is absent.

## 24/7 truth contract

AURYN remains research-usable through premarket, regular market, after-hours, overnight-reference, weekends, holidays, and early closes. Equity prices are never fabricated when a market is not trading: the UI carries the last verified extended/regular reference with exact Market Truth provenance, while execution remains stricter.

## Automated acceptance

Code gates verify deterministic indicators, timeframe disagreement, completed-bar stability, action-map ordering/evidence, provider fail-soft behavior, Market Truth session states, cross-surface snapshot identity, and canonical-decision bridging.

The deployed audit runs in controlled stages: **30 symbols → 100 symbols → 500 symbols**. It checks price identity, provider agreement, 24/7 research availability, confirmed timeframe coverage, evidence-backed levels, Market Truth/market-intelligence snapshot consistency, scan isolation, and cross-surface price consistency.

Scheduled audits use 30 symbols to control provider credits. The 100/500 audits are manual release evidence.

V9.3.4 does **not** authorize movement to V9.4. After deployed validation passes, the V9.3 Feature Tournament must be rerun on the improved feature universe before Model Factory work begins.
