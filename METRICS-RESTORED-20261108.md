# Research metrics restoration

The previous compact-layout change incorrectly removed the lower ResearchEvidenceGrid. Restored the complete existing business/valuation/technical/ownership grid directly below CompanyMetrics with all previous component behavior, category navigation and saved metric preferences intact. The upper CompanyMetrics grid remains intact. No disclosure panel or click-to-expand wrapper is restored. The previous removal was a misinterpretation of the request.

Rendering regression checks require both upper contextual metrics and lower research evidence in the active overview and reject the old All research metrics disclosure label. The component continues to use its existing data-selection rules and dedicated detail navigation; no source data is deleted or fabricated. Supersedes DISPLAY-CORRECTION's removal of the lower grid.
