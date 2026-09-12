# AURYN V9.6.3 Decision + Scenario Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a deterministic diagnostic harness for decision concentration and scenario anchoring without changing production policy.

**Architecture:** A pure TypeScript audit module consumes captured decision rows and returns canonical metrics. A CLI reads JSON, writes the report, and prints a concise summary. Tests use fixed fixtures to prove distribution, blockers, contradictions, anchoring bands, and fingerprint stability.

**Tech Stack:** TypeScript, Node.js, SHA-256, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-12-v963-engine-audit-design.md`

## Global Constraints
- Audit is observational only.
- No BUY/WAIT/AVOID threshold changes.
- No scenario-value generation changes.
- Same canonical input must produce deterministic metrics/fingerprint.

---

### Task 1: Pure audit engine
**Files:**
- Create: `lib/auryn-decision-audit.ts`
- Test: `tests/auryn-v963-decision-scenario-audit.test.mjs`

- [ ] Write failing tests for action distributions, blocker counts, score histograms, contradictions, scenario anchoring and invalid geometry.
- [ ] Run and confirm failure.
- [ ] Implement the pure audit functions and canonical fingerprint.
- [ ] Run and confirm pass.

### Task 2: CLI and package scripts
**Files:**
- Create: `scripts/run_v963_decision_scenario_audit.mjs`
- Modify: `package.json`
- Test: `tests/auryn-v963-decision-scenario-audit.test.mjs`

- [ ] Add failing tests for CLI/package contract.
- [ ] Run and confirm failure.
- [ ] Add `audit:v963-decisions` and CLI input/output behavior.
- [ ] Run and confirm pass.

### Task 3: Release gate fixture
**Files:**
- Create: `scripts/run_v963_release_gate.mjs`
- Create: `tests/fixtures/v963-decision-audit-fixture.json`
- Modify: `package.json`
- Test: `tests/auryn-v963-release-gate.test.mjs`

- [ ] Add failing tests for deterministic fixture output and non-mutating diagnostics.
- [ ] Run and confirm failure.
- [ ] Implement the release gate and fixture audit.
- [ ] Run targeted engine regressions and the new gate.
