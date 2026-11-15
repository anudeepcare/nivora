# Workspace route and state audit · 15 November 2026

## Verification boundary
Source review and automated checks only. No new browser screenshot, phone/tablet interaction, measured viewport fit or visual acceptance is claimed. Prior browser access is blocked; no workaround or deployment was attempted. Static responsive checks do not prove premium composition or keyboard/touch behavior.

Read repository AGENTS.md, README.md, DESIGN-PREFERENCES.md and EXPERIENCE-REDESIGN-20261115.md. Preserve useful metric grids, feature disclosures, source caveats, financial formulas, scenarios and provider behavior.

## Route/subscreen inventory

- Home/overview (Product's default route; HomeWorkspace): first-use, watchlist-only and holdings composition; dated briefing and source coverage; portfolio session and chart; followed-company price cards with unavailable-history explanation and keyboard slider; agenda/calendar with future/reported distinction; company news pagination; optional workbench, contribution plan, saved reviews, radar and Pace. Source paths include HomeBriefing, HomeDailyBriefing, HomeMarketCards, HomeNewsFeed and HomeUpdates. Loading, partial feed errors, no events, no headlines, no followed companies and chart gaps have explicit source paths. Confirmed phone agenda grid-placement bug fixed below. Live headline quality and all responsive compositions still need browser review.
- Watchlist: approved WatchlistPage, not the legacy Workspace export. Populated stock/crypto filters, name/ticker filter, no matches/reset, empty/search dialog, refresh/error, price freshness, earnings unknown, review condition, Pace, remove/busy/undo/error. Native search dialog has close and navigation dismissal. WorkspaceGate owns initial workspace loading. No financial or sorting logic changed. Native focus restoration, Escape and small-screen scroll remain browser gates.
- Portfolio: approved PortfolioPage. Balances and coverage; comparison; allocation/exposure; full-width filtered holdings; Pace filter; reset/no matches; empty add-position guidance; scenario range; position decisions; cost-currency warning; add/edit position; cash/balances dialog; lazy full-picture drawer containing transactions, ledger sorting, charts, risk, exposure and sector benchmarks. Inspected PortfolioContext, PortfolioTools, PortfolioRisk, PortfolioExposure, PortfolioRange, PortfolioCharts and PortfolioLedger. Monetary calculation and quote readiness remain unchanged. Source contains named modal close controls and onClose handlers; actual keyboard/modal/history behavior remains unverified.
- Holdings CSV disclosure: selection, filename, oversize/parse errors, preview table, confirm busy/error/success, preview disabled confirmation and Cancel. Added explanation of disabled preview confirmation and cleared misleading review guidance on cancel. Existing idempotency request and import API unchanged. File-picker repeat selection and interrupted asynchronous reads still require interaction testing.
- Alerts (/alerts → AlertCenter): create form for filing, Pace, price, earnings, fundamental and exposure rules; type-specific threshold limits; price/Pace preview and delivery caveats; saved rules/delete; history/read; manual check and partial errors. Fixed false empty states on initial loading/failure and disabled repeat read while busy. Retry buttons are independent for rule/history failures. Populated cached data stays visible during refresh. Rule semantics unchanged.
- Discover (/discover → Discover): selected-universe scan; saved screen restore; sector/Pace/business filters; save; coverage/partial verification failures; OpportunityMap; expandable MarketRadar; table; no matches/reset. Fixed initial empty-state messaging during scan and distinguished an attempted scan with no verified results. No ranking, universe size or decision calculations changed.
- Market workspace is an embedded options surface (MarketWorkspace/MarketContext/MarketRadar), not a separate Product route. Reviewed account saves, server capture, history errors, snapshot select, replay/play/pause/range, exit replay, alert callback and preview restrictions; relative benchmark/peer evidence and radar coverage/method disclosure. Touch-sized account controls and focus styles already exist. ExposureBoard and trading/options parent routing are outside this worker's edit ownership; parent must account for them separately.
- Earnings has embedded components, not a standalone Product route: EarningsPrep with next-date caveat and risk prompts; EarningsReview with EPS snapshot, no recent result, expandable business changes/source links and next date; EarningsWorkspace with reported EPS and future-estimate tables, or null when no evidence. Existing date/basis/calculation behavior untouched. Parent owns Research composition and current-company data validation.

## Confirmed corrections

1. Home's ≤600px agenda declared one column but inherited event rows pinned to grid-column 2 and date grid-row 1/20. This created an implicit column and reserved rows. Reset both placements at the same breakpoint with matching specificity. Keep all events visible.
2. Alert rules/history displayed “No alert rules yet”/“Nothing triggered yet” before retrieval finished or after retrieval failed. Added status text and independent retry states; retained cached populated lists.
3. Alert mark-read controls remained enabled while an alert action was pending. They now share the existing busy guard.
4. Discover displayed “Choose companies to screen” while its initial scan was in progress and after a completed scan returned zero verified results. Added distinct loading and no-verified-results states.
5. CSV preview disabled Confirm import without explanation in demo mode, and Cancel left “Review all rows before confirming.” visible. Added clear preview guidance and cancellation status.

## Regression evidence

- tests/workspace-state-refinement.test.mjs: first five source/CSS contract tests were run before production edits and failed for their expected missing behaviors. After fixes all passed. Three additional rendered AlertCenter cases check loading, failed retrieval/retry and loaded-empty guidance using the actual component with resource fixtures.
- Financial engines, provider source, APIs, auth/account configuration, billing, migrations and deployment unchanged.
- Full-suite and focused command outcomes are reported to the parent separately for its combined verification report. No browser visual acceptance implied.

## Combined candidate verification

After all presentation edits finished, the final `npm run verify` completed successfully: 1,616 tests passed, zero failed or skipped, with lint, formatting, typecheck and production build also passing. The parent summary records API/HTTP/package outcomes separately. Earlier concurrent runs above are historical, not the final result. Browser and device acceptance remain unverified.
