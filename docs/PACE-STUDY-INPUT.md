# Pace study input contract (research only)

Run `node --experimental-strip-types scripts/run-pace-study.mjs --policy-hash` to obtain the exact SHA-256 of current monthly-v5 and its recursively resolved local source dependencies. The runner recomputes this hash without modifying policy or generated fingerprint files. Then run:

```
node --experimental-strip-types scripts/run-pace-study.mjs audited-input.json study-result.json
node --experimental-strip-types --test tests/pace-study.test.mjs
```

Output creation refuses to overwrite an existing file. It records input byte hash, policy hash, supplied provenance, complete constituent manifest coverage, per-name exclusions, equal-budget account results and an explicitly conditional excess-wealth distribution. Repeating identical bytes against identical policy produces identical output. No network retrieval or tuning occurs.

## Required input

The authoritative TypeScript schema is `lib/pace-study.ts` (`PaceStudyInput`). The following skeleton is intentionally **not runnable evidence**: replace placeholders with verified data, add every constituent, and supply every eligible month. The only synthetic data are labeled unit-test fixtures.

```json
{
  "schemaVersion": "pace-study-1",
  "policyVersion": "monthly-v5",
  "policyHash": "REPLACE_WITH_CURRENT_SOURCE_HASH",
  "startMonth": "2010-01",
  "endMonth": "2025-12",
  "monthlyBudget": 100,
  "costBps": 10,
  "provenance": {
    "datasetId": "DATASET_VERSION",
    "provider": "PROVIDER",
    "retrievedAt": "2026-01-01T00:00:00Z",
    "sourceUri": "SOURCE_AND_LICENSE_REFERENCE",
    "universeDefinition": "EX_ANTE_RULE_AND_INCLUSION_CRITERIA",
    "membershipSource": "DATED_HISTORICAL_MEMBERSHIP_ARCHIVE",
    "signalPriceSource": "SPLIT_ADJUSTED_PRICE_DATASET",
    "totalReturnSource": "TOTAL_RETURN_INDEX_DATASET",
    "dividendMethod": "REINVESTMENT_AND_WITHHOLDING_CONVENTION",
    "delistingMethod": "TERMINAL_PROCEEDS_BANKRUPTCY_AND_MISSINGNESS_RULE",
    "cashYieldSource": "DATED_CASH_RETURN_SERIES",
    "signalGenerationMethod": "REPLAY_COMMAND_AND_RAW_INPUT_HASHES",
    "auditReference": "INDEPENDENT_AUDIT_REFERENCE",
    "expectedConstituentIds": ["STABLE_SECURITY_ID"]
  },
  "assets": [
    {
      "id": "STABLE_SECURITY_ID",
      "sector": "HISTORICAL_CLASSIFICATION",
      "country": "US",
      "assetClass": "equity",
      "membership": {
        "from": "2010-01-01T00:00:00Z",
        "to": null,
        "knownAt": "2009-12-31T00:00:00Z",
        "sourceRecord": "ARCHIVE_RECORD_ID"
      },
      "status": "active",
      "rows": []
    }
  ]
}
```

Each row requires `month` (YYYY-MM), UTC `signalDate`, `signalKnownAt`, `executionAt`, `periodEnd`, exact `policyHash`, purchase `multiplier` 0, 1, 2, or 4 (P0/P1 → 0; P2 → 1; P3 → 2; P4 → 4), positive `splitAdjustedSignalClose`, positive `totalReturnOpen`, nonnegative `totalReturnClose`, `cashReturn`, and `cashGapReturn`. Timestamps must put a prior-month signal before execution and execution before the mark; periods cannot overlap. `cashGapReturn` accrues prior residual cash between the preceding mark and execution (zero in the first row); `cashReturn` accrues post-purchase cash to the current mark. Returns are decimals, not percentages.

For a delisted name use `status: "delisted"`, UTC `delistedAt`, and documentary `delistingSource`. Supply its terminal month including zero total-return value for a total loss. Terminal positive proceeds must already be incorporated in the total-return index. Names stop contributing at delisting; their paired fixed/Pace budgets remain equal. Index membership exit alone does not terminate a name's history: follow it through the common end date or delisting. Multiple entry/exit episodes are not represented by this first-entry cohort contract. No investable portfolio return is implied.

Include a constituent even if unavailable: supply its record with `missingReason` and empty `rows`, or at minimum retain its ID in `expectedConstituentIds`. Missing/invalid records remain explicit exclusions and in the denominator. Never construct that manifest from currently surviving names. The engine cannot detect names omitted from both the manifest and records; independent universe reconciliation is mandatory.

## Evidence boundaries and blockers

Every output has `publishable: false`. Structural validation, hash equality, a filled audit-reference string, and thresholds are not authentication or proof of broad representativeness. The CLI requires raw-price replay for every included asset. Add `priceReplay: { market: "us-equity" | "crypto", sourceRecord: "DATASET_RECORD", bars: [...] }` to each asset. Each bar is `{ time: "YYYY-MM-DD", knownAt: "UTC_TIMESTAMP", open, high, low, close, volume }` using split-adjusted OHLC prices, never total-return values. Include at least 12 consecutive completed prior months plus the signal observation; use actual daily history and point-in-time adjustment vintages. A later corporate-action-adjusted historical series is not automatically point-in-time: `knownAt` must reflect when that exact price vintage was available. The replay filters by availability and signal date, invokes current `researchAccumulation` monthly-v5, and requires the confirmed date, close and mapped purchase multiplier to match each supplied row. P0/P1 purchase nothing, P2 uses 1×, P3 uses 2× and P4 uses 4×, always capped by available cash. Invalid or insufficient replay excludes the asset explicitly. A late-known required prior month-end produces a history gap rather than borrowing a future value. The monthly policy requires consecutive completed month-end observations; this runner does not certify every daily session, exchange-specific holidays, OHLC completeness, or the truth of availability timestamps. Reconcile full daily coverage and adjustment vintages independently.

The library API retains legacy supplied-input accounting for research callers omitting `{ requireReplay: true }`. Its `signalVerification` is `unverified-supplied-signals` unless all included names were replayed; it never authenticates a dataset. The CLI does not provide a bypass. Output records separate SHA-256 values for input bytes (`inputSha256`), recursively resolved monthly-v5 source (`policyHash`), and runner/accounting/replay source closure (`runnerSourceSha256`). Hashes provide reproducibility, not evidence that supplied provenance is truthful. Every output remains `publishable: false`, including a successful replay. Independently audit actual first tradable execution/complete month marks, raw price vintages, universe membership, corporate actions, cash yields and delisting proceeds. This price-policy experiment does not replay fundamental business checks.

The minimum screening gate of 100 included names and 120 calendar months is only a necessary breadth/duration warning. It does not establish per-name duration, balanced sector/geography coverage, crisis coverage, liquidity, selection neutrality or out-of-sample validity. The distribution is unweighted across complete name paths; each statistic normalizes terminal wealth difference by that pair's contributed capital, with differing entry/delisting horizons disclosed. It is not a universe portfolio, CAGR, independent holdout result, or proof of future performance. No trimming/sales, taxes, liquidity constraints, impact model or fundamental business gates are simulated. Costs apply to invested gross budget; returns and cash yields must use compatible conventions.

There is currently no suitable audited broad-universe dataset connected to this runner. Existing price-only evaluations cannot establish this claim, and pending old-policy outcome records cannot validate current monthly-v5. An actual representative result remains blocked on acquiring and auditing the data and audited production decision-path linkage. Do not promote fixtures, empty templates, or unchecked provenance fields as real backtest evidence.
