# SentiSense integration and migration audit

Checked November 16, 2026. This is an implementation inventory, not a claim that all datasets are licensed, working in Auryn, or complete for every stock.

> Historical discovery snapshot. The subsequent implementation candidate is described in `SENTISENSE_MIGRATION_RELEASE.md`; statements about then-current owner-preview configuration below are not current rollout instructions. The113-endpoint catalog remains an inventory, not a claim that every endpoint has been implemented.

## Result

The official reference enumerates **113 endpoints**, all cataloged in `sentisense-endpoint-inventory-20261116.json`. Current Auryn uses only stock profile and analyst consensus, for owner-only preview enrichment. Calling all endpoints on each screen would add latency and noise rather than coverage. Each endpoint has a proposed destination; provisioning is operational, not a customer feature.

Official family counts: Stocks 30; Analyst 9; Calendar 2; Earnings 6; ETFs 6; Options 4; Screener 4; Documents 9; Metrics 5; Rating 1; Insights 6; Market Mood 3; Market Summary 1; Entities 3; Institutional 10; Insider 3; Politicians 5; Indexes 3; Trackers 2; Keys 1.

[API overview](https://sentisense.ai/docs/api/) says PRO has 300 requests/minute and no monthly cap. This does not establish this account's active key or dataset rights. Independent account inspection found the browser logged out and existing preprod still configured as temporary owner preview. Do not remove expiry/caps or enable public access merely because the user reports upgrading.

## Replacement risks: do not cancel existing sources yet

| Current dependency | Candidate | Acceptance requirement |
| --- | --- | --- |
| Twelve/EODHD quote, company/search | Stocks price/prices/profile; entities search | Quote timestamp, delay, symbol/share-class/currency correctness; absent symbols explicit |
| Long price history and Pace | Stocks chart | Exact adjustment/granularity, completed periods and same Pace results on representative stocks |
| Financials and valuation inputs | Fundamentals/current/history/periods; KPIs | Currency/units/TTM/annual/quarter consistency; no inferred USD or invented values |
| Analyst context | Consensus, estimates, coverage, actions/history | Current paid-key responses for APP/NBIS/IREN; missing bounds remain absent, not copied historical targets |
| Earnings/calendar | Calendar and earnings families | Correct session/fiscal period/date, actual vs estimate distinction |
| Options chains/analytics | Options summary/history/overview | Aggregates are not a full chain; any chain, bid/ask, Greeks or gamma feature needs explicit source coverage |
| News | Documents/stories | Analytics/narratives and source links are not article redistribution rights |
| EODHD streaming and crypto | No like-for-like replacement established | Keep a valid alternative or deliberately change product promise before cancellation |

Technical detail from [Stocks reference](https://sentisense.ai/docs/api/stocks/): prices are delayed 15 minutes. Chart granularity varies with range: daily only for 3M–1Y, weekly 5Y/10Y, monthly MAX. 10Y/MAX adjust dividends and splits; shorter windows are split-adjusted only. A range switch must not silently change the model's basis. Fundamentals can be reported in non-USD currencies; missing currency is unknown. Treat these as migration blockers until tested, not UI warnings to hide.

[Options reference](https://sentisense.ai/docs/api/options/) provides four analytics endpoints. The intraday history contains aggregate cycles; the app-only intraday board is not fully exposed. Do not equate this with a live contract tape or complete options chain. New Options content should be concise risk context with observed date and detail on demand.

## Plan and licensing checks

As of this audit, API Terms **v1.12** are in effect until December 1; the current HTML page displays future-effective v1.13. Read the version applicable to the account, rather than applying future terms as current.

[v1.12](https://sentisense.ai/agreement/archive/API-Terms-of-Service-v1.12.pdf) permits analytical/value-added integration and individual records, but restricts raw redistribution, source-content reconstruction and ontology replication. Source links must remain available. Optional SentiSense attribution is not equivalent to permission to redistribute everything. Do not categorically say PRO permits every commercial display or forbids all app integration.

The [Data License agreement](https://sentisense.ai/agreement/data-license/) is a separate explicit display grant: Essentials covers earnings calendar, insider, institutional and congressional datasets; Premium covers the public API, subject to third-party-data restrictions. API access may exceed licensed display scope. Its attribution discount and accepted agreement version depend on the actual order. Confirm those records before public/monetized replacement. No purchase, cancellation, permission expansion, or live configuration change was made in this audit.

## Implementation order

1. **Fix reliability first:** verify actual paid key/account, capture authenticated APP/NBIS/IREN consensus responses without exposing secrets, preserve valid caching/freshness and map coverage errors distinctly. Upgrade cannot manufacture analyst coverage. Keep Auryn scenarios distinct from analyst low/mean/high opinions.
2. **Adapter foundation:** server-only typed endpoints; per-account request scheduler respecting rate headers and Retry-After; bounded cache per data class; reject preview/truncated content when a complete dataset is required. Never fetch all 113 endpoints on page load.
3. **Replacement acceptance:** run old/new adapters side by side in preprod against owned test cases; compare numbers, dates, missingness, splits, currency and corporate actions. Verify downstream chart/Pace/portfolio invariants, then change source preference per dataset. Keep rollback until proven.
4. **Useful new features within current structure:** earnings changes and KPI trends in Financials; analyst revisions in Analysts; filing-dated ownership/disclosures in Investment case; options risk history in Options; ETF overlap in Portfolio; one market briefing in Home. Avoid a new tab per endpoint.
5. **Optional detail:** sentiment decomposition, source narrative, analyst track record, entity graph, alternatives/trackers and aggregate market screens only when requested. Preserve clear separation between observed facts, vendor AI analysis and Auryn's calculations.
6. **Cancel old subscriptions only after** coverage, rights and paid-key validation; replacement quotes/history/fundamentals/options/news/crypto behavior; browser acceptance; and an explicit list of lost features accepted by the user. This audit does not cancel anything.

## Deliverables and limitations

- Complete normalized method/path inventory: 113 records, parsed from each official family page.
- Mapping to existing Auryn destinations and activation gates in JSON.
- Source check: `lib/sentisense-provider.ts` currently requests `stocks/{ticker}/profile` and `analyst/{ticker}/consensus`; `providers.ts`/`eodhd.ts` still own quote/history/fundamental/search/news and enrichment paths; `live-price.ts` expects streaming observations.
- No authenticated Pro endpoint sweep, actual entitlement confirmation, live account mutation or new runtime feature activation was performed. Those are explicit follow-up gates, not completed work.
