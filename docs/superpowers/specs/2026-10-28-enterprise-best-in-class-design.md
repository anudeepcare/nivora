# AURYN Enterprise Best-in-Class Design

**Status:** Draft for approval — no product code changes authorized yet  
**Date:** 2026-10-28  
**Scope:** Claude universal valuation specification + Gemini institutional extensions + AURYN Pace and approved product UX

## Intent

AURYN should become a transparent, auditable decision system for public-company research, accumulation timing and portfolio risk. It should have institutional data discipline and workflows while remaining understandable to an individual investor.

The product may be trading-grade in process, traceability and validation. It must not claim guaranteed returns, predictive certainty or broker execution authority.

## Goals

- Produce a deterministic result for every supported instrument: model value, range-only, facts-only or explicit refusal.
- Preserve Auryn Pace as a separate accumulation-timing layer after business, valuation and risk gates.
- Replace generic cash-flow examples with routed, company-specific valuation methods.
- Make every displayed number traceable to its source, period, transformation and model version.
- Make the mobile installed-PWA experience feel native to current iOS conventions.
- Support institutional review, API consumption, Excel workflows, portfolio-level risk and role-based approvals.
- Establish point-in-time data, backtesting, governance, monitoring and compliance before public production claims.
- Build the first release with existing infrastructure and free or already-available data sources; new paid services are optional, not prerequisites.

## Non-goals and anti-goals

- No hardcoded Meta, Nvidia, Google or other ticker verdicts.
- No fabricated values when data is missing, stale or disputed.
- No hidden provider fallback that silently changes the meaning of a number.
- No user-entered final valuation or analyst override of an output dollar value.
- No claim of outperformance before an untouched holdout backtest passes.
- No automatic trading, broker order placement or personalized legal/investment advice.
- No Kafka, alternative-data subscription or enterprise data-license purchase is assumed without an approved infrastructure and budget decision.

## Budget and accuracy contract

- **No new paid dependency by default.** The first build uses the existing Next.js/Supabase deployment, SEC EDGAR/XBRL, public Treasury/FRED data and already-configured market providers. A second vendor, options IV, transcripts, alternative data, managed vector search, Kafka and Excel distribution are feature-gated integrations, not launch blockers.
- **No silent quality downgrade.** If a preferred source is unavailable, the output becomes lower-confidence, range-only, facts-only or refused. It never substitutes invented values.
- **Universal ticker coverage means universal handling, not universal valuation.** Every valid symbol receives a deterministic state and explanation. Some instruments will correctly receive no intrinsic value.
- **99.9999% is a calculation-integrity target, not a market-forecast accuracy promise.** We can target deterministic reproducibility, schema correctness, lineage integrity and invariant compliance at that level. Valuation accuracy must be measured honestly with point-in-time holdout backtests and reported by family, size and data quality.
- **Fast path first.** Stored valuations, bounded requests, memoization and batch recomputation keep page loads fast. Monte Carlo and portfolio simulations run offline or on demand, not on every mobile page load.

## Approaches considered

1. **TypeScript-only valuation engine.** Rejected for institutional Monte Carlo and portfolio workloads; retained only for lightweight browser scenario recomputation and presentation.
2. **Python compute service with Next.js/Supabase product layer.** Chosen. FastAPI owns heavy valuation, Monte Carlo, portfolio risk and model-versioned outputs. Next.js owns UX, auth, API gateway and explain surfaces. Supabase owns account data and append-only application records.
3. **Full streaming platform before validation.** Deferred. The event schema will be Kafka-compatible, but the first production-safe implementation uses append-only events/outbox semantics and a worker. Kafka adoption requires a measured throughput and recovery need.

## System architecture

```text
SEC / primary vendor / check vendor / market feeds
                         |
                 Point-in-time data layer
                         |
                 Reconciliation + lineage
                         |
             Python/FastAPI valuation service
        (routing, rates, methods, scenarios, risk)
                         |
                Versioned valuation output
                         |
         Next.js API gateway + glass-box explain UI
              /                    \
       Web/PWA product          Excel/API clients
```

