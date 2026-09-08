# AURYN V9.1 — Historical Observation Factory

V9.1 turns the V9 Research Lab from a hypothesis catalog into an evidence-ready historical replay pipeline. It creates compact, deterministic, point-in-time base observations and materializes V9 feature candidates in bounded shards for tournament testing.

## What V9.1 adds

- A vendor-neutral historical replay bundle contract.
- Strict historical dataset quality audit with `DECISION_GRADE`, `LIMITED`, and `INVALID` states.
- Corporate-action safety: unadjusted historical price bars are rejected.
- Point-in-time fact/event resolution using mandatory `availableAt` timestamps. Fiscal period-end dates never substitute for public availability.
- Survivorship controls for dated universe membership, removed/delisted securities, and delisting returns.
- Exact trading-session outcome labels for `1D`, `5D`, `20D`, `90D` (63 sessions), `180D` (126), and `1Y` (252).
- Forward benchmark returns and maximum drawdown labels.
- Broad price/volume historical metric reconstruction plus sparse passthrough of point-in-time fundamental, valuation, earnings, options, narrative, macro, microstructure, and other vendor metrics.
- All eight V9 transforms and same-date context confirmation gates.
- Compact base-observation JSONL rather than expanding 46,464 candidates across every symbol/date.
- Deterministic candidate shard materialization for bounded research runs.
- V9 tournament JSONL ingestion.

## Why compact base observations

Naively expanding 46,464 candidates across hundreds of stocks and years of dates can create billions of redundant rows. V9.1 stores one sparse point-in-time base snapshot per symbol/date, then materializes selected catalog shards on demand. This preserves the full research universe while keeping storage and memory bounded.

## Commands

Create compact point-in-time base observations:

```bash
npm run observations:v91 -- --input=/absolute/path/replay-bundle.json --output=/absolute/path/base-observations.jsonl
```

Materialize a deterministic candidate shard:

```bash
npm run materialize:v91 -- --base=/absolute/path/base-observations.jsonl --output=/absolute/path/feature-observations.jsonl --candidate-start=0 --candidate-limit=500
```

Run the existing V9 tournament on that feature shard:

```bash
npm run research:v9 -- --observations=/absolute/path/feature-observations.jsonl
```

A feature shard is intentionally labeled partial. A shard result must not be represented as full-catalog false-discovery evidence.

## Research integrity

V9.1 refuses to create `DECISION_GRADE` evidence when survivorship, delisting, or corporate-action guarantees are missing. A `LIMITED` dataset may still be useful for exploratory research, but its manifest preserves those limitations.

Missing historical evidence remains missing. V9.1 does not reuse today's valuation, analyst estimates, news, options positioning, or revised fundamentals in historical dates.

## Production boundary

V9.1 is research-only. It does not modify:

- Market Truth
- the production CIO
- execution plans
- portfolio sizing
- broker permissions
- paper/live execution state
- `lib/auryn/v9/production-registry.ts`

`PRODUCTION_CANDIDATE` still requires explicit versioned promotion. No production weights are changed by generating observations or running the tournament.

See `docs/V9_1_HISTORICAL_REPLAY_CONTRACT.md` for the replay schema and quality rules.
