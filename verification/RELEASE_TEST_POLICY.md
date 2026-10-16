# Release acceptance and historical contracts

`npm test` is the current release acceptance gate. It runs every assertion in every file listed in `verification/release-test-files.json`, after deleting and rebuilding the compiled engine test directory. There are no test-name filters, ignored failures, automatic exclusions, or expected-failure allowances in this gate. A compile failure, missing/duplicate manifest entry, test failure or interrupted child process fails the command.

The repository also retains its historical tests unchanged. The old `test:engine` name is misleading: that command combines engine behavior with source-text assertions about many past UI versions, component paths, CSS selectors, copy, documentation, polling intervals and route architecture. Its failures must be investigated; its total is not a count of engine defects.

## Commands

| Command | Purpose | Failure policy |
| --- | --- | --- |
| `npm test` or `npm run test:release` | Current behavioral acceptance and reviewed supporting contracts in the explicit manifest | Blocking; every selected file runs in full |
| `npm run build` | Next.js production build, application TypeScript validation, prerendering and route compilation | Blocking |
| `npm run verify:release` | Current acceptance followed by the production build | Blocking |
| `npm run test:historical` or `npm run test:engine` | The original aggregate, with its original test-file list and command unchanged | Reports all failures and exits nonzero when any fail |
| `npm run test:historical:all` | Every `tests/*.test.mjs` file, including historical versions outside the old aggregate and current acceptance | Reports all failures and exits nonzero when any fail; its totals differ from `test:engine` |
| Existing `test:v*` and `gate:v*` commands | Version-specific compatibility and research gates | Preserved; some deliberately require older contracts or configured live services |
| `npm run verify:legacy-release` | The former `verify:release` command, `npm run gate:v936` | Preserved historical release gate |

Run test commands sequentially in one checkout. Several historical CLI integration tests rebuild `.engine-test`; the current runner therefore uses test-file concurrency 1. Do not run a separate engine compilation or historical suite against that directory concurrently. The manifest is deliberately reviewed rather than a filename-based guess about what constitutes an engine test.

## CI

`.github/workflows/auryn-release.yml` runs on pushes, pull requests and manual dispatches, with Node 22 and `npm ci`. The `Current acceptance and production build` job must pass. Configure that job as a required status check in repository branch protection when enabling CI; this source package does not change remote branch settings.

A separate advisory job executes the unchanged historical aggregate. It uploads the complete log and explicitly reports its outcome in the Actions summary. Its test step uses `continue-on-error` because known historical contracts are incompatible with the approved redesign; that exception does not apply to acceptance, dependency installation or the production build. New historical failures still require investigation against the recorded baseline. A green release job does not mean the historical job passed.

These jobs require no deployment credentials, do not deploy, and do not submit broker orders. They establish deterministic local correctness and buildability. They do not establish configured production OAuth, live provider entitlements, database migration completion, deployed authorization settings or successful real broker fills. Those require the separate deployment/service checks documented with the release.

## Recorded historical results

The preserved source logs record **677 passed / 54 failed** for the uploaded baseline and **650 passed / 81 failed** for the later aggregate snapshot. These are different source snapshots, not current acceptance totals. The 81 failures are **not 81 demonstrated engine defects**, and they are not all harmless either.

`research-failure-audit.md` and `operations-failure-audit.md` trace the failures to the active code. They identified real regressions, including blocked price-level disclosure, WATCH/REDUCE execution wording, missing shared canonical context, portfolio capital-priority presentation and Trading Lab operational visibility. Those findings drove repairs. Other failures still request removed components, old literal labels or an obsolete quote-route import. Restoring those names merely to satisfy a regex would not verify the current product.

See `logs/baseline-engine-tests.log`, `logs/engine-tests-restored-workflows.log` and `historical-failures.json` for the recorded evidence. Do not describe these historical suites as passing. Fresh acceptance and build logs are the source of truth for each release's current test count; adding new acceptance cases changes that count.

## Audit before changing the default

The initial acceptance manifest had 125 files and 447 passing tests. Before changing the default, omitted test files were inspected for compiled engine imports, dynamic imports, `createRequire`, transpilation and child-process integration. Misleading names were checked directly: for example, `auryn-v7-runtime-integration.test.mjs` reads source strings and an obsolete hero file; it does not execute the runtime.