- Heavy computation is implemented as a Python/NumPy-compatible core. It can run in the existing worker or deployment boundary first; a separately hosted FastAPI service is added only when measured load requires it. A deterministic non-vectorized reference implementation remains for tests.
- Internal transport defaults to authenticated REST with a versioned schema; gRPC remains an approved optimization if latency/load tests justify it.
- Every request and output carries `traceId`, `modelVersion`, `configHash` and `asOf`.
- The event envelope is immutable and replayable: ingest, reconciliation, corporate action, override proposal, approval, valuation and publication are separate events.

## Valuation contract

Claude’s nine-step contract remains authoritative:

1. Normalize TTM, shares, splits, currency and filing dates.
2. Score data quality.
3. Route using ordered business/model families.
4. Build dynamic cost of capital.
5. Run the family method.
6. Run joint bear/base/bull assumptions.
7. Solve reverse-implied growth.
8. Apply sanity and confidence gates.
9. Publish, show range-only, show facts-only or refuse.

Required extensions:

- Dynamic yield curve by cash-flow duration, with a documented fallback when only a point rate exists.
- Unlevered peer beta, then target-capital-structure re-levering; Blume adjustment and distress/size/country premiums remain explicit.
- Fully diluted capitalization using options, RSUs, warrants and converts. Use Treasury Stock Method where inputs support it; use Black-Scholes only when required terms and volatility are available; otherwise disclose the limitation and lower confidence.
- Dynamic peer clustering from business-description embeddings and financial/segment features. SIC/GICS may remain a fallback label, never the only peer method.
- SOTP routing for demonstrable conglomerate or materially separable segments.
- Options implied volatility as a scenario-distribution input when the chain is complete and current; historical volatility remains a labelled fallback.
- Earnings-call and filing text extraction may propose forward-input changes, but never publishes an override without human approval.

### Company-specific scenario requirements

- Meta, Nvidia, Alphabet and similar companies are classified from evidence, not ticker names.
- Capex-heavy businesses must separate maintenance and growth/build-out spending where evidence allows.
- FCF after SBC, cash/securities, debt/leases, dilution, margin path, revenue path, WACC and terminal growth move jointly.
- P/E or EV/revenue sensitivities remain separate from the routed model and analyst consensus.
- A missing or disputed input produces an explainable refusal or facts-only output, not a generic bearish number.

## AURYN Pace contract

Valuation and Pace remain separate axes:

- **P0:** pause purchases; reassess.
- **P1:** no accumulation zone; Watch for new purchases, Hold if already owned.
- **P2:** initial accumulation; Buy small/Add small where the business gate passes.
- **P3:** deeper accumulation; Buy gradually/Add gradually within limits.
- **P4:** deepest qualifying accumulation; Accumulate within limits, never automatically.

Risk, missing-data, business deterioration and funding gates override price depth. Forming and confirmed readings remain distinct. The UI must show the Pace badge in the primary decision surface, not hide it in a secondary tab.

## Data and lineage

- Append-only point-in-time observations with `filed_at`, `period_end`, `source`, `source_ref`, units, currency and restatement linkage.
- SEC/filing authority, primary normalized vendor and independent check source are separate roles.
- Reconcile shares, market cap, TTM, FCF, balance sheet, currency, corporate actions and day-over-day fundamental changes.
- Retain delisted securities and corporate actions for unbiased backtests.
- Provider names are hidden from the main UX; the explain view exposes the source, exact tag/field, filing/accession link, transformation and reconciliation result.
- No EODHD/Twelve Data label is presented as if it were an investment conclusion.
- Public SEC/Treasury/FRED sources are preferred where they provide the required field. Existing EODHD/Twelve access may supplement coverage, but no new entitlement is assumed.

## Institutional workflows

