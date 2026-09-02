# NIVORA V64.2 Real-Market BUY Calibration Implementation Plan

**Goal:** Make real-input BUY decisions possible when evidence is genuinely favorable, without weakening hard risk/consistency gates or targeting an arbitrary BUY frequency.

### Task 1 — Failing real-input pathway tests
- [x] Add compounder starter-BUY fixture with acceptable timing.
- [x] Add cyclical-value fixture.
- [x] Add growth path with unavailable valuation.
- [x] Add falling-knife/veto blocker fixtures.
- [x] Add distribution-audit fixtures.

### Task 2 — Archetype-specific BUY policy
- [x] Implement `nivora-buy-calibration.ts`.
- [x] Add QUALITY_COMPOUNDER, CYCLICAL_VALUE, GROWTH_MOMENTUM, FINANCIAL_VALUE, CATALYST_GROWTH, BALANCED_STANDARD.
- [x] Keep hard veto/reality gates absolute.
- [x] Wire real factors/archetype/reality evidence from `buildInvestorDecision`.

### Task 3 — Unified Today / triggers / UI
- [x] Persist BUY path/tier/audit in TodayDecision.
- [x] Make action triggers consume the same audit.
- [x] Show BUY PATH / CLOSEST BUY PATH and exact blocker in cockpit.

### Task 4 — Real-market observability
- [x] Add offline decision-distribution audit script.
- [x] Add protected `/api/decision-audit`.
- [x] Add Trading Lab real-market BUY distribution and closest candidates.

### Task 5 — Validation
- [x] Persist BUY path/tier/blocker in historical replay.
- [x] Report BUY sample, hit rate, alpha, 95% bootstrap interval and pathway breakdown.
- [x] Keep BUY evidence UNPROVEN unless the backtest cohort itself earns a positive interval.

### Task 6 — Release verification
- [ ] Run full regression suite.
- [ ] Syntax-check audit/backtest runners.
- [ ] Attempt production build.
- [ ] Verify Vercel Hobby config.
- [ ] Package source without secrets/generated artifacts.
