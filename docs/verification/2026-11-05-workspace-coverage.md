# AURYN workspace candidate — scope and coverage

This is an application source candidate, not a claim of full Skylit feature parity. No repository push, production deployment, subscription purchase, administrator grant, or remote provider configuration was performed. The signed-in Skylit review remains blocked by browser timeouts; inspiration comes from reviewed public modules/guides.

## Product coverage

| Requested area | Candidate implementation / retained behavior |
|---|---|
| All-page visual consistency | Default owned palette unified around neutral surfaces, teal/jade/citron; shared control/focus rules and page-heading bands. Home, Research, Portfolio, Settings, public landing, plans and login surfaces included. User-selected alternate accent preferences retained. |
| Simple header facts | Per-fact decorative/info icons removed; compact market cap, comparable revenue growth, applicable profitability and earnings; one About metrics entry retains dates/methods. Prior close remains in optional chart context. |
| Pace stage | Larger P0–P4 badge; stage rail retained; completed/forming selector above expanded technical/evidence detail; technical levels/contribution help open by default. Existing business, valuation, cash and position gates retained. |
| Scenario clarity | Historical downside/midpoint/upside with explicit percentiles; no relabelling historical statistics as conditional Bear/Base/Bull forecasts. Existing scenario assumptions and analyst separation retained. |
| Business/financial readability | Shared semantic surfaces, statement/ratio detail, reporting-period controls and existing financial/date guards retained; long methods remain contextual help. |
| Technicals | Existing studies and custom chart overlays retained; redundant decorative heading dot/alternating rows removed; shared level cards and definitions retained. |
| Options presentation | Searchable expiration picker, one authoritative exposure map, contract search and rankings, volatility context, preserved strategy payoff/Greeks/LEAPS. Duplicate legacy gamma/OI display removed. |
| Home/watchlist | Existing source-backed highlights, events, opportunity map, notes/alerts, comparison and saved watchlist preferences retained; unified palette and heading bands. No duplicate financial calculations added. |
| Portfolio | Existing positions, allocation, exposure, ledger, charts, risk and dated price notices retained; CSV import UI remains removed; manual management retained. |
| Settings/public/login | Consistent surfaces, clear headings, control contrast and focus. Existing privacy/auth/account/notification flows preserved. |
| Ask AURYN | Explicit current-company/date context; existing four research intents and source validation retained. Optional server-only OPENAI_FALLBACK_MODEL makes one same-provider retry on transient HTTP capacity errors; permission failures do not retry. This does not change ChatGPT's own model availability. |
| Lightweight source | No new dependencies. ZIP omits generated output, dependency folders, secrets, screenshots and prototypes; application, tests, lockfile and database migrations remain. |

## Heatseeker-inspired feature map

| Capability | Status and exact boundary |
|---|---|
| Symbol search, favorites/watchlists, ticker URLs | Existing AURYN search/watchlist/company routes retained. |
| Searchable lists | New searchable expiration and comparison-company selectors; other short lists use native accessible selectors with consistent styling. |
| GEX heatmap | Implemented from returned gamma/OI with strict per-cell observation coherence. Calls positive / puts negative is an estimate convention, not actual dealer inventory. |
| Strongest node; above/below concentrations | Implemented for the visible measured cells with exact strike/expiration. Not guaranteed support/resistance. |
| Hover/tap values and raw details | Accessible buttons expose exact values; tap opens inputs, coverage and date. |
| Center on spot/strongest cell | Implemented within the scrollable board. |
| Strike/expiration window, minimum size | Implemented; no extra provider calls from these view controls. |
| Dollar and normalized views | Implemented relative to largest absolute visible cell. |
| Named saved presets | Ten per browser device; validate values before reading. Not cross-device sync. |
| Snapshot capture/export | Twelve device-local manual checkpoints across symbols, TSV value export, quota/size failure feedback. |
| Snapshot inspection and changes | Implemented; select saved target, choose latest compatible baseline. Same universe/spot and newer source date required. Not intraday velocity. |
| Multi-symbol comparison | Up to six latest saved symbol checkpoints with independent dates. Not synchronized live index Trinity. |
| Keyboard/mobile controls | Board-scoped F/L/S/Escape actions; responsive toolbar, scrollable grid, tap details; native keyboard option-list navigation. Physical-device QA pending. |
| Contract lookup/rankings | Search ID/strike, call/put/liquidity filters, strike/volume/OI/volume-to-OI ranking using returned snapshot inputs. Volume/OI is not trade intent. |
| Volatility/term structure | Nearest-strike IV by loaded expiry, each dated; 20-return historical realized volatility with daily-density guard; existing strike skew plot. |
| Strategy lab | Existing call/put, defined-risk spreads, covered/protective/cash-secured examples and expiration payoff retained. No live orders. |
| Price alerts and history | Existing AURYN alert center/jobs retained. New map does not claim an unimplemented exposure-alert backend. |
| AI context | Existing sourced company analysis gains visible ticker/date context. It does not receive a new unsupported freeform flow-chat feature. |

## Features requiring additional implementation or authorized data

These are explicit outstanding scope, not enabled features:

| Capability | What is missing |
|---|---|
| Vanna/VEX board, proprietary node classifications | A validated vanna model or licensed compatible values, complete source inputs and display rights. No proprietary King/Pika/Barney formulas reproduced. |
| Intraday velocity/movers, agreement across timeframes | Repeated comparable time-stamped chains; shared snapshot history and documented exposure-change semantics. |
| Historical minute replay and session jumps | Durable/licensed historical options snapshots, retention and playback service. Manual saved snapshots are not a substitute. |
| Live multi-index synchronized panels | Authorized index coverage, synchronized timestamps and a bounded streaming backend. |
| Role-following/exposure alerts; watchlist smart alerts | Persisted exposure rules, scheduled comparable observations, notification delivery/de-duplication and access controls. Existing price alerts do not establish this capability. |
| Live prints, sweep/multi-leg/cross classification | Licensed options time-and-sales/trade-condition data; snapshots cannot supply it. |
| Flow scanner/tide, directional net premium, repetitive prints | Trade-side classification, event stream/history and aggregation infrastructure. OI and call volume do not prove bullish purchases. |
| Dark-pool tape and overlays | Authorized off-exchange prints and timestamped chart alignment. |
| Historical IV percentile/rich-cheap radar and similar conditions | Comparable multi-year IV histories, definitions, coverage and validated scoring. No percentile invented from today's IV. |
| Market-wide breadth/rotation | Consistent market-universe price histories and sector membership; selected-watchlist opportunity map is not market breadth. |
| Paper wallet/trade coaching/social leaderboard | Full simulated execution/expiration accounting, ledger and scoring design; existing payoff simulator is preserved, not represented as complete Nexus parity. |
| AI flow commands, context-aware heatmap narratives and chart annotations | Server-grounded structured map/flow context, citations, permissions and validation beyond current company analysis. |
| Cross-device layouts/presets; image export | Additional account-scoped persistence and chart/image rendering. Current device views and TSV exports are implemented. |
| Full authenticated competitor QA | Browser session verification and page-by-page UI access remain unavailable. |

No externally licensed data or new paid product was purchased. No environment owner/admin identity was copied or broadened. Options availability still requires the deployment's existing provider settings and account entitlement; this archive intentionally contains no secrets.

## Acceptance evidence

Automated tests, strict type check, production build, API regressions and archive integrity are recorded in GIT-HANDOFF.md after their final runs. Provider tests use synthetic transport. No claim of live-provider acceptance or physical iPhone/PWA acceptance is made.
