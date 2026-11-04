# Pricing freshness and Home coverage

Research now has a quote-only resource refreshed every 60 seconds while visible and on return to the app. Company statements/history keep their independent cache; the newest dated quote overlays research. Workspace prices recheck every two minutes while visible, skipping fresh cached rows and avoiding active batches. Server quote caches and request deduplication remain bounded at one minute. These are polling observations, not streaming exchange quotes.

A stale primary quote now triggers the configured backup source. If all returned quotes are stale or backup fails, the newest dated stale observation remains explicitly stale. Missing prices never become zero. During scheduled US weekday trading hours, Friday closes are considered old even if the provider reports its market-open flag as false; this freshness heuristic does not assert exchange holiday status. Stale Twelve Data observations can recover using a completed one-minute bar with its actual observation timestamp. No fetch-time timestamp is substituted.

ADA/DOGE and other explicit crypto search aliases map to USD pairs. Saved CRYPTO assets normalize bare base symbols as pairs, without treating the same bare ticker on a stock holding as crypto.

Price timestamps are directly visible without question-mark popups. Home checks news for all selected followed stocks (up to 30), reuses the existing shared one-hour news cache and expands up to 90 returned recent stories. Headlines favor distinct companies before repeated coverage. Earnings/splits retain their shared six-hour calendar cache. Coverage is provider-dependent and corporate feeds do not represent crypto news.

Verification: pricing-freshness-verify.log and pricing-freshness-api.log. No production credentials are present locally: live prices, exchange entitlements, account-specific limits and deployed behavior are not verified by fixture tests. Real-time availability depends on the configured feed; delayed and one-minute closes must not be presented as streaming live prices.
