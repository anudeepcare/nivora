# AURYN experience recomposition

**Goal:** Replace stacked, repetitive summaries with clear decision-led workspaces across Home, Research, News and Portfolio. The owner requested implementation and one ZIP rather than another design discussion.

**Architecture:** Keep Next/React, existing quote/provider/decision models and all metric grids. Use screen-specific compositions and pure presentation helpers. No changes to financial formulas, provider selection, auth, billing or database.

## Deliverables
- Home: source-backed 30-second briefing, then companies and coordinated news/agenda. Secondary tools remain available below.
- Research: one joined Pace/chart decision stage, followed by reasoning and actual change conditions beside the canonical scenario range. Remove duplicate action/analyst/risk summaries, retain every unique risk, eight company metrics and four evidence grids, source dates and deep methods.
- News: editorial feed with a lead story, dated source links, reading/filter controls and deduplicated articles. Filings remain separate primary records. Coordinate earnings and transactions rather than stacking mismatched boxes. Never infer price causation, sentiment or a story summary.
- Portfolio: chart-first workspace with explicit priced holdings/cash distinctions, simple benchmark selection, coordinated allocation/exposure, full-width holdings and retained optional tools.

## Verification
- Test pure feed presentation for URL/date validation, deduplication, sorting and no invented text.
- Render-test research reasoning and change conditions, missing-data behavior and retained metric visibility.
- Run lint, format, full tests, typecheck, build and fixture API suite on integrated source.
- Attempt browser verification at desktop/tablet/mobile; document actual observed coverage and any restrictions, never substitute unit tests for visual acceptance.
- Package clean root ZIP with current notes and manifest, no credentials/build/dependencies. No deployment.
