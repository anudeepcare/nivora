# Test contract changes in the approved build

The baseline release suite passed 760 tests. The first integration run failed 14 checks, all retained in `release-progress.log`.

- Missing valuation: the old policy permitted new capital; the approved B04/E01/G02 policy withholds it while preserving positive business evidence.
- Price invalidation: the old fixture expected AVOID. B03 now requires WAIT for tactical capital, separate intact long-term business quality and blocked execution.
- Reachability fixtures now provide real valuation support for a starter and independent weak fundamentals for a business avoid. No action quota or forced BUY threshold was added.
- Client-side V5/V6/V7 persistence grep assertions were replaced by behavioral tests of authenticated server recalculation, immutable policy provenance and raw multi-timeframe persistence. Historical serializers remain tested. Arbitrary client-provided shared research is no longer accepted.
- The technical bridge test now exercises the shared adapter instead of requiring duplicate logic inside StockClient.
- Three React rendering harnesses needed CSS module support; their component assertions remain unchanged.
- Diagnostics checks now prove that the diagnostics route cannot submit an order, rather than requiring a retired self-test flag in source text.

No whole failing suite was hidden or disabled for these changes. The complete historical inventory is run separately and reported by file; legacy assertions are not proof that an obsolete UI should be restored.

- Decision summaries now exercise the actual GET handler against the shared canonical projection, including missing/null analysis and blocked execution; replaced a retired raw-row source grep.
- Portfolio partial-price fixture now asserts the additive `missingCost: 0` field; existing partial-value and priced-only P/L assertions unchanged.
