# NIVORA V48 — Thesis First

V48 replaces the short-term price-zone-first experience with a durable investor architecture.

### Main changes
- New `lib/nivora-investor.ts` separates Company / Thesis / Opportunity scores.
- New `InvestorDecisionHero.tsx` is the primary Simple UX.
- Daily price changes no longer directly define long-term conviction.
- Removed the legacy price-plan hero from the primary experience.
- Simple mode no longer leads with support/resistance chips.
- Thesis tab now explains durable drivers, thesis breakers, factors, verified analyst evidence and model honesty.
- No fabricated NIVORA fair value from current-price-derived technical levels.
- Default horizon is **Investment (6–18 months)**; Near term and Long term remain context views.
- Today is a material thesis-change feed.
- Discover uses a new thesis-first persistent investment scanner, not the technical scanner.
- New Supabase investment-scan migration and background investment scanner.
- Market workflow refreshes both technical radar and thesis-first investment evidence.

### Required setup
Run:
`supabase/migrations/20260830_nivora_v48_investment_engine.sql`

GitHub Production environment needs:
- `TWELVE_DATA_API_KEY`
- `FINNHUB_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional variables:
- `NIVORA_INVESTMENT_SCAN_BATCH_SIZE` (default 12)
- `NIVORA_INVESTMENT_SCAN_PAUSE_SECONDS` (default 1.2)
- `NIVORA_MIN_MARKET_CAP_M` (default 750)

### Important
V48 is decision-support research. It is not a promise of returns and does not execute trades. Accuracy must be established from frozen forward outcomes.
