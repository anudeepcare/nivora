# AURYN V9.3 — Deterministic Feature Tournament

V9.3 is the scientific selection layer between the V9.2/V9.1 point-in-time evidence system and the future V9.4 Model Factory.

## Milestone
AURYN must disposition the complete **46,464** hypothesis catalog under one reproducible tournament. Each feature is evaluated with purged chronological walk-forward OOS evidence, benchmark-relative returns, stated transaction costs, 2x cost stress, deterministic bootstrap confidence intervals, IC, hit rate, drawdown, fold/regime/archetype/sector stability, minimum sample requirements and a single global Benjamini-Hochberg/FDR correction scope.

A feature that passes every gate becomes only a **`V94_CANDIDATE`**. There is **no automatic production promotion**. V9.3 does not change CIO weights, setup states, portfolio policy, Market Truth or broker permissions.

## Deterministic policy
The policy is versioned and fixed in `lib/auryn/v93/policy.ts`. The bootstrap seed is fixed, and each feature derives a deterministic per-feature seed. Identical inputs must produce identical result ordering, metrics, dispositions and deterministic fingerprints.

## Automated outputs
A full run creates:
- `auryn-v93-tournament-report.json`
- `auryn-v93-survivor-registry.json`
- `auryn-v93-rejections.jsonl`
- `auryn-v93-run-manifest.json`

The survivor registry is research-only and cannot be loaded as the production V9 allowlist.

## Commands
```bash
npm run research:v93 -- \
  --base=/path/base-observations.jsonl \
  --manifest=/path/base-observations.jsonl.manifest.json \
  --output-dir=/path/v93-output
```

Audit a completed full-catalog run and compare it with its deterministic twin:
```bash
npm run audit:v93-report -- \
  --report=/path/run-1/auryn-v93-tournament-report.json \
  --run-manifest=/path/run-1/auryn-v93-run-manifest.json \
  --second-run-manifest=/path/run-2/auryn-v93-run-manifest.json
```

Strict release gate:
```bash
AURYN_V92_REPLAY_BUNDLE=/path/auryn-v92-replay.json \
AURYN_V93_BASE_OBSERVATIONS=/path/base-observations.jsonl \
AURYN_V93_OBSERVATION_MANIFEST=/path/base-observations.jsonl.manifest.json \
npm run gate:v93 -- --require-data
```

## Pass condition
V9.3 may pass with **zero survivors**. Scientific evidence is allowed to say that none of the 46,464 hypotheses earned advancement. What is forbidden is advancing an unproven feature.

The gate passes only when upstream V9.2 evidence is decision-grade, all 46,464 canonical IDs are dispositioned exactly once, global FDR scope is complete, every `V94_CANDIDATE` passes every automated check, the research/production boundary is intact, and two complete identical-input runs have the same deterministic fingerprint.

## Release state
The source implementation can be code-ready while the milestone remains **BLOCKED**. V9.3 is not complete until the real V9.2/V9.1 dataset is supplied and `npm run gate:v93 -- --require-data` passes. Only then may AURYN advance to V9.4.
