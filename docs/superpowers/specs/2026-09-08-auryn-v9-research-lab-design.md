# AURYN V9 Research Lab & Feature Tournament Design

## Goal
Create an offline-first research system that can generate and evaluate tens of thousands of candidate investment features without allowing unproven signals to influence the production CIO.

## Architecture
V8.4 remains the production truth/execution foundation. V9 adds a separate research plane:

`Historical observations -> Feature Factory -> Feature Evaluation -> Robustness/OOS gates -> Multiple-testing control -> Shadow candidates -> Promotion Gate -> Production Allowlist`

The research plane never changes live weights automatically. Promotion creates an auditable candidate record; production adoption remains explicit/versioned.

## Feature families
The catalog spans trend, momentum, volatility, volume/flow, price structure/patterns, relative strength, Fibonacci, Elliott/Wyckoff/stage-analysis context, fundamentals, earnings/revisions, quality, valuation, narrative/catalysts, sector/macro, options/positioning, microstructure and portfolio context. Each base feature can be transformed by level/slope/acceleration/percentile/divergence/crossover/z-score/regime-normalization and evaluated at multiple horizons with contextual confirmations.

## Evaluation contract
Every observation is point-in-time and contains feature signal, forward return, benchmark return, archetype, regime, horizon and transaction-cost assumptions. Evaluation produces cost-adjusted alpha, hit rate, information coefficient, downside statistics, chronological in-sample/out-of-sample results, regime stability and sample breadth.

## Anti-overfitting gates
- Chronological OOS evidence is mandatory.
- Feature families are evaluated by archetype and regime, not assumed universal.
- Benjamini-Hochberg false-discovery control is applied across tournaments.
- Promotion requires positive OOS alpha after costs, positive lower confidence bound, sufficient sample, regime breadth and stability.
- No signal is promoted solely because of in-sample performance.
- Correlated/duplicate candidates may be retained for research but cannot all independently inflate CIO weight.

## Production integration
V9 exposes a versioned production allowlist. Only explicitly promoted feature IDs are eligible for later CIO adapters. The initial release does not modify V8.4 CIO weights.

## User surfaces
- `/research-lab` shows catalog size, evidence counts and promotion states without claiming alpha where no matured observations exist.
- `/api/research-lab` exposes the same summary.
- `npm run research:v9` runs the deterministic catalog/tournament CLI; optional observation JSON can be supplied for real historical experiments.

## Reliability
Research artifacts must be deterministic for a fixed input/seed. Missing data stays missing. No future leakage is allowed. A candidate can be `UNTESTED`, `REJECTED`, `OOS_SURVIVOR`, `SHADOW`, `PRODUCTION_CANDIDATE`, `PROMOTED`, or `DEGRADED`.
