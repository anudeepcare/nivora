# AURYN valuation API

`GET /api/valuation/{symbol}` is a bounded, authenticated read of the latest stored output. It normalizes the symbol, returns the stored `asOf`, `traceId`, `modelVersion` and `configHash`, and never starts a provider fanout or recalculates valuation during page load. A missing output is a 404; a missing migration or database failure is a 503.

The response payload is the versioned `ValuationOutput` contract. The primary UI displays business context, a transparent range and explicit limitations. The glass-box audit can expose source reference, exact field/tag, transformation, reconciliation, method, assumptions, flags and model version without putting raw vendor identifiers in the primary card.

## Spreadsheet-compatible names

These names are documentation contracts only; no commercial Excel add-in is distributed yet:

* `AURYN("MSFT", "BASE_VALUE")` → latest stored base-case value, or blank when not established.
* `AURYN_SCENARIO("MSFT", "BEAR", "WACC")` → the stored bear-case WACC assumption, with its `asOf` and trace lineage available through the API.

Spreadsheet consumers must display the `asOf`, status and trace ID beside any returned number. A refusal is a valid result and must not be converted to zero.

