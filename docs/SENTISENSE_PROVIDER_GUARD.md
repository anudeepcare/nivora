# Shared SentiSense request protection and rollout

## What changes by default

All runtime SentiSense adapters must use the shared transport. Existing per-route, user, access, sample, cache and adapter controls remain in place. A new aggregate account-wide allowance defaults to **20 requests per minute**, using the existing distributed `auryn_request_allow` RPC in production. This does not assume a paid entitlement. Multiple API keys and rotated keys share the account bucket. A secondary SHA-256 credential bucket is also reserved. Raw API keys are never stored in rate-limit rows or logged by the guard.

The default `SENTISENSE_SHARED_GUARD=compatibility` does **not** need the new migration. It does require the application's existing shared-request-limits migration and Supabase service-role configuration, already required by production route protection. Its provider-429 cooldown is process-local, not distributed. Do not describe compatibility mode as full cross-instance cooldown protection. Shared provider limits can make some evidence temporarily unavailable rather than issuing excess requests; no queue or automatic retry is added.

## Enabling complete shared cooldown

1. Apply `supabase/migrations/20261118082354_auryn_sentisense_provider_guard.sql` through your normal reviewed migration workflow **before** switching modes. This release does not apply migrations or deploy.
2. Set server-only `SENTISENSE_SHARED_GUARD=required` on every instance sharing the account.
3. Verify server Supabase URL/service-role access and the new RPCs. A missing RPC, denied privilege, malformed result or storage failure blocks upstream calls; the guard's diagnostic instructs the operator to check configuration and apply the migration. Existing adapters may show their normal unavailable message, so deployment verification must check guard/migration status rather than assume a generic empty panel means no source coverage.
4. Keep `SENTISENSE_REQUESTS_PER_MINUTE` unset for 20/min, or explicitly configure an integer from 1 through 2,000 **only after verifying the actual provider account allowance and other account consumers**. Never derive this setting from an app subscription or a preview response. Changing this setting does not purchase or validate entitlement.
5. Keep `SENTISENSE_ACCOUNT_SCOPE` unset to use one deployment-wide provider-account bucket across all keys. If deliberately isolating genuinely different provider accounts, choose a stable non-secret scope (1–100 letters, digits, dot, underscore, colon or hyphen). All deployments using the same provider account must share both scope and backing database. Changing scope resets isolation and is not a way to evade provider limits.

Required mode reserves both hashed account and credential rows atomically with stable row-lock ordering. A lower per-window cap cannot be raised during an active window. RPCs are security-invoker and executable only by service_role; table RLS and revoked anonymous/authenticated privileges prevent public manipulation. No raw user IDs or provider credentials are persisted. Stale hash rows are small and retained; deployments rotating many credentials can administratively prune expired rows after confirming both timestamps are past. No automatic destructive cleanup is performed.

## Cooldown and limitations

Every upstream 429 updates the account and credential cooldown. Numeric or HTTP-date Retry-After is bounded to 1–86,400 seconds; absent/malformed values default to 60 seconds. An explicitly identified `quota_exceeded` response without Retry-After gets a conservative one-hour pause, not a claim that the monthly allowance resets then. Error-body inspection is bounded to 4 KB and 500 ms; provider bodies and keys are never logged. No automatic retry occurs. Existing permitted in-flight requests cannot be recalled by a newly observed 429. Required mode fails closed if cooldown persistence fails; local suppression remains as a secondary safety net.

Both modes use fixed windows, not a rolling-minute guarantee. Requests near adjacent window boundaries can form a burst; the conservative default provides headroom but does not eliminate this behavior. Provider responses and shared cooldown remain authoritative.

The guard only coordinates traffic through this application and its shared database. Other apps on the same provider account still consume provider budget. Compatibility deployment does not provide distributed cooldown; development's existing limiter can remain process-local. Cached reads may conservatively consume a permit depending on the adapter's cache placement. Limiting is protective accounting, not billing/entitlement verification, guaranteed freshness, or a latency improvement.

Tests cover fixed origins, credential non-disclosure, configuration, key rotation, independent transport instances, actual SQL reservation/cooldown/role permissions and provider-error behavior. PGlite executes the actual migration and serialized concurrent promises; it is not a hosted multi-process load test. No production database or live provider was contacted.

References: https://sentisense.ai/docs/support/quota-and-rate-limits/ and https://sentisense.ai/docs/api/ . Provider allowances are account-wide and must be checked before raising the configured cap.
