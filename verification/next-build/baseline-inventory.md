# Baseline inventory

Recorded: 2026-10-16T15:52:18.786155+00:00. Read-only inspection of `bbdce50b92384acefb3db79978423da92a75e1ea` plus the active worktree. This is source inventory, not a deployment or investment-performance certificate.

The branch HEAD is `Fix AURYN charts and mobile glass navigation`. The active upgrade files are uncommitted; the final release owner must reconcile its source and run gates after all agents finish. GitHub origin freshness and comparison with historical ZIP sources were not established by this inventory. Historical test reports are preserved as historical evidence, never reused as current pass counts.

## Counts

- 25 page files; 48 API route files.
- 8 GitHub workflows; 29 SQL schema/migration files.
- 54 TSX files contain lexical interactive elements; dynamic iterations can render multiple controls. The detailed source inventory is in `route-action-matrix.md`.
- 65 environment names found statically; values deliberately omitted. Dynamic environment lookups may need manual review.

## Commands and gates

`npm ci`; `npx tsc --noEmit`; `npm run test:release`; `npm run build`; `node scripts/test-redesign-release.mjs --historical-all` (separate unchanged historical inventory). No lint script is configured in package.json. Current release test runner serializes engine-dependent tests because they share `.engine-test`. This auditor did not invoke build/test gates or alter package dependencies.

`node scripts/verify-next-build-browser.mjs` is the new browser runner. It must target a locally started production release, validates localhost-only URLs, and blocks outbound page requests. `AURYN_BROWSER_MODE=fixture` labels intercepted auth/database/market/paper responses as synthetic; `public` covers actual locally served anonymous pages only. It cannot certify Supabase RLS, provider entitlements, email delivery, deployed admin mapping or broker fills.

## Workflow inventory

| File | Schedule(s), UTC | Dispatch | Endpoint/script |
|---|---|---|---|
| `.github/workflows/auryn-v931-reliability.yml` | `30 12 * * 1-5; 30 15 * * 1-5; 20 21 * * 1-5; 30 2 * * 2-6; 0 16 * * 6` | yes |  |
| `.github/workflows/auryn-v935-reliability.yml` | `45 12 * * 1-5; 15 16 * * 1-5; 15 21 * * 1-5; 15 2 * * 2-6; 15 16 * * 6` | yes |  |
| `.github/workflows/auryn-v996-validation-queue.yml` | `*/10 * * * *` | yes | `scripts/auryn-v997-market-cycle.mjs` |
| `.github/workflows/nivora-calibration-mature.yml` | `35 6 * * *` | yes | `/api/calibration/mature`, `/api/model-health/mature` |
| `.github/workflows/nivora-market-scanner.yml` | `7 * * * 1-5` | yes | `scripts/scan_us_market.py` |
| `.github/workflows/nivora-paper-trading.yml` | `*/15 13-22 * * 1-5` | yes | `/api/trading-lab/run-paper` |
| `.github/workflows/nivora-portfolio-learning.yml` | `15 23 * * 1-5` | yes | `/api/portfolio/learn` |
| `.github/workflows/sec-13f-sync.yml` | `0 10 15 2,5,8,11 *` | yes | `scripts/sync_sec_13f.py` |

`vercel.json` is `{}`: no Vercel cron schedule is declared in this source. The paper GitHub schedule is every 15 minutes during 13–22 UTC weekdays; actual regular-market eligibility remains a server gate. Presence of workflow files does not show that GitHub secrets, schedules or deployed endpoints are active.

## Database inventory

All SQL filenames are preserved; execution/applied state is unverified. RLS and grants require database verification, not merely matching SQL text.

