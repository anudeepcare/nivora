# AURYN V7 Trust & Precision OS Design

## Goal

Upgrade V6 Proof OS into a 9.5-target trust/precision release without replacing the proven architecture. V7 must preserve the mobile experience, full professional metric depth, Market Truth, model proof, portfolio CIO, paper execution, and canonical decision path while eliminating the remaining duplicated scenario/level logic and scattered presentation semantics.

## Non-negotiable invariants

1. One verified Market Truth snapshot is the only price anchor for price-sensitive output.
2. One CIO decision is authoritative across hero, Thesis, Business, Earnings, Technicals, Ownership, Catalysts, Options, Portfolio and paper execution.
3. One ExecutionPlan owns initial/watch zone, DCA tiers, confirmation, invalidation and targets.
4. Scenario Map consumes the ExecutionPlan; it never invents a competing trigger, buy zone, invalidation or target set.
5. Missing evidence remains N/A and never becomes a bearish zero.
6. HOLD/REDUCE/SELL never displays an active DCA instruction.
7. Full professional metrics remain available. Beginner/Pro/Extreme Pro change presentation depth only.
8. Mobile behavior is preserved and protected; desktop is an expansion of the same components.
9. Model Proof remains historical evidence, not probability of profit.
10. Live autonomous execution stays disabled until validated promotion gates are satisfied.

## Canonical scenario model

The AURYN Setup Map becomes a signature interpretation layer over the same snapshot and ExecutionPlan.

It exposes:
- setup state (breakout ready, base building, early reversal, trend continuation, breakdown, etc.)
- structural regime and confluence score
- bull/base/bear cases
- new-money posture and owner posture
- trigger/confirmation
- canonical accumulation/watch zone
- DCA tiers only when ExecutionPlan.intent = ACCUMULATE
- canonical invalidation
- canonical T1/T2 targets
- wave context as probabilistic supporting context only
- confidence label, never uncalibrated probability

The bull case uses canonical confirmation/entry/targets/invalidation. The base and bear cases may describe structural context, but cannot introduce a second actionable execution plan.

## Presentation contract

Every metric is rendered by a central formatter/schema contract. No raw floating-point output is allowed. Metric value, state, role, timeframe, source class and interpretation remain available in Extreme Pro.

Hero core evidence order:
- Thesis Strength
- Business Quality
- Technical Strength
- Entry Quality
- Valuation
- Risk Pressure

Secondary timing context (such as RSI) appears as supporting evidence rather than displacing core decision factors.

Pro shows concise interpreted factors. Extreme Pro exposes full metric explorer, model proof, weekly alignment and valuation methodology.

Developer identifiers and raw engine/version internals stay out of the normal research surface.

## Mobile contract

At <= 620px:
- hero becomes one column
- core factors become 2-column compact cards
- horizon cards remain 2x2
- Scenario Map shows setup summary first, then Bull/Base/Bear as stacked cards
- ExecutionPlan cards stack without horizontal page overflow
- metric explorer remains grouped accordion content
- all values wrap safely without label/value concatenation

## Reliability validation

Add deterministic tests for:
- Scenario Map snapshot ID equals ExecutionPlan snapshot ID
- bull trigger/zone/invalidation/targets equal canonical ExecutionPlan
- HOLD/REDUCE/SELL do not publish DCA tiers
- blocked Market Truth blocks scenario price levels
- hero metric order and risk separation
- full metric formatting contract
- no raw long decimals in rendered pro surfaces
- mobile CSS contracts and no forced fixed-width grids
- V6 proof and portfolio CIO remain intact

## Release boundary

V7 is a trust/precision and scenario-orchestration release. It does not claim calibrated alpha or enable autonomous real-money execution. Those remain evidence-gated capabilities.
