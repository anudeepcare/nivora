# Recovery, public mobile navigation and Business charts — November 6, 2026

Changes:
- Public mobile navigation now uses dark, visible controls on the light header and contains Product, Product guide, Pricing, Help, Sign in and Get started links.
- Business financial charts use horizontal metric controls, bounded chart height and value gridlines. Pointer inspection maps through the SVG screen transform so centered charts select the correct period.
- Research heading spells out AURYN Accumulation Pace; stage meanings are unchanged.
- Portfolio history no longer stops after ten missing holdings. Sequential cached requests stop on authentication, entitlement or rate-limit responses. Partial coverage, historical subtotal and latest quoted value for the same included holdings appear above the chart. Cash, managed balances and margin remain excluded; missing historical values are never invented or rescaled to match the account total.
- Password reset requires a signed, short-lived recovery proof bound to the verified user and session. A regular signed-in session cannot enable password editing. The form shows the verified email. Updating the password uses the authenticated Supabase client on the server, checks request origin and clears recovery proof after success. Invalid proof is cleared. Recovery redirects stay on reset until completion.
- Hosted deployments enforce access policy even if the feature flag is absent. Vercel access-enabled and owner configuration now target production and preview; these changes apply on the next deployment. No subscription or user grants were changed.

Validation: production build including TypeScript passed. All 1,076 regression tests passed; an additional recovery-endpoint test passed for valid proof, missing proof, wrong account and cross-origin requests. Focused auth UI tests verify mismatched passwords, verification failure, visible account identity and success without automatic dashboard navigation.

Deployment: replace source in the existing preprod checkout, preserve local environment files, commit/push preprod, then promote through a pull request to main. No extra branch was created and no code deployment was performed here.

Required live acceptance: request a fresh reset email after deployment, open it in a separate browser and confirm the displayed account, change the password and sign in with it. Real email delivery, actual password changes and native iPhone behavior were not exercised. Supabase Reset Password email template must use the recovery confirmation handler for cross-browser support:

{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery

SiteURL must be the canonical app origin. Legacy PKCE links require the requesting browser. Existing consumed links cannot be reused. Supabase template configuration was not changed here.

The chart remains a current-quantity historical-price model, not account performance. Full account performance requires dated holdings/trades, cash flows and balances; those must not be inferred from today's holdings. Live account-specific $950K versus $400K reconciliation still requires complete data coverage.
