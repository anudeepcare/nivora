# Private analyst-target preview, November 14, 2026

This is a separate complete source bundle. The previous scenario/Pace release remains unchanged. No provider subscription was cancelled or upgraded, and no code, database migration or configuration was deployed.

## What the new source supports

An optional SentiSense target collection can supply the analyst low, consensus and high together, with their own provider refresh timestamp and analyst count. The collection is separate from EODHD financial evidence. It does not fill missing bounds around another provider's mean, replace quotes or price history, reinterpret rating placeholders as real zeros, or change the Pace model.

The feature is disabled by default and restricted to the authenticated owner in a nonproduction preview. It requires explicit configuration and an unexpired temporary-key cutoff. Production and other accounts are excluded. Failed, missing, stale, incorrectly ordered, mismatched-share-class or unsupported-currency observations fall back to existing research.

The existing target layout remains. Target provenance is shown independently of the EODHD recommendation distribution. Visit comparisons do not treat a switch between data providers as an analyst revision.

## Actual upstream checks

Private tests used an authorized temporary key. Eight selected stocks returned a complete ordered low/mean/high band and matching USD listing profiles: IREN, NBIS, APP, AAPL, NVDA, TSLA, BABA and BRK.B. SPY returned a specific ETF/not-applicable response. This is a small selected sample, not universe-wide validation.

IREN and NBIS's low, displayed mean, high and analyst count numerically match the previously saved reference-service observations. Those captures used different dates and do not include a known individual target revision date. **Same-date reference parity is not established.** APP had a valid full band, but no equivalent saved reference triple was available for this comparison.

The feed's updatedAt records its dataset refresh, not an individual analyst revision. Its currentPrice and upsidePercent belong to that snapshot, not the latest settled market close. AURYN continues using its own dated settled close. The same provider's listing profile supplies explicit currency and exchange evidence; the exact returned share class must match. [Analyst endpoint](https://sentisense.ai/docs/api/analyst-ratings/) · [Listing profile](https://sentisense.ai/docs/api/stocks/)

## Free access and limitations

A permanent Free account currently allows 1,000 requests/month and 30/minute. The temporary key allows 10/minute, 500/day and 1,000 total, expires after 72 hours, and can be kept on the owner's free account within 14 days. It is not a promise of unchanged pricing forever. No account was created or key kept for the user by this task. [Plans](https://sentisense.ai/docs/api/) · [Temporary-key documentation](https://sentisense.ai/docs/api/keys/)

This adapter deliberately limits upstream requests more conservatively: one every 7.2 seconds in its queue and at most 24 per rolling 24-hour budget, with 24-hour per-key caches. A cold stock lookup uses two requests. Shared server-side guards prevent other preview instances bypassing the budget; local development is an explicitly opted-in, single-process test. Guard failures preserve the old research. Existing guard tables must already be installed; no migration is applied here.

Current terms v1.12 permit internal research and qualifying integrations subject to restrictions. Published v1.13 becomes effective December 1, 2026. It expressly permits target display alongside an app's own analysis in genuinely unmonetized apps, including a free beta, but displayed provider values in paid offerings, their free tiers, or ad/affiliate-funded apps require the applicable Data License/Enterprise rights. Ordinary Pro capacity does not grant that display license. Do not infer commercial rights merely from a working free key. [Current terms](https://sentisense.ai/agreement/archive/API-Terms-of-Service-v1.12.pdf) · [Published December terms](https://sentisense.ai/agreement/api-terms/) · [License scope](https://sentisense.ai/agreement/data-license/)

## Activation boundary

The source is not enabled on the hosted app. For a separately authorized private preview, keep all existing provider configuration, supply the key only through an approved server secret store, and configure the preview-only flags documented in the source. Never put the key or its keep link in source control or client code. Keeping a key does not automatically remove this implementation's explicit temporary expiry or authorize production.

The temporary test key created in this task expires November 17, 2026 at 02:06:05 UTC. Its private keep link is excluded from this bundle. Provider renewal/cancellation decisions remain separate; this target-only test does not establish that SentiSense can replace EODHD or Twelve Data's other datasets.

## Verification boundaries

Full verification passed: 1,458/1,458 tests, lint, formatting, typecheck, production build and the compiled API suite. The new compiled-route contract failed on the prior build as expected and passed on this build. Independent focused review passed 48/48 checks with no remaining blockers. Machine-readable results are in verification/sentisense-preview-20261114. They distinguish direct live provider checks, normalization of captured payloads, actual provider-client transport with a bounded local test ledger, controlled route tests, and full repository checks. This source was not deployed or browser-tested as a new hosted build. No production database was used for the new guard tests.

The previous release's scenario date fixes and Pace preprocessing correction are retained. All 12 active classifier, model and runtime-helper source files are byte-identical. The generated dependency fingerprint changes because the shared Research type adds the optional analyst-target field; no Pace rule or weight changes. A fresh replay of the same archived 1,000 inputs returned the unchanged 971 matches, 28 disagreements and one input error. This is not fresh-market validation. No new Pace refit or claim of exact matching is made. Raw provider response bodies, credentials, keep links, dependencies and build output are excluded from the source archive.
