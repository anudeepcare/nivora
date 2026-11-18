# On-demand market summary

Official contract: https://sentisense.ai/docs/api/market-summary/ (reviewed 2026-11-18).

Screener → Market summary mounts only on selection. The fixed authenticated `/api/v1/market-summary` endpoint accepts no parameters. Existing SENTISENSE_API_KEY or SENTISENSE_API_TOKEN applies; no migration or extra environment configuration. All provider tiers are documented as eligible, but actual key entitlement/success was not verified.

The unwrapped DTO contains headline/expandedContent (nullable), generatedAt (nullable epoch seconds), lastUpdated (served epoch milliseconds). The UI distinguishes generation, provider serving, and local fetch receipt. It never substitutes lastUpdated for narrative freshness. No preview flag exists in the documented contract; the UI does not invent one or promise comprehensive coverage. Null content produces an honest empty state.

Access requires account, non-sample deployment, overview feature, rate and research allowance checks before transport. Fixed HTTPS host, no redirects, 12-second timeout, streamed 2MiB cap, credential-hashed process cache, neutral upstream errors. Server cache15min/client5min; receipt persists across cache hits; open views may be older. Manual check invalidates client cache but respects server cache.

Expanded content is rendered as an inert small Markdown subset (headings, paragraphs, bold, unordered items, HTTPS citation links). Raw HTML is escaped; images/embeds/scripts are not executed. Unsafe protocols and credential-bearing URLs never become links. No new dependency, no LLM calls, no ticker fanout, no portfolio data is sent.

RED→GREEN tests verify DTO times/nulls/limits, executable access denials and invalid query, mocked fixed-host transport/receipt cache/oversize/error handling, SSR citation safety, lazy integration and disclosures. Browser pixels, live provider/account access and deployed end-to-end were not tested.
