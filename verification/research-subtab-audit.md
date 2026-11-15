# Research subtab audit

Source and supplied-screenshot audit. This is not rendered browser or device acceptance.

| Area | Reviewed | Correction / retained behavior |
| --- | --- | --- |
| Business | FinancialPicture, FinancialExplorer composition, BusinessHistory, FinancingContext | Stop stretching a short durability panel to the funding panel's height. Fix funding CSS child selector (`section`, not `div`) and keep two compact columns. Quick reads use neutral glass with semantic icon color. Preserve period/statement selectors, chart choices, all measurements and help. |
| Case & ownership | ResearchDetails/ThesisPicture, BusinessMap, ownership row | Natural-height evidence cards; no full green washes. Preserve supporting/risk distinction, company description, ownership and evidence questions. |
| Valuation | ValueStudio, SelectedValuation, embedded TargetsEstimates | Natural-height scenario/consensus row. Sapphire interaction/focus states. Preserve scenario provenance, all editable assumptions, model comparison and missing-data safeguards. |
| Technicals | TechnicalDashboard, TechnicalLevelMap, ResearchDeskLayout | Natural-height study groups and compact 48px summary controls. Preserve daily/weekly/monthly, retained chart, study library and risk disclosures. |
| Targets & estimates | TargetsEstimates, analyst consensus/rating composition | Neutral glass backgrounds rather than arbitrary teal/purple panels; sapphire active tabs/focus and Valuation handoff. Preserve keyboard arrows, Home/End, all estimate views. |
| News & earnings | CompanyUpdates, NewsCoverage, EarningsReview | Neutral event/news surfaces and sapphire link/focus treatment. Optional hideNextReport prevents duplication when adjacent events panel supplies the same date; actual/estimate/surprise remain. |
| Labs | AdvancedResearch and advanced desk selectors | Preserve all five lazy/retained tool views, Congress disclosure, calculations and controls. Shared surface/layout changes avoid full-panel color mismatch. |

Removed superseded declarations only for identical selectors within the same CSS rule-list scope; responsive conditions remain separate. No financial formula or provider change.

Six new regression checks were observed failing before correction, then passing. They cover natural-height rows, correct funding child selector, neutral surfaces, interaction-vs-semantic colors, and rendered next-report deduplication.

## Follow-up screenshot audit (4.49.50–4.50.48, 4.51.09)
- Read all five source screenshots: disclosure summaries carried a second border; Technical Pace was oversized; price references used repeated outlined subcards and long ruled rows; cash bridge had a green surface; historical charts repeated disclosure borders.
- Corrected exact ResearchDeskLayout owners, not a global blanket selector: disclosure summaries now have no border/background/shadow; actual `.pace-period` children replace a stale `.pace-reading-card` selector; compact two-part Pace layout reflows to one column on mobile, preserving every period/date/name. Cash bridge uses a neutral glass surface, preserving semantic bar colors and calculations.
- ResearchMetrics price reference owners use 40px soft alternating rows, compact channel tiles without nested outlines; mobile column collapse and custom anchors remain. TechnicalLevelMap buttons retain minimum 44px touch targets and sapphire selection.
- FinancialExplorer already uses sapphire bars in current source, unlike the screenshot's stale teal; no calculation change made.
- News publisher entities decoded to text before duplicate matching. No HTML parsing/injection; React escaping remains. Invalid code points remain literal. Regression proves equivalent encoded/plain headlines deduplicate.
- These are source-level corrections supported by tests. New live browser acceptance still belongs to the parent review, not claimed here.
