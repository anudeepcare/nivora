# Pace comparison and prospective evidence

The Strategy Lab now has two explicitly separate rule sets in the existing comparison view:

- **Current v6 technical rules** calls `accumulation-policy-v6`, excludes v5 fallbacks and signals before the frozen model's November 7, 2026 release, and maps P0/P1 to zero contributions, P2 to one regular contribution, P3 to two and P4 to up to four. Available cash always caps spending.
- **Legacy v5 price-only research** preserves the prior experiment, including its P1 spending. It is not an evaluation of current decisions.

Both accounts receive 100 model currency units on the same execution dates and use the same prices and cost assumption. Signal evidence is from the previous completed month; execution uses the next month's first observed open, with completed month-end marks. Exports include the signal date, execution date, policy version and contribution multiple. These are hypothetical research units, not personal allocations or trade orders.

As of November 8, 2026 there are no completed execution months eligible for v6. The view explains this instead of relabeling earlier v5 returns. No superior performance or future accuracy is claimed.

## Prospective verification

The existing local study and prospective-verification scripts now support an explicit `policyVersion` of `monthly-v5` or `monthly-v6`. Source hashes are selected from that policy's dependency graph. V6 raw-price replay uses the actual frozen classifier and rejects pre-release signals and legacy fallbacks. Server publication receipts must match the same symbol, signal period, exact policy version, policy hash, contribution rule and publication-before-execution chronology.

Print the v6 source hash:

```sh
node --experimental-strip-types scripts/run-pace-study.mjs --policy-hash monthly-v6
```

A real study requires the existing schema's point-in-time prices, availability timestamps, universe membership, total-return records, cash-yield assumptions and provenance. Run it with:

```sh
node --experimental-strip-types scripts/run-pace-study.mjs INPUT.json OUTPUT.json
```

The existing `run-pace-prospective.mjs` additionally reads publication receipts from the configured database. This change does not publish observations, mutate a database, enable market-data licensing or produce any real prospective performance record. The publication endpoint's existing owner/license gates remain unchanged.

## Boundaries

Neither historical replay reconstructs historical business eligibility, valuation gates or personal portfolio constraints. It is a technical-rule comparison, not the full current investment decision. Prices may be revised; no dividends, cash interest, taxes, market impact or survivorship correction are modeled in the Strategy Lab. The more rigorous study runner requires explicit return and membership evidence but still does not claim independent provenance certification. A prospective performance claim remains blocked until real dated evidence accumulates and is audited.
