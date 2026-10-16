# Final candidate review
Repo: /workspace/scratch/0397d872aad5/auryn-next
Baseline HEAD: bbdce50b92384acefb3db79978423da92a75e1ea
Current changes are uncommitted. Review actual working files, not only HEAD.
Plan: docs/superpowers/plans/2026-10-16-approved-glass.md
Approved visual/content reference: docs/design/approved-glass-2026-10-16/reference.html

Primary current changes: AppShell, approved-glass.css + glass-integration.css, StockClient, StockSecurityHeader, StockEvidenceNav, PriceChart, premium/AurynResearchOverviewV2, research/{BusinessEvidence,FinancialTrends,GlassValuation,GlassEvidencePages,GlassResearchLab,WeeklyStructure,TechnicalReadings,DcaInsight,ContributionEditor,ContributionDialog,useContributionSettings}, ConnectedPlanner, ResearchWorkspace, ResearchHome, portfolio/trading-lab/research-lab/personalization pages, AuthShell, secondary-frame. Supabase API changes only app/api/research-workspace/route.ts and validateContribution in lib/auryn/workspace/model.ts.

Current checks: TypeScript clean; production build passed; initial12 responsive browser cases pass. Full release first run had22 old-view failures; source details restored and six assertions updated to approved hierarchy/current-state fixtures. Affected37 tests now pass. Comprehensive browser run is in progress, report verification/next-build/glass-02.

Review Focus (plan verbatim):
- Missing or conflicting financial evidence must not become a Buy or a fabricated fair value.
- Account changes must clear cached personal data and keep writes scoped to the authenticated user.
- Symbol/range changes must not show another symbol's quote, chart or contribution state.
- Menus/dialogs must remain operable by keyboard and at 320/390px, without chart scroll capture.
- Paper controls must remain paused/blocked unless server authorization and all execution checks pass.

Return concrete critical/important issues with file and trigger, plus concise minor observations. Review source and sample screenshots; do not modify files or call live trading/deployment tools. Distinguish prior engine/recovery limitations from regressions in this change. Check the plan ledger rulings, especially mock data versus supported real metrics, and whether any seemingly visual change dropped essential data provenance or functionality. This is the single fresh review per executing-plans workflow.
