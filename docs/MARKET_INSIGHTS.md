# Dated market insights

Official contract checked 2026-11-18: https://sentisense.ai/docs/api/insights/.

Existing Market summary now offers an optional dated-signals disclosure. Market priorities reads /insights/market (provider urgency/confidence order; aggregate patterns plus important company signals). Latest company signals reads /insights/latest?limit=50 (newest first across tracked companies). The modes fetch only when clicked and do not concatenate potentially overlapping feeds. Existing selected-stock insights remain separate; UI explicitly warns the same signal can appear there, not independent corroboration.

No /user call, no watchlist/portfolio upload. Reject personalized-category payloads. Fixed endpoint whitelist, signed-in non-sample overview+advanced,6/user/min and20/provider/min ceiling, research allowance before acquisition.12sec timeout, no redirects,2MiB streamed cap, credential/kind-scoped15min process cache;5min client cache, original received date preserved, loaded view may be older.

Strict envelope boolean preview and bounded total/array schema. Generated seconds converted to dated ISO, future dates/duplicate IDs/invalid confidence fail closed. Market ticker may be absent/null, company ticker is validated. Missing preview description remains withheld, not fabricated; no missing text on a full-data response. HTTPS credential-free source links only, React text escaping. Confidence score is explicitly not investment-success probability. Generation is not event/publication date. No score/action synthesis, no session-summary duplication.

Tests: test-first DTO/safety; executable route gate/kind-denial; actual mocked fixed-host transport/cache/error/size; actual route→projection→React SSR for dated zero-confidence preview/source/escaping. Existing market-summary tests run too. No live provider entitlement, production deployment or browser verification. No migration/new environment settings.

Compatibility note: PERSONALIZED is a documented category in the generic insight schema. This shared-key market integration intentionally rejects an entire response containing it as a conservative privacy boundary, even if a public endpoint legitimately serves such a row; it is not proof of malformed provider data. The UI reports unsupported data rather than exposing it.
