# AURYN V9.9.9.34 Tab Deduplication + Performance Cleanup

**Goal:** Give every Research tab one job, remove duplicate canonical summaries, and stop Overview-only work from running on every tab.

**Architecture:** Overview remains the single canonical decision surface. Business becomes long-term company-thesis evidence only. Earnings, Technicals, Ownership, Catalysts, and Options retain only domain-specific evidence. Heavy Overview chart/5Y roadmap requests run only while Overview is active. Dead unreachable UI and runtime-unreferenced legacy components are removed only when they are not part of the active import graph.

## Tab responsibilities
- Overview: what should I do now, why, price levels, valuation snapshot, weekly roadmap.
- Business: why own it for years, moat/durability, operating quality, five-year record, fundamental thesis breakers. No timing/entry or duplicate canonical score matrix.
- Earnings: reported results, surprises, revisions, next earnings.
- Technicals: price/volume/trend/structure only.
- Ownership: SEC 13F/institutional positioning only.
- Catalysts: scheduled events, filings, news evidence only.
- Options: options positioning/contract research only.

## Tasks
1. Add tab-contract regression tests.
2. Render Overview only on Overview tab and remove the duplicate legacy thesis panel.
3. Gate Overview 3M/5Y chart requests to Overview tab.
4. Rebuild Business as thesis-detail evidence instead of a second dashboard.
5. Remove unreachable News tab render and legacy StockThesisPanel runtime dependency.
6. Remove runtime-unreferenced stock components after import-graph verification.
7. Run V34 plus full V33 regression chain and release verifier.
