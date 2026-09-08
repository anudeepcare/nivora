# AURYN V9 — Research Lab & Feature Tournament

V9 adds a separate research plane on top of the proven V8.4 Market Truth / CIO / paper-execution foundation. It does **not** replace or silently mutate production decision weights.

## Candidate feature universe

V9 deterministically generates **46,464 candidate hypotheses** from:

- 121 base metrics
- 15 feature families
- 32 theory groups
- 8 transforms
- 6 forward horizons
- 8 contextual confirmations

Coverage includes trend, RSI/MACD/ADX/DMI/Ichimoku, Bollinger/Keltner/ATR, volume/OBV/CMF/MFI, support/resistance, Fibonacci, Elliott, Wyckoff, Weinstein, Darvas, relative strength, anchored VWAP, CAN SLIM-style factors, fundamentals, earnings/revisions, quality, valuation, narrative/catalysts, sector/macro, options positioning, microstructure and portfolio context.

## Feature Tournament

Historical point-in-time observations are evaluated with:

- transaction-cost-adjusted benchmark-relative edge
- chronological in-sample / out-of-sample split
- out-of-sample bootstrap confidence interval
- information coefficient
- hit rate and drawdown context
- archetype / regime breadth
- regime stability
- Benjamini-Hochberg false-discovery control

In-sample-only winners cannot be promoted.

## Promotion discipline

Research states are:

`UNTESTED -> REJECTED / OOS_SURVIVOR -> SHADOW -> PRODUCTION_CANDIDATE`

`PRODUCTION_CANDIDATE` is still **not PROMOTED**. Production adoption requires an explicit approved feature ID and versioned registry. Automatic CIO-weight mutation remains OFF.

## Surfaces

- `/research-lab` — catalog and promotion discipline
- `/api/research-lab` — research summary API
- `npm run research:v9` — catalog/tournament CLI

With no dataset, the CLI reports catalog breadth only:

```bash
npm run research:v9
```

With point-in-time observations:

```bash
AURYN_V9_OBSERVATIONS=/absolute/path/observations.json npm run research:v9
```

or

```bash
npm run research:v9 -- --observations=/absolute/path/observations.json
```

See `docs/V9_RESEARCH_DATA_CONTRACT.md`.

## Safety boundary

V8.4 Market Truth, canonical price roles, Security Master, canonical trust, Portfolio CIO, Alpaca Paper and live-money disablement remain unchanged. V9 research output cannot place orders and cannot silently change production weights.
