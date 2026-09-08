# AURYN V9.1 Historical Replay Contract

V9.1 generates point-in-time research evidence for the **46,464** V9 candidate hypotheses without materializing the full candidate universe at every historical date.

## 1. Replay bundle

The input is a JSON object with these top-level keys:

```json
{
  "meta": {
    "datasetId": "my-history-v1",
    "version": "2026-09-08",
    "source": "licensed-market-data + SEC",
    "benchmarkSymbol": "SPY",
    "adjustedPrices": true,
    "pointInTimeUniverse": true,
    "includesDelisted": true,
    "delistingReturnsHandled": true,
    "generatedAt": "2026-09-08T15:00:00Z"
  },
  "securities": [],
  "dailyBars": [],
  "benchmarkBars": [],
  "facts": [],
  "events": [],
  "universeSnapshots": []
}
```

### `securities`

```json
{
  "symbol": "NVDA",
  "archetype": "SEMICONDUCTOR_CYCLICAL",
  "sector": "Technology",
  "industry": "Semiconductors",
  "activeFrom": "1999-01-22",
  "activeTo": null,
  "delistedDate": null,
  "delistingReturnPct": null
}
```

Removed/delisted names belong in the historical security master. If a security disappears before a forward horizon, an explicit delisting return is required for survivorship-safe outcome handling.

### `dailyBars` / `benchmarkBars`

```json
{
  "symbol": "NVDA",
  "date": "2025-01-15",
  "open": 132.1,
  "high": 136.4,
  "low": 131.6,
  "close": 135.2,
  "volume": 182000000,
  "adjusted": true
}
```

Bars must be ascending within each symbol, unique by symbol/date, finite, OHLC-valid, and explicitly adjusted for corporate actions. An unadjusted bundle is `INVALID` for V9.1 observation generation.

### `facts` and `events`

```json
{
  "symbol": "NVDA",
  "metric": "revenue_growth",
  "value": 78.0,
  "periodEnd": "2024-10-27",
  "availableAt": "2024-11-20"
}
```

`availableAt` is mandatory. V9.1 will not expose the row before that date. `periodEnd` describes the economic period and is **not** evidence that the information was public then.

Use this same structure for historical estimates, revisions, valuation, options, macro, narrative, catalyst, microstructure, or other metrics. If a trustworthy point-in-time history does not exist, omit the metric.

### `universeSnapshots`

```json
{
  "date": "2025-01-15",
  "symbols": ["AAPL", "MSFT", "NVDA"]
}
```

Dated membership snapshots are part of the survivorship-bias control. Current constituents alone are not enough to claim `DECISION_GRADE` history.

## 2. Quality states

### `DECISION_GRADE`

Requires all of the following:

- valid adjusted bars
- point-in-time universe guarantee
- dated universe snapshots
- explicit delisted/removed security coverage
- delisting-return handling
- mandatory `availableAt` on facts/events

### `LIMITED`

The bundle is structurally usable, but one or more survivorship/universe guarantees are missing. V9.1 preserves the warnings in the sidecar manifest. Exploratory research is allowed; the result must not be represented as fully survivorship-safe evidence.

### `INVALID`

Examples include unadjusted bars, duplicate/invalid OHLC records, missing benchmark data, or facts/events without a valid `availableAt`. Generation stops.

## 3. Compact base observation JSONL

Run:

```bash
npm run observations:v91 -- --input=/path/replay-bundle.json --output=/path/base-observations.jsonl
```

Each JSONL row contains one symbol/date snapshot:

```json
{
  "symbol": "NVDA",
  "asOf": "2025-01-15",
  "archetype": "SEMICONDUCTOR_CYCLICAL",
  "sector": "Technology",
  "regime": "RISK_ON",
  "benchmarkSymbol": "SPY",
  "close": 135.2,
  "metrics": {
    "rsi14": 0.31,
    "macd_histogram": 0.42,
    "revenue_growth": 78.0
  },
  "outcomes": {
    "20D": {
      "horizon": "20D",
      "sessions": 20,
      "forwardReturnPct": 5.7,
      "benchmarkReturnPct": 1.9,
      "maxDrawdownPct": -6.2
    }
  },
  "costBps": 10
}
```

Horizon mapping is trading-session based:

- `1D` = 1
- `5D` = 5
- `20D` = 20
- `90D` = 63
- `180D` = 126
- `1Y` = 252

If the full future path for a horizon is unavailable, that horizon is omitted. V9.1 does not extrapolate.

## 4. Candidate shard materialization

Run:

```bash
npm run materialize:v91 -- --base=/path/base-observations.jsonl --output=/path/feature-observations.jsonl --candidate-start=0 --candidate-limit=500
```

The shard uses the deterministic V9 catalog ordering. Optional family/theory filters can narrow research. The resulting rows match the V9 `FeatureObservation` contract and can be passed directly to:

```bash
npm run research:v9 -- --observations=/path/feature-observations.jsonl
```

A candidate shard is not the complete 46,464-hypothesis tournament. Global false-discovery conclusions require combining the full intended hypothesis family under one correction scope.

## 5. Missing data

Missing historical evidence is omitted, never converted to zero and never backfilled with current values. Context-dependent candidates are skipped when the same-date confirmation evidence is unavailable.

## 6. Production safety

The observation factory and shard materializer are research-only. They cannot edit CIO weights, Market Truth, broker permissions, execution state, or the V9 production registry. A research result becoming `PRODUCTION_CANDIDATE` still does not make it `PROMOTED`.
