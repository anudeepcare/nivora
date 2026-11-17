# AURYN consolidated one-app roadmap

The approved goal is one coherent place to understand a company, evaluate its price, monitor holdings and review meaningful changes. UX first. This document retains the full scope; it is not a claim that every item is implemented.

## Existing capabilities retained
Company research, financial statements, scenarios, technical studies, options snapshots and heatmap, watchlists, holdings ledger, portfolio exposure, research comparison, contribution comparison, company events, alerts, owner controls and paginated support are present in source. Availability depends on account access and connected data. A holdings ledger is not a complete transaction-accounting engine.

## Implemented in this update
- Explicit Show/Hide levels disclosure and collapsed explanations.
- Continuous gamma cells, sticky strike/date context, current-price row marker and concentration distance.
- Options quote-quality summary: two-sided quote coverage, median spread as percentage of midpoint and observation dates. Invalid/zero/crossed quotes do not count as usable two-sided quotes.
- Bounded Pace rows with evidence links, preserving existing readings during refresh.
- Aligned holdings/watchlist numbers and explicit unavailable sparkline history.
- Set-based date/strike lookup for loaded heatmap data.

## Remaining approved product work
1. Unified Today attention queue with explanations, personalized events and change history.
2. Discover screening and focused company comparison with aligned periods.
3. Unified company overview linking business, valuation, technicals, options, ownership and position context.
4. Business-change timeline, metric history and inspectable score inputs/coverage.
5. Technical level map with separately attributed layers and conditional explanations.
6. Options expiry comparison, richer mobile ladder and stored-history replay. Dealer assumptions must remain explicit.
7. Full transaction ledger: buys, sells, fees, cash flows, dividends, corporate actions and multi-account reconciliation.
8. Actual time-weighted and money-weighted performance from reconciled transactions; benchmark comparison on matching dates. Existing holdings-history chart must not be relabeled account performance.
9. ETF look-through, currency/country exposure and scenario stress tests where data supports them.
10. CSV transaction import with preview/error reconciliation; broker connections require independently authorized integrations.
11. User-controlled alert frequency, deduplication and durable notification delivery verification.
12. Quick stock drawer, remembered workspace preferences, accessible mobile interactions and public product walkthrough.
13. Support assignments, priority, search, bulk actions and live mail delivery monitoring.

## Release gates
Types and automated regression tests; production build; responsive browser inspection; keyboard and touch interactions; partial/missing data cases; no secrets in ZIP. Production performance, physical iPhone Safari, external delivery and connected-provider completeness require live verification. Never claim zero bugs or investment superiority from local tests.
