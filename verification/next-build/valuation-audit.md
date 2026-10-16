# Valuation and business-evidence audit

Date: 2026-10-16. Audited baseline: `bbdce50b92384acefb3db79978423da92a75e1ea`.
Scope: approved-build requirements C01–C07, D01–D07 and E01–E07. Read-only source investigation; no production API requests or paid data requests. This report is the only authored file.

## Finding

The application has a useful, conservative **annual SEC financial evidence layer** and a functioning **exploratory cash-flow workbench**. It does not yet have the evidence or integration to turn that workbench directly into canonical fair value. Replace the hardcoded zero-cross-check gate with a validated evidence contract, but keep a particular company unavailable/partial until it satisfies that contract. Do not claim that a configurable gate alone completes E01.

The two most important constraints are:

1. `buildFundamentalAnalyst` currently has `independentCrossChecks = 0`; its unreachable DCF branch infers shares from market cap / price and supplies fixed policy forecasts. Simply changing the zero to one would publish unsupported values.
2. The analyst is called only by `components/StockClient.tsx`. `lib/auryn/v995/autonomous-research.ts` still builds canonical research through `nivora-investor → V4 → V5 → decision kernel`. That older path obtains EPS/book value per share from spot/provider ratios and may publish preliminary relative values. The new engine must replace valuation at the shared canonical snapshot boundary, not just the overview component.

## Evidence available now

| Input | Supported evidence and existing safeguards | Actual limitation |
|---|---|---|
| Revenue | US GAAP / IFRS standard concept aliases; annual 330–400 days and standalone quarter 70–110 days; numeric finite values; exact start/end, unit, currency, filing date, accession, taxonomy, form and SEC filing-index URL | No YTD or TTM; no segment dimensions; custom issuer concepts are ignored |
| Net income | Reported total and selected continuing-operations net income, exact annual/quarter revenue period and filing | Continuing-basis coverage depends on standard concepts; no normalization of unusual gains, preferred claims or minority interests |
| CFO / capex / FCF | Exact annual period, currency, taxonomy and filing match; FCF = CFO − absolute capex; reported consolidated figures remain separate; continuing-business FCF withheld if discontinued activity prevents verifying capex scope | No quarterly/YTD/TTM CFO construction; no historical capex/FCF series; no acquisitions, mandatory debt repayments or financing policy in FCF |
| Margins | Operating income / revenue; gross profit / revenue, matched reported basis | Annual ratios only; no trajectory forecast or forward margin guidance |
| Balance sheet | Cash, total assets, total liabilities from one point-in-time period/filing; liabilities/assets ratio | **Liabilities are not debt.** No debt, leases, preferred equity, minority interests, debt maturity, restricted cash or net-debt bridge |
| Shares | `WeightedAverageNumberOfDilutedSharesOutstanding`, US GAAP `shares` unit, exact annual CFO filing/period; positive finite values; conflicting duplicates rejected | Annual weighted average, not current outstanding or fully diluted current shares. No DEI/current shares, IFRS share tags, split/issuance reconciliation, ADR ratio or share-class mapping |
| Five-year record | Up to five annual revenue/earnings/CFO rows, original currency and source evidence, comparable current-business cohort | History excludes capex, shares and debt; scoring measures consistency, not moat; no full point-in-time snapshot archive |
| Finnhub profile | Raw `/stock/profile2`, including currency, market capitalization, shareOutstanding, name/industry/logo when returned | Market cap and shares are converted from millions by consumers but lack source observation dates and per-field provenance. API response arrival is not market-cap/share effective time |
| Finnhub basic metrics | Raw `/stock/metric` `metric` object, possibly PE/PB/PS/TTM ratios | Period, denominator, share class, accounting basis and observation time are not normalized. `series` is discarded. Availability/entitlements are not verified by this audit |
| Analyst targets/recommendations | Price target response and up to four recommendation rows, when available | External opinions; not issuer guidance or an independently derived intrinsic-value cross-check |
| News / earnings context | Up to ten dated source-linked news items; calendar row; up to four surprise rows; keyword sentiment/materiality | Article text is not structured contract/capacity evidence. Calendar dates may be estimates; provider surprise definitions are not normalized |
| SEC submissions | Latest 14 selected filing types, dates, primary-document URLs, coarse financing/materiality labels | Filings are indexed, not read for contracts/guidance. A shelf/prospectus is a financing watch item, not proof of completed issuance or thesis failure |
| Moat / thesis | Typed V4 explicit evidence hooks, classification/model registry, source-filtered business UI | Production autonomous adapter supplies no `explicitV4`; migration reasons are heuristic, and the UI correctly withholds them as measured moat. Financial consistency does not prove switching costs or scarcity |

