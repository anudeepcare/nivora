# AURYN V9.5.3 — After-hours Market Truth + mobile search hotfix

The after-hours error was systemic: AURYN could fetch a stale provider value *now* and then treat the fetch time as evidence that the underlying quote itself was current.

Fixes:
- A fast quote must carry a real provider timestamp.
- Provider age/freshness is validated before it can be displayed as LIVE.
- Twelve Data fast path changed from untimestamped `/price` to timestamped `/quote`.
- Client LIVE eligibility checks provider timestamp/freshness in addition to AURYN retrieval age.
- Stale fast values cannot overwrite the masthead; canonical verified/reference Market Truth remains the fallback.
- Fast display quotes still cannot rewrite the canonical decision price/engine.

Mobile search:
- Corrected the nested-span CSS collision visible in the CRM screenshot.
- Results are 58px compact rows, max 232px/28vh, contained scrolling and higher overlay z-index.
- Ticker/company/metadata/Open affordance no longer overlap Research content.

No UX redesign and no scoring/decision logic changes.

Verification: `npm run gate:v953`