| File | Create-table targets found | RLS/policy statements |
|---|---|---|
| `supabase/20260901_nivora_v61_trading_lab.sql` | `public.nivora_v61_paper_orders`, `public.nivora_v61_trade_fills`, `public.nivora_v61_trade_intents` | 3 |
| `supabase/20260901_nivora_v61_trading_lab_console.sql` | `public.nivora_v61_trade_evaluations` | 1 |
| `supabase/20260904_v6511_portfolio_pulse.sql` | `public.nivora_portfolio_snapshots` | 4 |
| `supabase/20260904_v65_portfolio_assets.sql` |  | 0 |
| `supabase/20260904_v65_trading_runs.sql` | `public.nivora_v65_trading_runs` | 1 |
| `supabase/auryn_manual_paper_orders.sql` | `public.auryn_manual_paper_orders` | 2 |
| `supabase/migrations/20260829_nivora_v30_enterprise.sql` | `public.nivora_model_registry`, `public.nivora_provider_health` | 2 |
| `supabase/migrations/20260829_nivora_v32_1_institutional.sql` | `public.nivora_institutional_snapshots` | 1 |
| `supabase/migrations/20260829_nivora_v34_institutional_dates.sql` |  | 0 |
| `supabase/migrations/20260829_nivora_validation.sql` | `public.nivora_validation_snapshots` | 1 |
| `supabase/migrations/20260830_nivora_v45_market_scanner.sql` | `public.nivora_market_scan`, `public.nivora_market_universe`, `public.nivora_scan_state` | 3 |
| `supabase/migrations/20260830_nivora_v46_discover_today.sql` |  | 0 |
| `supabase/migrations/20260830_nivora_v47_scan_freshness.sql` |  | 0 |
| `supabase/migrations/20260830_nivora_v48_investment_engine.sql` | `public.nivora_investment_scan` | 0 |
| `supabase/migrations/20260830_nivora_v51_learning_ledger.sql` | `public.nivora_decision_history`, `public.nivora_decision_outcomes` | 0 |
| `supabase/migrations/20260831_nivora_v55_trust_calibration.sql` |  | 0 |
| `supabase/migrations/20260831_nivora_v56_relative_portfolio.sql` |  | 0 |
| `supabase/migrations/20260831_nivora_v57_rate_limit.sql` | `public.nivora_rate_limit_buckets` | 1 |
| `supabase/migrations/20260901_nivora_v59_arena.sql` | `public.nivora_v59_arena_outcomes`, `public.nivora_v59_decision_snapshots`, `public.nivora_v59_reliability_buckets` | 3 |
| `supabase/migrations/20260912090000_auryn_v99_validation_lab.sql` | `public.auryn_model_health`, `public.auryn_model_registry`, `public.auryn_provider_rate_buckets`, `public.auryn_shadow_outcomes`, `public.auryn_shadow_snapshots`, `public.auryn_validation_jobs`, `public.auryn_validation_runs`, `public.auryn_validation_universe` | 0 |
| `supabase/migrations/20260912100000_auryn_v991_validation_integrity.sql` |  | 0 |
| `supabase/migrations/20260912103000_auryn_v992_run_lifecycle.sql` |  | 0 |
| `supabase/migrations/20260912120000_auryn_v995_autonomous_research.sql` |  | 0 |
| `supabase/migrations/20261016155025_auryn_paper_execution_safety.sql` | `public.auryn_manual_paper_orders`, `public.auryn_paper_control` | 3 |
| `supabase/research_workspace.sql` | `public.auryn_research_workspace` | 5 |
| `supabase/schema.sql` | `public.alerts`, `public.analysis_history`, `public.profiles`, `public.user_preferences`, `public.watchlist_items`, `public.watchlists` | 13 |
| `supabase/v12_upgrade.sql` | `public.portfolio_positions` | 2 |
| `supabase/v16_scale.sql` | `public.symbol_activity` | 1 |
| `supabase/v4_upgrade.sql` |  | 0 |

## Environment variable names

These are names from application/server sources, workflows and developer scripts; some are test-only, optional or obsolete. This does not say any key is present, valid or entitled.

