# Inactive provider-only coverage runner

This is an orchestration harness, NOT a live CLI, production job, deployed endpoint or completed 500-company report. `scripts/provider-coverage-runner.mjs` imports only Node crypto. It cannot read credentials, make a network request, access account data or persist a file by itself. All tests use synthetic identities and fake server dependencies. `liveVerified` is always false.

## Scope and estimate

An explicitly supplied manifest contains 1–500 unique US provider tickers, an owner/run identifier, directory capture time and bounded daily-history window. Its provenance label must be `authorized-provider-directory`; this is a declaration, not proof. Build the actual manifest from authorized EODHD/SentiSense directories, never external comparison captures. The manifest hash binds identity, ticker order and window to resumptions.

Three fixed checks per ticker: EODHD General/profile (10 estimated weighted credits), EODHD adjusted daily history (1), SentiSense analyst consensus (1 request). For 500: 1,000 EOD requests / 5,500 credits and 500 SentiSense requests, excluding discovery, quota checks and retries (this runner never retries). This is not all paid endpoints or business eligibility, price correctness, investment performance, competitor parity or a live integration test. The General check is security/profile coverage, not a full financial-statement audit.

Official plan documentation reviewed November 18, 2026: [EODHD limits](https://eodhd.com/financial-apis/api-limits), [EODHD pricing](https://eodhd.com/pricing/), [SentiSense API](https://sentisense.ai/docs/api/). Current Pro documentation says no monthly cap and 300 requests/minute; actual account/keys and current usage still need verification. The app's lower shared budget and route throttles remain authoritative. Unlimited monthly quota is not permission for unthrottled calls.

## Trusted dependency contract required before any execution

- `authorize(plan)` verifies the session and exact owner, licensed personal/internal use, source entitlements, required profile/history/analyst features, long-history access and audit scope. It returns `{userId, allowed}`. A caller-provided flag is not authentication.
- `quota(plan)` reads trusted account and app-budget state. `{verified, verifiedAt, eodhdRemaining, sentisenseRemaining}` must be finite integer allowances; verifiedAt must be at most 60 seconds old and not future. SentiSense's remaining allowance here is a deliberately allocated finite audit ceiling, not an invented monthly cap. The runner retains 10% of this allowance; production global reserves can be stricter.
- `reserve(task)` atomically enforces provider-weighted daily credits, all-key rate limits, user allowance, pause state and authorization before EVERY acquisition. It must recheck current quotas, not trust the initial snapshot. Return true only when allowed; false stops without reading. One reserve per actual attempted task; shared underlying adapters must not double-charge the same reservation. The production binder must reconcile this with existing EOD shared guard rather than duplicating budgets.
- `read(task)` is a fixed server-owned adapter with bounded timeout/body, safe cache handling and NO fallback/hidden fanout. At most one dataset request. Validate raw provider identity, adjusted-close basis, dates, counts, target low/mean/high ordering and provider status. Return only `{status, providerTicker, observedAt, currency, recordCount}`. Null dates/currency remain explicitly unknown. This harness does not itself authenticate or validate raw financial payloads.
- `checkpoint(report)` writes atomically to owner-scoped trusted storage or throws. Production binder must hold an exclusive run lease and enforce compare-and-swap revisions throughout: concurrent callers must not overwrite each other. Restore only trusted server records, never client JSON. The hash binds content but is not a signature or an authorization check.
- `now()` is a trusted UTC clock.

These dependencies are intentionally **not implemented/bound**. No fake quota flag can activate an existing route because no such route or executable transport is supplied. Secure provisioning, owner storage/lease, quota verification and independent review remain prerequisites. The user's Mac is unnecessary when an authorized cloud/server binder exists.

## Execution and crash behavior

Concurrency is exactly one, avoiding CPU/load spikes. The harness checkpoints before the first reserve and before every read, marking the row in-flight. Completed rows retain their original testedAt; in-flight rows from an interrupted process become unknown-outcome and are not repeated automatically. A checkpoint failure before read aborts; a crash after reserve may consume allowance without data and must not be refunded speculatively. Auth/permission/rate errors stop further tasks. Thrown provider errors produce sanitized unknown-outcome without copying raw exception messages or secrets.

Normal budget exhaustion leaves remaining rows not-tested, never no-coverage. Owner/run/manifest changes reject resume. Terminal result statuses include available, partial, no-coverage, invalid-evidence and unavailable; `complete` means every requested check has a terminal result, NOT that all datasets work. Unknown outcomes require reviewed reconciliation or a separately budgeted new run. Resume does not infer a provider response from a network timeout.

Reports include only closed status/identity/date/currency/count evidence and cost estimates, not raw provider payloads, keys, scores or narratives. Checkpoints are emitted per dataset rather than only every 25 tickers to minimize ambiguous paid work. A real binder may batch atomic storage operations only without losing pre-acquisition durability.

## Activation gate

First verify actual plan/remaining quota and current app reserves without exporting secrets. Review/implement the trusted binder above, then authorize a five-ticker smoke test, followed by checkpointed batches of 25. Stop on 401/403/402/429, unverified budget or identity mismatch; do not widen privileges, add subscriptions, use alternate providers, or evade application throttles. No live calls have been made for this implementation. Existing `audit-market-coverage.mjs` is NOT used: its legacy research/Pace/fallback path is outside this scope.
