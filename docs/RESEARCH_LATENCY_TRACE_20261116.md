# Research latency trace (source + controlled fixtures)

No live provider requests or credentials used. No production timing assertion.

## Blocking chain

1. `Research.tsx` waits for `useResource(research/{symbol})`; long-range chart bars come from that research result. A separate quote can arrive earlier, but cannot supply the chart.
2. Research route authenticates/reserves access, then awaits `research(symbol)`.
3. `providers.research` uses `Promise.allSettled(quote, marketHistory, fundamentals)`. These start together, but history cannot render until the slowest settles.
4. Fundamentals can await primary EODHD, then SEC ticker-directory lookup, then SEC facts/submissions in parallel. EODHD transport has a 15-second timeout; generic SEC/Twelve transport has an 18-second timeout per request. Shared-market mode first checks usage (5-second timeout), then shared DB budget/cache. These are upper bounds, not measured typical timings.
5. After base research finishes, the route awaits optional SentiSense enrichment. Cold enrichment queues profile then consensus on a per-key serialized promise chain. Each transport permits 15 seconds. Preview spacing is 7.2 seconds; Pro spacing is 250 ms. Up to 256 pending symbols have no end-to-end queue deadline. Under concurrent cold requests, waiting is not bounded by a single transport timeout.
6. The browser's API layer does one authentication-refresh retry for 401, not a general repeated data retry. Resource requests deduplicate identical in-flight keys. Memoized chart preparation is downstream of the response.

## Controlled algorithm check

Node fixture run on this workspace, `pacePriceZones` forming state at 2026-11-06T22:00:00Z:

| Fixture | Bars | Cold scan | Same-reference warm cache |
| --- | ---: | ---: | ---: |
| AVGO | 800 | 225 ms | <1 ms |
| APP | 800 | 275 ms | 1 ms |
| ALAB | 662 | 97 ms | <1 ms |

These results are not mobile/browser benchmarks and do not establish live request latency. They do not support attributing a two-minute delay to this scan alone. Financial computations were not modified.

## Safe implementation direction

- Make optional enrichment independently refreshable after base research, retaining the same authorization/projection and explicit analyst-data loading state. This needs coordinated route+client work so targets are not silently lost.
- Bound provider queue waiting plus network time as one request budget; cancelled/expired queued jobs must not later issue paid traffic. Preserve durable denial/rate guards and shared successful caches.
- Do not use `Promise.race` alone to abandon paid work, invent a chart from quote-only data, reduce history needed by Pace, or label incomplete fallback data fresh.
- Later, separate price/history availability from slower fundamentals with a typed incremental response or independently cached endpoints, ensuring financial views do not mistake a temporary partial result for complete research.

Required checks: slow optional provider does not hold base history; late enrichment updates only matching symbol; cancellation before queue turn makes zero upstream calls; denial/rate-limit guards remain enforced; timestamps unchanged; warm cache preserved; no double fetch on tab switch; same complete history produces identical Pace/chart bands. Provider worker owns shared route/provider edits; no conflicting patch made by this audit.

## Implemented remediation

The numbered chain above records the pre-fix behavior. The current candidate independently requests authorized price history during the research loading state. Paid targets now use a separate authenticated endpoint with a 20-second bounded queue/transport budget; base research no longer waits for paid enrichment. Trial behavior remains separate. Client merge never alters quote/history/financial observation clocks. Tests prove chart completion with deliberately unresolved fundamentals, nonblocking base research and coalesced cancellation. This does not remove the full research dependency for Pace or establish live-device timings.
