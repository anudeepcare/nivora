# Recovered requirements and exact status — 7 November 2026

This inventory consolidates the recovered source, conversation requirements and latest screenshots. It does not claim verbatim access to every message in all four previous chats. Delivery is source ZIP only; nothing was deployed or published.

| Requirement | Status and evidence |
|---|---|
| Labs next to News & earnings | Done: normal Research tab; Options / Research tools inside Labs. No isolated far-right dropdown. `components/Research.tsx`. |
| Rebuild confusing Options layout from its structure | Done: new scoped desk, summary, exposure controls and practice layout; old desk class dependency removed. Data/definitions unified, secondary tools on demand. `OptionsDesk`, `OptionsSnapshot`, `ExposureBoard`, `OptionsSimulation`. |
| Preserve calls/puts, expiry selection, heatmap, comparisons, simulation | Retained; 74 focused Options/exposure checks. Missing measurements stay distinct from zero. UI uses actual supplied fields; source cannot create absent provider volume/open interest. |
| Owner handbook actually explains | Fixed cover-only first selection. Opens first explanatory chapter, previous/next, deferred search, references opt-in. Validation/publication forms moved to their own owner tab. |
| Public track record, portfolio check, About | Rebuilt shared navigation and compact responsive layouts. Live portfolio calculations/example/reset. Publication disabled, empty and error states distinguished; errors offer retry. |
| Research evidence and explanations | Added on-demand metric formula/period/source receipts, existing earnings/risk checks, bounded manual filing passage comparison and public-only Markdown export. Automatic filing retrieval/diff and transcript extraction are not included. |
| Fast loading, cached navigation, smooth UI | Primary workspaces split into separate dynamic imports; quote hook no longer imports old full workspace; non-selected Snapshot mounts only once visited. LRU refresh/in-flight races and account-clear writes fixed. No blanket real-world speed guarantee. |
| Remove unused CSS / modernize entire app | Partial: new Options/public/handbook surfaces own compact styles; global compatibility CSS scoped to Product. The large historical stylesheet remains for existing screens. Full app-wide replacement is not complete. |
| Mobile iOS/PWA header, menu, keyboard, safe areas | Retained recovered fixes plus 320–1440px browser layout checks. Physical iPhone installed-PWA and live account checks remain necessary. |
| P0–P4 meaning, confirmed/forming, contribution guidance | Retained covered policy: P0 pause, P1 watch/hold, P2 small, P3 gradual, P4 deeper within limits. No policy thresholds changed. |
| Holdings-aware planning, budgets/caps/cash | Retained `lib/planning.ts`, MonthlyPlan and covered cent-exact allocation. USD workflow; multi-currency planning is not complete. |
| Structured thesis monitoring and scheduler | Code/queue/guards included. Actual scheduler activation and observed live execution remain operational steps; no production write performed. |
| Representative Pace backtest vs DCA | Evaluation infrastructure included. A representative result still requires point-in-time total-return/delisting data and an actual run. No performance advantage claimed or fabricated. |
| Public prospective observations | Append-only infrastructure and owner publish action included. Requires publication permission/config, fresh real quote and actual publication. No history fabricated. |
| 20 real participants | Recording tools included; actual consenting sessions remain outstanding. The software does not pretend those users have been observed. |
| Portfolio advanced roadmap | Broker synchronization, full TWR/benchmark reporting, ETF look-through, comprehensive tax-lot/non-USD accounting are not complete. They are not represented as delivered features. |
| Advanced research roadmap | NLP peer clustering/risk factors, exact option/RSU dilution, macro WACC, calibrated IV Monte Carlo, transcript ingestion, alternative data, Rust/Python engine, Excel add-in and portfolio VaR are not completed by this release. |
| All-ticker/provider accuracy | Regression fixtures pass; this is not a verified live audit of all ~300 tickers. Provider rights, freshness/coverage and real earnings-day behavior need live acceptance. |
| Supabase/config handoff | `.env.example`, migrations, `scripts/check-release-config.mjs` and `CONFIGURATION-20261107.md` included. No credentials in ZIP. |
| Source ZIP only | Complete source, lockfile, tests, migrations, docs and verification. No deployment, push or database write. |

## Decisions made
- The latest screenshot instruction takes priority: rebuild Options and affected public/owner surfaces, while retaining existing financial logic and unrelated verified features. Cost: legacy styles still remain elsewhere.
- Do not enable integrations, manufacture public observations, performance studies or participant results without genuine inputs. Cost: these items remain explicitly pending.
- Exact CSS deduplication produced little benefit and risks cascade differences; use module ownership and route scope here. Cost: no claim of full dead-CSS removal.
- Treat the reviewer’s invalid-tab finding as a user-visible regression and fix it together with consent styling. Both have regression coverage.
