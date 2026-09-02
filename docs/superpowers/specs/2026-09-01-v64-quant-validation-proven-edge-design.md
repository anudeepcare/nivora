# NIVORA V64 — Quant Validation & Proven-Edge Engine Design

## Goal
Make NIVORA's displayed scores, levels, actions, and reliability claims auditable and empirically testable while preserving the V63 market-integrity and paper-trading foundation.

## Principles
- Every important displayed number must have a calculation contract, source/provenance, model version, freshness/coverage context, and validation status.
- Missing evidence is never rendered as `0/100` unless zero is a real measured value.
- Data coverage, model calibration, predictive reliability, and market-data freshness are separate concepts.
- Advanced math is used only when it improves robustness, calibration, risk control, or out-of-sample performance. Complexity is never a substitute for evidence.
- Historical validation must be point-in-time safe, cost-aware, benchmark-relative, and out-of-sample.
- Live paper trading remains paper-only and downstream of canonical NIVORA decisions.

## Architecture

### 1. Canonical Technical Engine
Move the technical scoring math out of the API route and into a pure `nivora-technical-engine.ts` function shared by live analysis and backtests. Adopt Wilder-smoothed RSI and ATR in V64 so broker/chart comparisons are consistent. This formula change requires a new engine version and separate validation cohort.

### 2. Historical Validation Harness
Integrate the Claude harness into the repo and strengthen it with:
- SEC filing-date point-in-time fundamentals.
- Point-in-time price bars.
- Walk-forward in-sample/out-of-sample partitions.
- Benchmark-relative outcomes.
- Spread/slippage/commission cost model.
- Explicit historical-universe metadata to make survivorship-bias limitations visible.
- Validation status derived from pre-registered gates, not manually chosen labels.

The harness must never use current analyst estimates for historical dates. Missing historical analyst evidence is marked unavailable and reweighted honestly.

### 3. Validation Gate
Add a formal evidence ladder:
- UNVALIDATED
- BACKTESTED
- OUT_OF_SAMPLE_VERIFIED
- FORWARD_VALIDATING
- VALIDATED

A status can advance only when configured sample size, positive benchmark alpha, calibration quality, confidence interval, drawdown, and regime/archetype stability gates pass.

### 4. Metric Proof Contract
Each core metric can expose:
- display value
- semantic meaning
- formula/model version
- primary sources
- freshness/coverage
- validation status
- comparable sample size
- top positive/negative contributors
- warning when heuristic or unvalidated

This contract powers the UI and prevents authoritative-looking numbers with no evidence trail.

### 5. Decision UX
Mobile-first hierarchy:
1. Today action
2. Thesis / confidence state
3. Price now and actionable zone
4. Confirmation required
5. Invalidation / risk
6. Why this action
7. Ranked risks
8. Model evidence / provenance

Move low-value diagnostics out of the main path. Do not repeat `Collecting` in multiple large panels. `Unavailable · 0/100` becomes human-readable `Not established` with explanation.

### 6. Numeric Presentation
Central formatter:
- thousands separators for money and counts
- compact large values where appropriate
- consistent percent signs and sign display
- whole-number scores by default
- confidence-aware price precision
- no fake cents on low-confidence estimates

### 7. Risk & Position Sizing
For paper/research output, derive a suggested risk budget and position size from:
- portfolio equity
- risk-per-trade limit
- entry
- invalidation
- volatility/liquidity caps
- max portfolio exposure

This is informational/paper tooling only and must not bypass Trading Lab risk gates.

### 8. Paper-Trading Proof
Preserve V63:
- Alpaca Paper connectivity
- quote-integrity checks
- GitHub Actions runner
- order submit/cancel proof
- no-short rule
- stale/disagreement vetoes
- audit trail

V64 must make the operational state visible without curl/Supabase inspection.

## Validation Acceptance Criteria
V64 is not allowed to claim `Validated` merely because tests pass. Product validation requires real historical/out-of-sample/forward evidence. Code acceptance requires:
- Wilder RSI/ATR reference tests.
- No-lookahead tests.
- Walk-forward non-overlap tests.
- Cost-model tests.
- Validation-gate tests.
- Number-format/provenance tests.
- Existing V54–V63 regression suite green.
- TypeScript/Next production build green where dependencies are available.

## Known Limits
Historical analyst-estimate/recommendation snapshots are not available from the current free provider path. They must remain absent in historical replays until a legitimate point-in-time feed exists.
Historical universe quality determines whether survivorship bias is truly controlled; the harness must surface this as a data-quality property rather than hide it.
