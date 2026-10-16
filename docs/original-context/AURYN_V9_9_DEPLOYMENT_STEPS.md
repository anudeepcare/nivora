# AURYN V9.9 — Exact Deployment Steps

## A. Supabase
1. Open Supabase → SQL Editor.
2. Paste and run `supabase/migrations/20260912090000_auryn_v99_validation_lab.sql`.
3. Run the three verification queries in `AURYN_V9_9_SUPABASE_SETUP.md`.
4. Confirm the validation universe has rows.

## B. Vercel environment variables
In Vercel → AURYN project → Settings → Environment Variables, confirm these exist for **Production**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TWELVE_DATA_API_KEY`
- `CRON_SECRET`

Keep any existing Alpaca/Finnhub/SEC variables unchanged.

Create `CRON_SECRET` as a long random string if it does not exist. Do not expose it with a `NEXT_PUBLIC_` prefix.

## C. Deploy
Deploy this ZIP/repository to the same Vercel project.

`vercel.json` installs the autonomous schedules. Cron schedules are UTC, and AURYN intentionally schedules both CDT and CST candidates; the route itself checks America/Chicago time and skips the incorrect daylight-saving candidate.

## D. One-time smoke test
After deployment, replace `YOUR_DOMAIN` and `YOUR_CRON_SECRET` locally:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET"   "https://YOUR_DOMAIN/api/validation/orchestrate?kind=DAILY_CLOSE&force=1"
```

Expected JSON includes:
- `"status":"queued"`
- `symbols` > 0
- `batches` > 0
- `backgroundBudgetPerMinute: 42`

Then invoke one worker:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET"   "https://YOUR_DOMAIN/api/validation/worker"
```

Expected: `done`, `partial`, `deferred`, or `idle`. `deferred` is valid when the background provider budget is temporarily consumed.

Then check:

```sql
select status,count(*) from public.auryn_validation_jobs group by status;
select * from public.auryn_shadow_snapshots order by created_at desc limit 10;
```

## E. Confirm autonomous operation
Within the next scheduled cycle, verify:

```sql
select * from public.auryn_validation_runs order by created_at desc limit 20;
select * from public.auryn_model_health order by created_at desc limit 10;
select status,count(*) from public.auryn_shadow_outcomes group by status;
```

After this, no daily manual action is required.

## What runs automatically
- Premarket validation orchestration
- Post-close Shadow CIO capture
- After-hours session validation
- Nightly validation
- Worker every 5 minutes
- Watchdog every 15 minutes
- Outcome evaluator hourly
- Model-health aggregation nightly
- Weekly validation run

## Provider protection
The external provider ceiling is 55 calls/minute.
V9.9 background workers are hard-capped at 42 calls/minute by a database-backed atomic token bucket, preserving at least 13 calls/minute of nominal headroom for interactive users.

## Human-only action
A future challenger may become `ELIGIBLE` for promotion, but V9.9 never changes the production champion automatically.
