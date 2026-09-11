# AURYN V9.3.5 — Core Consolidation

## Release principle

**ONE CANONICAL SNAPSHOT** drives the product. Research, Portfolio, Monitor, Watchlist, and Trading Lab consume the same security identity, Market Truth snapshot, research decision, setup, levels, and provenance instead of rebuilding their own interpretations.

## What changed

- Added a canonical security identity and deterministic V9.3.5 snapshot contract.
- Added durable-first loading: last verified research remains usable while market data refreshes; a provider failure does not erase the product.
- Added single-symbol and batch canonical snapshot APIs.
- Research now loads the canonical snapshot first and refreshes deeper evidence in the background.
- Portfolio, Monitor, and Watchlist now consume canonical batch snapshots instead of composing scan/investment/decision-summary APIs.
- Trading Lab persists and requires V9.3.5 canonical provenance, while preserving Market Truth and hard-veto fail-closed behavior.
- Added shared low-chrome canonical UX components and a 375px mobile-first contract.
- Added canonical single/batch live audits with golden symbols, cross-surface parity, level parity, identity checks, and p50/p95/p99 latency evidence.
- Scheduled reliability probes cover premarket, regular session, after-hours, overnight/reference, and weekend/closed-market states.
- Runtime AI/Astra is not required.

## Performance and resilience contract

The browser reads AURYN's latest trusted state; it does not rebuild the entire system on every page load. Tactical enrichment may arrive later, but it cannot erase a verified decision or replace confirmed research with a full-page provider error.

## Release gate

V9.3.5 code readiness requires all prior Market Truth, historical-integrity, Feature Tournament, decision-policy, reliability, and dead-code gates to stay green.

The code gate intentionally ends at:

`CODE_READY_LIVE_VALIDATION_REQUIRED`

That is not production validation. After deployment, run the real-world audits in this order:

**30 → 100 → 500**

Do not advance to V9.4 until the deployed canonical snapshot path passes the required live/session/provider-failure evidence.
