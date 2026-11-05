# AURYN workspace coverage — November 5, 2026

This source candidate includes the UI refinement and remaining market-workspace software described below. It has not been pushed or deployed. Features needing provider entitlements stay unavailable until configured; no data feed or subscription was purchased. This is not a claim of complete Skylit parity or a completed private competitor walkthrough.

## Product and UX coverage

| Area | Implemented behavior |
|---|---|
| Public Home | Shorter product-led hero, interactive business/value/Pace walkthrough, restrained emerald/citron presentation, connected sales sections and working account/demo/pricing routes. No fictional performance claims. |
| Sign-in, signup, recovery | Balanced product context, contained padded form, responsive mobile styling; existing OAuth/email/recovery/error handling retained. |
| Signed-in Home | One earnings calendar with dated actual EPS, estimate and pending status; compact saved reminders; removed repeated earnings/contribution banners. |
| Research header | Compact supported market cap, comparable revenue growth, cash-flow margin, operating margin, net margin and next earnings where supplied. Sector guards apply; financial companies use return on average equity instead of generic cash margin. Dates/methods in one About metrics entry. Missing measures are omitted. |
| Pace | Prominent P0–P4 stage; completed/forming distinction, technical levels and contribution rules remain expanded in the research instrument. Financial policies unchanged. |
| Historical and valuation cases | Distinct downside/midpoint/upside icons and colors, percentile/date context, compact spacing. Historical returns remain separate from conditional Bear/Base/Bull valuation; decorative forecast lines removed. |
| Technicals | Grouped retracement, channel and pivot references, mobile layout, custom anchors, concise intro and expandable methods. Reference levels are not confirmed support. |
| Targets and business | More compact targets container, shared consistent controls/headings; financial comparisons and date/currency guards retained. |
| Portfolio, settings, watchlist, public/help/legal | Existing functionality retained with the prior shared readability/control improvements. No new portfolio CSV importer. |

## Market features

| Capability | Implemented behavior and boundaries |
|---|---|
| Exposure map | Returned-contract GEX/OI grid, strike/expiry/minimum filters, normalized view, largest and above/below concentrations, inspection, explicit nulls/coverage, TSV export and focused keyboard shortcuts. GEX call-positive/put-negative is a convention, not observed dealer inventory or a direction forecast. |
| Device views/history | Ten presets, twelve validated local checkpoints, compatible comparison and up to six saved-symbol boards. Device storage is distinct from account storage. |
| Account views/history | Explicit account save/load with optimistic conflict protection. Server loads market inputs and signs compact checkpoints; browser-supplied prices are never trusted. Latest sixty stored checkpoints per symbol can be selected/replayed discretely. No interpolation or minute backfill. |
| Exposure alerts | Fixed measured strike approach/crossing and percentage magnitude-change rules; largest-role backend supported. First check establishes baseline. Signed rule-bound baselines, source freshness, spot rebasing for changes, compare-and-swap concurrency, retryable/deduplicated alert events. Events appear in the existing alert center, not email/SMS or continuous push. |
| Modelled vanna | European Black–Scholes vanna grid with editable rate/dividend assumptions, source/expiry validation and finite-difference tests. Per +1 percentage-point IV sensitivity; American/settlement approximation disclosed. This is not proprietary dealer VEX or an observed positioning feed. |
| Options trade tape | Optional Alpaca adapter: up to thirty standard contracts, trailing twenty-four hours, one page up to 500 prints. Explicit load and opt-in fifteen-second polling with cache/coalescing/hidden-tab cleanup. Raw trade conditions, exact print timestamps, sample premium ranking and source delay disclosed. Symbol-first pagination cannot represent latest overall market flow. No inferred buy/sell/sweeps/multi-leg classifications. |
| Breadth & rotation | Home and Discover radar using loaded companies only. Shared dated completed history, daily-density/coverage checks, sector participation, 20/60-session relative return quadrants and historical checkpoint controls. Not market-wide breadth; universe survivorship bias disclosed. No extra provider calls for display controls. |
| Simulated options ledger | $100,000 starting cash; standard long calls/puts; buys at supplied ask and closes at supplied bid; partial closes, realized/marked P&L, closed-position win rate, notes, explicit device/account saves. Freshness and cash validation; no borrowing or broker orders. Expiration settlement withheld without an expiration close. |
| Volatility and strategy | Dated nearest-strike IV term structure, daily-density checked realized volatility, skew and existing expiration payoff/defined-risk strategy tools retained. |

## Activation and operational limits

- Reuse existing research-workspace documents/observations/alert-event tables and account RLS. No new schema migration is required by these additions; existing migrations must already be installed.
- Configure a stable server-only `AURYN_MARKET_SNAPSHOT_SIGNING_KEY` of at least 32 characters. Existing service-role key or sufficiently long cron secret is a fallback. Rotating the signing key makes older signatures unreadable. Never expose signing keys to the browser.
- Tape requires existing options access plus `AURYN_OPTIONS_FLOW_ENABLED=true` and valid Alpaca market-data credentials/rights. Default is false. This flag does not buy data or extend a subscription.
- Existing access guards, per-account market allowance, bounded provider budgets and source caches remain enforced. Manual captures are limited. Saved history/view reads do not need a new provider request.
- Existing alert check endpoints and bounded owner cron job evaluate exposure rules. This does not introduce all-tenant continuous workers or new delivery channels.
- Checkpoints contain at most forty nearby strikes and six loaded expirations; they do not archive an entire chain or market. History retrieval is bounded; the application does not automatically backfill or prune database history.
- Simulation account saves are explicit working-ledger replacements; they are not a transaction-synchronized multi-device broker wallet.

## Still data-dependent or outside this source candidate

Authorized historical minute-chain archives, synchronized live index streams, full-market flow/tide, reliable aggressor/sweep/multi-leg classification, off-exchange stock tape, multi-year IV percentiles, proprietary node classifiers, broker execution, expiry settlement accounting, social leaderboards and freeform AI flow commands are not represented as implemented. Existing company AI analysis remains sourced and budgeted. These need separate datasets, operational design or further implementation; an options snapshot cannot create them.

## Acceptance

Final automated results are in `GIT-HANDOFF.md`. Provider/API regression transport is synthetic, not live-provider acceptance. Browser preview timed out; screenshot, installed-iPhone/PWA and real-account cross-device acceptance remain pending. No production deployment or account privilege changes were performed.
