# Post-legacy CSS ownership audit

Source review prompted by alignment-latest screenshots: inline decision metadata concatenates and unstyled buttons retain native chrome when their old global owner disappears. Inspected screenshot 6.50.35 (ownership/Ask prompts) and 6.51.40 (Technical Pace/chart), then traced active renderer imports. This document is not browser-render acceptance.

## Concrete fixes
1. AccountBalances: attached PortfolioEvidence account root; explicit equity breakdown/fields/actions/checklist layout, numeric hierarchy, caption and error treatment, mobile form collapse.
2. PortfolioContext: attached PortfolioEvidence context root; three highlights, provenance/evidence block, exposure rows and actual-width meter children.
3. PortfolioRiskSummary: attached PortfolioEvidence summary root; stacked span/strong/small cells and phone single-column grid.
4. PaceGuidance: attached dedicated module for next-step label/value, contribution guide, five-stage scale and detailed explanation. Shared across Discover/Compare. Does not change eligibility or amounts.
5. Discover: `.block` date/provenance lines now block-level rather than concatenated; supporting-route footnotes sized consistently.
6. Settings: connected sign-in identities, analytics shortcut and diagnostics disclosure have explicit scoped rhythm.
7. Home: existing refresh icon uses canonical icon-button rather than orphan icon-btn. HomeUpdates lead date/company/action groups and batch selector gain scoped spacing.
8. ResearchOverview active KeyFinancialMetrics and CaseHighlights exports: dedicated ResearchSummaryEvidence module owns metric hierarchy, actual percentage meter bars, responsive tiles and stacked case points. No changes to unused ValuePicture/ResearchOutlook exports.

## Verified existing ownership / no speculative edits
- Search exact-ticker button already covered by `.search-results > button`; no special search-direct override needed.
- NewsAndFilings active branch directly returns NewsCoverage, which imports its own complete module; CompanyUpdates child also has its own module.
- HomeBriefing imports HomeAuxiliary; contextual row/section selectors already cover many raw child class names, so missing literal class selectors alone were not treated as proof of defect.
- PortfolioTools and standalone PortfolioRisk have no importing renderer in current components inventory; not styled merely to increase coverage count.
- Existing Watchlist/Portfolio page tables and dialogs have owned PortfolioWorkspace structural selectors; raw marker classes are not all intended styling hooks.
- Native Ask AURYN prompts/ownership screenshot assigned to Research owner; Technicals/Financials/Analysts assigned to their owners, not double-patched here.

## Validation
83 focused owner coverage, UI-controls, Pace and account-balance tests pass. Existing SSR harnesses updated with CSS-module bindings only; behavioral assertions retained. TypeScript passed after portfolio/guidance changes. No provider, financial calculation, permission, API or data-contract changes in this audit. Device/render verification remains required.
