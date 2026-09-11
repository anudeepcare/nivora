# AURYN V9.3.6 Premium Product + Opportunity Engine Design

## Goal
Turn the consolidated V9.3.5 system into one premium, mobile-first investing product without adding duplicate price/data paths. The product must remain deterministic, session-aware, and usable when upstream providers are slow.

## Non-negotiable architecture
1. V9.3.5 canonical snapshot remains the only market/security/research authority.
2. V9.3.6 may derive opportunity/scenario presentation from canonical evidence, but may not fetch market data directly.
3. Missing evidence lowers coverage/conviction; it never becomes a bearish zero.
4. Bull/Base/Bear are presented as an uncalibrated scenario balance until V10 earns calibrated probabilities.
5. Research, Portfolio, Monitor and Trading Lab share one visual language and the same canonical action/setup/levels vocabulary.
6. Mobile is a first-class layout at 375px. No horizontal page overflow.

## Product experience
### Global shell
- Premium black/ivory/gold visual system.
- Desktop top navigation; mobile fixed bottom navigation.
- Search remains globally available.
- Compact page widths, rounded surfaces, restrained borders/shadows.

### Research overview
Above-the-fold desktop:
- Security header with company/ticker, canonical price, change, session, data-quality chip.
- Premium AURYN Call hero.
- Price chart beside hero.
- Compact metrics grid: setup, pattern, entry/recovery zone, confirm/reclaim, support, major support, T1/T2, invalidation, reward/risk, relative strength, participation, volatility.
- Scenario balance card: Bull/Base/Bear, explicitly "scenario balance · not probability".
- Plain-English pattern/setup cards.

Mobile:
- Header -> tabs -> AURYN Call -> chart -> 2-column key metrics -> setup explainers -> bottom navigation.
- No clipped text, no fixed desktop widths.

### Research tabs
Tabs remain evidence pages. They inherit the same card/typography system. Deep evidence is visible inside the relevant tab; the overview does not duplicate every metric.

### Portfolio
- CIO-style summary surface.
- Canonical action, setup, price, opportunity score on holdings.
- Keep existing portfolio calculations; redesign hierarchy only.

### Monitor
- "What changed" feed based on canonical snapshots.
- Canonical action/setup/price context on every event.

### Trading Lab
- Premium execution-console hierarchy.
- Canonical provenance always visible.
- Paper-only safety stays unchanged.

## Opportunity engine
Pure deterministic derivation from existing decision evidence.

Inputs when available:
- business quality
- earnings/revisions
- valuation
- confirmed market structure
- catalysts/regime
- risk/asymmetry
- entry quality
- relative strength
- participation
- reward/risk

Rules:
- normalize weights over available evidence only
- missing valuation caps conviction but does not reduce score to zero
- hard vetoes remain authoritative
- no target quota for BUY/START SMALL/etc.
- output `opportunityScore`, `coverage`, top supports, top constraints

## Scenario balance
Generate Bull/Base/Bear balance from current deterministic evidence only. It is not a return forecast and not a calibrated probability. Bull rises with positive business/earnings/market structure/asymmetry; Bear rises with risk/weak structure/poor entry; Base is residual uncertainty. Values sum to 100.

## Reliability and performance
- No new market-data network requests from V9.3.6 UI.
- First render can use V9.3.5 durable snapshot.
- Tactical/live enrichment remains progressive.
- Loading/degraded states are compact and never replace the whole page when a last verified snapshot exists.

## Acceptance gates
- opportunity engine deterministic
- missing evidence is neutral, not bearish
- scenario balance sums to 100 and is labeled uncalibrated/not probability
- stock overview contains hero + chart + key metrics + setup explanation
- 375px contract: no page overflow, 2-column metric grid, sticky bottom nav
- AppShell/Portfolio/Monitor/Trading Lab share premium tokens/components
- all V9.3.5 and historical safety gates remain green
