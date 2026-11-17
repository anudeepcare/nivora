# Provider integration checkpoint

Built on the uploaded AURYN-clean-deploy-20261112 baseline, not the previously deployed redesign.

## Implemented
- EODHD-only quote/history/search/company-data routing. Existing Twelve credentials do not enable fallback. A central legacy compatibility guard rejects any old Twelve adapter call without making a network request.
- Server-only SentiSense adapter using `SENTISENSE_API_KEY` (or `SENTISENSE_API_TOKEN`). Credentials are never sent to the browser.
- Fixed supported sections (17): consensus, estimates, earnings, holders, insiders, politicians, options, documents, filingChanges, consensusHistory, analystActions, analystCoverage, earningsReactions, ownershipHistory, optionsHistory, optionsIntraday, kpis. No arbitrary URL forwarding.
- Authenticated `/api/intelligence/[symbol]?dataset=consensus` endpoint with account/market checks, user rate limit, feature access gate and existing research allowance reservation. Responses are private/no-store.
- Research includes five lazy intelligence groups (analysts, ownership, events, options and operating KPIs). Only the selected section is requested; all17 fixed dataset IDs have a documented presenter. Provider targets remain separate from AURYN's calculated scenarios. Preview, unavailable status, retrieval date and provider evidence date remain distinct.

## Still required before release
- Configure/validate real EODHD and SentiSense account entitlements in the deployment environment. No live credential validation is claimed here.
- Visual redesign to the supplied Figma reference, including viewport-constrained internal scrolling. This checkpoint does not claim visual fidelity.
- Additional documented subscription endpoints outside these17 sections. This is not the full SentiSense catalog or verified subscription-wide coverage.
- Browser/device QA with populated, restricted, empty and error responses.
- Distributed subscription quota accounting if required by the SentiSense plan. The adapter's concurrency cap/cache/cooldown are process-local safeguards, not a global quota ledger.

Direct SEC financial fallback, Finnhub enrichment/logos and Alpaca options market data are disabled. External SEC filing links may remain as citations, not provider calls. Existing application infrastructure (Supabase auth/storage, OpenAI analysis, Resend support email) and optional Alpaca paper-trading operations are separate from research-data sourcing and remain unchanged. No deployment or production configuration changes were made.

## Documentation used for display contracts
Official SentiSense API documentation checked Nov17,2026: analyst-ratings, earnings, institutional-flows, insider-trading, politicians, options, documents and stocks at https://sentisense.ai/docs/api/. Raw sentiment and proprietary Score fields are not displayed. Customer-facing redistribution rights still require confirmation; Pro API access alone is not proof of display rights.

Display invariants include: institutional changes require comparisonStatus AVAILABLE; insider F withholding is not a market sale; public-official range/owner/disclosure dates remain distinct; documents carry publisher links rather than invented headlines; options fractional IV is converted to percent while volume/OI remains a multiple; estimate surprises use surprisePct and suppress incompatible-basis flags; missing values never become zero.

## Later integration checkpoint
Nine additional documented fixed SentiSense adapters bring the server catalog and lazy user-facing sections to26: profile, fundamentalsCurrent, fundamentalsQuarterly, fundamentalsAnnual, shortInterest, float, shortVolume, stockEtfs, kpiTypes. All26 have fixed-route, lazy consumers; this still does not represent the complete113-endpoint documented SentiSense catalog or verified account entitlement.

Discover adds an explicitly opened EODHD corporate calendar (7/30days, IPOs and splits), using the existing shared EODHD request/quota/cache boundary. Source: https://eodhd.com/financial-apis/calendar-upcoming-earnings-ipos-and-splits. Existing Home earnings calendar is preserved. IPO zero prices/shares are treated as unset; split ratios retain old-to-new orientation, and foreign listings are not linked to US research aliases. No Marketplace endpoints are introduced. Live entitlement and browser verification remain pending.

## Stories and discovery follow-through
The Events group now includes a 30-day, ticker-filtered SentiSense story list (filterHours=720), explicit-open detail, safe original-source links, provider-authored perspectives and correction timelines. Detail IDs and ticker membership are checked server-side. Narrative markdown is displayed as safe text; no remote publisher images or raw sentiment/Score values are rendered. Story publication and assembly timestamps remain separate; timeline timestamps use the documented milliseconds.

Discover includes an explicitly opened, daily-cached tracked-stock browser. This is the provider's tracked universe, not proof that every dataset is populated or that the user's plan grants every entitlement. Coverage discovery does not fan out requests over all symbols.

## Loading and scroll follow-through
Auth SDK session lookup/refresh now has a10-second deadline; successful JSON body reads are bounded at20seconds. These release waiting UI with errors instead of leaving an unbounded promise. They do not cancel SDK auth state, weaken sign-out checks or remove shared-refresh behavior. This hardening is not a confirmed explanation of the user's specific hang. Discover does not force viewport clipping. Research scroll ownership is separately maintained by the layout implementation.

## Local verification blocker
No EODHD/SentiSense credentials exist in this execution environment, and no connected read-only provider tool was available. Protected deployment access was not retried. Tests use synthetic fixtures; live entitlement, live payload acceptance, full509-symbol exception coverage and pixel-level browser validation remain unverified. Do not label this complete or production-ready on the basis of unit counts alone.

### Options observation charts
Daily history and delayed intraday snapshots now expose selectable ATM IV (%), put/call volume ratio, call volume and put volume with an accessible observation scrubber. The plots use dated provider samples only; missing, malformed and duplicate timestamps are omitted, never interpolated. Intraday counts are cumulative and the daily/intraday IV methodologies are explicitly distinguished. This does not provide full executable chains, GEX, Vanna or trade-direction inference. Source: https://sentisense.ai/docs/api/options/ . No live entitlement or production-data verification is claimed.
