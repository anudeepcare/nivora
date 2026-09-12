# AURYN V9.7 — CIO Engine Design

## Goal
Upgrade AURYN from a conservative six-pillar score/gate engine into a two-speed capital-allocation system that distinguishes long-term business quality from tactical deployment, preserves thesis stability through noisy quarters, penalizes persistent business deterioration, and produces better differentiated new-money/owner/long-term actions without touching the approved UX.

## Locked
- No visual, layout, theme, PWA, navigation, copy-layout or component-geometry changes.
- Market Truth remains authoritative.
- Missing evidence is uncertainty, never automatically bearish.
- No forced quota for BUY/START_SMALL/BUILD/HIGH_CONVICTION.
- The engine may remain conservative when evidence supports conservatism.
- Current market price cannot be used to manufacture independent intrinsic value.

## Research principles synthesized
The engine uses public, testable principles rather than copying any investor:
- Owner earnings, capital allocation, reinvestment runway and durable economics.
- Quality research: profitability, growth quality, safety and shareholder discipline.
- Gross profitability and incremental returns on invested capital.
- Earnings-quality / cash-conversion checks.
- Independent valuation and expectations-based reasoning.
- Momentum/relative-strength/trend as deployment/timing signals, not business-quality signals.
- Cycle/risk awareness, downside control and asymmetric payoff.
- Opportunity cost and portfolio context as sizing/ranking concepts.

## Architecture

### 1. Slow Brain — Compounder Quality
A normalized 0–100 score combining:
- durable business quality
- earnings/fundamental durability
- capital-allocation/reinvestment quality
- evidence quality

The slow brain cannot be materially downgraded by technical weakness alone.

### 2. Thesis Persistence and Deterioration
A deterioration score requires corroboration. One weak input does not break a thesis.
- one weak fundamental family => noise/watch
- two materially weak families => deterioration
- three+ weak families or explicit structural invalidation => severe deterioration

The deterioration score affects long-term action and owner action more strongly than new-money timing.

### 3. Fast Brain — Deployment Quality
Uses valuation, market structure, catalysts/regime, risk/asymmetry and evidence completeness.
Its job is to answer when/how aggressively to deploy, not whether the business is a generational compounder.

### 4. Expected Return / Expectations Gap
Given an independent value estimate when available:
expectedReturnPct = ((independentBaseValue / marketPrice)^(1 / horizonYears) - 1) * 100

When independent value is unavailable, valuation score is treated as a bounded proxy with lower confidence, never converted into a fake price target.

### 5. CIO Decision
New-money ladder:
AVOID → WAIT → START_SMALL → BUY → STRONG_BUY

Existing-owner ladder:
EXIT → REDUCE → WATCH → HOLD → ADD

Long-term:
UNATTRACTIVE → SELECTIVE → ATTRACTIVE

A durable high-quality company with merely mixed timing may be ATTRACTIVE + HOLD + WAIT/START_SMALL rather than being flattened into one generic WAIT.

### 6. Decision confidence
Confidence is multiplicative, not additive:
confidence = evidenceCompleteness × agreementFactor × noMissingValuationPenalty

Conflicting evidence lowers sizing confidence without automatically lowering business quality.

### 7. Counterfactual decision triggers
Each decision returns the most relevant upgrade and downgrade conditions:
- valuation/expected return
- market structure
- risk/asymmetry
- fundamental deterioration

### 8. Calibration
V9.7 must emit deterministic diagnostics for:
- action distribution
- dominant blockers
- long-term/new-money disagreement
- high-quality WAIT cases
- deterioration cases
- scenario anchoring
- score sensitivity

## Formula policy
No single indicator can dominate.
Business quality and deterioration affect 3–5 year thesis.
Valuation and expected return affect capital attractiveness.
Technical structure affects timing/deployment.
Risk/asymmetry affects action intensity and sizing.
Evidence completeness affects confidence.
