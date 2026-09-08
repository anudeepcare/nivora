# AURYN V9.2 Historical Data Backfill & Provider Adapters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add auditable provider adapters and an automated historical-data release gate upstream of V9.1.

**Architecture:** Provider-specific modules normalize raw Twelve Data and SEC payloads into V9.1's HistoricalReplayBundle. A deterministic bundle assembler and integrity reporter sit above adapters; CLI scripts expose normalize/backfill/audit/gate workflows without touching production CIO or broker state.

**Tech Stack:** TypeScript, Node.js, Node test runner, existing AURYN V9/V9.1 research modules.

**Spec:** `docs/superpowers/specs/2026-09-08-auryn-v92-historical-backfill-design.md`

## Global Constraints
- Preserve V8.4 Market Truth and V9/V9.1 production isolation.
- Research-only code must not import production-registry, CIO, broker, or paper-run mutation paths.
- `availableAt` must represent public availability, not economic period end.
- Adjusted price history is mandatory for decision-grade research.
- Missing historical evidence stays missing; never coerce to zero.
- Real dataset safety claims require explicit evidence, not inferred defaults.

---

### Task 1: V9.2 domain and Twelve Data adapter
**Files:** Create `lib/auryn/v92/domain.ts`, `lib/auryn/v92/twelve-data.ts`; test `tests/auryn-v92-twelve-data.test.mjs`.
**Interfaces:** Produce normalized `HistoricalBar[]`, provider diagnostics, and deterministic request URL builder.
- [ ] Write failing tests for adjusted ascending OHLCV normalization and malformed response rejection.
- [ ] Run focused test and confirm RED.
- [ ] Implement minimal adapter.
- [ ] Run focused test and confirm GREEN.

### Task 2: SEC point-in-time fact adapter
**Files:** Create `lib/auryn/v92/sec-companyfacts.ts`; test `tests/auryn-v92-sec.test.mjs`.
**Interfaces:** Produce canonical `PointInTimeMetric[]` with `availableAt=filed` and `periodEnd=end`.
- [ ] Write failing tests for filing-time availability, amendments, unit selection, and deterministic dedupe.
- [ ] Run focused test and confirm RED.
- [ ] Implement adapter.
- [ ] Run focused test and confirm GREEN.

### Task 3: Bundle assembler and integrity/coverage audit
**Files:** Create `lib/auryn/v92/assemble.ts`, `lib/auryn/v92/integrity.ts`; tests `tests/auryn-v92-assemble.test.mjs`, `tests/auryn-v92-integrity.test.mjs`.
**Interfaces:** Assemble V9.1-compatible replay bundles and report hard failures/warnings/coverage.
- [ ] Write failing deterministic bundle and integrity tests.
- [ ] Run RED.
- [ ] Implement assembler and integrity report.
- [ ] Run GREEN.

### Task 4: CLI and automated gate
**Files:** Create `scripts/run_v92_normalize.mjs`, `scripts/run_v92_data_audit.mjs`, `scripts/run_v92_backfill.mjs`, `scripts/run_v92_release_gate.mjs`; modify `package.json`, `tsconfig.engine.json`; tests `tests/auryn-v92-cli-contract.test.mjs`, `tests/auryn-v92-release.test.mjs`.
**Interfaces:** `normalize:v92`, `backfill:v92`, `audit:v92-data`, `test:v92-core`, `gate:v92`.
- [ ] Write failing CLI/package/release-boundary tests.
- [ ] Run RED.
- [ ] Implement scripts and package wiring.
- [ ] Run GREEN.

### Task 5: Compatibility and release verification
**Files:** Create `AURYN_V9_2_RELEASE.md`; update `README.md`, `DATA_SOURCES.md`.
- [ ] Run V9.2 focused tests.
- [ ] Run full `npm test`.
- [ ] Run `npm run audit:v8-reality` and `npm run audit:v65`.
- [ ] Run adapter→bundle→V9.1→V9 tournament smoke fixture.
- [ ] Package clean ZIP, extract it, and rerun the same gates from exact ZIP.
