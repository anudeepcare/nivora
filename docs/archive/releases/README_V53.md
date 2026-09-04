# NIVORA V53 — Intelligence + Position Engine

V53 freezes the V52 visual direction and hardens the decision brain for real-money decision support.

## Core changes

- Adds a consistency resolver so contradictory labels are not silently presented as certainty.
- A bearish thesis that is improving is labelled **Recovering**, not the contradictory **Bearish + Strengthening**.
- Separates business quality, forward thesis, valuation, timing and risk.
- 3M / 6M / 1Y / 2Y / 3Y use different factor weights.
- Adds business-archetype-aware quality weighting for hypergrowth, compounders, cyclicals, financials and biotech/general cases.
- Owner mode reads the user's actual `portfolio_positions` row (shares + average cost) when available.
- Owner actions use a higher threshold for REDUCE/EXIT below cost. A price decline or technical breakdown alone cannot force a realized loss.
- Owner UI displays average cost, current price and unrealized return.
- Entry zones are explicitly timing evidence. If independent valuation is missing, the UI says fundamental fair value is not established.
- Bearish stocks no longer display support as a "best buy" recommendation.
- High `risk` factor is displayed as **RISK PRESSURE**, not a green-looking positive score.
- Company/thesis breakers are more specific to growth/cyclical archetypes instead of one identical generic sentence for every stock.
- Radar remains removed from primary navigation until broad-universe coverage is reliable.

## Decision policy

Company quality changes slowly. Price primarily changes opportunity/timing. Thesis changes require material business/forward evidence. For existing owners, cost basis affects position management but does not alter the underlying company thesis.

## Validation

Changed TypeScript/TSX files pass TypeScript `transpileModule` syntax diagnostics and Python scanners pass `py_compile`. A full `next build` could not be completed in this runtime because dependency installation timed out; Vercel remains the authoritative full build gate.

## Next proof layer

The existing V51 learning ledger is preserved. Continue freezing decisions and grading 1D / 7D / 30D / 90D / 180D / 365D outcomes before allowing automated real-money execution.
