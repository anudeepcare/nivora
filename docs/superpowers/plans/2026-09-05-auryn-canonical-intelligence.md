# AURYN Canonical Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace conflicting/stale generic scoring with one period-aware, asset-aware, provenance-backed intelligence path for Business, Earnings, Future, Valuation, Risk, Thesis and actions.

**Architecture:** Normalize all decision-grade evidence into a typed contract, validate freshness/conflicts before scoring, route by asset/archetype, compute independent factors, synthesize one canonical thesis, then apply explicit action gates. Existing V3.8.4 UI consumes the canonical outputs without a redesign.

**Tech Stack:** Next.js, React, TypeScript, existing market/provider adapters, Supabase decision ledger, Node test scripts.

**Spec:** `docs/superpowers/specs/2026-09-05-auryn-canonical-intelligence-design.md`

## Global Constraints
- Preserve the approved V3.8.4 visual system and icon work.
- Never map missing evidence to 50/100.
- Coverage/data completeness is not predictive confidence.
- SEC/filing and issuer-reported periods outrank provider/derived conflicts.
- Analyst price targets are not valuation.
- Technical Strength and Entry Quality remain separate.
- No ticker-specific production scoring rules for BE, IREN, MU, MSFT, QQQ or APP.
- Final actions must be traceable to explicit gates.
- Existing regression suite must not gain new failures.

---

### Task 1: Canonical evidence contract and integrity resolver
**Files:**
- Create: `lib/auryn/evidence.ts`
- Create: `lib/auryn/evidence-integrity.ts`
- Test: `scripts/test-auryn-evidence.mjs`

**Interfaces:**
- Produces: `EvidencePoint`, `EvidenceSet`, `resolveEvidence()`, `evidenceCoverage()`.
- Consumers: Tasks 2-7.

- [ ] Write failing tests proving mismatched periods remain distinct, stale evidence is flagged, SEC/issuer evidence wins conflicts, and missing metrics remain absent.
- [ ] Run `node scripts/test-auryn-evidence.mjs` and verify failure.
- [ ] Implement typed evidence normalization and deterministic source/conflict priority.
- [ ] Re-run the test and verify pass.
- [ ] Commit `feat: add canonical evidence integrity layer`.

### Task 2: Asset and business-model classification
**Files:**
- Create: `lib/auryn/classification.ts`
- Test: `scripts/test-auryn-classification.mjs`

**Interfaces:**
- Consumes: normalized security/company metadata.
- Produces: `AssetClass`, `BusinessArchetype`, `classifySecurity()`.

- [ ] Write failing fixtures proving QQQ routes to ETF, MSFT/APP to operating equity, MU to semiconductor/cyclical, IREN to capital-intensive infrastructure, and unknowns degrade safely.
- [ ] Run classification test and verify failure.
- [ ] Implement deterministic classifier without ticker-specific score overrides.
- [ ] Re-run and verify pass.
- [ ] Commit `feat: add asset aware intelligence routing`.

### Task 3: Canonical Business and Earnings engines
**Files:**
- Create: `lib/auryn/business-engine.ts`
- Create: `lib/auryn/earnings-engine.ts`
- Modify: `lib/nivora-investor.ts`
- Test: `scripts/test-auryn-business-earnings.mjs`

**Interfaces:**
- Consumes: `EvidenceSet`, classification.
- Produces: scored/nullable factor objects with score, label, evidence, coverage, explanation, warnings.

- [ ] Write failing tests: BE latest-quarter inflection cannot be hidden by stale annual loss; IREN transition charges cannot be treated as ordinary recurring economics; QQQ Business is N/A rather than 50; score labels use the centralized mapper.
- [ ] Run test and verify failure.
- [ ] Implement normalized Business and event-aware Earnings engines with period-aware weighting and renormalization over available evidence.
- [ ] Route legacy investor fields through canonical outputs while preserving API shape where required.
- [ ] Re-run and verify pass.
- [ ] Commit `feat: rebuild business and earnings intelligence`.

### Task 4: Future/Execution, valuation and risk
**Files:**
- Create: `lib/auryn/future-engine.ts`
- Create: `lib/auryn/valuation-engine.ts`
- Create: `lib/auryn/risk-engine.ts`
- Modify: `lib/nivora-valuation-sanity.ts`
- Test: `scripts/test-auryn-forward-valuation-risk.mjs`

**Interfaces:**
- Consumes: normalized evidence, classification, Business/Earnings outputs.
- Produces: Future, Valuation and Risk factor outputs.

- [ ] Write failing tests for guidance/revision/backlog evidence, capital-requirement penalties, cyclical valuation normalization, and analyst target de-duplication.
- [ ] Verify tests fail.
- [ ] Implement factor engines with archetype-aware weights and explicit N/A behavior.
- [ ] Verify tests pass.
- [ ] Commit `feat: add forward valuation and multidimensional risk engines`.

