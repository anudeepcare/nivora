# AURYN approved EODHD product build

Authority: user purchased EODHD All-in-One personal and authorized integration and the approved desktop/iPhone design. Design contract: docs/design/approved-pwa-20261017.html. Preserve account data, identity checks, financial period/currency guards, and paper-only controls. No additional subscriptions or paid AI activation.

1. EODHD adapter: US stocks and USD crypto identity, search, delayed quotes, split-adjusted daily history, historical intraday, normalized annual/quarterly financials, estimates, analyst consensus, ownership, insiders, profile/logos, news, calendar and corporate actions. Cached server-only credentials and explicit source timestamps; no silent ETF/crypto substitution. Test financial normalization, split handling, future-data rejection, identity, and missing values.
2. Approved presentation: cohesive new CSS and five research tabs (Snapshot, Financials, Valuation, Technicals, Thesis), data-led snapshot/charts/DCA, working metric explanations, responsive navigation and bottom safe areas, readable themes. Preserve login isolation, watchlist/portfolio forms and existing guarded paper tooling.
3. Verify production build and route contracts; public demo checks where account credentials unavailable; package full source, setup, acceptance limitations and test reports. Do not claim installed iPhone visual verification without available browser/device tooling.

Ruling: implement core paid datasets directly rather than issue every endpoint on every visit. Optional market-wide calendars/screening, macro, options add-ons and raw bulk feeds do not improve this personal research workflow and must not generate background costs. EODHD key is not locally configured; Vercel env access returned403, CLI absent. User instructed to add EODHD_API_KEY securely. Continue code/fixture/demo work while awaiting secure configuration.


User steering, 2026-10-17: retain both paid subscriptions and use each where useful. Twelve Data is preferred for quotes/intraday; EODHD for daily history and research. Fall back on failure to the other configured price source, replace the entire series and display provenance. Financials stay on one provider rather than mixing records. User reports EODHD key configured externally; it remains absent in local private environment. No duplicate successful quote requests and no paid AI activation.

## Completion ledger

Task 1 implemented: EODHD adapter and both-provider routing, identity/currency/time guards, new research evidence, cached requests. Unit and built-route verification passed. Paid EODHD entitlement verification remains blocked by external key access.

Task 2 implemented in source: approved tokens and research layout, visible DCA, financial charts, provenance, technical groups, safe areas, themes and offline page. Rendered desktop/iPhone comparison remains unverified.

Task 3 code verification complete: npm run verify → 94/94 tests, TypeScript and production build; npm run test:api → 58/58 checks. Full source packaging follows. No push/deployment.

Final review: one independent reviewer; four Important findings fixed in one pass, all observed RED→GREEN in tests/release-review.test.mjs; whole suite green. No deferred minor findings.

Ruling: retain unavailable device and paid-account acceptance as explicit open gates rather than claiming production verification. The cost is that the package requires deployed preview acceptance before reliance or commercial release.
