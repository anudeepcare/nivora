# AURYN V5 Decision OS Design

## Goal
Turn AURYN from several cooperating scoring surfaces into one canonical investment-decision system: one verified market state, one evidence snapshot, specialist analyses, one CIO decision, one execution plan, synchronized tabs, and a full professional metric explorer.

## Non-negotiable invariants
1. No price-sensitive decision or broker intent may use an unverified market snapshot.
2. Missing metrics remain N/A; they never become bearish zeroes.
3. All user-visible levels (initial entry, DCA, confirmation, invalidation, targets) come from one `ExecutionPlan` object.
4. All research tabs consume one `CanonicalAnalysisSnapshot` and never calculate a second verdict.
5. Technical weakness changes timing/sizing; it does not independently break an intact structural thesis.
6. SELL requires structural failure, a hard veto, or materially negative expected-return evidence — never one weak indicator.
7. Pro/Extreme Pro can inspect all material metrics, their interpretation, source role, and decision relevance.
8. Subjective frameworks such as Elliott-style wave counts are supporting, probabilistic context only.
9. Broker execution requires the same snapshot id that generated the trade intent.
10. The scenario/stress harness must exercise at least 10,000 deterministic combinations and assert the invariants above.

## Architecture
`Market Truth -> Canonical Evidence Snapshot -> Specialist Engines -> Scenario/Confluence -> CIO Decision -> Execution Plan -> UI/Broker`.

Specialists include structural business/thesis (V4 migration source), technical regime, pattern/structure, valuation state, catalyst/sector/risk context, and portfolio/execution gates. V5 initially reuses V4 evidence collection while replacing V4 presentation/arbitration with the V5 canonical snapshot and decision/execution contracts.

## User experience
The page order is Security Header -> Market State -> AURYN Call -> Why / What To Do -> Tab Nav -> Evidence. Developer metadata (engine id, model registry id, evidence-state internals) moves out of the hero. All tabs share the same width, spacing, score vocabulary and call context.

Extreme Pro exposes a metric explorer grouped by Trend, Momentum, Volume/Flow, Volatility, Structure, Relative Strength, Fundamentals, Valuation, Thesis/Moat, Catalysts/Sector and Risk. Each metric contains value, state, interpretation, role, availability and source scope.
