# AURYN V9.2 — Historical Data Backfill & Provider Adapters

V9.2 is the real-data ingestion layer for the V9/V9.1 Research Lab. It normalizes adjusted historical market data and filing-timestamped fundamental facts into the V9.1 point-in-time replay contract.

## Added
- Twelve Data adjusted daily-bar adapter with explicit start/end dates and `adjust=all` semantics.
- SEC Company Facts adapter using `filed` as public `availableAt`; economic `periodEnd` never substitutes for filing availability.
- Derived point-in-time fundamental metrics including revenue growth/acceleration, gross/operating/FCF margin, EPS/FCF growth, dilution, leverage, ROE, cash conversion, and net cash/debt where source facts permit.
- Deterministic historical replay bundle assembler.
- Historical integrity/coverage audit with hard failures for invalid prices, contradictory facts, false survivorship claims, and corrupted benchmark data.
- Network backfill CLI plus offline normalization CLI.
- Master `gate:v92` release command. With `AURYN_V92_REPLAY_BUNDLE` and `--require-data`, the release is blocked unless the real bundle is DECISION_GRADE and meets coverage/history thresholds.

## Safety boundary
V9.2 is research-only. It does not change production weights, approve V9 candidates, write the production feature registry, place orders, or relax Market Truth / broker gates. Missing historical options/news/revisions/macro data remains missing.

## Required before V9.3
A real replay bundle must pass `AURYN_V92_REPLAY_BUNDLE=/path/replay.json npm run gate:v92 -- --require-data` with zero hard integrity failures, point-in-time/survivorship requirements satisfied, and the configured coverage/history floors met.
