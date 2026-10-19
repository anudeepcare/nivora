# Refresh and layout correction — 2026-10-19

Research retains the newest usable observed quote across missing/invalid REST results and stream expiry. Retention is scoped to the selected instrument; age is reassessed with quoteHealth. Portfolio commits streamed observations to its retained snapshot so disconnecting cannot roll displayed values back to a previous REST observation. Home, Watchlist and Portfolio share the existing account-scoped on-device quote cache, including older observations with their true times. Failed requests never get a fabricated market observation time.

The research depth switch now sits within the company header, eliminating its separate spacer row. Simple keeps the decision readout and price/scenario context; Pro also exposes the overview financial metrics, detailed evidence lenses and review thresholds. Other research tabs remain available in either mode. Assessment cards align their content to the top; observed changes use a compact strip. Earnings hover contrast and the portfolio update selector are corrected. Installed-PWA shell and safe-area geometry are unchanged.

Metric source disclosures retain period, currency, calculation basis and observation dates, but API vendor URLs are not offered as customer-facing source links. Actual filing and news links remain available. Server-side provider identifiers and fallbacks remain operational.

## Pricing behaviour

| Surface | Visible-page updates |
| --- | --- |
| Research | Available streaming trades; one-minute REST fallback while stream is unhealthy |
| Home / Watchlist | Available streaming trades, two-minute REST checks |
| Portfolio Balanced | Five-minute REST checks |
| Portfolio Live | Available streaming trades, two-minute REST checks |
| Portfolio Hourly | Hourly REST checks |
| Portfolio Manual | Initial load and explicit refresh |

Streams cover up to 30 selected supported instruments. Remaining portfolio instruments use REST. Shared provider caching, budgets, entitlements and request limits apply; these intervals are checks, not guaranteed new trade observations. Streaming frames are coalesced at roughly one-second intervals. Extended-session trades are shown when delivered; otherwise the latest observation remains visible. Crypto may update continuously. Monthly contribution readings continue to use settled month ends, not live quotes.

Validation: automated tests, type checking, production build and fixture API checks. Authenticated production feed behaviour and physical iPhone rendering are not verified in this environment.
