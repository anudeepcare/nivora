# AURYN V9.8 — Three-Clock Valuation Architecture

## Goal
Separate long-term thesis, independent valuation and tactical market structure so short-term price noise cannot manufacture or rewrite fundamental Bull/Base/Bear values.

## Locked
- UX/layout/components/styles remain unchanged.
- Existing technical Decision Map remains technical: support, entry, confirm, T1/T2, invalidation.
- Fundamental scenarios are independent of technical support/resistance and current market price.
- Missing valuation inputs produce UNAVAILABLE/PARTIAL, never fake precision.
- Current price may be used only after intrinsic values are computed, to calculate implied return.
- Market Truth remains authoritative.

## Three clocks
1. Thesis clock (3–7+ years): business economics, moat, reinvestment, cash conversion, capital allocation, durable deterioration.
2. Valuation clock (1–5 years): normalized growth/margins/FCF, dilution, discount rate, terminal economics and independent scenario values.
3. Tactical clock (days–months): trend, momentum, participation, volatility, support/resistance, catalysts/regime.

## Thesis half-life
Evidence families carry persistence:
- price/technical: short
- revisions/catalysts: medium
- margins/cash conversion: multi-quarter
- moat/reinvestment/business economics: long
One isolated weak family cannot break a long-lived thesis.

## Fundamental scenarios
Bear/Base/Bull are economic states, not chart targets.
- Bear: partial thesis/economic deterioration.
- Base: normalized execution.
- Bull: upside operating/reinvestment assumptions.
Scenario values require an independent valuation input. If unavailable, the fundamental scenario map is unavailable rather than derived from current price.

## Anti-anchoring
A deterministic audit reports the percentage of securities whose independent Base value lies within ±2%, ±5% and ±10% of current price. Suspicious clustering is a calibration failure, not automatically corrected by moving targets.

## Integration
The existing technical scenario map remains available for execution context but is explicitly labeled technical internally. A new fundamental valuation module supplies valuation-clock evidence to CIO logic when decision-grade.
