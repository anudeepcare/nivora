# AURYN V9.3.4.3 Decision Policy De-Bias + Expert UX Design

## Goal
Make the V9.3.4 multi-timeframe engine the real decision authority without forcing a target BUY rate, while presenting a compact first-screen decision experience that explains setup states and exposes all actionable levels immediately.

## Non-negotiable principles
- No action quota. BUY/WAIT/AVOID distribution must emerge from evidence.
- Legacy V5 may challenge or hard-veto only on explicit severe conditions; ordinary HOLD cannot force V9.3.4 back to WAIT.
- Missing evidence never becomes a bearish zero. It reduces evidence coverage and may cap conviction depending on which required evidence is missing.
- Pattern/setup state is not an action. BREAKOUT_READY, DOUBLE_BOTTOM, TREND_BREAKDOWN, etc. must have explicit meaning, action implication, confirmation, and invalidation copy.
- Price truth remains independent from decision logic and remains session-aware 24/7.
- Completed 4H/1D/1W evidence drives confirmed decisions; tactical 15M/1H is context only.
- Existing Market Truth, resilient-history fallback, V9.3 Feature Tournament, and Trading Lab fail-closed contracts remain intact.

## Decision policy
The policy uses available, decision-grade pillars with renormalized weights. Missing optional pillars reduce evidence completeness but do not contribute zero.

### New-money actions
- STRONG_BUY: exceptional multi-pillar alignment, strong confirmed structure, attractive asymmetry, high evidence completeness, and no hard veto.
- BUY: clear positive evidence and acceptable structure/asymmetry with no hard veto.
- START_SMALL: positive evidence with one meaningful uncertainty or incomplete but non-critical evidence.
- WAIT: evidence is mixed, entry quality/structure is not ready, or confidence is insufficient.
- AVOID: materially negative evidence, structural damage plus weak business/earnings, or explicit hard veto.

### Owner actions
- ADD, HOLD, WATCH, REDUCE, EXIT.

### Hard-veto categories
Only explicit conditions may block a positive V9.3.4 decision:
- confirmed structural invalidation;
- canonical legacy SELL caused by a real thesis/risk break, not merely missing valuation;
- severe risk/asymmetry failure;
- data-integrity failure that makes the decision unsafe;
- explicit extreme valuation danger when valuation is decision-grade.

V5 HOLD is never a hard veto.

## Action reachability and distribution audit
Automated fixtures must prove every action is reachable. A deterministic distribution audit over synthetic/frozen evidence must report action counts and top rejection reasons. The gate must fail if a legacy HOLD is the dominant WAIT reason or if BUY/START_SMALL are unreachable.

## First-screen UX
One screen, no essential expanders:
1. Security + session-aware canonical price.
2. AURYN CALL with a specific one- or two-sentence explanation.
3. New Money / Owner / Long Term compact strip.
4. Current setup state with plain-English meaning, action implication, confirmation, and invalidation.
5. Multi-timeframe tape: 15M/1H tactical context, 4H/1D/1W confirmed structure.
6. Always-visible Market Plan: context-aware label (Preferred Entry or Recovery/Watch Zone), Confirm/Reclaim, Support, Major Support, T1, T2, Invalidation.
7. Five decision metrics only: Entry Quality, Relative Strength, Participation, Reward/Risk, Volatility/Extension.
8. Why this call / What upgrades it / What breaks it / What changed.
9. Research tabs for deeper evidence without another canonical verdict.

## Setup explanation contract
Each current setup state exposes:
- meaning;
- action implication;
- what confirms it;
- what invalidates it.

The copy must explicitly say that setup states do not equal BUY/SELL.

Examples:
- BREAKOUT_READY: price is near/through a validated resistance area with supportive structure, but breakout confirmation may still be required. Action implication: WAIT_FOR_CONFIRMATION or BUY only if the policy independently qualifies.
- DOUBLE_BOTTOM: two similar support tests suggest seller exhaustion; confirmation requires neckline/reclaim evidence. Action implication: reversal candidate, not automatic BUY.
- TREND_BREAKDOWN: confirmed structure has deteriorated. Action implication: new money usually waits/avoids; owner action depends on thesis/risk, not automatic SELL.

## Explanation quality
Generic boilerplate such as “current business-quality evidence from the canonical record” must not lead the decision explanation when more specific evidence exists. The first screen prioritizes concrete facts and market-state evidence. If concrete evidence is unavailable, say Evidence insufficient rather than inventing detail.

## Compatibility
- V9.3.4 multi-timeframe snapshot remains canonical.
- V5 is retained as challenger/legacy evidence, not ordinary decision authority.
- Trading Lab uses the V9.3.4/V9.3.4.3 decision snapshot and remains fail-closed for execution.
- No paid AI runtime dependency.
