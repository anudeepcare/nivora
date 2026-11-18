# On-demand stock Insights

Contract: https://sentisense.ai/docs/api/insights/ checked 2026-11-18.

Events → Insights adds two explicit choices: current importance-ranked observations, or the last 30 inclusive US Eastern calendar days (urgency/confidence ordered). Only the selected stock request runs; there is no polling or personalized `/user` access. Type filtering uses only returned observations, not a fabricated catalog. Market/latest/types endpoints are not implemented by this slice.

Server-only fixed provider origin and two paths; redirects refused, 12-second timeout, 2 MB streaming cap. User market authentication, deployment restriction, advanced feature, six-per-minute user limit and research reservation precede provider access; shared endpoint limiter is 20 per minute. Provider denial remains unavailable, not a success/zero response. No live key or paid calls were used in verification.

Every row must identify the exact requested ticker (GOOG is not GOOGL), with an integer nonfuture epoch-seconds generation timestamp. Range rows are also checked against inclusive Eastern dates. The endpoint lacks an envelope ticker for empty arrays, so empty-result provenance is the fixed validated request path, not separately response-verified issuer identity. Duplicate IDs and unsupported schemas are rejected.

Provider confidence retains its reported 0–1 value and is labeled as provider confidence, never return probability, accuracy or an Auryn score. AI descriptions are not independently verified facts. All documented categories are supported; PERSONALIZED is merely a possible category from the fixed stock response, not an invocation of the shared key's user feed. Safe HTTPS document links are retained; missing sources stay missing. Preview can retain metadata with withheld descriptions; unknown totals are not invented. Sample-company access is not a general entitlement claim.

UI caches results for five minutes, renders only exact selected symbol/mode, and makes no initial request. Source generation times remain separate from server retrieval time. React renders text without HTML interpretation. Current scope is bounded to 500 response rows and 50 references per row; oversized/incompatible responses are unavailable rather than silently truncated.

Verification: synthetic projections, auth/quota guards, fixed request paths, Eastern-boundary/range rejection, streaming-size rejection, rendered lazy/preview/source/score behavior, and route → transport → projector → rendered UI. These tests do not establish live entitlement, actual provider payload compatibility or browser visual quality.
