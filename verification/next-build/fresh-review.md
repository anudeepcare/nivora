# Fresh review — approved October 16 build

Review date: 2026-10-16. Baseline: `bbdce50b92384acefb3db79978423da92a75e1ea`. Reviewed the current uncommitted implementation against `docs/superpowers/specs/2026-10-16-approved-build.md`. This is an independent source and fixture review, not deployed integration or investment-performance verification. Production source was not edited by this reviewer. Other implementation agents were fixing findings during the review; the disposition below distinguishes observation from re-verification.

## Findings

### R1 — Important: the new capital gate blocked owner reductions and exits

Files: `lib/auryn/v931/decision-kernel.ts` execution readiness; `lib/server/paper-operations.ts` `normalizePaperEvidence`; `app/api/trading-lab/run-paper/route.ts` before the owner-action mapping.

The initial diff made execution `READY` conditional on a new-money BUY tier. An owner `REDUCE`/`EXIT` consequently became `BLOCKED` when new money was WAIT/AVOID, and the runner rejected it before mapping the owner instruction to TRIM/SELL. The existing intent/risk engines deliberately permit risk-reducing sells.

**Disposition:** fixed in the working source during this review and independently rechecked. A fresh direct-source fixture with business/earnings scores 15, a structural break and an executable market now returns `owner: EXIT`, `newMoney: AVOID`, `execution: READY`, with reasons `RISK_REDUCTION_ONLY`, `RESEARCH_WITHHOLDS_NEW_CAPITAL`, `SETUP_INVALIDATED`. This is a policy-layer check; live broker execution remains unverified.

### R2 — Important: pending sells are deducted twice from broker availability

File: `lib/server/paper-operations.ts`, `reservePaperCapacity`, initially line 57. `lib/alpaca-paper.ts` maps Alpaca `qty_available` to `availableQty`.

Alpaca's available quantity already excludes open orders. The helper subtracts each pending sell again. A broker position with `qty:100`, `availableQty:70` and a pending sell of 30 produces `availableQty:40`. Both the manual and automated paths can therefore reject a legitimate sale of the remaining 70 shares. Existing tests use `availableQty == qty` in their pending-order fixture and miss this broker-shaped case.

Reproduced against current source by calling `reservePaperCapacity({equity:10000,cash:5000,buyingPower:5000}, [{symbol:'AAPL',qty:100,availableQty:70,marketValue:5000}], [{id:'sell1',symbol:'AAPL',side:'sell',qty:30,filledQty:0,limitPrice:50}])`; observed output availability 40, expected at most the broker-reported 70. Initial reconciliation should compare the broker limit with `qty - total pending sells`. Newly submitted orders since that broker observation need a distinct incremental reservation path.