Primary implementation references: `lib/sec-company-evidence.ts`, `lib/research-evidence.ts`, `lib/research-valuation-workbench.ts`, `lib/auryn/v99910/fundamental-analyst.ts`, `app/api/company/[symbol]/route.ts`, `app/api/context/[symbol]/route.ts`, `lib/auryn/v4/current-evidence-adapter.ts`, `lib/auryn/v6/valuation-registry.ts`.

## Financial-period and provenance gaps

1. **YTD is rejected rather than normalized.** This is safer than treating nine months as a quarter, but C01 is incomplete. Preserve annual, quarter, YTD and instant facts independently. Derive a quarter only by subtracting compatible cumulative periods; derive Q4 from annual minus nine-month YTD when compatible. TTM can use four non-overlapping quarters or latest FY + current YTD − prior comparable YTD. Every component must have been available by the snapshot cutoff, share currency/taxonomy/business scope, and have compatible fiscal periods. A missing component produces a reason, not an annualization.
2. **Fiscal identity is implicit.** Exact dates are retained, which is good; `history.year` is period-end calendar year. Preserve fiscal year/period labels separately without using a later filing's `fy` field to relabel a comparative year. Support 52/53-week years and report duration changes; avoid silently assuming calendar quarters.
3. **Restatement policy is partly implemented.** Newer filings outrank older facts, and calculations require one filing. Preserve original observations and explicit supersession lineage for replay. Date-only `filedAt <= asOfDay` can admit a filing later on the same day; intraday replay needs SEC acceptance/publication timestamps or a conservative date policy.
4. **Conflicting monetary duplicates are not detected.** Verified with an in-memory fixture: identical concept, period, filing and accession with values `[100, 200]` yields 200; reversing input yields 100; no conflict reason. Annual diluted shares already reject this. Apply conflict detection to monetary facts before selecting them. Do not resolve source conflicts by array order.
5. **Reported-versus-current business scope must survive every consumer.** SEC rawMetrics correctly withhold unconverted currencies and consolidated FCF affected by discontinued operations. The presentation module is less strict when deriving displayed source references: it checks source/period/currency, but not accession/taxonomy. Reuse normalized derived-metric lineage instead of rebuilding it in UI code.
6. **No per-metric missing reason.** `dataQuality.warnings` and coverage are aggregate; individual absent inputs need typed reasons such as `NO_FACT`, `PERIOD_MISMATCH`, `CONFLICT`, `UNCONVERTED_CURRENCY`, `DISCONTINUED_SCOPE`, `STALE` or `UNSUPPORTED_SHARE_CLASS`.
7. **Fetching time is mislabeled as freshness.** Company/context route timestamps are generated on every response even when `sharedJson` returned cached provider data. Preserve retrieval time in the cached envelope. SEC publication time, economic period end, provider observation time and response time are different fields.
8. **Missing snapshot dates.** Autonomous research reads `company.asOf/updatedAt` and `context.asOf`, fields these routes do not supply. It also treats the next earnings event date as `earningsAsOf`. Use actual evidence publication/observation cutoffs, not upcoming event dates.
9. **Transport failure reasons collapse.** SEC `Promise.all` means a submissions failure discards usable facts, and vice versa. Finnhub `get` collapses 401/403/429/timeout/empty results to null. Preserve successful subsets and expose endpoint availability states. Existing shared cache/coalescing should be retained; do not add unbounded requests to obtain valuation.

## Methodology boundary

