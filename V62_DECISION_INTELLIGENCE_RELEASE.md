# NIVORA V62 — Decision Intelligence

V62 strengthens trust, calibration, and decision clarity without changing the V59 thesis-weight contract.

## What changed
- Weight-compatible historical calibration with exact-engine results retained separately.
- Calibration metrics: sample size, benchmark hit rate, average/median alpha, 95% Wilson interval, score-to-outperformance Brier score, expected calibration error, score/alpha correlation and information ratio.
- Valuation sanity layer flags optimistic bear/base cases and reduces decision-grade evidence when assumptions deserve review.
- Overlapping fundamental starter/accumulate/strong bands consolidate into one accumulation zone to avoid false precision.
- Ranked adversarial risks always show active/fallback risks rather than an empty risk panel.
- Today action now exposes explicit conditions that would change WAIT→BUY, HOLD→ADD, or SELL/TRIM→HOLD.
- Material-news text uses the specific headline when available.
- Canonical engine version is V62; thesis weights remain v59-thesis-1.
- Trading Lab remains paper-only and continues to consume frozen decisions downstream.

## Calibration policy
Calibration may reuse prior decisions only when they share the same thesis-weight version. Exact-engine evidence is shown separately. Reliability remains collecting until enough matured benchmark-comparable observations exist.
