# AURYN — existing-subscription scenarios

## What this build does

The Overview no longer requires a paid analyst low/high feed to show supported cases. When a complete analyst range is supplied, it remains unchanged. Otherwise, AURYN displays a separately named qualifying cash-flow, earnings or revenue model. Available analyst consensus remains a separate observation.

The same selection rules apply to every stock. There are no ticker-specific target overrides. Existing model safeguards remain: currency/listing reconciliation, dated evidence, positive ordered outputs, business eligibility, cash-flow/dilution checks and rejection of extreme revenue-multiple projections. Historical volatility does not become a fundamental valuation fallback.

Cash-flow valuation is a present-value model; earnings/revenue cases are fiscal-period sensitivities, not analyst targets. The detailed valuation tools retain their assumptions. If the inputs cannot support any model, the screen explains the evidence gap rather than inventing three prices.

This release retains active Pace v7 and all prior fixes. Its recorded held-out Pace agreement is 205/223 (91.9%). That percentage does not describe valuation forecasting or Bear/Base/Bull agreement. These AURYN scenarios have not established 99.9% agreement with DCA Optimizer. Older comparison reports are included as historical evidence, not certification of the new model presentation.

## Deploy

1. Extract the ZIP. The extracted directory is the project root: `package.json`, `app/` and `lib/` are directly inside it. No inner AURYN folder or separate bundle is required.
2. Use Node.js 24 and run `npm ci`.
3. Retain the existing application configuration (Supabase, authentication and other enabled features). Configure `EODHD_API_KEY` and `TWELVE_DATA_API_KEY` server-side from your existing subscriptions. Never prefix provider secrets with `NEXT_PUBLIC_` or commit them.
4. Run `npm run verify`. Build command: `npm run build`. Start command for a Node host: `npm start`. On Vercel, use the Next.js preset and `.` as the root directory.
5. Deploy to preproduction first and check populated research pages with your live provider configuration.

No FMP account or new paid dataset is required by this change. No production deployment or database modification was performed. Optional public Pace publication still requires the separately documented `scripts/sql/enable-pace-v7.sql`; scenario display does not require that migration.

## Validation

1,376 tests passed, with lint, formatting, type checking and production build successful. Archive packaging checks CRC and every manifest hash.
