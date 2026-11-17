# AURYN unified research build

## Included

Full application source, existing schema/migrations, all tests, approved design reference, deployment instructions, competitor comparison, monthly-v3 rules and fourteen-instrument calculation audit. This is not a mock-only archive.

Public experience: landing, Why AURYN, illustrative interactive sample, sign-in, account creation and password recovery. Account operations retain existing Supabase authorization and configuration.

Workspace: shared content design across Home, Watchlist, Portfolio, Settings and every research tab. Business now contains company/segment evidence and annual durability history. Financials retains statements and trend charts. Value distinguishes suitable models from analyst consensus. Technicals retains study groups, Fibonacci references and monthly accumulation. Analysts, News and Advanced retain their evidence and controls. News no longer repeats the separate earnings-preparation panel before its earnings workflow.

No new provider requests are introduced by the added durability metrics, model-suitability summary or v3 policy. Expensive historical evaluation runs only when expanded. Existing portfolio/quote refresh controls and cache budgets remain intact.

## Deliberate decisions

- Competitor outputs are comparison observations, not ground truth. No signal is hardcoded for APP, IREN or any other ticker.
- DCA rules are price-only. Business quality and financing remain separate. Missing inputs stay unknown.
- Model suitability is explicit for banks, frontier, infrastructure and currency/listing mismatches. This does not invent a fully validated sector valuation model.
- Content styling is separate from PWA geometry. Existing safe-area, status surface, keyboard and scroll-restoration behavior is preserved.
- No paid entitlement, database change, live order, commercial billing activation, merge or deployment was performed.

## Verification

380 unit/render/database tests passed. Type generation and TypeScript passed. Production build passed. 83 compiled API checks passed before the final formatting/copy pass and were rerun on the final build (see verification logs and REPORT.json).

The API tests use controlled fixtures, not the owner's live Supabase records or brokerage. The market-history audit used the connected data service for fourteen instruments, with matching overlapping daily OHLC before accepting incremental history. It is not an independent audit of every financial input.

Browser access to the local preview was blocked in this environment. No claim of exact pixel matching, smoothness on physical iPhone, or complete installed-PWA acceptance is made. The last reported successful installed-app status-bar behavior was preserved; no new safe-area workaround was added.

## Remaining capabilities and limits

Existing optional API/AI/options/peer/transcript modules depend on deployment configuration and real entitlements. This build does not certify their paid/live availability. It does not add functioning billing, a commercial broker connector or a verified automated filing/thesis-monitoring service. Sector-specific intrinsic values and numeric cases remain unavailable when their material inputs cannot be supported. Live quote latency and iPhone acceptance require testing on the deployment/device. No outperformance or all-ticker valuation guarantee is claimed.

## Install and deploy

Read DEPLOYMENT.md. Replace the project source while preserving your local .env files. Do not copy node_modules or .next from an old build. From the application root run:

```bash
npm ci --include=dev &&
npm run verify &&
npm run test:api
```

Then, from your existing correctly linked Git working tree:

```bash
git status --short &&
git add -A &&
git commit -m "Unify AURYN research experience and monthly accumulation engine" &&
git push origin main
```

These commands do not resolve divergent or unrelated histories. Do not force push to bypass such an error. Preserve private .env files with the included .gitignore. Vercel production changes only after your configured Git deployment runs successfully.
