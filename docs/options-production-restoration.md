# Existing production Options restoration

Source reference: verified `nivora-prod` d6b51bd; its Alpaca transport file hash was `38f7cd9bbea8688203587cd5ed1099525ec390f6c4a9c049df752c1e1510ebda`. The baseline had replaced this working transport path with a disabled stub. This restoration follows the user's latest instruction to retain existing production providers, superseding the earlier two-provider restriction. No new subscription, credential extraction, environment edits or live provider calls were made.

Existing settings remain authoritative: `AURYN_OPTIONS_ENABLED=true`, provider `alpaca` or unset/default, and explicit `AURYN_ALPACA_OPTIONS_FEED=opra` versus default indicative. The existing paper-account key/secret stay server-side in request headers. No automatic OPRA upgrade or fallback to Marketplace occurs. The briefly started EODHD experimental modules/tests and activation wiring were removed; this change does not add an EODHD Options subscription.

Transport is bounded to four snapshot and four metadata pages, fixed HTTPS hosts, no redirect forwarding, timeouts, per-process cache/dedup and sanitized failures. User authentication, central Options feature/sample-only access checks, per-user market allowance and route rate limit remain; explicit monthly research reservation was added. The provider can deny the requested feed; denial is not relabeled as successful coverage.

Contract identities are validated before cache publication. Greeks are explicitly projected, never spread into identity fields. Trade size is never daily volume. OI retains its separate reported date and existing seven-day bound. Quote timestamps are retained separately; no independent Greek timestamp is invented. UI exposes raw reported delta/gamma/theta/vega and dates under Calls & puts, even if contract sizing cannot be verified.

Standard-contract sizing requires a single explicit equity deliverable matching the underlying symbol and asset ID, amount/allocation100, multiplier100, size100 consistency, non-delayed CCC T+1 settlement. Missing/different metadata means unsupported/unverified, not proof of adjustment. Size is not substituted for multiplier. These requirements follow the official Alpaca schema:
- https://raw.githubusercontent.com/alpacahq/alpaca-mcp-server/main/src/alpaca_mcp_server/specs/trading-api.json
- https://docs.alpaca.markets/us/reference/get-options-contracts
- https://docs.alpaca.markets/us/reference/optionchain

Pagination completion is recorded separately, not asserted as complete-chain verification. Full-chain metrics remain withheld when completeness is unknown. Indicative quotes are explicitly not executable prices; modeled exposure never claims actual dealer inventory. Expiry refresh replaces its old snapshot, including empty responses, without erasing other expiry observations.

Synthetic tests verify gating, fixed hosts, cache reuse, missing/stale OI, deliverable proof, Greek-field injection resistance, malformed identity/no poisoned cache, sanitized errors, expiry refresh and populated chart behavior. These do not establish live account entitlement or current data availability. The production browser stopped at sign-in, so live chain/Greeks remain unverified.
