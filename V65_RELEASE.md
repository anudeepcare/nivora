# NIVORA V65 Release

## Major product changes

- Unified V65 application shell and shared metric explanation interaction.
- Explicit Long-term / New Money Today / Existing Owner decision surfaces.
- Preserved slow-thesis separation from quote/timing movement.
- Multi-asset Portfolio: stocks, crypto and cash.
- Portfolio Health rebuilt without an arbitrary floor.
- Portfolio allocation, deployable cash, concentration and strongest/weakest/opportunity views.
- Trading Lab now distinguishes connectivity, execution and actual learning.
- Automatic portfolio learning cohort creates frozen evidence snapshots.
- Automatic outcome maturity measures 30D/90D/180D/1Y/2Y benchmark-relative results.
- Champion/challenger architecture prevents silent self-modification.
- Shared click/tap/keyboard MetricInfo component with mobile sheet behavior.
- Active stock surfaces migrated toward one V65 visual system.
- Removed disabled legacy decision branches and unused local scoring/presentation code.
- Historical release documents moved from root into `docs/archive/releases`.
- Added V65 dead-code audit.

## Safety

- Trading remains Alpaca Paper only.
- No automatic live-money execution.
- Veto, quote-integrity, consistency and risk gates remain active.
- Automatic learning updates evidence, not production weights.

## Required deployment step

Run `supabase/20260904_v65_portfolio_assets.sql` and `supabase/20260904_v65_trading_runs.sql` once before using the V65 Portfolio and run-by-run Trading Lab audit.
