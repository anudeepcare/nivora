# NIVORA V32.1 — Institutional Intelligence + Stabilization

## Fixed
- TypeScript nullable `derivatives` / `valuation` comparisons that could fail Vercel builds.
- Full Thesis / Why / Explore Analysis use the shared research-scroll path from V32.
- Institutional quick signal no longer simply says `Unavailable` when the verified filing feed is absent but NIVORA still has a price/volume accumulation proxy.

## Institutional Intelligence
NIVORA now distinguishes three different things:
1. **Reported institutional direction** — delayed holdings/filing evidence. UI says `Reported increasing`, `Reported reducing`, or `Reported mixed`.
2. **Reported insider transactions** — buys/sells from the connected data source when available.
3. **Daily accumulation proxy** — price/volume evidence. This is explicitly NOT described as named institutional buying.

The server endpoint first uses direct Finnhub ownership rows when the current entitlement supplies them. If the provider does not, it falls back to NIVORA's Supabase SEC Form 13F cache.

## Free SEC 13F pipeline
- Migration: `supabase/migrations/20260829_nivora_v32_1_institutional.sql`
- Sync: `scripts/sync_sec_13f.py`
- GitHub Action: `.github/workflows/sec-13f-sync.yml`
- The script discovers the latest two official SEC Form 13F structured-data ZIPs automatically, compares manager holdings quarter-over-quarter, aggregates results by ticker, and stores the snapshots in Supabase.
- Set GitHub secrets: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SEC_USER_AGENT`.
- `SEC_USER_AGENT` should identify NIVORA and provide a real contact email, per SEC automated-access guidance.

## Interpretation language
Do not say `institutions are buying today` from Form 13F.
Use:
- `Reported increasing`
- `Reported reducing`
- `Reported mixed`
- `Today's accumulation proxy: constructive/accumulating/distribution risk`

This preserves the fast beginner UX without overstating what delayed public filings can prove.
