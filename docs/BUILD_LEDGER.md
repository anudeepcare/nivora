# AURYN clean rebuild

Parent repository plan: docs/superpowers/plans/2026-10-17-product-foundation.md. Independent product status: RELEASE_STATUS.md.

User clarified October 17, 2026 at 00:04 America/Chicago: ground up, nothing old. This supersedes the previous plan to retain legacy application modules. A new independently buildable application lives in `product/`. It imports no legacy source, styles, engines or routes. Existing account records and brand assets are preserved; providers remain external integrations. The old application stays runnable; its layout import was returned to its original stylesheet.

Ruling: implement new provider adapters and versioned research calculations rather than importing the historical engines. Cost: investment-model parity must be revalidated; passing the legacy suite cannot validate this replacement.

Visual target: approved AURYN desktop-dark / mobile-light research concept, with ValueSnapshot screenshots as feature/content references. Illustrative mockup values never become production data.

Verification: engine tests written before implementation. Browser infrastructure discovery found managed Linux; no control-browser tool is currently advertised. No production UI verification claimed.

Ruling: the inherited 104-item checklist remains a separate acceptance gate; none of its old verification results are transferred to the new application. Commercial feature gaps are explicit in RELEASE_STATUS.md.

Validation: standalone npm ci succeeded. Source was formatted with Prettier. New PostgreSQL integration tests validate ownership and quotas in an isolated PGlite database. Read-only live schema inspection corrected watchlist_id usage. A fresh Astra review found three integrity issues; regression tests were observed failing and the implementation was corrected. No live migrations, paid AI calls or broker orders performed.

Ruling: international listings are excluded from search until exchange identity is carried end-to-end. US/USD stocks and USD crypto pairs remain supported; this prevents attaching US financial evidence to a same-named foreign listing.

Ruling: deliverable is not described as production ready while visual testing and wider features are incomplete. The Sites managed-preview rule prevents browser QA without control-browser; no substitute browser path used.

Final local verification: standalone dependency install, 20 domain/Postgres tests, TypeScript, production build and 11 built API checks passed. Browser checks and full 104-item commercial acceptance remain open; see verification/REPORT.json.

## Completion pass · October 17

Implemented: financial YTD derivation and contiguous TTM; weekly studies and reverse growth; specialized personal scenarios; versioned snapshots; saved theses/comparisons/screens; company screening; durable manual/scheduled in-app alerts; equal-budget DCA comparisons; holdings import with replay IDs; purchase/stress previews; classified Finnhub insider/earnings display; guarded owner paper plans, execution, reconciliation and manual job workflow; shared 55/min and 42/min provider budget.

Ruling: owner-defined paper instructions remain distinct from canonical research recommendations. Cost: autonomous engine-driven trading is not delivered, and cannot be claimed as such.
Ruling: existing configured providers are retained; no purchased replacement, paid model request or broker order is needed for source verification. Cost: unsupported transcript/institutional/point-in-time coverage remains unavailable.
Ruling: existing root source and unrelated dirty files are untouched. Only the independent product is staged/packaged. Cost: deployment must explicitly select the product root.
Ruling: large portfolios receive prioritized holdings batches of 20, paced to preserve provider headroom, rather than permanently truncating to 30. Cost: large universes load progressively and are not tick-by-tick.

Fresh final Astra review: five important findings, zero critical isolation findings. Fixed account-state revalidation inside the reservation, full evaluated-input snapshot identity, per-period SEC tag fallback, complete holdings quote batches and fair bounded scheduler candidates. Snapshot and reservation regression failures were observed before fixes; all five findings have regression coverage. Source review is not browser/device verification. No deferred minor findings were reported.

Added transactional CSV request replay protection and a fresh-install account schema. PostgreSQL tests include imports, immutable observations, cross-user access denial, monthly run uniqueness, global execution lock, paused plans and shared provider budgets. Final counts and commands are in verification/REPORT.json. The 104-item original scope remains audited separately; source packaging does not convert partial requirements into completed ones.