- Glass-box number lineage: clicking any key metric opens the exact input, source node, aggregation math, date and confidence impact.
- Versioned API first, with stable symbols, model output schemas and trace IDs.
- Excel add-in contract: `AURYN(symbol, field)` and `AURYN_SCENARIO(symbol, case, input)` against the authenticated API. The first milestone is a documented API and importable workbook prototype; commercial add-in distribution is a later gate.
- Portfolio-level Monte Carlo correlation, expected shortfall/VaR, concentration, factor and scenario contribution.
- Analyst override layer changes inputs only; every proposal records author, reason, source, expiry and old/new values. Junior analyst proposals require portfolio-manager approval; compliance has read-only audit access.
- Similar historical overrides may be suggested through existing Supabase pgvector only if already enabled; otherwise the override workflow remains fully functional without semantic search.

## Mobile and product UX

- Unify iOS status-bar, safe-area and header colors.
- Compact glass header with brand, search, tools and account aligned to current iOS proportions.
- Floating/blurred bottom navigation with accessible active state.
- Native-feeling sheets for search, tools and position editing.
- Preserve desktop/tablet information density without horizontal overflow.
- Simplify public home, login, signup, settings, Explore, back navigation and logout.
- Every tab and route must have a complete state: loading, partial, stale, empty, error and success.

## Security, compliance and governance

- RLS and server-side authorization remain mandatory; analyst roles are explicit and auditable.
- Encrypt data in transit and at rest, minimize sensitive data, and retain immutable audit records.
- Prepare the control set for SOC 2 Type II / ISO 27001; certification itself is a business/compliance project, not a code claim.
- Every output carries semantic model version and config hash.
- Major/minor/patch change rules, frozen fixtures, shadow mode and independent review are required.
- Each valuation view shows model version, as-of date, methodology link and the disclosure that values are assumption-dependent and not recommendations.
- Counsel must review Buy/Hold/Pace wording, override records, retention and international availability before launch.

## Validation gates

1. Unit, property, API and type checks for the full deterministic engine.
2. Fixture matrix covering profitable growth, build-out, funded growth, HIMS-like, IREN-like, bank, REIT, shell, OTC, cyclical, distressed, split, ADR and crypto cases.
3. Point-in-time backtest including delisted stocks and total return.
4. Untouched holdout metrics for range coverage, calibration, rank power, decile spread, bias, refusal honesty, family stability and reproducibility.
5. Load tests for nightly batch, API p95, replay and failure recovery.
6. Browser checks at 320–1440px, light/dark, keyboard, reduced motion and installed iOS PWA acceptance on a physical device.
7. Shadow-mode comparison against the current engine before user exposure.
8. Independent model review, security review and legal/compliance review.

The first release also requires a deterministic integrity report: identical inputs must reproduce identical output, every output number must have lineage, no invariant may fail, and no ticker may disappear without a recorded reason.

The current repository passes local engineering checks for the existing product, but it does not yet pass these new institutional gates. Production enterprise acceptance remains pending data entitlements, deployed verification, subscriber-wide monitoring, backtesting and physical-device validation.

## Coordinated implementation sequence

The release is one coordinated scope, but execution must be dependency-safe:

1. Approve this design and freeze the output contract.
2. Add the Python/FastAPI service boundary and shared schemas without changing the live UI.
3. Implement normalization, routing, dynamic rates and capital-structure inputs.
4. Implement methods, scenarios, gates, reverse DCF, implied volatility and traceable audit output.
5. Add the Research adapter and run shadow mode.
6. Add point-in-time storage, reconciliation, corporate actions and event records.
7. Add backtest, portfolio risk, monitoring, governance and RBAC.
8. Add glass-box UI, Excel/API clients and compliance surfaces.
9. Rebuild the mobile/PWA shell and all product routes against the validated contracts.
10. Promote only after every acceptance gate passes.

## Human decisions required before implementation

- Which existing provider entitlements are available; no new vendor purchase is required for the first release.
- Python service hosting and deployment boundary; default is the existing worker/deployment boundary.
- Excel milestone: documented API/workbook prototype first; AppSource or private distribution later.
- Portfolio risk methodology and VaR/expected-shortfall policy.
- Analyst/compliance role owners.
- Legal wording and retention opinion.

**Approval requested:** approve this combined Claude + Gemini + AURYN design before any code, migration, dependency or deployment work begins.
