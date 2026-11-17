# Auryn (fresh ground-up workspace)

This directory contains a dependency-free local research application built without reusing prior app source. It is intentionally not deployed.

## Run

```bash
npm test
npm run validate
AURYN_APP_API_KEY='replace-with-24+-random-characters' npm start
```

This is a local engineering build, not a deployable service. Startup fails unless
`AURYN_APP_API_KEY` contains at least 24 characters, and the server binds to loopback.
The browser exchanges that key once for an opaque, expiring HttpOnly SameSite cookie;
the key is not embedded in client code or persisted by the browser. `/api/health`
still reports `deploymentReady: false`: multi-user identity, distributed abuse
enforcement, and provider acceptance are not implemented or verified.

Provider queues are bounded in-process. If verified provider budgets are configured,
`AURYN_QUOTA_LEDGER_PATH` can opt into a lock-protected cross-process weighted-usage
ledger. The ledger contains only provider names, window timestamps and usage counts;
it never persists credentials, request URLs, symbols or response data. Rolling budgets
remain disabled unless their environment values are explicitly configured.
This file ledger coordinates processes only when they share the same durable filesystem.
It is not cross-instance enforcement for isolated/serverless hosts; such a deployment
would require an external atomic store and remains outside this local build.

Open `http://127.0.0.1:4173`. Provider credentials are server-only environment variables documented in `.env.example`. For the owner-only local secret workflow, see [docs/secure-provider-setup.md](docs/secure-provider-setup.md) and run `npm run start:local`. With no credentials, the UI and API return explicit `unavailable` states and make no provider requests. SentiSense uses `X-SentiSense-API-Key`; EODHD's required query token is assembled only on the server.

## What is implemented

- Overview, screener, research, portfolio, and settings navigation. Portfolio includes
  a local symbol-only watchlist with add/remove/research actions plus explicit, on-demand Pace/scenario evidence. Evidence is identity-, currency-, date- and freshness-checked, stays in the current browser session, and is never converted into an invented ranking.
- Fixed desktop/mobile shells with scroll owned by grid containers.
- Focused named adapters plus server-side declarative catalogs for all 112 documented SentiSense data endpoints and 90 documented EODHD HTTP endpoint contracts. They are documentation-backed and contract-tested, but remain entitlement-unverified; see [`docs/provider-endpoint-matrix.md`](docs/provider-endpoint-matrix.md). Catalog counts are not integrated-screen counts.
- Typed unavailable, unauthorized, restricted, no-coverage, preview, live, rate-limited, network-error, and provider-error results with endpoint-level entitlement evidence.
- TTL cache with concurrent request deduplication plus shared per-provider concurrency, pacing, and 10-second timeout scheduling.
- Independent monthly P0–P4 Pace dollar zones using the documented open monthly-v5 thresholds; Pace is not a 0–100 score or a purchase multiplier.
- Fundamental Bear/Base/Bull cases derived from revenue, margin, net cash, shares and growth estimates. Third-party analyst targets remain separate observations.
- Independent hand calculations, intermediate arithmetic, provenance rules, and the explicitly non-comparable user-provided DCA snapshot examples are documented in [`docs/independent-model-validation.md`](docs/independent-model-validation.md). No numeric parity is claimed.
- 512 synthetic model fixtures plus a separate manifest of 512 unique real securities from the user-provided reference snapshot. None of the real securities has been live-validated; parity claim is false.
- Working offline-fixture screener filtering/sorting, research evidence tabs, provider settings evidence, and interactive DCA illustration. Research includes a lazy, fixed allowlist for news, earnings, ownership, public-official filings, options, and dividends with per-source provenance; news and ownership lookbacks are constrained to named allowlists, and dated evidence is ordered newest-first without mutating provider payloads. There is no arbitrary provider execution route.
- Provider-backed symbol/company search uses a fixed, debounced EODHD route, discards malformed identifiers, cancels superseded requests, and preserves canonical exchange-qualified identifiers, including share-class forms such as `BT.A.LSE`. Provider quotes are rejected if the returned security identifier differs from the requested canonical symbol, and missing timestamps remain unknown rather than being replaced with the current time. The local portfolio ledger records chronological USD buy/sell transactions and calculates FIFO cost basis and realized gains including fees. Sell eligibility uses unrounded internal quantities; rounding is display-only. A fixed capped server route can refresh delayed-indicative EODHD quotes, but valuation remains unavailable unless every open position has a matching, timestamped, nonfuture, no-more-than-seven-days-old quote with explicit USD currency.
- Canonical security identity is provider-specific. US identifiers such as `AAPL.US` map to EODHD `AAPL.US` and SentiSense `AAPL`; non-US identifiers are not stripped and sent to SentiSense without verified mapping. Unsupported mappings return an explicit state and make zero SentiSense requests. Ambiguous dotted manual identifiers must be resolved through search.

