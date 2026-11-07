# AURYN — completed changes and remaining external gates

This package continues the workflow/owner-handbook handoff. It is source, not a deployed release. The full one-stop roadmap is not represented as complete.

## Implemented
- Private owner handbook: searchable chapters, download, worked examples and exact calculation references; server-authorized owner endpoint, excluded from client bundles.
- Solid mobile header/dock and reading surfaces; native date controls retained.
- Options primary navigation: Price levels, Calls & puts, Guide and Practice; advanced tools in one selector.
- Expiration comparison from loaded contracts: call/put volume, open interest, observed dates and coverage.
- Heatmap plus compact key-level ladder; ranges retain all / 1 / 2 / 6 months of available expirations. Saved snapshots remain actual observations, not invented daily history.
- Technical map comparing stock price with dated daily and weekly averages.
- Unified home attention section includes earnings, saved reviews and alerts; partial coverage stays visible.
- Discover saved-screen filters survive saving; changing screens is blocked while a scan is in progress.
- Account-backed USD transaction ledger: deposit, withdrawal, buy, sell, dividend, fee and split; average-cost reconciliation, CSV preview, duplicate handling, export and reviewed full replacement.
- Same-account concurrent saves use revision checks. Return display requires statement confirmation, matching recorded holdings, coherent dated quotes, at least one year and solvable dated cash flows.
- Support full-text search, priorities, assignment labels, page selection and bulk status changes; bounded keyset pagination and owner-only access retained.

## Required deployment steps
Apply these SQL migrations in order before deploying the new source:
1. `supabase/migrations/20261107124746_auryn_support_workflow.sql`
2. `supabase/migrations/20261107124819_auryn_transaction_ledger.sql`
3. `supabase/migrations/20261107140000_auryn_shared_request_limits.sql`

The dedicated `AURYN_MARKET_SNAPSHOT_SIGNING_KEY` is now required for account snapshots. See `REVIEW-ACTIONS-20261107.md` for authoritative current deployment requirements.

No migration has been run against production. The support list and transaction storage require these migrations. Account assignment is a label for owner triage; this does not grant access to staff accounts or send assignment emails.

## Capabilities that still need data/integration work
- Broker sync: no broker provider or account consent configured by this update.
- True time-weighted returns and matched benchmark returns: require reconciled transaction history plus account valuations around external flows. Existing historical-holdings chart remains clearly labeled.
- Non-USD ledger, tax lots, mergers/spin-offs and transfers: not silently approximated. USD splits are supported.
- ETF constituent look-through and currency/country revenue exposure: require dated licensed holdings/segment data. Sector groups and uniform stress scenarios are already available.
- Historical gamma replay beyond collected snapshots: requires stored licensed observations. Expiration windows are not historical observation windows.
- Email delivery and physical iPhone Safari/PWA checks: need live external verification. Local browser emulation does not prove either.
- Cross-device stock quick-view drawer and configurable alert delivery cadence remain product work; existing company research, saved preferences and alert deduplication are retained.

## Calculation boundaries
Transaction results are average-cost research figures, not tax reporting. A successful reconciliation check cannot prove that a user supplied every broker record. Annualized money-weighted return is withheld for known mismatches or ambiguous cash-flow roots. Options aggregates are loaded-contract coverage and retain missing values; call-positive/put-negative GEX is a modeling convention, not observed dealer inventory or a directional forecast.
