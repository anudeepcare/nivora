# Interaction, contrast and calculation update — 19 October 2026

## Root causes addressed

- The old `portfolio-top` container defined dark-surface text tokens for every descendant. The new white chart inherited those tokens and became unreadable. Portfolio now uses an independent grid wrapper; dark tokens belong only to its balance card. The chart is a sibling surface with normal theme tokens.
- Live-price updates repeated financial-period normalization, indicators, monthly accumulation and historical-risk scans. These now reuse immutable evidence by dataset identity, cutoff, length and applicable market. A new dataset/cutoff invalidates the result; each dataset retains at most three cached variants and weak references allow release. Current-price-dependent calculations remain current.
- Research charts were destroyed and recreated when switching Overview and Technicals. Visited chart panels now retain their chart instances; inactive panels are hidden from layout and accessibility. Other sections still load only when selected.
- First visits to research tabs no longer restore a deep scroll offset into short new content. Tab navigation stays beneath the measured app header and retains horizontal touch scrolling. Returning tabs retain their saved positions; reduced-motion preferences apply to the horizontal reveal.
- The Settings sheet now has an isolated fixed header and one scrolling body, with smaller controls and initial heading focus. Reopening resets its body scroll. It does not inherit the old sheet's clipped content or large initial close-button focus ring.
- Portfolio keeps the newest cached observations during background refresh and saves fresh stream observations for the next visit. Disconnected cached trades are labelled reconnecting and retain the short streamed-price expiry.
- Portfolio quote maps, totals, returns, filtering and upcoming-report sets reuse unchanged inputs. The market-session formatter is shared, avoiding recreation for every ticker.

## Measured calculation sample

On this runtime, 50 quote-only updates of the same fixture, each evaluating perspective and two decision summaries, took approximately 612 ms before caching and 31 ms after caching, including initial calculation. This is a single local calculation sample, not a browser interaction measurement, load test, production SLO or iPhone speed claim.

## New cross-platform utility

Advanced's valid hypothetical long plan can produce a **manual trade reference** for another broker. It includes the dated observed quote, explicitly user-assumed entry/invalidation/target, whole units, planned loss and assumed slippage. It flags stale quotes and lists broker checks still required: spread, buying power, lot sizes, fees and session/order eligibility. Copying uses the local clipboard only after the user clicks; it creates no order, broker connection, server message or extra market-data request.

## Accuracy and operating limits

Caching is for immutable supplied evidence; replace arrays when data changes rather than modifying an existing fact/bar object in place. Financial and price periods remain distinct. Existing quote identity, currency, stale-data, model eligibility and budget checks are preserved. Indicators and original decision rules are not proven profitable trading strategies.

No new paid data subscription or automatic AI call is introduced. Installed physical-iPhone acceptance and rendered-browser measurements remain outstanding. The PWA status-bar surface, metadata and document-scroll shell are unchanged.

## Next useful additions, rather than more generic panels

1. A transaction and cash-flow ledger, reconciled to broker records, before drawing a true portfolio-performance history.
2. Saved decision outcomes against the user's recorded plan, including fees and fills, before making strategy-performance claims.
3. Company-specific source evidence for catalysts and thesis conditions, with dated changes and alert delivery status. Coverage must be established before adding a claim to the primary screen.

Options/order-flow analytics and fully automated broker execution still require separate datasets, validation and controls; they are not represented as complete in this build.
