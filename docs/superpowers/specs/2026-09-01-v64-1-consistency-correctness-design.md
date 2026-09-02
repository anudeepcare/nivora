# NIVORA V64.1 — Consistency & Correctness Rebuild

## Goal
Make every NIVORA stock screen obey one decision language, one numerical standard, and one set of cross-system invariants so that thesis, action, price zones, valuation, risks, analyst context, and calibration cannot contradict one another.

## Required behavior
- Info buttons must work on click/tap, including mobile, not hover-only.
- Bull/Base/Bear scenarios must be visible whenever valuation is decision-grade; unavailable valuation must explain why and must never render as zero.
- `WAIT` and `HOLD` screens may show watch/support context, but must not label it as an actionable buy zone.
- `BEARISH`, hard-veto, or `AVOID/SELL` states must never present a `Path to BUY` primary confirmation.
- `BUY/ADD` must be reachable under legitimate coherent evidence. We will prove reachability with policy-matrix tests instead of loosening thresholds blindly.
- Technical risk level and fundamental thesis invalidation must be displayed as separate concepts.
- Collapsed ranges such as `$28–$28` render as a single approximate level.
- Analyst consensus is external context and cannot visually override NIVORA's action.
- Repeated `Collecting` states are consolidated into one compact model-evidence component.
- All core number cards must have provenance and validation status.
- V64.1 must enforce cross-system invariants before a decision is displayed or snapshotted.
- V63/V64 paper-only execution, quote-integrity, backtest, validation and mobile-first foundations remain intact.

## Cross-system invariants
A consistency checker flags or blocks:
- BUY/ADD with a hard veto.
- BUY/ADD with stale/disputed market data.
- Bearish thesis + actionable buy-zone language.
- Bear/Base/Bull ordering violations.
- support > resistance.
- malformed/collapsed price ranges presented as false intervals.
- action confirmation text pointing to BUY while policy state is vetoed/bearish without a recovery path.
- valuation unavailable but a valuation score shown as numeric zero.
- missing model proof for core headline scores.

## Decision language
Primary new-money states: BUY, WAIT, AVOID.
Primary owner states: ADD, HOLD, TRIM, SELL.
Supporting long-term thesis remains BULLISH / NEUTRAL / BEARISH and must not be confused with today's action.

## UX hierarchy
1. NIVORA thesis
2. Decision Now
3. Potential Entry / Actionable Entry based on authorization
4. Confirmation or recovery path
5. Technical risk level
6. Thesis invalidation
7. Business / Opportunity / Timing
8. Market reality / valuation robustness / stabilization / early warning
9. Bear/Base/Bull scenarios
10. Why this score / ranked risks
11. External analyst context
12. Model evidence / provenance
