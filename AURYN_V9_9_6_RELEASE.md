# AURYN V9.9.6 — Autonomous Queue Runner + Evidence Completion Gate

- Adds bounded GitHub queue pump every 15 minutes, max 4 sequential worker calls per invocation.
- Supabase remains the durable queue and provider-budget authority.
- Adds `/api/validation/finalize`, which refuses PASS unless all expected jobs are terminal and every expected symbol has complete Shadow CIO evidence.
- Queue pump invokes watchdog and finalizer after each bounded drain.
- GitHub concurrency prevents overlapping queue pumps.
- Vercel cron remains disabled: `vercel.json` is `{}`.
- No CIO formula, threshold, universe, UX, theme, or V9.9.5 autonomous-research changes.
- Requires GitHub repository secrets `AURYN_BASE_URL` and `CRON_SECRET`.
