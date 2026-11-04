# Streaming prices and Home performance

## What changed

Authenticated `/api/price-stream` relays EODHD trade WebSockets over a private, noncached SSE response. US equities and USD crypto use separate upstream market sockets; no vendor key is sent to the browser. Symbols are validated and limited to 30 per browser view. An in-worker hub shares upstream subscriptions, caps the union at 50 symbols and releases subscriptions when clients leave. Provider failures reconnect with exponential backoff. The 55-second downstream connection renews automatically within the route's 60-second maximum duration.

The server batches each symbol's latest tick once per second, with bounded pending state and downstream backpressure. The client updates at that cadence, pauses when hidden, reconnects on return and prevents superseded fetches from reconnecting. REST polling continues as fallback. A stale/disconnected trade is not labeled live. Actual trade timestamps, positive prices, subscription identity, session and ordering are validated. Missing trades do not turn into zero prices. Stock daily changes require a valid same-day prior-close baseline; crypto uses the feed's reported daily percentage. Real-time trades update current price; completed technical/DCA history is not rewritten by intraday ticks.

The existing Twelve Data quote path now treats observations older than three minutes as stale during scheduled US hours and checks minute-bar recovery for observations older than 90 seconds. REST quotes can remain delayed depending on entitlement. This does not turn a delayed feed into a live feed.

Home calendar and news load independently, retaining separate 6-hour calendar and 1-hour news caches. Home still checks up to 30 followed stocks. Expanded stories use browser content visibility to reduce offscreen rendering. The session-change panel is more compact; the two update columns no longer stretch to match the taller panel. Existing PWA header/safe-area implementation is unchanged.

## Deployment

Use Node 22.18+ (Node 24 recommended). Existing server `EODHD_API_KEY` or `EODHD_API_TOKEN` enables the stream attempt; `EODHD_STREAM_ENABLED=false` is the kill switch and keeps REST polling. Never use a NEXT_PUBLIC variable for vendor credentials. No new data subscription is required by the code; the account must actually have the vendor's streaming entitlement. Rebuild and deploy the updated source normally. The service adds long-lived function execution and transfer usage on the existing host; measure these before enabling for many accounts.

The EODHD US stream covers EDGX venue trades, not the consolidated SIP tape. Premarket/after-hours labels use actual extended-hours trade frames and New York time. There may be no new trade for quiet symbols; absence of a new event is not an invented price. Company fundamentals and news retain their independent providers/caches.

## Scaling limit

The hub is shared within a warm Node worker only. Autoscaled workers and regions do not share subscription state. EODHD's 50-subscription limit applies across the token, so concurrent tabs/devices/workers can exhaust it; failures retain polling. This is suitable for initial personal validation, not a claim of a globally coordinated multiuser relay. Before commercial scale, centralize the upstream owner in a dedicated relay or durable coordination service, then fan out to authenticated subscribers. No such external service has been provisioned or purchased here.

## Verification

`verification/streaming-verify.log`: unit/SSR tests, TypeScript and production build.
`verification/streaming-api.log`: mocked identity/provider route regression tests, including authentication protection on the new stream route.
Stream parser tests cover crypto/stock identity, old/future/invalid values, extended hours, nonregressing timestamps and daily-change baselines. A fake-socket hub test verifies shared subscriptions, scoped delivery and release. A public demo crypto WebSocket probe received a BTC-USD trade; private account entitlement and deployed browser streaming are not verified. Physical iPhone testing is not represented by these checks.

Primary protocol reference: https://eodhd.com/financial-apis/new-real-time-data-api-websockets
