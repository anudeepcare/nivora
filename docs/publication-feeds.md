# Publication source filters

Official contract: https://sentisense.ai/docs/api/documents/ (reviewed 2026-11-18).

Events → Publications now requires an explicit source choice: NEWS, REDDIT, X, SUBSTACK or YOUTUBE. One fixed ticker request, last30days/limit25, no background fanout or article fetching. Documents contain publisher/source name, link and epoch-second publication time; the API does not supply publisher headlines or article bodies. This UI does not invent either or relabel source names as headlines. Returned documents are not a complete audit trail of aggregate sentiment coverage.

Authenticated news feature and non-sample deployment required; user6/minute, adapter20/minute and research reservation apply. The adapter-wide budget is not a unified provider budget. Server response cached300seconds; cache does not prove current provider observation. Payload identity and source must match. Unknown/malformed payloads fail closed, unsafe URLs removed, future dates withheld, preview flags retained if supplied. Standard documented response is bare, not preview wrapped.

No live API entitlement, rendered browser QA or full provider-app feed parity was established. Tests use synthetic records. No account state, provider key, article bodies or sentiment data logged/returned unnecessarily.
