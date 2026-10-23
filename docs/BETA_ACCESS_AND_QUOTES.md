# Beta access, quote refresh and comparison — 23 October 2026

This is the complete source package. It has not been pushed, deployed, or migrated into the live database. Billing is not implemented or connected; no payment, cancellation portal, or Stripe test checkout is available. The planned Pro price is $2.99/month. Do not advertise working subscriptions from this build.

## Price refresh

Research performs a quote-only check every 60 seconds while visible, independently of stream-health state. Returning to the page also checks; repeated visibility/focus events within five seconds do not burst requests. Checks do not reload the page. A previously healthy stream could otherwise leave a frozen true flag and suppress polling after updates stopped. Regression tests cover this failure mode and cleanup.

EODHD remains primary. During scheduled US pre/regular/post hours (04:00–20:00 New York weekdays), an observation over three minutes old triggers a bounded Twelve Data backup check. Crypto uses the same three-minute freshness preference continuously. Closed-market observations have a longer tolerance. The schedule is not an exchange holiday calendar. Existing shared budgets and per-provider caches still apply. A current primary avoids a second request; an unavailable or older backup never replaces a newer retained observation. There is no invented fresh timestamp or price.

A sixty-second check is not a promise of real-time exchange data: vendor entitlement, exchange delay, cache windows, throttling and outages can still return the same observation. Timestamp and stale status describe the observation, not the request time. Actual production quote freshness after deployment remains to be checked with the configured accounts.

## Thirty-stock comparison

See `verification/dca-reference-30.json` and `verification/dca-comparison-30.json`. The sample was declared before calculating results, spans thirty stocks, and is not statistically random. Signed-in DCA Optimizer pages were observed on October 23 for the October 22 settled close. Current production monthly-v5 was not changed or retuned.

- Confirmed September: 28 of 30 match. TSLA: AURYN 2×, reference 1×. NVO: AURYN 2×, reference 3×.
- Forming October: 30 of 30 match.
- IREN: 2× confirmed / 4× forming. NBIS: 1× / 1×. CRWV: 1× / 4×. APP: 4× / 4×.

Agreement is not accuracy, return prediction, or evidence of superiority. Some names overlap earlier calibration. Older reference months still differ, and universal or future parity is not established. The prior independent eight-stock historical evaluation remains in `DCA_FROZEN_VALIDATION.md`; it did not establish outperformance.

The reference Bear/Consensus/Bull card explicitly describes third-party analyst targets. Compare it to AURYN's analyst-target section, not to calculated valuation or historical price-risk scenarios. Those answer different questions. This audit does not establish all-stock numerical valuation parity or prove all inputs correct. Do not substitute a consensus target for independently calculated fair value.

To reproduce with your licensed daily OHLC input, run `node --experimental-strip-types scripts/compare-dca-reference.mjs /absolute/path/to/private-history.json`. Input is a map of symbol to daily candles. Full licensed histories are intentionally not bundled.

## Activate owner-controlled beta

1. Test all pending migrations in your staging Supabase project first. The new migration is `supabase/migrations/20261023130718_beta_access.sql`; it requires the existing workspace/watchlist schema.
2. Set server-only `SUPABASE_SERVICE_ROLE_KEY` and `AURYN_OWNER_USER_ID` to your exact Supabase Auth user UUID. Never use a public `NEXT_PUBLIC_` variable for either. Profile metadata does not grant owner access.
3. Set `AURYN_ACCESS_ENABLED=true`. Keep `AURYN_EXTERNAL_DATA_LICENSED=false` until your vendor contracts permit external display. Redeploy after changing environment variables.
4. As owner, open Settings → Owner controls, choose Private or Beta mode and **save**. This binds the database watchlist enforcement to the configured owner. Other accounts fail closed until settings are saved.
5. Friends must first register. Grant an existing exact email an expiry (up to a year) and optional group. Revoke individuals or a whole group at any time. Revoke affects complimentary grants, not an independently valid paid-through record. Access is rechecked on requests and periodically in the visible UI.
6. Private mode admits invited/paid accounts and owner; Beta admits Free accounts too. Without external display rights, other accounts receive a clearly labelled read-only synthetic workspace and vendor endpoints reject real-data requests. Sample searches are restricted to the fixture universe; they are not full-market coverage. Owner retains real data.
7. Settings → Plan & access shows quotas, features and owner Free/Pro previews. Preview does not change subscription records. Its monthly research reservations use the owner's testing usage; the actual database owner remains exempt from watchlist caps. Use a separate beta test account to validate real watchlist limits.

Owner controls support Free/Pro/Beta-only/off feature rules and numeric quotas. Distinct research tickers count once per UTC calendar month; repeated company opens do not consume another slot. AI generation has a separate monthly allowance and existing daily cost guard. UI gates are backed by authenticated routes and projected research payloads. Feature calculations share some necessary evidence inputs; this is not field-by-field data licensing. Technical access includes up to 756 daily bars for monthly warm-up, even without the long-chart-history feature.

Watchlist caps are enforced by a private database trigger, including direct authenticated writes. Downgrades preserve saved records but prevent further additions over the cap. Grants/config/usage/audit/subscription tables deny ordinary client access. Service-role functions reserve quota atomically and audit owner mutations. No general-purpose public admin RPC or subscription writer is installed.

Default `AURYN_ACCESS_ENABLED=false` preserves personal-mode behavior. To turn enforcement off after testing, save owner settings while that flag is false too; database triggers cannot read server environment variables. Existing grants remain recorded, not deleted. No live database writes were made for this package.

## Billing blocker

The Vercel CLI in this environment was not authenticated to provision the Stripe integration. No Stripe connector, test credentials, product/price, signed webhook or customer portal was available. A real Stripe account connection is needed before implementing and testing checkout, cancellation, idempotent webhook processing and paid-through access. No mock checkout or simulated success has been shipped. Paid subscriptions are therefore a remaining launch item, not a completed feature.

## Acceptance limits

Automated checks use local fixtures and local Postgres/PGlite. They do not certify a physical installed iPhone PWA, a live payment, OAuth consent, external display licenses, every ticker, or production feed latency. This update does not modify PWA viewport/safe-area geometry. Retain the last accepted installed-device baseline and test keyboard/open/resume/navigation on the preview before promotion.
