# Execution and review ledger — unified product

Plan: 2026-10-23-unified-product.md. Existing dirty source preserved; no clean/reset, commit, merge, push or deployment.

1. Monthly-v3: implemented and integrated across perspective, technical desk and standalone accumulation. New tests were run red for the missing module before implementation, then green. Additional duplicate-conflict and crypto settlement cases pass.
2. Equal-budget evaluation: missing-module red run, implementation green. Tests check equal deposits, nonnegative carried cash, next-observation execution, costs and future-bar exclusion. No market-wide performance claim.
3. Shared content: product-surfaces.css owns base panels and current settings layout; duplicate former panel/settings declarations were removed. Specialized geometry remains in existing sheets. Home/Watchlist/Portfolio/Settings presentation follows the same content primitives.
4. Research: Business tab added without changing retained tab IDs; company/segment evidence moved from Financials. Business annual evidence and market cap use existing data. Earnings preparation duplication removed. Useful statements, technical studies, analysts and Advanced controls retained.
5. Model suitability: missing-module red run, implementation green. Tests cover ordinary, infrastructure, frontier, bank, crypto and absent-data behavior. No numeric cases are invented.
6. Public/account/help: Why AURYN added, auth copy changes by mode, help/methodology aligned to v3. No new authentication provider or permissions.
7. Verification: 380/380 unit/render/database tests; type generation/TypeScript; optimized build; 83 compiled API checks; diff whitespace check. Four initial render-test failures were missing injected dependencies after imports changed; test bindings updated without weakening their original assertions.

## Review decisions

- Preserve PWA geometry and status-surface behavior rather than rewriting it during content changes. Cost: physical installed-device acceptance remains necessary.
- Do not fit thresholds to competitor labels or copy contradictory model outputs. Cost: APP and IREN multipliers remain different, explicitly documented.
- Specialist models need real inputs; suitability explanations do not count as a completed sector valuation engine. Cost: some instruments still lack supported numeric cases.
- Use shared appearance ownership while retaining specialized legacy geometry. Cost: older specialized styles remain and visual regression testing is still needed.

Final review: self-review under the no-delegation constraint. Checked hook ordering, memoized calculations, no added network calls from the new derived metrics, preservation of dynamic Advanced loading, currency/period discipline, null-vs-zero handling, date cutoffs, no live order/database changes and unchanged PWA stylesheet order. A self-review is weaker than an independent review.

Unverified: rendered pixel parity, physical iPhone transitions/keyboard, live account/provider entitlements, commercial permissions and investment performance. No assertion that automated tests establish those properties.
