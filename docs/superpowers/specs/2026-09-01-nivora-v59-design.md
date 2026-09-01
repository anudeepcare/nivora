# NIVORA V59 — Validated Decision Platform Design

## Goal
Preserve the V58 thesis-first investor engine while making decisions versioned, reproducible, measurable, provider-resilient, and explicitly separated into long-term thesis versus Today action.

## Canonical architecture
One TypeScript investor engine remains authoritative. Company, thesis, opportunity, valuation, timing, portfolio risk and Today action are separate layers in one decision contract. Missing evidence remains uncertainty, never silent bearish evidence. Portfolio concentration may limit sizing but cannot rewrite company quality.

## V59 additions
- Canonical `v59` engine/weights/valuation/policy version constants.
- Deterministic Today policy: BUY / ADD / HOLD / WAIT / TRIM / SELL / NO ACTION with veto precedence.
- Frozen decision snapshots with deterministic evidence fingerprint and point-in-time metadata.
- Arena outcome grading at 30D/90D/180D/1Y/2Y using raw, SPY-relative and optional sector-relative returns plus drawdown.
- Reliability calibration only after minimum version-matched samples; data completeness is never predictive confidence.
- Provider request coalescing, provider-health metadata and explicit degraded/stale semantics.
- V59 persistence migration for snapshots, outcomes and reliability buckets.
- V59 health/methodology/version surfaces and regression tests.
- Release package excludes `.env.local`, `.next`, `node_modules`, `.git`, and macOS metadata.

## Invariants
Price action cannot directly rewrite company quality or long-term thesis. Unsupported valuation stays N/A. Today cannot bypass thesis/consistency vetoes. Identical evidence plus versions produces the same fingerprint. Calibration must be isolated by engine version and horizon.
