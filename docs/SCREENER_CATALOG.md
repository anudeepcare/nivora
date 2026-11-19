# Screener discovery

Official reference: https://sentisense.ai/docs/api/screener/ (2026-11-18).

Stock and ETF screeners offer an optional catalog disclosure. No provider request occurs until Browse fields or Browse curated screens is clicked. GET /fields returns descriptors, unit/operator/type metadata, string choices and enum value/label pairs. GET /screens returns provider-curated recipes, not the user's saved screens. Recipes can be inspected but are not executed by this feature. Current screen builders remain bounded supported subsets; this does not advertise arbitrary field execution.

Only two fixed upstream paths, no URL/body proxy. Auth, non-sample, overview+advanced, rate6/user/min,20/provider/min, existing research allowance.12-second timeout, redirects rejected,2MiB streamed response limit. Strict bounded descriptor/preset validation, whitelisted strings/numbers/operators, duplicate identifiers rejected. No content interpreted as instructions, HTML or executable plans.

Original received timestamp retained in credential-keyed15min process cache. Client5min cache; loaded view may be older. No generation timestamp or preview flag is documented, neither invented.20entries/page and local search, no per-field fanout. Existing provider key/token, no migration.

Tests run projection bounds/enums/compact amount strings, actual route denials, fixed transport/cache/limits, actual route→projection→React SSR units and safe text. Existing stock/ETF tests included, with ETF's dynamic-child harness updated. No live provider/browser verification.
