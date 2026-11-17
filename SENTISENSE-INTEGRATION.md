# Provider integration checkpoint

Built on the uploaded AURYN-clean-deploy-20261112 baseline, not the previously deployed redesign.

## Current source coverage — November 17, 2026

The adapter defines **40 fixed dataset IDs**, not 39 independently live-verified endpoints or 39 per-ticker screens. Of these, 31 are allowed through the ticker intelligence route; nine use dedicated universe, institution or detail flows: storyDetail, trackedStockCoverage, kpiCoverage, optionsOverview, institutionalFlows, institutionProfile, institutionHistory, institutionalQuarters and institutionalActivists. Some flows require a prior selection or quarter lookup. This is a source inventory, not subscription-wide coverage of the documented 113-endpoint SentiSense API.

The latest additions include ETF holdings and analyst aggregates, institutional profiles/history/flows/activist observations, discovery coverage, and the Pro deep research report. Existing account-plan evidence identifies SentiSense Pro and EODHD All-in-One, but plan identity does not establish that every endpoint has been exercised successfully or that every ticker has data. The result envelope therefore retains entitlement as unverified. Live payload acceptance, per-endpoint entitlement and current deployment configuration must be checked separately.

## Implemented
- EODHD-only quote/history/search/company-data routing. Existing Twelve credentials do not enable fallback. A central legacy compatibility guard rejects any old Twelve adapter call without making a network request.
- Server-only SentiSense adapter using `SENTISENSE_API_KEY` (or `SENTISENSE_API_TOKEN`). Credentials are never sent to the browser.
- The initial 17 ticker datasets were: consensus, estimates, earnings, holders, insiders, politicians, options, documents, filingChanges, consensusHistory, analystActions, analystCoverage, earningsReactions, ownershipHistory, optionsHistory, optionsIntraday, kpis. No arbitrary URL forwarding.
- Authenticated `/api/intelligence/[symbol]?dataset=consensus` endpoint with account/market checks, user rate limit, feature access gate and existing research allowance reservation. Responses are private/no-store.
- Research includes five lazy intelligence groups (analysts, ownership, events, options and operating KPIs). Only the selected section is requested; the initial 17 dataset IDs have a documented presenter. Provider targets remain separate from AURYN's calculated scenarios. Preview, unavailable status, retrieval date and provider evidence date remain distinct.

## Still required before release
- Configure/validate real EODHD and SentiSense account entitlements in the deployment environment. No live credential validation is claimed here.
- Visual redesign to the supplied Figma reference, including viewport-constrained internal scrolling. This checkpoint does not claim visual fidelity.
- Additional documented subscription endpoints outside the current fixed catalog. This is not the full SentiSense catalog or verified subscription-wide coverage.
- Browser/device QA with populated, restricted, empty and error responses.
- Distributed subscription quota accounting if required by the SentiSense plan. The adapter's concurrency cap/cache/cooldown are process-local safeguards, not a global quota ledger.

Direct SEC financial fallback, Finnhub enrichment/logos and Alpaca options market data are disabled. External SEC filing links may remain as citations, not provider calls. Existing application infrastructure (Supabase auth/storage, OpenAI analysis, Resend support email) and optional Alpaca paper-trading operations are separate from research-data sourcing and remain unchanged. No deployment or production configuration changes were made.

## Documentation used for display contracts
Official SentiSense API documentation checked Nov17,2026: analyst-ratings, earnings, institutional-flows, insider-trading, politicians, options, documents and stocks at https://sentisense.ai/docs/api/. Raw sentiment and proprietary Score fields are not displayed. Customer-facing redistribution rights still require confirmation; Pro API access alone is not proof of display rights.

Display invariants include: institutional changes require comparisonStatus AVAILABLE; insider F withholding is not a market sale; public-official range/owner/disclosure dates remain distinct; documents carry publisher links rather than invented headlines; options fractional IV is converted to percent while volume/OI remains a multiple; estimate surprises use surprisePct and suppress incompatible-basis flags; missing values never become zero.

## Earlier integration checkpoint (historical count)
Nine additions took the initial ticker catalog from 17 to 26 at that checkpoint: profile, fundamentalsCurrent, fundamentalsQuarterly, fundamentalsAnnual, shortInterest, float, shortVolume, stockEtfs, kpiTypes. Those datasets retain fixed-route, lazy consumers. The current source count is 39 dataset IDs as detailed above; neither count represents complete catalog coverage or live verification.

