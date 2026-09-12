# AURYN V9.9.4 — Actual-Schema Validation Universe

Uses the verified `public.nivora_market_universe` schema:
`symbol, name, exchange, instrument_type, currency, country, active, updated_at`.

Validation loader selects only:
`symbol,name,exchange,instrument_type,currency,country`

Behavior:
- paged reads (1,000 rows/page)
- active rows only
- USD / US common-equity eligibility
- warrants, units, rights and non-common instruments excluded
- deterministic exchange-stratified 300-name cohort
- V9.9.2 immutable run lifecycle retained
- `vercel.json` is intentionally `{}` so Vercel Hobby deployment is never blocked by cron schedules
- scheduling remains external (GitHub Actions), not Vercel Cron
- no UX or CIO formula/threshold changes
