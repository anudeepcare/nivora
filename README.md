# Decision Canvas preprod handoff

Start with [release and deployment instructions](docs/DECISION_CANVAS_RELEASE.md). Full source; no production deployment performed.

# AURYN Edge — October 25 preprod build

Latest release: see `docs/AURYN_EDGE_RELEASE.md`, `docs/SUPPORT_SETUP.md` and `docs/PREPROD_EDGE_DEPLOYMENT.md`. The complete source is included. No production deployment or live email/database mutation was performed. Historical notes below describe earlier releases and are not a claim of current verification.

# Options workspace refinement — October 23, 2026

Replaces the options presentation with one expiry selector, compact market summary, conditional positioning charts, clearer contract costs, automatic listed long-term selection, strategy cards and practical explanations. Preserves the Alpaca/EODHD data adapters and existing research tabs. See `docs/OPTIONS_UX_REFINEMENT.md`. Missing feed inputs are not unlocked by this redesign.

# Alpaca options update — October 23, 2026

Options now defaults to Alpaca using the existing paper-account credentials. See `docs/ALPACA_OPTIONS_SETUP.md` for production variables and verification limits. This update does not enable data rights, buy a plan or place trades.

## Options, projections and access reliability — October 23

This release adds a dedicated Options tab (chain, GEX/positioning, LEAPS explorer, expiry payoff strategies, metric explanations), conditional earnings projections under Value, and timezone-explicit verified admin access saving with member filters/extension.

Read `docs/OPTIONS_AND_PROJECTIONS.md` before enabling the options feed. Set `AURYN_OPTIONS_ENABLED=true` only after dataset entitlement/display rights are verified; no new subscription is purchased. Existing market-data keys are reused. No new SQL migration is required. Default Options feature access is Pro, configurable by the owner.

Options data are EOD snapshots, not live executable quotes. GEX is modeled; no actual dealer inventory is inferred as fact. The earnings model is a conditional sensitivity, not a guaranteed target. Live vendor entitlement, live payments and physical iPhone acceptance remain unverified in this environment.

> Owner UX update: focused People, Features and Payments sections, quick complimentary access durations, and a private Settings shortcut. See [docs/ADMIN_CONTROLS.md](docs/ADMIN_CONTROLS.md).

> Current Free experience: full Overview, news and Home; real account workspace with no automatic sample holdings; quieter upgrade prompts. See [docs/FREE_EXPERIENCE_UPDATE.md](docs/FREE_EXPERIENCE_UPDATE.md).

> Friends can now subscribe while retaining complimentary Pro. Live Stripe activation steps: [docs/STRIPE_PRODUCTION_LAUNCH.md](docs/STRIPE_PRODUCTION_LAUNCH.md). This package does not activate or charge a live Stripe account.

> Current membership update: every new account starts Free (100 distinct companies/month); Pro has unlimited company research. See [membership setup](docs/FREE_AND_PRO_MEMBERSHIP.md). Earlier invitation-only or signup-to-Plans instructions below are superseded.

# Latest — visible signup-to-plans flow and payment return UX

Read `docs/ONBOARDING_AND_EMAIL.md`. New users have visible Plans/Free navigation, confirmation-email resend, and clear payment return messages. Misleading sample-beta design-preview labels are removed. User-supplied screenshots show a successful sandbox purchase, Pro access and Customer Portal invoice; live charges and email delivery remain unverified. No new migration required.

# Latest — billing diagnostics and quieter admin UX

Read `docs/BILLING_TROUBLESHOOTING.md`. Removes global owner-preview banners, adds owner-only Stripe connection checking, safe failure references and aligned admin inputs. The production checkout 503 remains unverified; this build makes its underlying failure diagnosable without exposing secrets. No new migration required beyond the existing Stripe setup.

# Latest — clean Plans and Stripe implementation, 23 October 2026

Read `docs/STRIPE_SETUP.md` first. The complete source includes compact Free/Pro plans, $2.99 monthly Checkout, signed subscription webhooks and a Customer Portal entry. Apply the new billing migration, configure the price/webhook/portal, and complete a sandbox checkout before enabling live payments. Actual Stripe payment and physical iPhone verification have not been performed. Earlier entries below are historical.

# Latest — direct Plans and model audit, 23 October 2026