The 34 omitted files containing runtime or CLI integration were executed against the compiled source: **174 passed / 15 failed**, with no skips. All 15 failures were in nine mixed files and were source/path/copy/document assertions; no executed runtime assertion in that audit failed. This result was used together with source inspection, not as an automatic passing-test whitelist. The 25 complete passing files below were added without modifying their assertions.

| Area | Complete suites added to acceptance (under `tests/`) |
| --- | --- |
| Execution authority and invariant matrix | `auryn-v5-reliability.test.mjs`, `auryn-v931-reliability.test.mjs` |
| Immutable learning payload and measured model proof | `auryn-v6-learning-payload.test.mjs`, `auryn-v6-model-health-api.test.mjs` |
| Provider failure handling and representative audit sampling | `auryn-v83-audit-scalability.test.mjs`, `auryn-v84-audit-sampling.test.mjs` |
| Real replay normalization and data-quality CLI gates | `auryn-v92-data-gate-integration.test.mjs`, `auryn-v92-normalize-integration.test.mjs`, `auryn-v92-release.test.mjs` |
| Structured analyst output cannot override deterministic decisions | `auryn-v931-astra.test.mjs` |
| Canonical projections, decision bridge, completed bars and price semantics | `auryn-v934-cross-surface.test.mjs`, `auryn-v934-decision-bridge.test.mjs`, `auryn-v934-provider-contract.test.mjs`, `auryn-v9342-price-truth.test.mjs` |
| Decision policy and non-mutating scenario audit | `auryn-v9343-debias-policy.test.mjs`, `auryn-v963-decision-scenario-audit.test.mjs`, `auryn-v963-release-gate.test.mjs` |
| Universe schema compatibility | `auryn-v994-universe-schema.test.mjs` |
| Provider integrity, bars, risk sizing and reachable decisions | `v63-evidence-reality.test.mjs`, `v64-bar-integrity.test.mjs`, `v64-position-sizing.test.mjs`, `v641-consistency.test.mjs`, `v642-live-decision-audit.test.mjs` |
| Paper invalidation, quote timestamps and limit precision | `v657-context-help-paper-path.test.mjs`, `v659-reliability-premium-ux.test.mjs` |

Some promoted files also contain source assertions about retained implementations. They are retained because their behavior and supporting contract remain relevant, not because all source assertions are invalid. If one fails in future, investigate it before changing the manifest.

## Mixed historical suites and replacement coverage

These nine files remain intact and execute in the historical aggregate. Their runtime portions passed during the audit. The active coverage below protects the relevant current invariants; it does not claim to duplicate every old fixture or literal assertion.

