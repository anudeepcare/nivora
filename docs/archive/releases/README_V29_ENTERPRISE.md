# NIVORA V29 — Enterprise Intelligence Foundation

## Investor vs Pro is now visibly different
Investor:
- Decision + thesis
- price/performance context
- fundamentals, catalysts, news, earnings
- standard options view

Pro adds:
- dark Pro Workspace cockpit
- engine/model version
- data-quality score and source coverage
- model confidence
- contradiction count
- decision factor attribution
- audit ID / reproducible decision fingerprint
- evidence freshness/status
- full Technical Lab
- full Options Lab
- shadow-validation status

## Validation infrastructure
V29 includes a server-side validation snapshot endpoint and Supabase migration:
`supabase/migrations/20260829_nivora_validation.sql`

To persist validation snapshots:
1. Run the migration in the NIVORA Supabase project.
2. Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel server environment variables.
3. Never expose the service-role key with a `NEXT_PUBLIC_` prefix.

Snapshots store the model version, symbol, timestamp, price, action, score, confidence,
factor scores, levels and evidence metadata. Forward-return columns are included for
1D/5D/20D/60D/120D calibration jobs.

This is the foundation for real measured validation. It does NOT fabricate historical
accuracy statistics before enough observations have been collected and evaluated.

## Enterprise design
- deterministic factor engine remains separate from AI explanation
- model version exposed
- decision fingerprint exposed
- source/evidence coverage visible
- server-side shared caching retained
- options expiration-aware caching retained
- validation writes use server credentials only