Read `docs/CLEAR_PLANS_AND_MODEL_AUDIT.md` first. Pricing is public; signed-in Plans is one click from the header. Overview shows analyst targets separately from AURYN scenarios. Includes the 30-stock cross-product audit and historical DCA evaluation; the timing strategy did not establish an advantage. Stripe sandbox connection and payment implementation are required before charges can work. Earlier entries below are historical.

# Latest update — beta controls and quote polling, 23 October 2026

Read `docs/BETA_ACCESS_AND_QUOTES.md` first. Includes owner-only feature controls, expiring friend grants, Free/Pro previews and quotas, sample-only beta protection, quote-polling and freshness fallback fixes. Billing remains disconnected; no Stripe test or real payments are available. Thirty-stock DCA check: 28/30 confirmed and 30/30 forming signals agree with the observed reference snapshot, without policy changes. This is not investment outperformance or universal parity. No deploy or live database migration was performed. Earlier entries below describe previous iterations.

# Latest build — Adaptive Home, 23 October 2026

The approved adaptive Home is implemented. Read `docs/ADAPTIVE_HOME_BUILD.md` for behavior, coverage and verification limits. Greeting and a daily perspective remain; the navy feature adapts to earnings, company updates, milestones or a weekly review. The Home CSS file was replaced rather than adding another override layer. PWA shell geometry and other app pages remain unchanged. Prior entries below describe earlier iterations. DCA outperformance remains unestablished.

# Latest validation — 23 October 2026

This is the complete application source, not just the validation bundle. See `docs/DCA_FROZEN_VALIDATION.md` and `verification/dca-frozen-validation.json`. Frozen monthly-v5 was evaluated on eight additional securities over 68 execution months with equal contributions: one win, two losses, five ties versus ordinary DCA; mean ending-value difference +0.044%. This is not evidence of a superior investment algorithm. Production thresholds were not retuned to improve these results. The report discusses reserve funding, dividends, cash yield, survivorship and further validation. Earlier parity results below refer to calibration examples, not proven investment performance.

# Latest combined update — 23 October 2026

Read `docs/SCENARIOS_AND_MONTHLY_V5.md`, `docs/HOME_DAY_AND_DOMAIN_FOLLOWUP.md` and `verification/REPORT.json` first. SOFI, TTD, CRWV and ONDS match the supplied October 22 monthly readings; the current 17-stock calibration sample matches 34/34. Two older IREN months still differ; no universal parity is claimed. Overview/Value use eligible earnings cases or explicitly labelled historical price-risk Bear/Base/Bull, not consensus substitution. Home now selects by session impact, shows coverage and expands all returned matching news. The requested setup panel is hidden and research/footer spacing is tightened. EODHD remains primary. Both domains serve the same build/Supabase project; custom-domain password failure is not reproduced or certified fixed. Earlier entries below are historical.

# Latest scenario and DCA correction — 23 October 2026

Read `docs/SCENARIOS_AND_MONTHLY_V5.md` and `verification/REPORT.json` first. Supplied October 22 monthly readings now match: SOFI 3×/3×, TTD 4×/3×, CRWV 1×/4× (confirmed/forming). CRWV uses explicitly limited listing history. Current 16-stock comparison is 32/32; two older IREN months still differ, so universal parity is not claimed. Overview/Value show eligible earnings cases or explicitly labelled historical price-risk Bear/Base/Bull cases, not consensus substitution. Price-risk is not company fair value. Numeric cases still require sufficient valid data. EODHD remains primary. 452 tests, production build, 86 compiled API checks and 12 local HTTP checks pass. Production/device/pixel acceptance remains unverified; no deploy or push was performed. Earlier entries below are historical.

# Approved public, sign-in and Home build — 23 October 2026

Read `docs/APPROVED_PUBLIC_AUTH_HOME_20261023.md` for this update. The approved public research panorama, focused sign-in/create-account screens and account-driven Home briefing are implemented. EODHD is primary for quotes, intraday and daily history; Twelve Data is fallback. Financial research already prefers EODHD. The archive contains complete source, tests and deployment instructions, not installed dependencies or secrets.

**Not production accepted:** rendered pixel matching, installed-iPhone behavior and a live OAuth round trip remain unverified. SOFI/TTD DCA reference mismatches and universal bear/base/bull coverage are unresolved; do not treat selected historical agreement as universal parity. Reports document the exact limits. Earlier entries below are historical.

# AURYN Investment Intelligence