### Task 5: One thesis synthesis and explicit action policy
**Files:**
- Create: `lib/auryn/thesis-engine.ts`
- Create: `lib/auryn/score-label.ts`
- Modify: `lib/nivora-intelligence.ts`
- Modify: `lib/v65/action-policy.ts`
- Modify: `lib/nivora-decision-presentation.ts`
- Test: `scripts/test-auryn-thesis-policy.mjs`

**Interfaces:**
- Consumes: canonical factors plus existing technical state.
- Produces: one thesis, one coverage value, explicit new-money/owner actions, reason codes and blockers.

- [ ] Write failing tests proving missing factors renormalize instead of becoming 50, timing cannot redefine Business, high risk can gate BUY, owner/new-money actions may differ, and 49 can never label Strong.
- [ ] Verify failure.
- [ ] Implement canonical synthesis and centralized labels.
- [ ] Make legacy intelligence a compatibility adapter rather than a second scoring truth.
- [ ] Verify pass.
- [ ] Commit `feat: unify thesis and action policy`.

### Task 6: ETF/index intelligence route
**Files:**
- Create: `lib/auryn/etf-engine.ts`
- Modify: `lib/auryn/thesis-engine.ts`
- Test: `scripts/test-auryn-etf.mjs`

**Interfaces:**
- Produces ETF factors: constituent quality, earnings trend, index growth, valuation, breadth, concentration, macro/liquidity, trend, entry and risk when evidence exists.

- [ ] Write failing QQQ test proving no fake company fundamentals and no neutral fallback dimensions.
- [ ] Verify failure.
- [ ] Implement ETF factor routing with available-evidence renormalization.
- [ ] Verify pass.
- [ ] Commit `feat: add ETF specific thesis model`.

### Task 7: API/provider integration and freshness metadata
**Files:**
- Modify relevant routes under `app/api/market/`
- Modify provider adapters discovered by call-site tracing
- Modify: `lib/nivora-snapshot.ts`
- Test: `scripts/test-auryn-provider-periods.mjs`

**Interfaces:**
- Produces normalized evidence payloads with period/source/freshness metadata for the canonical engines.

- [ ] Trace each Business/Earnings/Forward input to its provider and write fixtures for period metadata.
- [ ] Verify test fails against legacy payloads.
- [ ] Normalize annual, quarterly, TTM and forward evidence without silently mixing scopes.
- [ ] Add integrity warnings for incompatible/stale provider data.
- [ ] Verify pass.
- [ ] Commit `feat: normalize provider periods and provenance`.

### Task 8: Preserve UI, expose better evidence
**Files:**
- Modify: `components/StockClient.tsx`
- Modify: `components/stock/StockThesisPanel.tsx`
- Modify: `components/stock/StockEvidenceSections.tsx`
- Modify only scoped AURYN CSS if required.
- Test: `scripts/test-auryn-intelligence-ui.mjs`

**Interfaces:**
- Consumes canonical thesis/factors.
- Produces the existing V3.8.4 visual experience with coherent labels, N/A states, period/freshness copy and reasoned actions.

- [ ] Write structural tests for Business, Earnings, Thesis, ETF N/A behavior and no contradictory score labels.
- [ ] Verify failure.
- [ ] Replace legacy display fallbacks with canonical outputs; preserve layout.
- [ ] Verify pass.
- [ ] Commit `feat: surface canonical intelligence in stock research`.

### Task 9: Golden-case regression harness
**Files:**
- Create: `validation/golden/BE.json`
- Create: `validation/golden/IREN.json`
- Create: `validation/golden/MU.json`
- Create: `validation/golden/MSFT.json`
- Create: `validation/golden/QQQ.json`
- Create: `validation/golden/APP.json`
- Create representative non-tech fixtures.
- Create: `scripts/test-auryn-golden-cases.mjs`

**Interfaces:**
- Frozen fixtures contain evidence and expected invariants, not hard-coded target recommendation scores.

- [ ] Add invariant tests for period correctness, asset routing, evidence coverage, no impossible labels, explanation/input consistency and action-gate traceability.
- [ ] Run and verify failures expose remaining integration gaps.
- [ ] Fix engine defects rather than ticker-specific fixtures.
- [ ] Re-run until all golden invariants pass.
- [ ] Commit `test: add cross archetype intelligence golden cases`.

### Task 10: Calibration semantics and full verification
**Files:**
- Modify: `lib/nivora-calibration-v63.ts`
- Modify: `app/api/calibration/route.ts`
- Add release notes for the new AURYN version.

**Interfaces:**
- Data completeness remains distinct from empirically earned model confidence.

- [ ] Add test proving sparse outcome history cannot be presented as predictive confidence.
- [ ] Implement calibration labeling/read-path changes without rewriting historical decisions.
- [ ] Run all new AURYN tests.
- [ ] Run the repository's existing engine/regression suite and compare failures with the V3.8.4 baseline.
- [ ] Run `npm run build`; fix all TypeScript/build errors before packaging.
- [ ] Run ZIP integrity check and package the verified source.
- [ ] Commit `release: canonical intelligence architecture`.
