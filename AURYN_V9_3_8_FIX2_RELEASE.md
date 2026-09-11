# AURYN V9.3.8 FIX2 — Market Truth + Fast Research

- During the regular session, stale/timestamp-unverified live quotes no longer blank Research when a usable last regular close is known.
- AURYN falls back to `OFFICIAL_CLOSE` / `RESEARCH_CLOSE`: research remains price-aware while execution stays blocked.
- The UI labels this state `Reference price · Live verification pending` during regular hours rather than incorrectly saying the market is closed.
- The existing execution-grade verification requirement is unchanged.
- Same-URL in-flight coalescing and short-lived client response caching from FIX1 remain active.
- Twelve Data regular close is reused before attempting an extra Alpaca bars fallback call.
- Deep analysis remains progressive; cached canonical research can render independently.

Verification: `npm run gate:v938fix2` passes.