A complete standalone **source package** for the new AURYN application. The application builds independently of the old screens and styles. **It is not fully production accepted, and not every inherited product requirement is complete.** Read `docs/RELEASE_STATUS.md` for the exact remaining scope and verification limits.

Latest scope: `docs/UNIFIED_BUILD_20261023.md`. The three-platform comparison is in `docs/COMPETITOR_COMPARISON_20261023.md`; monthly-v3 rules and limitations are in `docs/MONTHLY_POLICY_V3.md`. Current verification: 380 tests, TypeScript, production build and 83 compiled API checks.

## Start

From the extracted application directory (the directory containing this file):

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Node 22.18+ is required; Node 24 was used. Configure Supabase, EODHD_API_KEY and your existing TWELVE_DATA_API_KEY. EODHD is primary for market data and financial research; Twelve Data remains a fallback for unavailable or stale quotes and failed history requests. Add a real SEC contact identity for the legacy filings fallback. Existing Finnhub and Alpaca paper credentials are optional. Keep every server key out of `NEXT_PUBLIC_*` variables.

For a read-only local design preview, set `AURYN_ENABLE_PREVIEW=true` in `.env.local` and open `http://localhost:3000/preview/research/MSFT`. Illustrative fixture values are labeled, are not live signals, and cannot authorize writes or trades. The local preview does not require account credentials. Keep that flag off when hosted.

## Verify

```sh
npm run verify
npm run test:api
```

`verify` runs domain/Postgres tests, TypeScript and the production build. `test:api` tests the actual built handlers with mocks. Reports live in `verification/`. The updated source has not had rendered-browser or physical-iPhone acceptance. Earlier authenticated deployed/reference inspection is documented separately.

## Current update

The user-approved studio design is implemented in the connected React app: lighter top navigation, floating mobile dock, contrasting research canvas and compact settings. The five research tabs retain exactly the approved primary metric selection. See `verification/APPROVED_STUDIO_REPORT.md` for the 146-test verification, forecast model distinction and browser/iPhone acceptance limits. The exact approved mockup is included as `docs/design/approved-studio-20261017.html`. No live-data or pixel-parity certification is implied.


Persistent account navigation, tab scroll/filter memory, compact mobile holdings and stable price refresh states; corrected cash-flow example geometry, custom-result labeling and earnings/debt interpretation. See `verification/RESEARCH_MOBILE_REPAIR_20261017.md`. No post-patch installed-iPhone acceptance or company-specific fair-value completion is claimed.

Compact stock decision guide, separate buying/ownership context, visible 0×–4× monthly signals, sector-aware valuation safeguards, and responsive search/dialog/portfolio repairs. Read `docs/DECISION_GUIDE.md` and `verification/UI_CONTROL_AUDIT_20261017.md` for exact behavior and remaining acceptance checks.

## What is included

- `app/`, `components/`, `lib/`, `public/`: full application source and assets.
- `supabase/migrations/`: fresh-account baseline and additive feature migrations.
- `tests/`, `scripts/`, `package-lock.json`: reproducible tests, tools and exact dependency versions.
- `.env.example`: safe configuration names, with paper execution and AI off by default.
- `.github/workflows/`: CI verification and manually triggered controlled checks.
- `docs/`: architecture, deployment/Git steps, original requirements audit, approved design reference, source-review results and remaining gates.
- `MANIFEST.sha256`: checksums of packaged files.

Follow `docs/DEPLOYMENT.md`. Do not overwrite production or enable broker scheduling solely because compilation passed. No provider was purchased or canceled, no paid AI call was made, and no order was placed during this repair. Earlier database setup is recorded in `verification/LIVE_SETUP.md`. The latest provider allocation is in `docs/PROVIDER_STRATEGY.md` and the approved design is `docs/design/approved-studio-20261017.html`; inherited gaps remain in `docs/RELEASE_STATUS.md`.

Latest October 19 research/visual additions and exact remaining scope: see docs/RESEARCH_RETENTION_RELEASE.md (RESEARCH_RETENTION_RELEASE.md from this docs directory). Latest automated verification: 219 tests, TypeScript, production build and 64 API fixtures. Billing and the full commercial roadmap are not complete.

Latest connected research changes and the complete requested-feature coverage matrix: docs/CONNECTED_PRODUCT_RELEASE.md.

Latest benchmark, industry candidate, segment and Technicals work: docs/MARKET_CONTEXT_RELEASE.md. Install test dependencies with npm ci --include=dev.
