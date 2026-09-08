# AURYN V8.4 Live Session Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make AURYN's live, close, analysis-anchor, decision, and execution prices explicit and session-aware, and make the 500-stock audit diversified instead of alphabetically concentrated.

**Architecture:** Extend Market Truth with typed price-role/timestamp fields, mark `/api/analyze` price as a completed daily-bar anchor, and replace the audit's unconditional canonical-vs-analysis gap rule with a session-aware alignment policy. Add deterministic stratified/spread universe sampling so large audits cover the market broadly without introducing random nondeterminism.

**Tech Stack:** Next.js/TypeScript, Node test runner, existing AURYN Market Truth, Twelve Data, Alpaca, Supabase audit universe.

**Spec:** `docs/superpowers/specs/2026-09-08-auryn-v8-4-live-session-alignment-design.md`

## Global Constraints
- Preserve V8.3 fail-closed Market Truth behavior.
- Do not weaken the independent-provider requirement for execution.
- Preserve legacy `analyze.price` for compatibility, but define it as the analysis anchor.
- Do not treat legitimate intraday movement from the prior completed daily close as a critical error.
- Closed-market regular-close mismatch remains a critical error.
- Audit sampling must be deterministic and reproducible.
- No live-money automation is enabled by this release.

---

### Task 1: Session-aware price alignment policy

**Files:**
- Create: `lib/auryn/v84/price-alignment.ts`
- Modify: `tsconfig.engine.json`
- Test: `tests/auryn-v84-live-session-alignment.test.mjs`

**Interfaces:**
- Produces `evaluatePriceAlignment(input): PriceAlignmentResult`.
- Input contains session, decision price/role, regular close, analysis anchor price/date, researchAllowed, executionTradable, executionPrice.
- Result contains `criticalIssues`, `warnings`, and `intradayMovePct`.

- [ ] **Step 1: Write failing tests** for open-session live-vs-anchor divergence, closed-session mismatch, execution-price invariants, and blocked state.
- [ ] **Step 2: Compile/run the focused test and verify it fails** because the V8.4 module does not exist.
- [ ] **Step 3: Implement the minimal policy** so open-session movement is informational, closed-session mismatch is critical, and execution invariants remain strict.
- [ ] **Step 4: Run the focused test and verify it passes.**

### Task 2: Explicit Market Truth price roles

**Files:**
- Modify: `lib/auryn/market-truth.ts`
- Test: `tests/auryn-v84-live-session-alignment.test.mjs`

**Interfaces:**
- Add `regularClosePrice`, `regularCloseAsOf`, `liveMarketPrice`, `liveMarketPriceAsOf`, `decisionPriceRole`, `executionPrice`, `executionPriceAsOf` to `CanonicalMarketSnapshot`.
- Preserve existing `regularClose`, `decisionPrice`, `displayPrice`, and `decisionPriceAsOf` compatibility fields.

- [ ] **Step 1: Add failing assertions** for live verified, live single-source, official-close, disagreement, and blocked states.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Populate role-specific fields from the existing canonical state machine without changing safety thresholds.**
- [ ] **Step 4: Verify focused Market Truth tests pass.**

### Task 3: Mark analysis price as completed daily-bar anchor

**Files:**
- Modify: `app/api/analyze/[symbol]/route.ts`
- Test: `tests/auryn-v84-api-semantics.test.mjs`

**Interfaces:**
- Response adds `analysisAnchorPrice`, `analysisAnchorAsOf`, `analysisAnchorRole:"COMPLETED_DAILY_BAR"`, `priceRole:"ANALYSIS_ANCHOR"`.
- `price` remains equal to `analysisAnchorPrice`.
- `freshness.priceAt` must represent the bar anchor date rather than request time; `decisionAt` may remain request time.

- [ ] **Step 1: Write failing source/API contract tests** for the new fields and corrected freshness semantics.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Implement anchor metadata from the final bar in `barRows`.**
- [ ] **Step 4: Verify the API contract tests pass.**

### Task 4: Replace false live canonical/analyze criticals in audit runner

**Files:**
- Modify: `scripts/run_v8_live_100_audit.mjs`
- Modify: `lib/auryn/v83/audit-helpers.ts` only if compatibility delegation is needed
- Test: `tests/auryn-v84-live-audit-contract.test.mjs`

**Interfaces:**
- Audit calls `evaluatePriceAlignment` using quote snapshot and analyze anchor metadata.
- Summary adds `intradayDivergences`, `alignmentWarnings`, and existing critical/quarantine counts remain.

- [ ] **Step 1: Write failing tests** proving a 9% regular-session move from completed close is not critical, while a 4% closed-session same-close mismatch remains critical.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Wire the V8.4 alignment policy into the audit and remove the unconditional `gap>3` live critical rule.**
- [ ] **Step 4: Verify audit contract tests pass.**

### Task 5: Diversified deterministic 500-stock universe

**Files:**
- Create: `lib/auryn/v84/audit-sampling.ts`
- Modify: `app/api/audit/universe/route.ts`
- Modify: `tsconfig.engine.json`
- Test: `tests/auryn-v84-audit-sampling.test.mjs`

**Interfaces:**
- Produces `selectDiversifiedAuditUniverse(rows, limit)`.
- Input rows support `symbol` and optional `market_cap_m`.
- Output is deterministic, unique, supported-equity-only upstream, and spread across the candidate list/market-cap strata rather than concentrated at one alphabetic prefix.

- [ ] **Step 1: Write failing tests** using synthetic A/B/C/... candidate buckets to prove broad-prefix coverage and deterministic output.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Implement deterministic stratum + spread sampling and use it in both scan and fallback universe paths.**
- [ ] **Step 4: Verify sampling tests pass.**

### Task 6: Full regression and release gate

**Files:**
- Modify: `package.json`
- Create: `AURYN_V8_4_RELEASE.md`
- Create: `AURYN_V8_4_VERIFICATION.txt`
- Modify: `README.md`

**Interfaces:**
- Add `test:v84-core` and `audit:v84-live` scripts.

- [ ] **Step 1: Add V8.4 tests to the full engine test command and focused scripts.**
- [ ] **Step 2: Run focused V8.4 tests.**
- [ ] **Step 3: Run full `npm test`.**
- [ ] **Step 4: Run `npm run audit:v8-reality`.**
- [ ] **Step 5: Run `npm run audit:v65`.**
- [ ] **Step 6: Attempt `npm run build`; record environment limitation if dependencies are unavailable.**
- [ ] **Step 7: Package a secret/cache-free ZIP and rerun tests/audits from the extracted package.**
