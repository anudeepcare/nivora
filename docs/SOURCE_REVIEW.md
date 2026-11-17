# Independent source review

One fresh Astra review examined the standalone product and completion changes. No critical cross-tenant isolation flaw was reported. Five important findings were identified and corrected:

1. Account cash/position checks could become stale before reservation. They are now repeated after acquiring the account-wide lock; a failing fresh check cannot submit.
2. Snapshot IDs excluded price state and older history corrections. Snapshot identity now includes quote state and complete evaluated evidence; separate evidence identity identifies price-only changes.
3. SEC tag selection chose one tag for an entire history. Preferred/fallback selection is now per period and filing, retaining current alternate-tag observations without double counting.
4. Workspace quotes silently stopped at 30 combined names. All holdings receive prioritized progressive batches before watchlist symbols, with provider headroom.
5. A preflight-failing scheduled plan could starve all later plans. Bounded candidates advance after definite failures; candidate order rotates across invocations, and submission/uncertainty stops the batch.

Regression tests: `canonical.test.mjs`, `paper.test.mjs`, `review-regressions.test.mjs`, plus database uniqueness/locking tests. The review was read-only source inspection, not an independent browser, live brokerage or deployed-RLS test. One fix pass was completed; no second paid reviewer was invoked.
