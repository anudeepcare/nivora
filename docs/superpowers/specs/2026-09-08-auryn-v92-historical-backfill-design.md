# AURYN V9.2 Historical Data Backfill & Provider Adapters Design

## Goal
Turn V9.1's provider-neutral HistoricalReplayBundle contract into a practical, auditable historical backfill pipeline using real provider payloads while preserving strict point-in-time and survivorship honesty.

## Architecture
V9.2 adds a research-only ingestion plane upstream of V9.1. Provider adapters normalize raw payloads into canonical adjusted bars, filing-timestamped facts, security-master records, and dated universe snapshots. A separate integrity gate audits the normalized replay bundle before V9.1 may consume it.

The ingestion plane never imports or mutates production CIO, broker, live feature registry, or portfolio execution code.

## Provider adapters
1. **Twelve Data daily bars**: use `time_series`, `interval=1day`, explicit `start_date` + `end_date`, and `adjust=all`. Adapter requires positive OHLC, non-negative volume, ascending dates, and records the returned exchange/timezone metadata.
2. **SEC Company Facts**: use `data.sec.gov/api/xbrl/companyfacts/CIK##########.json`. Facts are mapped by known taxonomy concepts and use the filing date (`filed`) as `availableAt`; period end (`end`) remains only the economic period. Amendments/re-filings therefore become visible only after their filing date.
3. **Security master / universe inputs**: normalized from explicit research input. V9.2 must not claim survivorship safety unless dated universe membership, removed/delisted names, and delisting handling are actually present.
4. **Twelve Data corporate actions + earnings**: retain split/dividend events independently from adjusted bars; normalize full earnings-release history and derive point-in-time surprise streaks. Network fetching is opt-in because these endpoints consume additional credits.
5. **Revision / sector rows**: accept only explicit point-in-time research rows with a verified `availableAt`; never backdate a current analyst snapshot.
6. **FRED/ALFRED macro vintages**: use `realtime_start` as public availability so later macro revisions cannot leak backward.
7. **Security master / universe inputs** remain mandatory for survivorship-safe claims, including dated membership, removed/delisted names, and delisting handling.

## Backfill modes
- `normalize:v92`: normalize provider payload files into a replay bundle without network access.
- `backfill:v92`: optional network fetch using `TWELVE_DATA_API_KEY`, `SEC_USER_AGENT`, symbol/CIK mapping, start/end dates, benchmark, and explicit universe/security-master input.
- `audit:v92-data`: audit an existing replay bundle and emit machine-readable integrity/coverage report.
- `gate:v92`: compile + all tests + V9.2 core + V8 reality/production audits; if `AURYN_V92_REPLAY_BUNDLE` is present, also require the real dataset integrity gate.

## Release gates
Hard failures:
- any future availability (`availableAt` after observation use is handled by V9.1; V9.2 rejects malformed availability)
- duplicate bars
- non-adjusted provider bars presented as adjusted
- invalid OHLC geometry
- unsorted provider history after normalization
- duplicate SEC fact identity with contradictory values at same filing timestamp
- benchmark missing or corrupted
- dataset meta falsely claims point-in-time universe / delisting safety without supporting records
- non-deterministic replay normalization

Warnings / limited quality:
- missing dated universe snapshots
- missing delisted names / delisting returns
- sparse fundamentals
- provider coverage gaps
- provider coverage gaps for a required canonical family (the strict real-data gate blocks release even if the structural audit itself can still emit a report)

## Success criteria
- Deterministic adapter output for identical inputs.
- Twelve Data adapter emits adjusted ascending daily bars and refuses malformed responses.
- SEC adapter maps facts with `availableAt=filed`, never `periodEnd`.
- Integrity report exposes coverage by symbol/year/family, expected-vs-missing benchmark sessions, corporate-action corruption, and survivorship limitations.
- A V9.2 replay bundle passes unchanged into V9.1.
- No research adapter imports production decision/execution mutation paths.
- Master release gate prints PASS/BLOCKED with explicit sub-gates and requires `FUNDAMENTALS,EARNINGS,REVISION,SECTOR,MACRO,CORPORATE_ACTIONS` for a real V9.2 release.
