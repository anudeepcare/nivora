# AURYN V9.1 Historical Observation Factory Design

## Goal
Turn the V9 research catalog into an evidence-ready offline research system by producing deterministic, point-in-time-safe `FeatureObservation` rows from historical replay data without allowing historical data quality gaps or research results to leak into production CIO weights.

## Architectural choice
Use a vendor-neutral normalized historical replay bundle feeding a deterministic observation factory. This is preferred over (1) embedding a single provider-specific backfill client in the research engine, which couples research validity to one vendor, and (2) reconstructing observations from current live APIs, which risks look-ahead, survivorship, revisions, and rate-limit artifacts.

The flow is:

`HistoricalReplayBundle -> Dataset Quality Audit -> Compact Base Observation JSONL -> Candidate Shard Materializer -> Feature Transform/Context -> V9 Tournament`

V8.4 Market Truth, CIO, execution, broker, and the V9 production allowlist remain unchanged.

## Historical replay bundle
The normalized input is versioned and contains:

- `meta`: dataset id/version, source description, benchmark symbol, adjusted-price guarantee, point-in-time universe guarantee, delisted-security coverage, delisting-return handling, and generated-at timestamp.
- `securities`: symbol, archetype, sector/industry, active-from/active-to, optional delisted date and delisting return.
- `dailyBars`: ascending historical OHLCV records with symbol/date/open/high/low/close/volume and an explicit adjusted flag.
- `benchmarkBars`: equivalent bars for the benchmark.
- `facts`: optional point-in-time metric facts with `metric`, `value`, `periodEnd`, and mandatory `availableAt`. A fact cannot affect an observation before `availableAt`.
- `events`: optional point-in-time event/estimate/options/news-derived metric observations, each with mandatory `availableAt`.
- `universeSnapshots`: optional dated membership snapshots proving historical membership beyond the current surviving universe.

Missing optional evidence remains missing. The factory never fills historical facts with today's values.

## Dataset quality gates
Before generating decision-grade observations, the factory audits:

1. Price bars are explicitly adjusted for corporate actions.
2. Bars are ascending, unique by symbol/date, finite, and OHLC-valid.
3. Point-in-time facts/events have `availableAt`; period-end alone is not accepted as public availability.
4. Universe metadata proves point-in-time membership, inclusion of removed/delisted names, and delisting-return handling for `DECISION_GRADE` survivorship status.
5. Benchmark coverage spans the observation/outcome period.
6. Duplicate/revised facts resolve by the latest item actually available as of the historical observation date, never by future revision.

Quality is `DECISION_GRADE`, `LIMITED`, or `INVALID`. `INVALID` blocks generation. `LIMITED` may generate research observations but marks the manifest so promotion cannot be claimed as survivorship-safe.

## Observation clock and horizons
Observations are created only on completed daily bars. The observation `asOf` is the completed session date; no partial current-day bar is consumed.

V9 horizon labels map to trading sessions:

- `1D` -> 1 session
- `5D` -> 5 sessions
- `20D` -> 20 sessions
- `90D` -> 63 sessions
- `180D` -> 126 sessions
- `1Y` -> 252 sessions

Forward return uses adjusted close from the observation bar to the exact future trading-session index. If the dataset does not contain the full future path, the observation is dropped rather than extrapolated. Maximum drawdown is calculated from the forward path through that horizon. Benchmark return uses the benchmark's aligned completed session and horizon.

## Base metric reconstruction
V9.1 computes a point-in-time price/volume research core directly from historical bars, including moving-average/trend state, RSI variants, MACD, ADX/DMI, stochastic, CCI, ROC, MFI, Bollinger, ATR/realized volatility, relative volume, OBV/CMF/accumulation-distribution, support/resistance distance, breakout/base structure, Donchian-style range structure, relative strength versus benchmark, and VWAP-distance proxies where the underlying data supports them.

Non-price metrics (fundamentals, earnings revisions, quality, valuation, narrative/catalyst, macro, options, microstructure, portfolio context) are read only from point-in-time `facts/events` with `availableAt <= asOf`. If a source is not present historically, those base metrics are omitted rather than fabricated.

## Transform engine
For each catalog candidate whose base metric exists as of a date, V9.1 derives:

- `LEVEL`
- `SLOPE`
- `ACCELERATION`
- `PERCENTILE`
- `DIVERGENCE`
- `CROSSOVER`
- `ZSCORE`
- `REGIME_NORMALIZED`

Transforms use only historical values at or before the observation date. A transform with insufficient history returns missing and emits no observation.

## Context engine
Contexts are confirmations, not extra future information. `NONE` uses the raw transformed signal. Sector, market-regime, volume, trend, valuation, earnings, and risk confirmations can only use point-in-time values available by the same `asOf`. If a requested confirmation is unavailable, that candidate/date is skipped rather than silently falling back to `NONE`.

## Regime and archetype
Archetype comes from the historical security record when available; otherwise `UNKNOWN`. Market regime is derived only from benchmark history available as of the observation date using trend and realized-volatility state, producing deterministic labels such as `RISK_ON`, `RISK_OFF`, `HIGH_VOL`, or `NEUTRAL`.

## Cost model
Each observation carries `costBps`. When a point-in-time slippage estimate is present it is used; otherwise the factory applies a documented deterministic default cost assumption. Costs are never negative and are capped by a research sanity limit.

## Output and scale
The canonical factory output is compact newline-delimited **base observation JSON** (`.jsonl`): one sparse row per symbol/date containing point-in-time metrics plus all available forward-horizon outcomes. The factory does **not** expand 46,464 candidates across every symbol/date because that would create billions of redundant rows.

Candidate feature observations are materialized later in deterministic catalog shards (for example 250-1000 candidates at a time). Transforms are computed from each symbol's historical base-metric series, contexts are applied at the same `asOf`, and the candidate's configured horizon selects the matching forward label. This preserves exact V9 semantics while keeping storage and memory bounded.

A sidecar manifest records:

- source dataset id/version
- quality grade and warnings
- symbols/dates processed
- observations written
- candidates with evidence
- missing-data counts by family/base metric
- skipped rows by reason
- horizon counts
- archetype/regime counts
- survivorship/corporate-action guarantees

The V9 tournament CLI is extended to accept both JSON arrays and JSONL observations.

## Production boundary
The Historical Observation Factory can create research data and run the tournament only. It cannot edit `lib/auryn/v9/production-registry.ts`, CIO weights, Market Truth, broker state, or trading permissions. `PRODUCTION_CANDIDATE` remains a research state requiring explicit versioned promotion.

## Success criteria
- Identical bundle + options yields identical observations and manifest.
- Any future-dated fact/event is absent from earlier observations.
- Current-day/partial bars are never used in historical daily features.
- Incomplete forward horizons are dropped.
- Corporate-action/universe quality limitations are visible and cannot be mistaken for decision-grade evidence.
- V9.1 base JSONL can be materialized into deterministic candidate shards consumable by the V9 tournament.
- Full-catalog research can be distributed across shards and finalized with global multiple-testing control; V9.1 never pretends a partial shard is the full tournament.
- Existing V8.4/V9 production behavior and all legacy tests remain green.
