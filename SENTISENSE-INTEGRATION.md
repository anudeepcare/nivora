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
