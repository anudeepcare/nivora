# AURYN V6 — 9+ Proof OS Design

## Goal
Move AURYN from a strong decision/research product to a professional-grade, evidence-disciplined decision operating system whose reliability is measured continuously and whose execution risk is bounded. “9+” refers to software/data/decision-process quality and validation discipline, not a guaranteed market win rate.

## Core Principles
1. **One truth path** — Market Truth → canonical evidence snapshot → specialist engines → CIO → execution plan → broker/learning.
2. **Evidence confidence is not predictive probability** — current snapshot quality and historical model proof are displayed separately.
3. **Proof before promotion** — production weights are frozen. New logic is a challenger until exact-engine outcomes satisfy promotion gates.
4. **No silent self-tuning** — learning updates evidence and challenger rankings, never mutates the live engine in place.
5. **Portfolio context can change sizing/action for the user, never rewrite the independent company thesis.**
6. **Full professional metrics stay available** with interpretation, role, source, timeframe, and clean formatting.
7. **Price-sensitive decisions fail closed** whenever Market Truth is not verified.

## New V6 Layers

### 1. Proof & Learning Engine
Consumes immutable decision snapshots and matured benchmark-relative outcomes. Computes:
- exact-engine sample size by horizon;
- hit rate / average alpha;
- max drawdown distribution;
- Brier/ECE when confidence-like inputs are eligible;
- archetype × horizon × regime cohorts;
- action-ladder monotonicity (Strong Buy > Buy > Hold > Reduce > Sell by future alpha);
- regime stability and concentration of evidence.

It emits a **Model Proof Grade**:
- `UNPROVEN` — insufficient exact-engine evidence;
- `EMERGING` — some matured evidence but promotion criteria not met;
- `VALIDATED` — core gates met;
- `ELITE` — stricter gates met across multiple horizons/regimes.

No grade is treated as a probability of profit.

### 2. Champion / Challenger Promotion Gate
A challenger can only be promoted by creating a new immutable engine version. Promotion requires minimum samples, positive benchmark-relative performance, acceptable drawdown, monotonic decision ladder, and evidence across multiple regimes. Auto-promotion remains disabled.

### 3. Confidence Separation
Every V6 analysis exposes:
- **Evidence Confidence** — quality/completeness/agreement of current inputs;
- **Model Proof** — historical evidence for this exact engine/cohort;
- **Decision Strength** — current decision conviction after risk/valuation/timing resolution.

The UI must never label Evidence Confidence as win probability.

### 4. Multi-Timeframe Technical Regime
Daily technical analysis remains the execution anchor. Weekly bars are derived deterministically from verified daily bars and analyzed through the same technical engine. V6 exposes:
- daily setup state;
- weekly structural regime;
- alignment / conflict state;
- weekly support/extension context.

Weekly and daily disagreement changes sizing/timing, not the company thesis.

### 5. Portfolio CIO Overlay
Given funded holdings, concentration, correlations, sector/archetype exposure, and the independent AURYN call, the overlay returns:
- portfolio action (`ADD`, `HOLD`, `REDUCE_EXPOSURE`, `BLOCK_ADD`);
- max suggested new-position percentage;
- concentration reason;
- correlation/archetype exposure warnings;
- whether the independent stock call is being constrained only because of portfolio context.

### 6. Valuation Method Registry
V6 makes valuation method explicit by business model and lifecycle rather than pretending one multiple applies to all companies. It returns method families such as:
- FCF/earnings/DCF for mature compounders;
- EV/Sales + FCF trajectory for SaaS/growth;
- cycle-normalized earnings for memory/cyclicals;
- SOTP/capacity/contract economics for AI-power infrastructure;
- scenario/runway/dilution for frontier/pre-commercial;
- P/B/ROE/NIM for banks;
- FFO/AFFO for REITs.

When required inputs are unavailable, valuation remains unavailable/partial and new-money conviction is capped instead of receiving a fake bearish zero.

### 7. Model Health API + UI
A new `/api/model-health` endpoint reads exact-engine snapshots/outcomes and emits the proof grade, promotion eligibility, action-ladder checks, horizon evidence, and weaknesses. Calibration becomes a true Model Health console, not only a table of pooled historical metrics.

### 8. Canonical Learning Payload
Validation snapshots persist the V6 canonical decision, execution plan, evidence-confidence state, model-proof state, and snapshot ID. Learning must never reconstruct a different decision from legacy fields.

### 9. Reliability Harness
The existing deterministic matrix remains. V6 adds invariants for:
- no promotion without exact-engine evidence;
- no Strong Buy proof claim from insufficient samples;
- action-ladder monotonicity checks;
- weekly/daily alignment determinism;
- portfolio overlay never mutates company thesis;
- V6 validation payload uses the same snapshot/plan shown in UI;
- execution remains blocked on unverified Market Truth.

## User Experience
### Beginner
Call → why → what to do → risk.

### Pro
Adds evidence confidence, model proof, scenario map, multi-timeframe read, portfolio overlay when available.

### Extreme Pro
Adds full metric explorer, cohort proof, action-ladder validation, source/timestamp, model-health details and audit links.

Developer engine identifiers remain in diagnostics/audit only, not the normal decision hero.

## Safety / Release Gate
V6 is suitable for research, shadow validation, and paper execution only until exact-engine forward evidence earns promotion. Live autonomous trading remains disabled by default.
