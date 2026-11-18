# Opt-in daily bulk radar: source candidate, not activated

Default path is unchanged. Enable only after an operator has verified the account's
EOD and split bulk entitlements, tested the migration, configured shared EOD protection,
and accepted actual billing. Required source configuration:
- AURYN_BULK_RADAR_ENABLED=true (absent/false keeps existing per-symbol path)
- EODHD_BULK_RADAR_ENTITLEMENT=verified (operator assertion, not automated proof)
- AURYN_SHARED_MARKET_GUARD=true; existing `20261019140303_shared_market_guard.sql` applied; configured `EODHD_DAILY_BUDGET` and the existing shared per-user market allowance remain enforced
- new `20261118102559_auryn_bulk_radar_state.sql` and `20261118110617_auryn_bulk_radar_source_cooldown.sql`, applied separately by an authorized operator
No migration or provider request was made during implementation.

Official contract: https://eodhd.com/financial-apis/bulk-api-eod-splits-dividends .
Each whole-exchange daily dataset costs100units. EOD+splits costs200units, before
cold-history/bootstrap costs. No symbols query is sent: adding500symbols would cost
600units per request, and action feeds ignore that filter. Existing shared EOD account
usage, budget reservation, distributed leases and credential-scoped cache are used.
No paid add-on or subscription is purchased. A denial/invalid response is cached as
unavailable for a one-hour negative cache interval; it does not trigger500per-symbol fallbacks.

The user's universe comes exclusively from authenticated holdings/watchlist queries.
Shared tables/cache contain only public market observations, keyed by hashed provider
credential and symbol; user identity, portfolio quantities and memberships are not
written into public-data cache. Read responses expose only the authorized selected
universe. Key rotation creates a separate cache/snapshot scope.

Each snapshot atomically stores rawOHLCV and dated split ratios with policy/revision.
Normalized history is rebuilt from raw data; only pre-split bars are price-adjusted,
volume remains unchanged per existing radar policy. Adjusted_close (which includes
dividends) is never mixed into this price-only history. Wrong dates/duplicates or bad
split ratios fail closed. Full reseed is required on a new split, a missing session,
missing ticker, or after30days. Revised/removed past actions are replaced on reseed,
not compounded. Prior history remains visible, marked pending/stale, on failure.
Daily appends preserve original history/split acquisition dates, not pretend all past
history was re-fetched. Historical provider corrections can precede the replay scope;
there is no revision watermark and no claim of point-in-time or fully restated history.

Continuations update at most50cached names and bootstrap at most2instruments. A first
500-name account therefore remains partial until bounded continuations complete.
Reads hydrate50histories per page without provider requests. Global daily data is
validated/compacted into a JSON string envelope bounded to4MiB before the existing5MiB JSONB cache publisher (which otherwise expands numeric arrays); Too-large or malformed
responses are unavailable, never truncated into claimed complete coverage. Holidays
may return older dates; these are not relabeled as requested sessions. Empty action
responses are attributed to the requested query, not independent completeness proof.

This remains a resumable page-open daily workflow, not a newly deployed autonomous
scheduler. Route timeout/cancellation stops follow-on work; shared RPC/cache work
already started can finish. No provider/browser performance claim has been measured.
Rollback: turn the opt-in flag off; legacy per-symbol cache path remains unchanged.
Do not delete raw state or user holdings as rollback. SQL migration has no production
activation and no automatic pruning job. See BULK_RADAR_STATE.md for storage safety.

Successful daily data caches for24hours; unavailable/invalid/denied data for1hour.
Negative cache expiry permits a later bounded retry without a tight quota loop. Bulk
publication must acknowledge success; a missing/expired lease cannot silently return
an uncached acquisition as a success. A50000row actual SQL publisher regression proves
the compact-string envelope is stored and a second acquisition spends no additional
quota. These are synthetic SQL tests, not measured hosted throughput.

Source outages persist a credential-scoped, requested-session cooldown. GET and a
remounted page read this pause without provider work; POST during the pause does
not spend another market allowance or start a source request. This metadata contains
no user holdings or membership. The additional cooldown migration must be applied
before enabling bulk mode; missing storage fails closed. Source recovery is retried
after expiry, not silently inferred from stale histories.

Before publishing any rebuilt history, every known daily split must match its exact
effective date and numerically equivalent historical split ratio. Missing or
contradictory action evidence leaves the previous generation stale, never READY.