Primary provider reference: [Alpaca position model](https://alpaca.markets/sdks/python/api_reference/trading/models.html), `qty_available` definition. Retrieved during this review.

**Disposition:** fixed and independently rechecked. The helper distinguishes broker observations from orders newly submitted during this run. The realistic broker case now preserves 70 available shares; a subsequent new sell of 20 reserves that capacity and leaves 50. Source review confirms the runner uses the incremental `new` path after successful submission.

### R3 — Important: unavailable technical evidence became measured neutral evidence

Files: `lib/auryn/v931/canonical-assessment.ts`; `lib/auryn/v934/decision-bridge.ts`; `lib/auryn/v931/setup-state.ts`.

The initial adapter called the bridge for any market-intelligence object. An empty `confirmed` object caused its weighted reducers to fall back to 50; that generated a MIXED market-structure pillar, 17% coverage and a measured `RECLAIM_ATTEMPT`. Missing history was therefore a fabricated neutral fact (B04/C03/F05), despite all-null kernel unit tests passing.

**Disposition:** fixed and independently rechecked. Qualification now checks valid fields only in the actual 1D/1W/4H/1H weighted family. Both empty-confirmed and valid 15M-only fixtures return null/UNAVAILABLE structure, coverage 0 and setup UNASSESSED.

### R4 — Important: allocation changes and tactical invalidation were described as thesis evidence

File: `lib/auryn/workspace/model.ts`, `materialChanges` and `snapshotFromCanonical`.

A WAIT-to-BUY change with identical thesis score, setup and valuation produced `kind:'thesis'`, title `Canonical assessment changed`. New-capital actions can change from price or timing alone. The saved-evidence adapter also labeled the kernel's explicitly tactical invalidation `Thesis invalidation` and classified it as a business counterargument. These leak technical changes into thesis alerts and Ask AURYN (B03/L04).

**Disposition:** fixed and independently rechecked. A fresh READY action-only change emits `allocation`, while explicit long-term business assessment/counterevidence changes retain the thesis category. Tactical invalidation is labeled `Tactical setup invalidation` with a fact role, so it is not presented as a business counterargument.

### R5 — Important: valuation citations used the business evidence family

File: `lib/auryn/v931/canonical-assessment.ts`, valuation pillar.

The original adapter attached `financial.evidenceIds` and `financial.evidenceAsOf` to the valuation score. Those are the operating-quality inputs. They exclude the share denominator and financing/other cash claims used to calculate value. The Advanced export could not trace its valuation vote to its material inputs (B08/C02/M01).

**Disposition:** fixed and independently rechecked through the financial engine and canonical adapter. A complete synthetic mature fixture with business evidence dated February 15 and a listed-share review dated March 21 produces valuation date March 21, retains the share denominator ID and passes the entire valuation evidence family to the canonical pillar. The business evidence date remains February 15.

### R6 — Important: saved workspace readiness does not age

File: `components/ResearchWorkspace.tsx`, snapshot projection, ready filters and portfolio attention state; `lib/auryn/workspace/model.ts` saved snapshot state.

Workspace rows retain the `READY` state captured at save time. Returning after more than seven days still classifies that old record as “Research ready” and treats portfolio evidence as current until the user manually refreshes. The canonical loader itself correctly checks age; the workspace does not recompute the same eligibility from `observedAt`. A timestamp being visible does not make a readiness filter accurate (B07/C04/L01).

**Disposition:** fixed and independently rechecked at helper/source level. `researchFreshness` returns stale for a 15-day-old saved READY record. The workspace recomputes its clock each minute and uses this helper for readiness labels, filters, comparison currentness and portfolio attention. Browser behavior was not independently exercised by this reviewer.

### R7 — Important: a corrected filing does not clear an older conflict gate

Files: `lib/sec-company-evidence.ts`, `normalizeFacts`; `lib/research-financial-assessment.ts`, source-conflict guards in `buildValuation` and `buildFinancialAssessment` (lines 86 and 147 at review).

The normalizer retains every historical CONFLICT issue while correctly admitting a later unambiguous filing for that same fiscal period. The assessment then treats the old issue as unresolved based only on period end. A corrected/restated period therefore remains blocked despite the current facts having resolved the ambiguity.

Reproduction: put `Revenues=100` and `RevenueFromContractWithCustomerExcludingAssessedTax=110` in the 2025 annual filing dated 2026-02-15, then put both aliases at 120 in a 2026-03-01 filing for the same period. Include matching operating income, cash flow and capex in the later filing. The normalizer selects the current 120 correctly, but retains the February CONFLICT; the assessment returns null business quality and `UNRESOLVED_CONFLICT`. Retain the conflict audit, but distinguish unresolved conflicts from a later same-basis resolution. This is a C01 restatement-recovery defect.

**Disposition:** fixed and independently rechecked with the original reproduction. The historical issue remains `SUPERSEDED`, with `resolvedAt: 2026-03-01` and the correcting accession. Business score is restored to 92 in that synthetic fixture and the false `UNRESOLVED_CONFLICT` gate is absent. Unresolved-conflict tests continue to pass.

### R8 — Important: the new funding-evidence object was passed as a display string

Files: `components/StockClient.tsx` planning evidence mapping; `components/PlanningWorkbench.tsx` evidence display; `lib/auryn/planning/policy.ts` string-state validation.

The newly added `financial.fundingRisk` is an object containing state and provenance. The initial integration passed that object as `PlanningEvidence.fundingRisk`, which expects a string. Opening the stock planner would render the object as a React child and fail; the policy would also reject it as an unrecognized state. Pass `fundingRisk.state`, with its material source IDs retained in the references.

**Disposition:** root corrected the typed mapping to fundingRisk.state and retained evidence IDs. Full build/type checks passed after the correction. The final browser accumulation fixture explicitly supplies reviewed funding evidence; see current release report for its result. This root follow-up is not an additional independent review.

## Approved-scope gaps that must be implemented or disclosed

- **D02–D07, E01–E05, J07–J08:** the initial production path could never supply required valuation review or business claims. A server-owned source-review API, append-only audit migration and company read-through now exist. Focused API and isolated SQL tests passed: ordinary users cannot write, editable user metadata cannot elevate privilege, citations must match current issuer SEC evidence, and changed evidence invalidates the review. Source review is mounted in company fundamentals and valuation; save refreshes company data and requests a server-generated canonical refresh with only the symbol. Source was checked; an authenticated browser save was not performed by this reviewer. Companies without the required source facts/review remain blocked. IREN/ASTS specialized valuation engines remain explicitly unsupported, not implemented capacity/runway valuation; their business-specific disclosure dimensions and invalidation conditions do not establish a numerical valuation.
- **I03, L01, L04:** the missing event producer path is now wired through collection, persistence and canonical projection. Focused tests verify date validity and publication cutoffs, and a direct-source fixture confirms external estimates remain planned/estimated. No real provider event completeness was established. The source-review UI's initially dropped nonnumeric milestone period was corrected: source now preserves `periodEnd` independently of the optional numeric value.
- **B02:** six-to-twelve-month evidence is always withheld by the current canonical adapter. This is conservative, but distinct horizon display is not delivery of a researched medium-term assessment. Disclose that unavailable forward evidence is the boundary.
- **H02/H04:** sector/theme/shared-risk coverage and benchmark/correlation/fund-overlap behavior remain data-dependent. The portfolio passes security/research fields that the canonical projection does not yet populate. Showing coverage limitations is correct; do not count fully populated concentration intelligence as verified by arithmetic fixtures.
- **M02–M05/M08:** the equal-budget replay engine consumes a user-supplied dataset and declarations of model training cutoffs. No independent point-in-time universe, delisted assets or frozen model-training provenance was established by this review. Observation-only labels and limitations must remain; test counts are not investment validation.
- **J01–J03/J08/N02/N08:** local source, mocked routes and isolated SQL do not prove deployed admin mapping, applied schema, scheduled-runner credentials, live row isolation or an authorized broker lifecycle. Existing operational diagnostics must remain explicit release boundaries.

## Verification performed by this reviewer

1. Fresh current-source tests (no shared engine compilation):

   `node --test tests/canonical-write-boundary.test.mjs tests/canonical-projection-integrity.test.mjs tests/paper-operations.test.mjs tests/financial-assessment-v1.test.mjs tests/financial-evidence-v4.test.mjs`

   **36 passed, 0 failed, 0 skipped.** This result predates later implementation changes; it is not the final full release result.

2. Isolated PostgreSQL/PGlite workspace migration check:

   `WORKSPACE_SQL_TEST_MODULE=/workspace/scratch/0397d872aad5/auryn-next/node_modules/@electric-sql/pglite/dist/index.js node --test tests/auryn-workspace-ownership.test.mjs`

   **1 passed, 0 failed, 0 skipped.** It exercises cross-user insertion/read isolation, immutable original/review rows, and owner-bound review foreign keys. It does not connect to deployed Supabase.

3. Direct TypeScript transpile/load fixtures against the then-current source reproduced R2/R4 and verified the R1/empty-history R3 corrections. No production build or broad suite was run by this reviewer while the release owner was running them. No live database or broker mutation occurred.

4. Subsequent current-source paper/event/write/projection tests: **23 passed, 0 failed, 0 skipped** at that check. Direct-source fixtures independently verified R2 broker/incremental capacity, R3 empty/15M-only history, R4 allocation/tactical semantics, R6 aging and external-estimate event state.

5. New source-review API/migration and event tests: `node --test tests/company-source-review.test.mjs tests/company-source-review-migration.test.mjs tests/canonical-events.test.mjs` — **14 passed, 0 failed, 0 skipped**. Migration tests ran in isolated PGlite and exercised append/read, denied audit update/delete and denied anonymous/authenticated browser access. Direct-source R5 lineage assertion also passed. These are focused checks, not a final full-release result.

6. After the conflict/funding fixes: `node --test tests/financial-evidence-v4.test.mjs tests/financial-assessment-v1.test.mjs tests/company-source-review.test.mjs tests/company-source-review-migration.test.mjs` — **32 passed, 0 failed, 0 skipped**. Original R7 reproduction rerun separately passed. `git diff --check` passed at this point.

## Release assessment

Do not claim all approved scope or paper-operation acceptance complete from the initial report. The above open regressions need re-verification, and the data-dependent/unsupported capabilities must have item-specific status in the final requirements ledger. The authenticated server-generated canonical write path and isolated RLS check are useful verified improvements, but neither establishes deployed operational readiness.
