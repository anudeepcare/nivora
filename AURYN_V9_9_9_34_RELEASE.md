# AURYN V9.9.9.34 — Tab Deduplication + Performance Cleanup

## One job per tab
- Overview: only canonical decision surface. The V33 Overview no longer remains mounted above every specialist tab.
- Business: rebuilt as long-term company-thesis detail: Why Own It, What Must Go Right, What Breaks the Business Thesis, 5-Year Business Record, and reported operating evidence. No Timing/Entry or duplicate canonical decision dashboard.
- Earnings: reported results, surprises/revisions and next earnings.
- Technicals: price/volume/trend/structure.
- Ownership: delayed SEC 13F/institutional evidence.
- Catalysts: events, filings and news evidence.
- Options: positioning and contract research.

## Performance
- Overview chart-range request and independent 5Y roadmap request only run while Overview is active.
- Institutional provider request is lazy and only runs on Ownership.
- Options provider remains lazy and only runs on Options.
- Removed unreachable News-tab render.
- Removed duplicate legacy StockThesisPanel runtime surface.

## Source cleanup
Removed 9 runtime-unreferenced legacy presentation components:
StockActionPlan, StockDecisionSummary, StockThesisPanel, ExecutionPlanPanel, ProfessionalMetricExplorer, ScenarioMapPanel, StockV5Decision, AstraAnalystPanel, InstitutionalDecisionBrief.

These were not part of the active runtime import graph; removal reduces source/dependency surface without changing canonical engines.

## Verification
V34 tests and complete V33/V32/V31.1 + legacy price-truth regression chain pass.
