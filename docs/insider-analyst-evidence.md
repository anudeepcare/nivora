# Insider clusters and prior analyst revisions

Official contracts checked2026-11-18:
- https://sentisense.ai/docs/api/insider-trading/ — `/insider/cluster-buys?lookbackDays=90`,90-day window; full PRO response versus top5 Free preview. Envelope preview status retained. Selected ticker absent from preview is explicitly unknown, not no activity.
- https://sentisense.ai/docs/api/analyst-ratings/ — `/analyst/{ticker}/called-it?limit=10`, selected historical large moves with firm counts in/against direction and unchanged. Full PRO versus newestmove/up-to5calls Free; sample-company metadata retained. This is NOT accuracy, hit rate, ranking, or a complete analyst track record. Individual profile endpoint explicitly disclaims those scores.

New UI: Ownership→Insiders has Load cluster evidence; Analysts→coverage has Load revision evidence. Requests occur only on clicking, not automatic scrolling or retries. This independent request remains reachable even if the older dataset has no coverage. Closed output excludes arbitrary provider strings/upgrade links. Per-request account, sample-only, corresponding business/analysts feature, daily/monthly research allowance and rate limits preserved. Fixed host/endpoints, secrets server-only, no redirects, sanitized errors.

No purchase, new key, configuration change, live provider call or deployment. Documentation entitlement is not verification of actual key/plan. Global20/min limiter is specific to this slice, not a replacement for a shared budget spanning every existing SentiSense endpoint. Provider429 remains authoritative. Commercial licensing is not newly certified.

Historical calls list includes same-direction revisions only; UI retains against/unchanged counts prominently. Targets are shown as published without invented currency or split basis; no realized-return computation. Names are attributed to firms when analyst is absent. Clusters are delayed disclosures, not a forecast or recommendation. Dates are purchase/publication/window dates, not retrieval timestamps.

Retrospective dates are validated against the current UTC date at projection (injectable as-of date for deterministic tests). Future purchase/window/publication dates reject the response, never become completed observations. Same-day dates are admitted as reported disclosures, not certified complete-session bars. This is a calendar-bound validation, not proof of provider authenticity or filing completeness.