Discover adds an explicitly opened EODHD corporate calendar (7/30days, IPOs and splits), using the existing shared EODHD request/quota/cache boundary. Source: https://eodhd.com/financial-apis/calendar-upcoming-earnings-ipos-and-splits. Existing Home earnings calendar is preserved. IPO zero prices/shares are treated as unset; split ratios retain old-to-new orientation, and foreign listings are not linked to US research aliases. No Marketplace endpoints are introduced. Live entitlement and browser verification remain pending.

## Stories and discovery follow-through
The Events group now includes a 30-day, ticker-filtered SentiSense story list (filterHours=720), explicit-open detail, safe original-source links, provider-authored perspectives and correction timelines. Detail IDs and ticker membership are checked server-side. Narrative markdown is displayed as safe text; no remote publisher images or raw sentiment/Score values are rendered. Story publication and assembly timestamps remain separate; timeline timestamps use the documented milliseconds.

Discover includes an explicitly opened, daily-cached tracked-stock browser. This is the provider's tracked universe, not proof that every dataset is populated or that the user's plan grants every entitlement. Coverage discovery does not fan out requests over all symbols.

## Loading and scroll follow-through
Auth SDK session lookup/refresh now has a10-second deadline; successful JSON body reads are bounded at20seconds. These release waiting UI with errors instead of leaving an unbounded promise. They do not cancel SDK auth state, weaken sign-out checks or remove shared-refresh behavior. This hardening is not a confirmed explanation of the user's specific hang. Discover does not force viewport clipping. Research scroll ownership is separately maintained by the layout implementation.

## Verification boundaries
Source contract tests use synthetic fixtures. Separate signed-in portal and deployment checks do not prove that all 40 datasets return valid live responses. The deep-report addition has not made a live provider request in this source verification pass. Full 509-symbol exception coverage, complete paid-endpoint coverage and pixel-level validation of the latest source remain unverified. Do not label subscription-wide coverage complete on the basis of adapter counts or unit tests alone.

### Options observation charts
Daily history and delayed intraday snapshots now expose selectable ATM IV (%), put/call volume ratio, call volume and put volume with an accessible observation scrubber. The plots use dated provider samples only; missing, malformed and duplicate timestamps are omitted, never interpolated. Intraday counts are cumulative and the daily/intraday IV methodologies are explicitly distinguished. This does not provide full executable chains, GEX, Vanna or trade-direction inference. Source: https://sentisense.ai/docs/api/options/ . No live entitlement or production-data verification is claimed.

## Pro deep research report
The fixed `aiReport` dataset calls `/stocks/{ticker}/ai-summary?depth=deep` on explicit selection. Only a matching ticker with `READY` and `FULL` report status is accepted. A bounded, closed projection carries the ordered section titles, plain-text narrative and report timestamp; provider directives, proprietary scores and extra fields are not transmitted. The reader displays one selected section rather than stacking every report section. AI-authored narrative is distinct from analyst targets and AURYN calculations; no prices or Bear/Base/Bull values are inferred from report text. Draft, unavailable, malformed and mismatched responses do not become a report. Contract source: https://sentisense.ai/docs/api/stocks/ .

## Remaining confirmed integration gaps
EODHD historical market-cap series now has a fixed, authenticated, financial-access-gated route and an explicit-open dated dot chart within the existing Business financial workspace. It requests one year of NYSE/NASDAQ equity observations, preserves weekly sample dates, uses the shared 24-hour cache and 10-unit request accounting, and makes no call in demo mode. Malformed, conflicting, nonpositive or out-of-window observations fail closed; no prices or daily samples are interpolated. This source implementation has not been verified against live account payloads. Contract: https://eodhd.com/financial-apis/historical-market-capitalization-api . Broader SentiSense deep-report live acceptance, curated relationships, market-wide earnings statistics and additional ETF aggregates require separate integration/verification work. EODHD macro, rates and other included families are not automatically covered by the current quote/fundamentals/calendar adapters. Options Marketplace/Greeks entitlement must not be inferred from All-in-One; no gamma exposure is synthesized from unrelated fields.

## Company relationships
A selected-only, explicit-open company graph uses `/stocks/{ticker}/graph?depth=1&cap=30`. The official stocks documentation states API-key access without a tier gate. The closed projection retains bounded node names and directed edges only, checks root and edge references, and excludes arbitrary properties. Existing business context is preserved; no prices or competitive advantage are inferred. No live account acceptance is claimed.