| Mixed historical file | Why the complete old file is historical | Current acceptance coverage |
| --- | --- | --- |
| `auryn-v51-reliability.test.mjs` | Deleted V5 hero/plan/summary files, old quote-route authority and exact technical JSX expressions | `auryn-v5-execution-plan` covers WATCH, accumulation and reduction plans; `auryn-v9342-price-truth` covers Twelve close semantics; `v42-market-truth` covers canonical price integrity; `v657-context-help-paper-path` covers frozen invalidation; `research-execution-presentation` server-renders current WATCH/REDUCE/ACCUMULATE, blocked levels and canonical map precedence. Professional-formatting legacy fixtures remain historical. |
| `auryn-v6-analysis-ui.test.mjs` | Requires deleted V8 hero labels | `auryn-v6-proof`, `auryn-v6-timeframes`, `auryn-v6-valuation-registry`, `auryn-v6-model-health-api` and `auryn-v6-learning-payload` cover evidence/proof separation, timeframe and valuation policy, measured outcomes and immutable serialization. The old assembled V6 hero fixture remains historical. |
| `auryn-v6-portfolio-ui-actions.test.mjs` | Requires the former `actions:v6PortfolioActions` prop spelling | `auryn-v6-portfolio-cio` and `auryn-v6-reliability` cover blocked adds, concentration and preservation of company calls; `portfolio-redesign-integrity` covers unavailable quotes and stale canonical decisions. The current capital-priority implementation is traced in `research-failure-audit.md`; the exact legacy adapter fixture remains historical. |
| `auryn-v7-release.test.mjs` | Requires V7/Setup Map marketing language in today's README | `auryn-v7-analysis` covers canonical version/trust propagation; `auryn-v7-trust-audit` covers blockers; `v61-broker-safety` keeps live auto-submit prohibited. Old version-specific documentation remains a historical contract. |
| `auryn-v81-market-truth-hotfix.test.mjs` | Requires `/api/quote` to own canonical execution truth, although it is explicitly research-only | `v42-market-truth`, `v63-evidence-reality`, `v61-trading-risk`, `manual-paper` and `manual-paper-route` cover disagreement, independent verification and fail-closed execution. |
| `auryn-v92-market-truth-24x7.test.mjs` | Same obsolete quote-route import boundary | `v42-market-truth`, `v60-market-session`, `auryn-v934-session-matrix`, `auryn-v9342-price-truth` and `auryn-v82-security-master` cover holidays, early closes, session states, extended quote normalization and listing identity. |
| `auryn-v934-reliability.test.mjs` | Same obsolete quote-route import boundary | `auryn-v934-timeframes`, `auryn-v934-snapshot`, `auryn-v934-provider-contract` and `auryn-v9342-price-truth` cover deterministic indicators/snapshots, completed-bar aggregation and unavailable/slow optional feeds. |
| `auryn-v9341-hotfix.test.mjs` | Requires deleted `InstitutionalDecisionBrief.tsx` | `auryn-v83-audit-scalability`, `auryn-v84-audit-sampling`, `auryn-v9342-price-truth` and `research-execution-presentation` cover null-safe audit data, representative sampling, bounded provider loading and current execution presentation. |
| `v61-auto-paper-runner.test.mjs` | Requires the literal uppercase `AUTOMATIC RUNNER` label | `v659-reliability-premium-ux`, `v63-evidence-reality`, `v61-trading-risk` and `v61-paper-execution` cover timestamp selection, scheduled paper-only boundary, quote gates and execution behavior. Current operational disclosures were separately server-rendered against empty, populated and migration-required fixtures as described in `operations-failure-audit.md`. |

Table entries without `.test.mjs` use that extension under `tests/`. Other omitted historical files are primarily source-only UI, documentation, migration or wiring contracts, including those outside the old aggregate. They remain runnable with `test:historical:all`; current visual acceptance is recorded separately in the browser reports. Historical source assertions about deleted layouts are not a substitute for inspecting the current rendered product.

## Updating this policy

Add new current behavior tests to the acceptance manifest and run `npm test` plus the production build. Never remove a failing case simply to restore a green status. Trace its intended requirement, determine whether the active product violates it, repair real regressions, and document the current replacement coverage when an intentional redesign makes an old contract obsolete. Keep the historical assertion unchanged unless a separately reviewed test-maintenance change explicitly authorizes updating it. Keep release claims scoped to the exact commands and environments actually verified.

## Prior packaged run

A fresh ZIP extraction passed **605 acceptance tests with zero failures/skips**, then passed its production build. The unchanged historical aggregate was rerun: **649 passed / 82 failed**. The additional failure relative to the earlier 650/81 snapshot is `auryn-v934-package-contract`: it expects `verify:release` to point to an old v934/v935/v936 gate. That gate remains available as `verify:legacy-release`; the current gate intentionally runs the reviewed acceptance suite and build. No historical assertion was edited to mask this difference. See `logs/clean-acceptance.log`, `logs/clean-production-build.log` and `logs/historical-final.log`.

## Product research update

The October 15 product review adds four complete files to the acceptance manifest: `sec-company-evidence-integrity`, `research-product-clarity`, `client-research-cache`, and `product-valuation-disclosure` (all under `tests/` with `.test.mjs`). They add 52 regressions covering actual SEC selection/arithmetic, rendered research meaning, cancellation/cache lifetime behavior and explicit valuation implementation limits. The current 158-file run passed **657 tests with zero failures/skips**. The original historical aggregate remains **649 passed / 82 failed**. See `logs/product-acceptance.log` and `logs/product-historical.log`. No existing acceptance file was removed.

## October 16 weekly study acceptance

The manifest now includes 161 whole test files, with 696 passing tests in the fresh release run. Three new files add 39 tests for weekly calendar/data/pivot/average geometry, explicit support observations and dated moving-average evidence, overlay selection and rendered missing/loading states. The original aggregate remains 649 passed / 82 failed with unchanged failure names versus the preceding product update; `weekly-historical-comparison.json` records that comparison. No historical assertion was modified or removed for this update. The browser and external-service scopes remain separate from this deterministic gate.