The workbench explicitly discounts annual CFO less capex as an **equity cash-flow proxy**, assumes zero net new borrowing and lets users add a cash deduction. It does not subtract net debt. That is a coherent exploratory disclosure, but does not establish that the cash is distributable to common owners.

SEC guidance on FCF explains that CFO less capex is not uniform and can omit mandatory debt service or other nondiscretionary claims. Damodaran's FCFE formulation includes debt issuance less repayments and addresses preferred claims. Therefore:

- Do not subtract total net debt from an already levered equity cash-flow model merely to fill a missing net-debt field; that mixes enterprise and equity methods.
- An FCFF model needs an explicitly unlevered operating cash-flow basis, WACC and an enterprise-to-common-equity bridge. An FCFE model needs financing/claims assumptions and a cost of equity. Keep these contracts separate.
- A zero debt balance, zero financing, zero preferred claims, or zero dilution must be an evidenced value or an explicitly labeled scenario assumption. Missing is not zero.
- Reported annual diluted averages are usable for the current exploration with its warning, but canonical current equity-per-share output needs a verified listed-share denominator and post-period corporate-action treatment.

Methodology references inspected on 2026-10-16:

- [SEC Non-GAAP Financial Measures, Question 102.07](https://www.sec.gov/rules-regulations/staff-guidance/corporation-finance-interpretations/non-gaap-financial-measures)
- [Aswath Damodaran, Investment Valuation, Chapter 14: Free Cash Flow to Equity Discount Models](https://pages.stern.nyu.edu/~adamodar/pdfiles/valn2ed/ch14.pdf)

## Recommended contracts

The following interfaces are proposed, not implemented by this audit. They prevent a raw number or caller-supplied `verified: true` from becoming a source-backed canonical value. Existing public response fields can remain as compatibility projections of these contracts.

```ts
type Availability = 'AVAILABLE' | 'MISSING' | 'STALE' | 'CONFLICT' | 'UNSUPPORTED';
type EvidenceKind = 'REPORTED_FACT' | 'MANAGEMENT_GUIDANCE' | 'EXTERNAL_ESTIMATE'
  | 'AURYN_ASSUMPTION' | 'USER_ASSUMPTION' | 'DERIVED';
type FinancialScope = 'ANNUAL' | 'YTD' | 'QUARTER' | 'TTM' | 'POINT_IN_TIME';

interface SourceRef {
  id: string; source: 'SEC' | 'ISSUER' | 'FINNHUB' | 'OTHER_AUTHORIZED';
  sourceUrl: string; retrievedAt: string; publishedAt: string | null;
  accession: string | null; concept: string | null; taxonomy: string | null;
}
interface EvidenceValue {
  id: string; metric: string; kind: EvidenceKind; status: Availability;
  value: number | null; unit: string; currency: string | null;
  scope: FinancialScope; periodStart: string | null; periodEnd: string | null;
  fiscalYear: string | null; fiscalPeriod: string | null;
  observedAt: string | null; availableAt: string | null;
  accountingBasis: 'US_GAAP' | 'IFRS' | 'NON_GAAP' | null;
  businessScope: 'CONTINUING' | 'CONSOLIDATED' | 'SEGMENT' | null;
  sourceIds: string[]; inputIds: string[]; formulaVersion: string | null;
  reasonCodes: string[]; supersedesIds: string[];
}
interface ShareDenominator {
  factId: string;
  basis: 'CURRENT_OUTSTANDING' | 'CURRENT_FULLY_DILUTED' | 'ANNUAL_DILUTED_AVERAGE';
  securityId: string; shareClass: string | null; effectiveAt: string;
  unitsPerListedShare: number | null; corporateActionEvidenceIds: string[];
  reconciliationState: 'VERIFIED' | 'REVIEW_REQUIRED' | 'UNSUPPORTED';
}
interface ModelCoverage {
  method: string; version: string; businessModels: string[]; lifecycles: string[];
  implementation: 'IMPLEMENTED' | 'EXPLORATORY_ONLY' | 'NOT_IMPLEMENTED';
  requiredMetrics: string[]; requiredAssumptions: string[];
  requiredCrossCheckFamilies: string[]; exclusions: string[];
}
interface ValuationAssumption {
  id: string; value: number; unit: string;
  kind: 'MANAGEMENT_GUIDANCE' | 'EXTERNAL_ESTIMATE' | 'AURYN_ASSUMPTION' | 'USER_ASSUMPTION';
  evidenceIds: string[]; rationale: string; policyVersion: string | null;
}
interface ValuationCrossCheck {
  id: string; family: 'NORMALIZED_EARNINGS' | 'RESIDUAL_INCOME' | 'ASSET_NAV'
    | 'COMPARABLE_MULTIPLES' | 'HISTORICAL_MULTIPLES';
  methodVersion: string; status: Availability;
  evidenceIds: string[]; assumptions: ValuationAssumption[];
  valuePerListedShare: number | null; currency: string;
  independentOfPrimaryMethod: boolean; limitations: string[];
}
interface CanonicalValuationInput {
  symbol: string; securityId: string; researchSnapshotId: string; asOf: string;
  businessModel: string; lifecycle: string; modelVersion: string; policyVersion: string;
  facts: EvidenceValue[]; sources: SourceRef[]; shares: ShareDenominator | null;
  assumptions: Record<'bear' | 'base' | 'bull', ValuationAssumption[]>;
  crossChecks: ValuationCrossCheck[];
  marketReference: { price: number; currency: string; observedAt: string;
    marketSnapshotId: string } | null;
}
interface CanonicalValuationResult {
  researchSnapshotId: string; modelVersion: string; policyVersion: string;
  method: string; state: 'MEASURED' | 'PARTIAL' | 'UNAVAILABLE' | 'UNSUPPORTED';
  decisionGrade: boolean; missingInputs: { metric: string; reasonCode: string }[];
  scenarios: Record<'bear' | 'base' | 'bull', {
    valuePerListedShare: number; assumptionIds: string[]; evidenceIds: string[];
    projection: unknown[]; terminalWeightPct: number;
  }> | null;
  crossChecks: ValuationCrossCheck[];
  comparison: { marketSnapshotId: string; marginOfSafetyPct: number;
    priceObservedAt: string } | null;
  impliedExpectations: { metric: string; value: number | null;
    fixedAssumptionIds: string[]; reasonCode: string | null } | null;
  evidenceCoveragePct: number; warnings: string[];
}
```

Use a distinct `ExploratoryScenarioInput` with `origin: 'USER'`, `parentResearchSnapshotId`, reviewed shares and overrides. Its output keeps `decisionGrade: false`, can never populate canonical factor scores, and does not invalidate or mutate the saved canonical snapshot.

## Conservative implementation strategy

1. **Unify coverage first.** Reuse one model registry across v6, v99910 and the workbench. v6 maps `SPACE_SATELLITE` to `FRONTIER_SCENARIO_RUNWAY`; v99910 currently omits it and falls back to `GENERAL_RELATIVE`. A registry must distinguish implemented methods from named future methods. Mature positive-FCF software may support an explicitly scoped cash-flow method; this does not make all hypergrowth software suitable. Preserve specialized methods and unsupported states.
2. **Extend the SEC normalizer with typed facts and reasons.** Retain current safeguards. Add YTD/TTM with lineage; current/basic/diluted share evidence; interest-bearing debt components; share-based compensation; financing cash flows; preferred claims and current listed-share identity where obtainable. Candidate standard tags are adapter mappings to validate against fixtures, not asserted available data. Missing debt components cannot be summed as zero. Reject total-debt/component overlap and same-period source conflicts.
3. **Build valuation from economic inputs before looking at price.** The mature-company path can use source-backed FCFE only after its financing/claim contract is satisfied, or a separately implemented FCFF path after its enterprise bridge is satisfied. Put every growth/fade/margin/capex/discount/terminal/financing/dilution choice into a versioned assumption object. Fixed policy assumptions are allowed as assumptions; they are not SEC facts or management forecasts. Never derive the share count from market cap / price.
4. **Make the gate real.** `independentCrossChecks` must be the count of validated, genuinely separate method families. A second DCF run, an FCF yield, terminal sensitivity, or the same value rearranged algebraically does not count. A second SEC earnings source line can support a normalized-earnings method, but reported net income alone does not establish distributable earnings or a justified capitalization multiple. Until normalization/reinvestment and the multiple basis are supported, that is a diagnostic rather than a qualifying cross-check. Provider PE/price-target fields without dated normalized evidence cannot unlock canonical fair value.
5. **Do not falsely mark methods verified.** An implementation passing software tests is not calibrated investment performance. Return model implementation state, evidence completeness and outcome validation separately. A dynamic gate that withholds all presently unsupported production cases is correct; present that coverage limitation explicitly.
6. **Calculate independent price comparison and implied expectations.** A missing/stale price can suppress upside or implied growth while leaving the intrinsic estimate intact. Solve for one displayed assumption with a bracketed root search under fixed others; return `NO_SOLUTION_IN_DOMAIN` if no solution. Do not tune base growth or terminal value to match spot. Implied growth is an expectation under assumptions, not a forecast or success probability.
7. **Integrate once.** Add the valuation result and structured thesis to the research snapshot and project that snapshot into overview, tabs, watchlist, portfolio, alerts and paper eligibility. Price-only refresh updates a market-reference comparison and timing; it cannot rewrite source facts, business quality or canonical forecasts. Remove/disable the legacy valuation factors in the canonical path rather than averaging them with the new model.

## Business thesis coverage

The existing classifier and factor weights can select business-specific models. They cannot supply the missing business evidence.

| Coverage | Dimensions that should be tracked | Current supported state |
|---|---|---|
| Mature compounder | Comparable sales/margins/cash generation, reinvestment, capital structure; cited moat drivers | Annual financial history is available; measured moat and forward economics remain incomplete |
| Growth business | Revenue quality, cohort/unit economics, margin conversion, SBC/dilution, financing | Revenue growth and annual margins available; forward conversion and unit economics unsupported |
| IREN-type infrastructure | Segment revenue/EBITDA, operational vs contracted MW/GPU capacity, power rights/cost, utilization, delivery, equipment replacement, customers, capex/funding, dilution, remaining mining | Profile/news can aid classification, SEC financial totals can be shown. No structured operating/contract facts; no SOTP value should be fabricated |
| ASTS-type satellite | Satellites deployed/usable, coverage/capacity, commercial conversion, regulatory approvals/dependencies, milestone dates, cash runway, funding/dilution | Classification and financial totals possible. No sourced operating milestone ledger, probability model or runway financing model |

Recommended structured thesis contract:

```ts
interface BusinessClaim {
  id: string; dimension: string; text: string; evidenceIds: string[];
  kind: 'REPORTED_FACT' | 'MANAGEMENT_GUIDANCE' | 'EXTERNAL_ESTIMATE' | 'AURYN_INTERPRETATION';
  state: 'SUPPORTED' | 'CONTRADICTED' | 'UNSUPPORTED'; availableAt: string;
}
interface BusinessMilestone {
  id: string; dimension: string; expected: BusinessClaim | null;
  actual: BusinessClaim | null; dueAt: string | null; dateConfirmed: boolean;
  state: 'PLANNED' | 'DELIVERED' | 'DELAYED' | 'CANCELLED' | 'UNKNOWN';
}
interface BusinessThesis {
  researchSnapshotId: string; businessModel: string; coverageVersion: string;
  reasonsToOwn: BusinessClaim[]; counterarguments: BusinessClaim[];
  moatDrivers: BusinessClaim[]; milestones: BusinessMilestone[];
  dependencies: BusinessClaim[];
  invalidators: { id: string; dimension: string; condition: string;
    evidenceIds: string[]; state: 'NOT_TRIGGERED' | 'TRIGGERED' | 'UNKNOWN' }[];
  missingDimensions: string[];
}
```

Start by generating factual thesis statements from actual normalized financial changes with their source IDs. Operational/moat dimensions stay missing until SEC/issuer passages or reviewed structured evidence are connected. Keep management targets distinct from actual delivery. Preserve historical expectation and actual pairs for D06. A chart break is not a `BusinessClaim` that invalidates a business thesis. No ticker-specific BUY overrides are needed.

## Verification and proposed tests

Baseline command executed successfully:

```sh
node --test tests/sec-company-evidence-integrity.test.mjs tests/research-valuation-workbench.test.mjs tests/product-valuation-disclosure.test.mjs tests/research-product-clarity.test.mjs
```

Result: **52 passed, 0 failed**. These are local fixture/route/UI tests, not live provider or investment-performance verification. The NBIS fixture demonstrates safe currency/cohort/discontinued-operations handling; it is not evidence for IREN/ASTS operating metrics.

Additional direct fixture: equal-identity conflicting monetary facts select different values when input row order reverses; this is a reproduced baseline defect. No files were altered for that probe.

Recommended meaningful behavior tests:

| Test | Expected result |
|---|---|
| Q1, H1, nine-month cumulative CFO and annual CFO | Derived Q2/Q3/Q4 reconcile to annual; no overlap/double count |
| FY + current/prior YTD TTM, non-calendar and 53-week years | Exact compatible periods; all source IDs retained; wrong duration rejected |
| Restatement published after cutoff; same-day intraday cutoff | Earlier snapshot unchanged; unavailable later facts cannot leak into replay |
| Equal-identity conflict with reversed source order | `CONFLICT`, null derived result, deterministic reason |
| Cash/debt different dates/currencies; total plus components | No invalid bridge or double-counted debt; absence never becomes zero |
| Annual diluted vs current basic shares; split/ADR/class mismatch | Annual average cannot silently become current denominator; conversion requires evidence |
| Positive annual CFO but discontinued operations or compulsory financing claims missing | Exploratory/partial only; no canonical value |
| Complete permitted mature-company fixture with independent qualifying cross-check | Non-null bear/base/bull values reconcile to displayed formulas and source IDs |
| Same fixture with cross-check removed/undated/derived from primary DCF | Null canonical fair value with precise missing reason |
| Same economics, different price/market cap/technical levels | Intrinsic value unchanged; only comparison/implied expectation/timing changes |
| Higher discount, lower growth, higher dilution, higher required claims | Correct directional response; terminal weight disclosed; no silent scenario sorting |
| Inverse expectation solver | Known synthetic growth recovered; no-solution domain explicit |
| IREN / ASTS fixtures with no operational facts | Correct required model and missing dimensions; no inferred capacity or probabilities |
| Guidance later met/missed; mutually inconsistent issuer claims | Original guidance preserved; outcomes dated; conflict explicit |
| User overrides and reviewed shares | Exploratory values change, canonical snapshot hash/action/paper eligibility unchanged |
| Company/context endpoint partial failure and stale cache | Surviving fields retained; original retrieval/observation time and endpoint-specific reason shown |
| Overview vs background canonical snapshot | Same valuation method, values, version, source IDs and eligibility at identical evidence |

Existing `product-valuation-disclosure` tests should retain the assertion that scalar-only inputs cannot unlock valuation. Add a separate positive fixture with real provenance/period/share/financing/cross-check contracts; do not replace the safety regression with a blanket expectation of a fair value. Old source-regex tests in `auryn-v99910-fundamental-analyst.test.mjs` only assert words are present and are not adequate proof of arithmetic or safety.

## Acceptance status at baseline

- C01: partial; annual/quarter/instant preserved, YTD/TTM and corporate-action normalization missing.
- C02/C03/C06: partial; strong selected SEC provenance and null handling, but missing reasons/freshness/conflicts/endpoints are incomplete.
- C05/C07: shared caching and authorized endpoints exist; usable live capabilities/entitlements were not verified here.
- D01: registry exists; no unified coverage/implementation contract. D02–D07: hooks and conservative presentation exist; structured operational, moat, guidance and thesis evidence is incomplete.
- E01–E05: canonical intrinsic valuation is not supported at baseline; cross-check and economic/share/financing inputs are incomplete.
- E06: functioning isolated scenario workbench with explicit assumptions and disclosure.
- E07: multiple safeguards exist; stronger typed uncertainty and per-input reasons remain necessary.