| Name | Source references |
|---|---|
| `ALPACA_PAPER_API_KEY` | `app/api/analyze/[symbol]/route.ts`, `app/api/decision/summaries/route.ts`, `app/api/market/route.ts`, `app/api/portfolio/pulse/route.ts`, `app/api/quote/[symbol]/route.ts`, `app/api/scan/route.ts`, `app/api/system/health/route.ts`, `app/api/trading-lab/diagnostics/route.ts`, `app/api/trading-lab/manual/route.ts`, `app/api/trading-lab/run-paper/route.ts`, `app/api/trading-lab/status/route.ts`, `lib/auryn/v935/canonical.ts` |
| `ALPACA_PAPER_API_SECRET` | `app/api/analyze/[symbol]/route.ts`, `app/api/decision/summaries/route.ts`, `app/api/market/route.ts`, `app/api/portfolio/pulse/route.ts`, `app/api/quote/[symbol]/route.ts`, `app/api/scan/route.ts`, `app/api/system/health/route.ts`, `app/api/trading-lab/diagnostics/route.ts`, `app/api/trading-lab/manual/route.ts`, `app/api/trading-lab/run-paper/route.ts`, `app/api/trading-lab/status/route.ts`, `lib/auryn/v935/canonical.ts` |
| `AURYN_ADMIN_USER_IDS` | `lib/server/authorization.ts` |
| `AURYN_AUDIT_REPORT` | `scripts/run_v931_live_reliability_audit.mjs`, `scripts/run_v934_live_audit.mjs`, `scripts/run_v935_live_audit.mjs` |
| `AURYN_AUDIT_TOKEN` | `.github/workflows/auryn-v931-reliability.yml`, `.github/workflows/auryn-v935-reliability.yml`, `scripts/run_v8_live_100_audit.mjs`, `scripts/run_v931_live_reliability_audit.mjs`, `scripts/run_v934_live_audit.mjs`, `scripts/run_v935_live_audit.mjs` |
| `AURYN_BASE_URL` | `.github/workflows/auryn-v931-reliability.yml`, `.github/workflows/auryn-v935-reliability.yml`, `.github/workflows/auryn-v996-validation-queue.yml`, `.github/workflows/nivora-calibration-mature.yml`, `.github/workflows/nivora-paper-trading.yml`, `.github/workflows/nivora-portfolio-learning.yml`, `app/api/validation/snapshot/route.ts`, `scripts/auryn-v996-queue-pump.mjs`, `scripts/auryn-v997-market-cycle.mjs`, `scripts/run_v8_live_100_audit.mjs`, `scripts/run_v931_live_reliability_audit.mjs`, `scripts/run_v931_release_gate.mjs`, `scripts/run_v9343_release_gate.mjs`, `scripts/run_v934_live_audit.mjs`, `scripts/run_v934_release_gate.mjs`, `scripts/run_v935_live_audit.mjs`, `scripts/run_v935_release_gate.mjs`, `scripts/run_v936_release_gate.mjs` |
| `AURYN_PRODUCTION_URL` | `.github/workflows/nivora-paper-trading.yml` |
| `AURYN_QUEUE_MAX_JOBS` | `scripts/auryn-v996-queue-pump.mjs` |
| `AURYN_QUEUE_MAX_RUNTIME_MS` | `scripts/auryn-v996-queue-pump.mjs` |
| `AURYN_QUEUE_SPACING_MS` | `scripts/auryn-v996-queue-pump.mjs` |
| `AURYN_REQUIRE_LIVE` | `scripts/run_v931_release_gate.mjs`, `scripts/run_v9343_release_gate.mjs`, `scripts/run_v934_release_gate.mjs` |
| `AURYN_V91_BASE_OBSERVATIONS` | `scripts/run_v91_materialize_shard.mjs`, `scripts/run_v91_observation_factory.mjs` |
| `AURYN_V91_FEATURE_OBSERVATIONS` | `scripts/run_v91_materialize_shard.mjs` |
| `AURYN_V91_REPLAY_BUNDLE` | `scripts/run_v91_observation_factory.mjs` |
| `AURYN_V92_MAX_SESSION_GAP_PCT` | `scripts/run_v92_data_audit.mjs`, `scripts/run_v92_release_gate.mjs`, `scripts/run_v93_release_gate.mjs` |
| `AURYN_V92_MIN_SYMBOL_COVERAGE` | `scripts/run_v92_data_audit.mjs`, `scripts/run_v92_release_gate.mjs`, `scripts/run_v93_release_gate.mjs` |
| `AURYN_V92_MIN_YEARS` | `scripts/run_v92_data_audit.mjs`, `scripts/run_v92_release_gate.mjs`, `scripts/run_v93_release_gate.mjs` |
| `AURYN_V92_RAW_BUNDLE` | `scripts/run_v92_normalize.mjs` |
| `AURYN_V92_REPLAY_BUNDLE` | `scripts/run_v92_data_audit.mjs`, `scripts/run_v92_normalize.mjs`, `scripts/run_v92_release_gate.mjs`, `scripts/run_v93_release_gate.mjs` |
| `AURYN_V92_REQUIRED_FAMILIES` | `scripts/run_v92_data_audit.mjs`, `scripts/run_v92_release_gate.mjs`, `scripts/run_v93_release_gate.mjs` |
| `AURYN_V92_REQUIRE_DECISION_GRADE` | `scripts/run_v92_data_audit.mjs` |
| `AURYN_V92_SEC_DELAY_MS` | `scripts/run_v92_backfill.mjs` |
| `AURYN_V92_TD_DELAY_MS` | `scripts/run_v92_backfill.mjs` |
| `AURYN_V931_LIVE_DELAY_MS` | `scripts/run_v931_live_reliability_audit.mjs` |
| `AURYN_V931_LIVE_LIMIT` | `scripts/run_v931_live_reliability_audit.mjs` |
| `AURYN_V931_LIVE_MAX_RETRIES` | `scripts/run_v931_live_reliability_audit.mjs` |
| `AURYN_V934_LIVE_DELAY_MS` | `scripts/run_v934_live_audit.mjs` |
| `AURYN_V934_LIVE_LIMIT` | `scripts/run_v9343_release_gate.mjs`, `scripts/run_v934_live_audit.mjs`, `scripts/run_v934_release_gate.mjs` |
| `AURYN_V934_LIVE_MAX_RETRIES` | `scripts/run_v934_live_audit.mjs` |
| `AURYN_V93_BASE_OBSERVATIONS` | `scripts/run_v93_feature_tournament.mjs`, `scripts/run_v93_release_gate.mjs` |
| `AURYN_V93_GATE_OUTPUT_DIR` | `scripts/run_v93_release_gate.mjs` |
| `AURYN_V93_OBSERVATION_MANIFEST` | `scripts/run_v93_feature_tournament.mjs`, `scripts/run_v93_release_gate.mjs` |
| `AURYN_V93_OUTPUT_DIR` | `scripts/run_v93_feature_tournament.mjs` |
| `AURYN_V9_OBSERVATIONS` | `scripts/run_v9_feature_tournament.mjs` |
| `CRON_SECRET` | `.github/workflows/auryn-v996-validation-queue.yml`, `.github/workflows/nivora-calibration-mature.yml`, `.github/workflows/nivora-paper-trading.yml`, `.github/workflows/nivora-portfolio-learning.yml`, `app/api/calibration/mature/route.ts`, `app/api/decision-audit/route.ts`, `app/api/model-health/mature/route.ts`, `app/api/portfolio/learn/route.ts`, `app/api/trading-lab/run-now/route.ts`, `app/api/trading-lab/status/route.ts`, `app/api/validation/finalize/route.ts`, `app/api/validation/model-health/route.ts`, `app/api/validation/orchestrate/route.ts`, `app/api/validation/outcomes/route.ts`, `app/api/validation/watchdog/route.ts`, `app/api/validation/worker/route.ts`, `scripts/auryn-v996-queue-pump.mjs`, `scripts/auryn-v997-market-cycle.mjs`, `scripts/verify-v99937-release.mjs`, `scripts/verify-v99938-release.mjs` |
| `FINNHUB_API_KEY` | `app/api/context/[symbol]/route.ts`, `app/api/health/route.ts`, `app/api/institutional/[symbol]/route.ts`, `app/api/news/[symbol]/route.ts`, `app/api/quote/[symbol]/route.ts`, `app/api/system/health/route.ts` |
| `FRED_API_KEY` | `scripts/run_v92_backfill.mjs` |
| `MARKETDATA_TOKEN` | `app/api/health/route.ts`, `app/api/options/[symbol]/route.ts`, `app/api/system/health/route.ts` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `app/api/research-workspace/route.ts`, `lib/server/authorization.ts`, `lib/social-auth-providers.ts`, `lib/supabase.ts` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `.env.example`, `app/api/health/route.ts`, `app/api/research-workspace/route.ts`, `lib/server/authorization.ts`, `lib/social-auth-providers.ts`, `lib/supabase.ts` |
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.example`, `.github/workflows/nivora-market-scanner.yml`, `.github/workflows/sec-13f-sync.yml`, `app/api/arena/route.ts`, `app/api/audit/universe/route.ts`, `app/api/calibration/mature/route.ts`, `app/api/calibration/route.ts`, `app/api/decision-audit/route.ts`, `app/api/decision/summaries/route.ts`, `app/api/discover/route.ts`, `app/api/factor-integrity/route.ts`, `app/api/health/route.ts`, `app/api/institutional/[symbol]/route.ts`, `app/api/investment/route.ts`, `app/api/model-health/mature/route.ts`, `app/api/model-health/route.ts`, `app/api/portfolio/learn/route.ts`, `app/api/portfolio/pulse/route.ts`, `app/api/portfolio/risk/route.ts`, `app/api/relative-rank/route.ts`, `app/api/research-workspace/route.ts`, `app/api/system/health/route.ts`, `app/api/trading-lab/control/route.ts`, `app/api/trading-lab/manual/route.ts`, `app/api/trading-lab/run-now/route.ts`, `app/api/trading-lab/run-paper/route.ts`, `app/api/trading-lab/status/route.ts`, `app/api/validation/finalize/route.ts`, `app/api/validation/model-health/route.ts`, `app/api/validation/orchestrate/route.ts`, `app/api/validation/outcomes/route.ts`, `app/api/validation/snapshot/route.ts`, `app/api/validation/watchdog/route.ts`, `app/api/validation/worker/route.ts`, `lib/auryn/v935/canonical.ts`, `lib/rate-limit.ts`, `lib/server/authorization.ts`, `lib/social-auth-providers.ts`, `lib/supabase.ts` |
| `NIVORA_INVESTMENT_SCAN_BATCH_SIZE` | `scripts/scan_investment_universe.py` |
| `NIVORA_INVESTMENT_SCAN_PAUSE_SECONDS` | `scripts/scan_investment_universe.py` |
| `NIVORA_MIN_DOLLAR_VOLUME` | `scripts/scan_us_market.py` |
| `NIVORA_MIN_MARKET_CAP_M` | `scripts/scan_investment_universe.py` |
| `NIVORA_MIN_PRICE` | `scripts/scan_us_market.py` |
| `NIVORA_SCAN_BATCH_SIZE` | `.github/workflows/nivora-market-scanner.yml`, `scripts/scan_us_market.py` |
| `NIVORA_SCAN_PAUSE_SECONDS` | `.github/workflows/nivora-market-scanner.yml`, `scripts/scan_us_market.py` |
| `NIVORA_SYNC_UNIVERSE` | `scripts/scan_us_market.py` |
| `NODE_ENV` | `lib/rate-limit.ts` |
| `OPENAI_API_KEY` | `app/api/astra/[symbol]/route.ts` |
| `SEC_13F_LATEST_URL` | `scripts/sync_sec_13f.py` |
| `SEC_13F_PREVIOUS_URL` | `scripts/sync_sec_13f.py` |
| `SEC_USER_AGENT` | `.github/workflows/sec-13f-sync.yml`, `app/api/company/[symbol]/route.ts`, `scripts/run_backtest.mjs`, `scripts/run_v92_backfill.mjs`, `scripts/sync_sec_13f.py` |
| `SUPABASE_SERVICE_ROLE_KEY` | `.github/workflows/nivora-market-scanner.yml`, `.github/workflows/sec-13f-sync.yml`, `app/api/arena/route.ts`, `app/api/audit/universe/route.ts`, `app/api/calibration/mature/route.ts`, `app/api/calibration/route.ts`, `app/api/decision-audit/route.ts`, `app/api/decision/summaries/route.ts`, `app/api/discover/route.ts`, `app/api/factor-integrity/route.ts`, `app/api/institutional/[symbol]/route.ts`, `app/api/investment/route.ts`, `app/api/model-health/mature/route.ts`, `app/api/model-health/route.ts`, `app/api/portfolio/learn/route.ts`, `app/api/portfolio/pulse/route.ts`, `app/api/portfolio/risk/route.ts`, `app/api/relative-rank/route.ts`, `app/api/system/health/route.ts`, `app/api/trading-lab/control/route.ts`, `app/api/trading-lab/manual/route.ts`, `app/api/trading-lab/run-now/route.ts`, `app/api/trading-lab/run-paper/route.ts`, `app/api/trading-lab/status/route.ts`, `app/api/validation/finalize/route.ts`, `app/api/validation/model-health/route.ts`, `app/api/validation/orchestrate/route.ts`, `app/api/validation/outcomes/route.ts`, `app/api/validation/snapshot/route.ts`, `app/api/validation/watchdog/route.ts`, `app/api/validation/worker/route.ts`, `lib/auryn/v935/canonical.ts`, `lib/rate-limit.ts`, `lib/server/authorization.ts` |
| `SUPABASE_URL` | `app/api/institutional/[symbol]/route.ts` |
| `TRADING_LAB_CRON_SECRET` | `.github/workflows/nivora-paper-trading.yml`, `app/api/calibration/mature/route.ts`, `app/api/decision-audit/route.ts`, `app/api/model-health/mature/route.ts`, `app/api/portfolio/learn/route.ts`, `app/api/trading-lab/run-now/route.ts`, `app/api/trading-lab/status/route.ts`, `scripts/verify-v99937-release.mjs`, `scripts/verify-v99938-release.mjs` |
| `TRADING_LAB_PAPER_ENABLED` | `app/api/trading-lab/manual/route.ts`, `app/api/trading-lab/run-paper/route.ts`, `app/api/trading-lab/status/route.ts` |
| `TRADING_LAB_RISK_PER_TRADE_PCT` | `app/api/trading-lab/run-paper/route.ts` |
| `TRADING_LAB_SELF_TEST_SYMBOL` | `app/api/trading-lab/diagnostics/route.ts`, `app/api/trading-lab/status/route.ts` |
| `TWELVE_DATA_API_KEY` | `.env.example`, `.github/workflows/nivora-market-scanner.yml`, `app/api/analyze/[symbol]/route.ts`, `app/api/calibration/mature/route.ts`, `app/api/chart/[symbol]/route.ts`, `app/api/decision/summaries/route.ts`, `app/api/health/route.ts`, `app/api/market-intelligence/live/[symbol]/route.ts`, `app/api/market/route.ts`, `app/api/model-health/mature/route.ts`, `app/api/portfolio/pulse/route.ts`, `app/api/portfolio/risk/route.ts`, `app/api/quote/[symbol]/route.ts`, `app/api/scan/route.ts`, `app/api/search/route.ts`, `app/api/system/health/route.ts`, `app/api/trading-lab/diagnostics/route.ts`, `app/api/trading-lab/manual/route.ts`, `app/api/trading-lab/run-paper/route.ts`, `lib/auryn/v935/canonical.ts`, `scripts/run_backtest.mjs`, `scripts/run_v92_backfill.mjs` |
| `V8_LIVE_AUDIT_BACKOFF_MS` | `scripts/run_v8_live_100_audit.mjs` |
| `V8_LIVE_AUDIT_DELAY_MS` | `scripts/run_v8_live_100_audit.mjs` |
| `V8_LIVE_AUDIT_LIMIT` | `scripts/run_v8_live_100_audit.mjs` |
| `V8_LIVE_AUDIT_MAX_RETRIES` | `scripts/run_v8_live_100_audit.mjs` |

## Boundaries and unresolved baseline checks

- Parent release owner must reconcile surviving fixes with the latest remote source; this inventory records HEAD but did not fetch GitHub.
- Historical handoff archive paths `docs/handoff/source/AURYN_REDESIGN_BUILD_2026_10_15.zip` and `docs/handoff/source/AURYN_INTELLIGENCE_OS_WORKSPACE_REBUILD.zip` are absent from this checkout. Existing same-workspace source directories and reports must not be mistaken for the exact original ZIPs.
- Native/browser public-key configuration is build-time in Next.js. Rebuild with actual public deployment settings after a fixture build; never deploy the fixture-configured bundle.
- `supabase/.temp` is transient tooling state and must be excluded from source packaging.
- Source inventory covers known static routes/components. Browser-generated controls, failure states, dialogs and user-specific branches require current runtime interaction evidence.
