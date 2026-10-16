# AURYN Research Overview V2 — Architecture & Visual Contract

## Status
Approved architecture, September 14, 2026.

## Goal
Replace the existing Research Overview presentation with a new decision-first component that closely follows the approved premium mockup while preserving AURYN's canonical CIO, Market Truth, session authority, portfolio, tabs, APIs and autonomous workflows.

## Core rule
Overview explains the canonical AURYN decision. It does not create a second recommendation engine.

## Architecture
Create a new `AurynResearchOverviewV2` component and a typed analyst-view contract. StockClient adapts canonical research evidence into that contract. Existing deeper Research tabs remain unchanged.

### Layer 1 — Decision hero
Desktop: AURYN CALL | canonical price chart | compact Price Structure.
- AURYN CALL: canonical New Money / Owner / Long Term.
- Chart: existing verified research chart.
- Price Structure: current, entry, support, thesis break, confirm, T1, T2.
- Remove the separate Decision / Trigger / Asymmetry / Trust row. Useful fields are absorbed into the hero and analyst cards.

### Layer 2 — Three analyst clocks
1. BUSINESS QUALITY
   - quality score
   - trajectory: improving / stable / deteriorating
   - growth
   - profitability
   - cash generation
   - balance sheet
   - durability
   - forward evidence
   - evidence coverage/freshness

2. VALUATION
   - state: measured / partial / building
   - valuation score only when mathematically supported
   - method used
   - fair-value range
   - margin of safety
   - historical/relative/growth-adjusted context when available
   - confidence/evidence

3. MARKET TIMING
   - market structure
   - entry quality
   - trend
   - momentum
   - participation
   - relative strength
   - volatility
   - confirmation level

### Layer 3 — Two decision visuals
- Fundamental Scenario Spectrum: Bear / Base / Bull from the valuation engine only.
- Execution Decision Map: canonical thesis/support/entry/current/confirm/T1/T2.
These calculations are independent. Technical targets can never be presented as fundamental fair value.

### Layer 4 — Analyst synthesis
- Key Catalysts
- Key Risks
- What's Changed
- AURYN View
Use canonical/source-backed evidence. Historical change requires comparable snapshots; price action alone cannot become a business change.

## Fundamental analyst contract

### Invariants
- `fairValue == null` => `marginOfSafety == null`.
- `marginOfSafety == null` => no derived fundamental valuation score.
- Missing evidence is never converted to zero.
- Partial evidence is labeled PARTIAL, not bearish.
- No technical support/resistance/RSI/momentum input may enter fundamental valuation.
- Extreme business dimension scores require evidence coverage and retain provenance.

### Valuation method router
Use the existing AURYN business-model classification and valuation registry:
- mature/general compounder: DCF / FCF / forward earnings
- growth/software: EV/Sales + growth + FCF trajectory, with cash-flow cross-check where decision-grade
- cyclical: normalized cycle economics
- AI/infrastructure: SOTP/capacity economics
- bank/insurer: book value + ROE/ROTCE/NIM/credit quality
- REIT: FFO/AFFO/NAV
- biotech/frontier: scenario/runway/milestone economics
- energy/miner: normalized commodity/NAV/mid-cycle cash flow
- fallback relative valuation only when evidence supports it

Each method reports required inputs, missing inputs, state, confidence, assumptions, and scenario values. Do not publish precise fair value when evidence is insufficient.

## Scenario policy
Bear/Base/Bull are explicit assumptions, not probabilities. Each scenario exposes major assumptions and source freshness. Scenario values must be reproducible from the contract.

## Historical thesis model
Persist/consume comparable canonical fundamental snapshots when available:
- business dimensions
- forward evidence/revisions
- valuation state
- scenario values
- catalysts/risks
- market timing (separate)
"What Changed" compares like-for-like evidence and distinguishes business change from market change.

## Responsive contract
Desktop follows the approved mockup composition closely.
Tablet collapses hero and analyst visual columns gracefully.
Mobile order:
1. Call
2. chart + compact levels
3. Business
4. Valuation
5. Timing
6. Scenario
7. Decision Map
8. Catalysts / Risks / What's Changed / AURYN View
No horizontally crushed desktop cards. Text and tap targets remain readable.

## Protected systems
Do not alter:
- canonical Market Truth/session ownership
- extended-hours rules
- CIO thresholds/formulas during this release
- portfolio calculations
- existing deeper Research tabs
- autonomous validation/calibration workflows or secrets

New fundamental outputs remain explanatory/shadow evidence until validated before any CIO weighting change.

## Validation
- TDD for analyst contract invariants.
- Tests for valuation router method selection and missing-input behavior.
- Tests proving fundamental valuation contains no technical-level dependency.
- Tests for exact Overview V2 hierarchy and absence of the old four-card row.
- Desktop/mobile structural tests.
- Existing V9.9.9.10, V9.9.9.9, Market Truth and workflow regression gates.
- Production Next.js build remains a release gate.
