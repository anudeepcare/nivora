# AURYN V9.9.9.38 — Trading Lab Canonical Provenance + Compact UX

## Root cause
Trading Lab queried `nivora_v59_decision_snapshots` using the legacy `v65.2` engine filter, while current autonomous canonical research is persisted as `auryn-v9.8`. Portfolio Learning creates V65 validation snapshots, but those snapshots intentionally do not carry the V9.3.1/V9.3.4/V9.3.5 autonomous execution provenance. Trading Lab therefore selected the wrong snapshot family and blocked every symbol with `V935_CANONICAL_SNAPSHOT_MISSING`.

## Fix
- Autonomous research persistence now writes a V9.3.5 canonical provenance envelope at the same time as V9.3.1 decision and V9.3.4 market-intelligence evidence.
- A pure V9.3.5 provenance builder is shared with the canonical loader so snapshot IDs use one contract.
- Trading Lab paper runner reads `auryn-v9.8` autonomous research snapshots.
- Trading Lab status/audit reads the same autonomous snapshot family.
- Portfolio Learning remains a validation/learning pipeline and is no longer accidentally treated as execution provenance.
- Trading Lab server-to-server calls prefer `CRON_SECRET`, retaining the legacy secret only as fallback.
- Confirmed-working Portfolio Learning workflow remains `AURYN_BASE_URL + CRON_SECRET`.

## UX
- Top status now describes the latest paper check, not lifetime historical order totals.
- Five oversized funnel cards are replaced by four compact current-check metrics.
- Historical paper orders and completed round trips are clearly separated from the current run.
- Recent decisions use a compact two-column desktop grid.
- Old V9.3.5 implementation jargon is translated to “Canonical research snapshot is not ready yet”.
- Mobile layout remains single-column.

## Important after deploy
Existing old decision snapshots do not magically gain V9.3.5 provenance. Run/wait for one successful Autonomous Market Cycle after deployment, then run Trading Lab. New autonomous snapshots will contain the complete provenance chain.

## Verification
V38 focused tests and the complete V37/V36/V35/V34/V33/V32/V31.1 + legacy regression chain pass.
