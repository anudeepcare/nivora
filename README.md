# Current screenshot follow-up — 23 October 2026

Read `docs/SCREENSHOT_REPAIR_20261023.md` first. Corrected the quote candle-opening/observation timestamp mismatch, added live social-provider availability handling, replaced the profile Settings sheet and Home/landing compositions, and compacted the stock metric strip. 439 tests, production build, 83 API fixture checks, 3 additional provider-config checks and 12 local HTTP checks pass. Google/X are disabled in the inspected live Supabase configuration; complete `docs/LAUNCH_AUTH_SETUP.md` to activate them. No push/deployment or live configuration mutation was performed. Physical device, rendered-source and live quote/OAuth acceptance remain outstanding. Earlier status entries below are historical.

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

Node 22.18+ is required; Node 24 was used. Configure Supabase, EODHD_API_KEY and your existing TWELVE_DATA_API_KEY. Both are used: Twelve Data for quotes/intraday, EODHD for financial research/daily history. Add a real SEC contact identity for the legacy filings fallback. Existing Finnhub and Alpaca paper credentials are optional. Keep every server key out of `NEXT_PUBLIC_*` variables.

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
