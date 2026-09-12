# AURYN — Canonical Project Context

**Canonical release:** V9.9 Autonomous Validation Lab  
**Frozen investment-engine baseline:** V9.8 Three-Clock Valuation  
**Date:** 2026-09-12

This file is the portable source of truth for continuing AURYN in a new chat/session.

## Product mission
Build a future-facing investment decision system that gives institutional-quality reasoning in a simple form. AURYN does not promise certainty. It should make the best decision from available evidence, explain why, know what would change the decision, preserve long-term theses through short-term noise, and learn from outcomes.

## Locked UX
The current UX/layout/theme/PWA/navigation is locked unless the user explicitly reopens UX work. Engine and validation work must not casually modify visual files.

## Core investment architecture

### Three clocks
1. **Thesis clock (3–7+ years):** business quality, moat, reinvestment runway, incremental returns, FCF/cash conversion, capital allocation, persistent deterioration.
2. **Valuation clock (1–5 years):** independent economic Bear/Base/Bull value, normalized growth/margins/FCF, dilution, discount rate and terminal economics.
3. **Tactical clock (days–months):** price structure, trend, momentum, volume/participation, relative strength, volatility, catalysts and regime.

Short-term technical/political/macro noise may change timing/deployment without automatically rewriting the long-term thesis or independent intrinsic value.

### V9.7 CIO principles
- Slow Brain / Compounder Quality is separated from Fast Brain / Deployment Quality.
- One noisy quarter should not break a durable thesis.
- Corroborated multi-family deterioration should lower thesis confidence and can lead to REDUCE/EXIT/AVOID.
- New-money, owner and long-term actions are separate.
- Missing evidence lowers confidence; it is not silently bearish.
- No forced quotas for BUY/WAIT/AVOID.

### V9.8 valuation principles
- Fundamental Bull/Base/Bear is independent of technical support/resistance.
- Current market price may only be used *after* intrinsic values exist, to calculate expected/implied return.
- If independent valuation inputs are absent, AURYN returns unavailable rather than manufacturing a Base near spot.
- Anti-anchoring audit measures Base proximity to current price at ±2%, ±5%, ±10%.

## V9.9 Autonomous Validation Lab

### Deployment architecture
Vercel Cron → lightweight orchestrator → durable Supabase jobs → rate-limited workers → immutable Shadow CIO snapshots → outcome evaluator → model-health report.

### Provider constraint
- Provider ceiling: **55 external API calls/minute**
- V9.9 background operating cap: **42/minute**
- Nominal interactive headroom: **13/minute**
- Total provider volume is unlimited.
- Background jobs must defer/retry when the shared budget is unavailable.

### Initial validation universe
Target approximately **300 diverse U.S. securities**, sourced from the existing AURYN market universe. Do not validate only favorite holdings.

### Automated validation
- Golden company fixtures
- Three-clock shock tests
- Market-session/Market-Truth invariants
- Decision action reachability/distribution
- Valuation independence / anti-anchoring
- Immutable daily shadow predictions
- Outcomes at 1W / 1M / 3M / 6M / 1Y / 3Y / 5Y
- Watchdog/retry/idempotency
- Model health
- Champion vs Challenger infrastructure

### Governance
A challenger can become eligible for promotion, but production promotion is **never automatic**. Human approval is mandatory.

## Supabase V9.9 tables
- auryn_model_registry
- auryn_validation_runs
- auryn_validation_jobs
- auryn_validation_universe
- auryn_shadow_snapshots
- auryn_shadow_outcomes
- auryn_model_health
- auryn_provider_rate_buckets

## Validation commands
```bash
npm run validate:auryn
npm run gate:v990
```

## Known limitations / next scientific milestones
1. V9.9 captures canonical live Shadow CIO evidence autonomously; it does not yet prove alpha.
2. Business-model-specific independent valuation adapters still need to be built for compounders, SaaS/growth, semiconductors/cyclicals, AI infrastructure, banks, energy, REITs, biotech/frontier, consumer/industrial.
3. A point-in-time survivorship-bias-free historical dataset is still required for a defensible 1995–2025/2026 replay.
4. Historical Research Genome should test whether signals actually add out-of-sample value and remove/reduce signals that do not.
5. Champion-vs-Challenger promotion must use historical + forward evidence, not subjective weight tweaking.

## Roadmap
**V9.9:** Autonomous Validation Lab + Shadow CIO  
→ **V10:** Point-in-Time Historical Replay / Research Genome  
→ **V10.1:** Business-model-specific independent valuation adapters  
→ **V10.2:** Evidence-calibrated Champion vs Challenger  
→ **V10.x:** Portfolio opportunity-cost / capital-allocation intelligence

## Continuity instruction
When starting a new conversation, upload the latest AURYN ZIP and say:

**“Continue AURYN from AURYN_CANONICAL_CONTEXT.md.”**

Read this file before proposing or implementing further AURYN changes.
