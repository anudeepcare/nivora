# NIVORA V65.4 — Premium Decision Experience

V65.4 is a product/UX and Trading Lab clarity release built on the canonical V65.2 investment engine. It deliberately does not manufacture BUY signals by weakening hard safety gates.

## What changed

- Analyze now leads with the decision, preferred entry/reassess plan and owner action.
- Bullish candidates above a valid preferred entry surface a concrete **BUY ON PULLBACK** plan instead of a generic WAIT message.
- Full research is an obvious interactive control with visible Fundamentals / Valuation / Technicals / Risks / Outlook navigation.
- Metric help uses a tiny inline information glyph on the same line; popovers are plain-English and compact.
- Portfolio removes empty priority cards, uses obvious Add investment control, gives strongest holding / best new-money setup / review-first guidance only when real evidence exists, and uses meaningful green/orange/red status treatment.
- Trading Lab first view now shows checked decisions, actionable BUY signals and paper orders; no-trade rows prefer the actual BUY blocker and tell the user what would need to change.
- Mobile layouts are explicitly optimized for one-column decision reading and touch targets.
- Number formatting preserves financial precision with commas and appropriate decimals.
- User-facing engineering terms such as UNVALIDATED, metric contract and heuristic are removed from primary UX.

## Engine policy

`ENGINE_VERSION` remains `v65.2`. BUY calibration, hard vetoes, falling-knife guards, quote-integrity rules and execution-risk controls are unchanged. V65.4 improves action communication and observability rather than lowering thresholds simply to create trades.

## Verification

- Full NIVORA engine/product contract suite
- V65.4 premium UX regression tests
- V65 dead-code audit
- TypeScript/TSX syntax parse

Vercel/Next production compilation remains the final deployment gate.