## Exact gaps

- The authenticated Figma editor remains blocked by WebGL, but the user-provided published Make preview was accessible and its six primary screens, eight Research tabs, auxiliary dialogs, settings, and responsive rules were inventoried. The current UI follows that observed direction; direct screenshot comparison against the running local app remains blocked, so this build deliberately does not claim visual parity.
- Provider portals verified an active SentiSense Pro plan and an active EODHD All-in-one plan. Their protected credential values cannot be securely bridged into this executor, so endpoint-specific entitlements and live schemas remain unverified; actual live ticker validation is `not-run` for all 512 manifest symbols.
- SentiSense's 112 documented data endpoints and 90 documented EODHD HTTP contracts are represented server-side. WebSocket and separate real-time-host transports remain outside that HTTP catalog. Exact account-specific quotas and response variants require credentialed acceptance testing. Rolling budgets are disabled unless explicitly configured from verified account limits; request pacing, concurrency and timeout controls remain active.
- The accessible user-provided DCA snapshot includes displayed multipliers and next levels, but not the historical/fundamental inputs needed to calculate Auryn's independent metrics. The semantic comparison is documented; numeric comparison remains pending a scoped, input-complete, user-approved sample.
- Cloud-browser localhost isolation prevented visual automation against the running workspace server. HTTP behavior and responsive overflow contracts are automated; visual screenshot QA remains pending an environment where the browser can reach localhost.
- Portfolio persistence is browser-local and single-device. Invalid JSON, wrong-shaped storage, and invalid transaction records are surfaced; the original raw browser value is retained, persistence is suspended, and editing is disabled rather than silently rewriting or discarding it. The FIFO output and provider valuations are estimates, not brokerage statements, tax-lot election advice, or tax guidance. Brokerage synchronization, split adjustments, return of capital, wash sales, transfers, dividends, multi-currency lots, and specific-lot elections remain unimplemented.
- Portfolio recovery now provides an explicit original-data download and validates a complete corrected chronological ledger before replacing browser storage. Invalid imports never replace the saved raw value. Recovery remains local-browser functionality rather than durable account storage.
- Settings now provides a unified browser-local JSON backup containing normalized settings, watchlist symbols, and transaction records only. It excludes quotes, provider responses, and credentials; malformed portfolio storage is preserved verbatim for recovery. This is manual portability, not account synchronization.

## Security and data truthfulness

Tokens are never sent to the browser, serialized in responses, or logged. Fixture rows are labeled `OFFLINE FIXTURE`. EODHD quotes are labeled delayed/indicative rather than live. Malformed provider responses are rejected, errors and 429s are not cached, cache keys include request parameters, and stale async research, explanation, intelligence, or settings responses cannot overwrite newer state. Local responses include a restrictive Content Security Policy, frame denial, MIME sniffing protection, referrer/permissions policies, and browser cross-origin writes are rejected. These controls do not replace production identity, distributed rate limiting, CSRF architecture, durable storage, or external security review.
