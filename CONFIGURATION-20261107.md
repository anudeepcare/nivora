# Configuration and Supabase handoff

Source-only package. No environment variables, database objects or schedules were changed in this pass.

1. Use Node 24. Run `npm ci`, `npm run verify`, then `npm run test:api`.
2. Copy `.env.example` to your local environment and supply the existing project values securely. Never commit secrets. Run `node --env-file=.env.local scripts/check-release-config.mjs` for presence checks (names/status only). This does not test connectivity or entitlements.
3. Required core values: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `AURYN_OWNER_USER_ID`, and `AURYN_MARKET_SNAPSHOT_SIGNING_KEY` (at least 32 characters). Keep server keys server-only.
4. Options: set `AURYN_OPTIONS_ENABLED=true` only when configured. `AURYN_OPTIONS_PROVIDER=eodhd` uses `EODHD_API_KEY` (or supported `EODHD_API_TOKEN` alias); otherwise Alpaca requires `ALPACA_PAPER_API_KEY` and `ALPACA_PAPER_API_SECRET`, plus the correctly entitled feed. Missing volume/OI cannot be fixed by UI configuration alone.
5. `AURYN_EXTERNAL_DATA_LICENSED=true` is an assertion of permission to redistribute the public observations; do not enable it without that permission. False now returns a deliberate unpublished state, rather than a misleading feed failure. When enabled, real database/read failures still return errors and the UI offers Retry.
6. Thesis jobs: `AURYN_THESIS_JOB_ENABLED=true` and `CRON_SECRET` are needed for the scheduled path. Existing `vercel.json` has the daily 14:00 UTC schedule. Deployment and a successful observed invocation are still required for activation. Four-condition budget and account-isolation controls remain.

## Database reconciliation
A read-only check of the connected nivora project during recovery found public Pace records, shared request limits, thesis queue and source guards installed (remote versions `20261107142000`, `20261107143506`, `20261107143633`, `20261107151801`). Support workflow columns and transaction ledger were also present. Local migration filenames may have different versions; compare SQL content/schema before applying anything. Do not blindly rerun the entire migrations folder.

The new UI, cache and receipt changes in this pass introduce no new tables or schema migrations. Existing operational features still require the matching recovered migrations. Database guard fixtures passing does not prove a running production job. A future release should verify credentials, RLS, feed permissions and scheduler logs using the target environment.
