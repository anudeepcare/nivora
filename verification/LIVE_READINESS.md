# Live integration checks — 15 October 2026

These checks used the configuration supplied in `AURYN(5).zip` and the connected Supabase project. Requests were read-only. No user account was created, no stored holding was changed, no order was submitted/cancelled, and no broker configuration was changed. Secret values are not in this report or the source ZIP.

| Area | Observed result | Implication |
|---|---|---|
| Supabase public connection | Auth settings and REST API HTTP 200 | Supplied public project settings work |
| Anonymous access | Zero rows returned from profiles, portfolio positions, watchlists, watchlist items and alerts | Anonymous requests did not disclose private rows |
| Two-user read isolation | In read-only SQL transactions under the actual `authenticated` role, portfolio owners saw their own 30 and 13 positions respectively; all five tables returned zero foreign-owner rows | Database read policies work for the two tested identities; this is not browser login or CRUD validation |
| Existing user tables | RLS enabled and owner predicates present on the five tables | The expected schema/policies exist |
| OAuth | Only email is enabled in the actual Auth settings | Google/Apple cannot be used until the project providers are configured; UI now checks enabled capabilities |
| Alpaca Paper account | HTTP 200, ACTIVE, trading/account not blocked | Supplied Paper credentials connect successfully |
| Paper broker protections | `no_shorting=false`, `max_margin_multiplier="4"`, `suspend_trade=false` | New manual tickets remain blocked until an administrator intentionally configures long-only/cash-only protections |
| Paper market clock | Closed during check; next open reported 16 October 2026, 09:30 Eastern | No regular-session paper execution/fill test was possible or attempted |
| Alpaca IEX data | Quote endpoint HTTP 200 | Data connection works; this does not guarantee a fresh execution quote outside regular hours |
| Finnhub | AAPL quote HTTP 200 with price and timestamp | Supplied key works for the tested quote |
| Twelve Data | AAPL and BTC/USD quote HTTP 200 | Supplied key works for these quote endpoints |
| Extended-hours intraday | HTTP 403 with subscription error | Current entitlement does not cover this request; fallbacks must remain labelled and unverified execution must stay blocked |
| Manual paper audit | New audit table absent in connected database | Apply the included additive SQL before using the new lifecycle feature |
| Trusted paper administrator | No `app_metadata.role=admin` user; uploaded environment has no admin allowlist | A deployment administrator must designate the intended user in trusted server settings |
| Service-role configuration | Not present in uploaded local environment | Local privileged audit writes cannot be verified from the upload; actual Vercel value is not established by this check |

Machine-readable direct service results: `live-service-report.json`. Read-isolation SQL uses session-local identity and role settings inside `BEGIN READ ONLY … ROLLBACK`; no token or user identifier is included in the deliverable.

Existing production endpoints and GitHub schedules were checked separately in `REPOSITORY_FOLLOWUP.md`. The existing deployment's success status does not prove the rebuilt files have been deployed. Model health remains UNPROVEN until sufficient real outcomes mature; passing software tests must never manufacture validation evidence.

Vercel tools became available. Project inspection confirmed `nivora`, Next.js, Node 24.x, `getauryn.vercel.app`, and existing production deployment `dpl_27SC9VfqGTTatHBEqHCRAZoqRV6F` in READY state. The detailed deployment request under the returned `anudeeppaleru` team scope was rejected with HTTP 403 (not authorized for that scope). No authenticated Vercel CLI was available. This is an access blocker for detailed deployment/configuration verification; the rebuilt source has not been deployed. No Vercel settings were changed.

The clean-extracted, actually configured local production server rejected unauthenticated protected APIs with HTTP 401. Its AAPL research quote request returned HTTP 503 / UNAVAILABLE with executionVerified=false and researchOnly=true; therefore end-to-end market-data operation in that local runtime is not marked as passed, even though direct provider requests succeeded. See `configured-local-api-report.json`.

## Remaining acceptance work

1. Apply the included manual-order audit SQL and confirm service-role configuration in the deployment; designate the intended administrator.
2. Intentionally configure the Alpaca Paper protections and validate a reviewed simulated order through submission, fill and cancellation during the appropriate market session.
3. Enable/verify OAuth if required; test real signup, email delivery, recovery, session refresh and two-user CRUD in a preview deployment.
4. Validate the rebuilt preview/production deployment and its schedules with actual configured secrets. Resolve the Twelve Data entitlement or accept the clearly labelled fallback scope.

These are specific external configuration/acceptance requirements, not evidence of missing source files.
