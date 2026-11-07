# AURYN completion build — 7 November 2026

## Public explanation
Removed the negative headline. The public evidence page now leads with “Understand the logic behind Pace” and explains a consistent framework for accumulation. Comparative validation status remains in the methodology disclosure. Owning a model does not by itself establish investment performance; no outperformance claim is added.

## Implemented
- Holdings-aware monthly contribution draft: combined lots, current USD quotes, selected companies, capped allocation toward equal final values, cent-exact budget, retained cash and current/after weights. Missing or stale valuation blocks the draft. No orders or account-save claims.
- Explicit thesis condition monitoring: four supported financial metrics, dated evidence, unknown state for unavailable evidence, deduplicated review events. Saving/checking is account-scoped; optional scheduled account checks lease up to four opted-in conditions per pass. Free text is never silently converted into an investment rule.
- Prospective observation infrastructure: owner-only server publication, database publication timestamp, policy/evidence hashes, unique company-period-policy identity, public latest-100 feed. No backdated publication or invented results. This is a publication record, not yet a completed performance series.
- Representative study runner: replays raw dated prices through current monthly-v5 and validates signal date/close/contribution multiple, total-return observations, universe coverage, delisting inputs, costs and cash yields. P0/P1 spend zero; P2/P3/P4 use 1x/2x/4x within cash. Independent audited representative data are still required.
- Owner-only observed-session records: anonymous participant code, consent, task, completion, duration and notes. No actual users or results have been invented.
- React hooks lint enforced; source formatting enforced; forty compatibility stylesheets consolidated in original order and tokens extracted. Archived CSS is retained as a complete cascade regression baseline, not imported into the application.
- Owner handbook and deployment documentation updated.

## What remains dependent on real inputs
1. Run a representative current-policy backtest on audited point-in-time, total-return and delisting data. The CLI now requires raw-price policy replay; replay is not authentication of dataset provenance. It intentionally refuses to mark a study publishable.
2. Accumulate prospective observations and comparable outcomes over time; use the restored read-only prospective comparison command to verify actual same-stock publications before execution and calculate paired DCA outcomes. No real series exists yet.
3. Recruit and observe real participants. A recording form does not complete user validation or establish retention.
4. Account-scoped scheduling is implemented through the leased opt-in queue. Production scheduler activation, external notification delivery and operational scale testing remain outstanding; in-app alert history is the implemented delivery surface.
5. CSS consolidation preserves the existing cascade; it does not certify every product screen has been visually redesigned.

## Connected database inspection
Read-only inspection found 4,249 older-model observations and 29,743 pending outcome entries (all pending), labelled auryn-v9.8. These are not current monthly-v5 performance results. No account identifiers, private holdings or user messages were included in this report.

## Database and release steps
1. Use Node 24 and run `npm ci`, `npm run verify`, then `npm run test:api`.
2. Reconcile installed migrations before applying anything. Read-only recovery inspection confirms public records (20261107142000), shared request limits (20261107143506), and thesis queue (20261107143633) already exist with RLS enabled. The first two match differently numbered local files; do not blindly reapply create-table SQL. Exact installed SQL is retained in verification/recovered-migrations/.
3. Keep service credentials server-only. Public observation publication requires the existing market-data licensing flag and the appropriate redistribution rights. The migration inserts no observations.
4. Optional account-scoped background thesis checks require `AURYN_THESIS_JOB_ENABLED=true` and the existing protected job secret/schedule. The installed queue follows explicit saved-condition opt-in and rechecks account access; see `THESIS-SCHEDULING.md`.
5. Verify login, quote freshness, planning, owner publication, public read, thesis condition and alert history in staging before promoting.

Earlier interrupted work installed the three migrations above. This recovery pass performed no production writes, deployment, publication or outreach. These are source changes ready for release validation, not a claim that the live site changed.

## Verification
- 1,156 unit/regression/database-policy tests passed.
- ESLint completed with zero warnings; all covered source files pass Prettier.
- Planner component browser checks passed at 390px and 1440px: cap/budget/candidate changes, retained cash, invalid-input withholding, no horizontal overflow and no browser errors. These use mocked account hooks, not a real signed-in production session.
- Type checking and the production build passed. The initial build hit a temporary output-directory cleanup error; a clean rebuild passed. Next reports that its optional framework-specific ESLint plugin is absent; the separate hooks/error lint gate passes.
- The compiled API suite passed, including new non-owner access rejection checks for public-record publication and private validation records, sample-data thesis gating, existing billing/options/market checks, and production fixture exclusion across 55 route traces. Transport is mocked; this does not certify live provider availability.
- Public home, evidence page and portfolio check passed at 390px and 1440px with no page errors or horizontal overflow; portfolio-input interaction passed after waiting for React hydration. Production preview routes return 404. The feed was tested with publication disabled, not with live observations.

## Interrupted work restored
See `implementation/20261107-interrupted-recovery.md` and `PROSPECTIVE-COMPARISON.md`. The original verification above describes the baseline. Fresh integrated verification is recorded in `verification/interrupted-recovery-20261107/`.

## Final restored-release verification
1,181 tests passed with zero failures. Lint, formatting, typecheck, production build and compiled API suite passed; 56 route traces checked. Fresh logs and review fixes are under verification/interrupted-recovery-20261107/. Apply the new source-body guard migration before activating scheduled checks. This recovery restored code omitted from earlier ZIPs; production remains undeployed.
