# Analyst target freshness correction

This source-only change reduces one avoidable source of target lag. It does not establish that AURYN's Bear/Base/Bull targets match DCA Optimizer, and it does not create missing analyst bounds.

## Change

With the existing shared market-data guard enabled, a permitted refresh of EODHD fundamentals now bypasses Next.js's additional stale-while-revalidate fetch cache. Previously, the first request after the application cache expired could receive an old framework-cached response and publish it into the application/shared cache for another full TTL.

The fix covers both the version 1.1 and legacy fundamentals endpoints. It leaves the existing six-hour fundamentals TTL, local request deduplication, shared cache, endpoint cost, quota checks, daily budgets and access/backoff behavior intact. It does not add a provider, change a target value or make extra scheduled requests. Unguarded deployments retain their existing framework caching behavior, rather than removing their cross-worker cache without a shared spending guard. No deployment setting was changed or verified remotely.

This is not a universal freshness guarantee: existing application/shared caches can still contain older observations, and a worker's local cache does not receive the shared entry's remaining lifetime. Nor does a fresh provider response prove that every analyst target was recently revised. These separate issues are not relabeled as solved.

## Matching evidence and blocker

The saved independent UI observations from November 13 used the same November 12 settled close for each pair:

- IREN: AURYN and DCA consensus both $56.69; AURYN low/high remain absent.
- NBIS: AURYN consensus $278.05 versus DCA $271.20, a $6.85 or 2.53% difference in target price. At the shared $128.64 close, that is a 5.32-percentage-point difference in upside. AURYN low/high remain absent.

No numerical tolerance was chosen to make these examples pass. No new live provider data was fetched for this correction, so these remain the earlier dated observations, not post-fix validation. The 1,000-symbol evidence audit still has 998 missing pairs, two partial pairs and no complete comparable pairs.

The existing EODHD source documents a consensus average and a consensus-only fallback, not a low/high range or per-target revision dates. Its whole-record update date cannot identify the target vintage. Twelve Data's range endpoint requires 75 credits per symbol and verified entitlement/allowance; the existing request budget is below that cost, and the saved quota response did not establish a usable allowance. No budget was raised and no endpoint probe or bulk request was made. DCA's restrictions rule out using bulk extraction to populate a competing dataset.

Consequently, no verified permitted no-purchase route was found to supply the missing bounds or guarantee that NBIS uses the same analyst population and vintage as DCA. Copying screen values, synthesizing bounds or selecting whichever field happens to match was not used.

## Sources

- [Next.js 15 time-based caching](https://nextjs.org/docs/15/app/guides/caching): expired time-based fetch cache entries can be returned while background revalidation runs.
- [EODHD fundamentals glossary](https://eodhd.com/financial-academy/financial-faq/fundamentals-glossary-common-stock): documented average target and recommendation fields.
- [EODHD fundamentals API](https://eodhd.com/financial-apis/stock-etfs-fundamental-data-feeds): record update metadata and current endpoint structure.
- [Twelve Data price targets](https://twelvedata.com/docs/analysis/price-target): target range response, plan and credit requirements.
- [DCA terms](https://dcaoptimizer.com/terms): source-use restrictions.

## Verification

The regression suite executes the real TypeScript EODHD, shared-cache and normalization graph, replacing only external HTTP. Its fake HTTP boundary models the documented framework stale-response behavior. Three target-refresh assertions failed against the unchanged source and all six checks passed after this correction. The checks cover both endpoint versions, same-worker deduplication, cross-worker shared-cache reuse, daily-budget refusal, failed-refresh retry and preservation of unguarded cache policy.

Final `npm run verify` passed lint, formatting, all 1,401 tests, typecheck and the production build. `npm run test:api` also passed its compiled-route fixture checks and production-file isolation check. The build retained its existing non-blocking Next ESLint-plugin warning.

Detailed verification logs are under `verification/target-freshness-20261113/`. These are controlled source/fixture checks, not live provider, deployed application or investment-accuracy tests. No Research grid, component or styling file was changed by this correction.
