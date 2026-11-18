# Independent Business Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an inactive, descriptive business evidence assessment with no investment score, pass threshold, eligibility approval or trading action.

**Architecture:** One pure TypeScript module consumes explicit period/fact/source contracts and returns component evidence, arithmetic and missingness. It never reads legacy policy/model files or fetches provider data. Existing normalized facts are not silently promoted to authenticated, contemporaneously published input.

**Tech Stack:** TypeScript, Node test runner, synthetic fixtures; no dependencies or application integration.

**Spec:** `docs/independent-business-evidence.md`, implementing the parent assignment and independent research handoff.

## Global Constraints

- Inactive only; no runtime integration or buy/sell/Pace mapping.
- No numerical score or arbitrary universal business-quality cutoff.
- Missing critical evidence means unknown/no-assessment; unsupported sectors require a specialist policy.
- Publication date, period, unit/currency, source and comparability are explicit; contracts are not proof of authenticity.
- No restricted third-party labels, models, calibration constants or comparison outputs.

## Review Focus

- Retrieval-date fallback must not pass as reported filing publication.
- Negative/zero baseline must not generate misleading percentage growth; overflow stays unavailable.
- Different currency, period, accounting or split basis must not be silently compared.
- Missing risk review must not read as absence of risk or business eligibility.
- Specialist businesses must not receive generic industrial-company liquidity conclusions.

### Task 1: Pure evidence assessment and source contract

**Files:** Create `lib/independent-business-evidence.ts`, `tests/independent-business-evidence.test.mjs`, `docs/independent-business-evidence.md`.

**Interfaces:** `assessIndependentBusinessEvidence(input: BusinessEvidenceInput): BusinessEvidenceAssessment`; versioned descriptive policy, explicit instrument/period/source expectations, component status/evidence/unknown reasons, `instruction:null`, `eligibility:'not-determined'`.

- [x] Write synthetic tests for exact arithmetic and all five review-focus conditions, plus missing/future sources and unsupported models.
- [x] Run tests to establish failure before implementation.
- [x] Implement separate evidence completeness, growth/per-share, cash/liquidity, dilution and material-risk components. Retain dates and sources in every component; never infer narrative risks from ratios.
- [x] Run targeted tests, lint, TypeScript and formatting.
- [x] Request independent financial/data-contract review and correct concrete defects with regressions.
- [x] Run full repository tests; report exact status and zero runtime consumers. No repository commit is possible because this workspace has no Git repository.

Verification completed: 19 focused tests independently passed; full repository suite 1,822/1,822 passed; targeted ESLint, TypeScript and formatting passed. Independent signoff is for inactive descriptive scope only. No runtime consumer or production integration was added.
