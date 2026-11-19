# ETF screener

Official contracts checked 2026-11-18:
- https://sentisense.ai/docs/api/screener/
- https://raw.githubusercontent.com/SentiSenseApp/sentisense-node/main/src/types.ts (EtfScreenerRow)

Screener → ETF screener is lazy and only submits on Run. One bounded numeric filter (AUM USD, expense ratio percentage points, holdings count, or weight coverage percent), AND/scope/custom URLs unsupported, maximum100 results with local25-row pages. This is intentionally a supported subset, not the entire live field catalog. `EXPENSE_RATIO` in the screener is percentage points (0.09 =0.09%), unlike the separate ETF quote endpoint's fraction. No guessed scaling. Per-row lastUpdated seconds is snapshot build time, not quote time; ETF screens lack priceAsOf. Exact quote age unknown. No options/sentiment/analyst fields exposed.

DTO preserves null/zero, partial composition and provider matched count, whitelists only supported facts; duplicate ticker fails closed. Unsupported future snapshot timestamps become unknown. No preview boolean is invented: documentation has a flat matched/limit/results response; count truncation is visible.

Signed-in non-sample account + overview and advanced features required. User6/min and provider20/min ceilings plus existing research allowance. POST body streamed max2000 bytes; upstream fixed HTTPS host, redirects rejected,12-second timeout, streamed2MiB response bound. No new env/migration; existing key/token. No automatic polling or requests on typing; no extra server cache that might suggest fresh quotes. Neutral errors do not leak provider body/key.

Test-first DTO/unit/validation, executable route denial and actual mocked request/oversize handling, source UI interactions. No live provider entitlement, production deployment or browser pixel verification.
