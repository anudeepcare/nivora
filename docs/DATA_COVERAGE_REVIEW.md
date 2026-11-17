# Data coverage review — 18 October 2026

Official references reviewed:
- https://eodhd.com/financial-apis/stock-etfs-fundamental-data-feeds
- https://github.com/EodHistoricalData/EODHD-openapi
- https://twelvedata.com/docs
- https://twelvedata.com/news/march-2026-updates

EODHD fundamentals groups include company information, valuation, share statistics, corporate actions, ownership, insider transactions, earnings and statements. The existing application normalizes many of these groups. Home adds calendar earnings and splits plus news, rather than fetching a full company report for every headline. Twelve Data remains quote/search fallback and the existing company enrichment integration; endpoint presence in documentation does not prove Growth-plan access.

The EODHD documentation now describes v1.1 fundamentals, including distinct quarterly/annual estimates. Source inspection confirms the current adapter already requests v1.1 first, with whole-response legacy fallback on authorization failure. Existing fixtures test this. The earlier note that the app still used only legacy was incorrect.

The broad build now exposes user-selected comparisons, same-session estimate changes, earnings reminders, saved screening, professional exports and deeper grouped metrics. Persistent point-in-time estimate history, cash-flow-adjusted portfolio returns, company-specific intrinsic-value models and options/gamma analytics remain unavailable; see BROAD_BUILD_STATUS.md for exact scope.

No private account entitlement probe or paid API call was made during this patch. Provider keys stay server-side. No new subscription is required by the included changes.


Official SDK coverage reference: https://eodhd.com/financial-apis/node-js-typescript-sdk-for-eodhd-financial-apis — advanced third-party datasets can require a separate Marketplace purchase. Do not equate SDK method presence with entitlement. The existing REST adapters remain to avoid a second network stack.
