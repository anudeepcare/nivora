# AURYN 1.0.0 — screenshot corrections

This source package supersedes RC2. It has not been deployed by this session. Version 1.0.0 is the app version; release publication remains a separate action.

## Visible corrections
- Replaced the large Home checklist and Tomorrow/Reviewed controls with at most three followed-company earnings, saved-alert or saved-review highlights. News backlog no longer appears here.
- Removed Data coverage & definitions and Since your previous saved view from Research. Metric dates and relevant explanations remain available.
- Public footer now owns its layout; analytics preferences uses a plain footer control instead of a settings-row button.
- Chart/Pace and lower overview cards stretch to equal row height on desktop. Mobile remains naturally stacked.
- Separated Set an alert and See valuation assumptions into wrapping actions with adequate gaps.
- Standardized shared metric help buttons and added definitions for all displayed funding/working-capital metrics.
- Added spacing and a contained evidence section to the earnings review.
- Updated app/package/release version to 1.0.0.

## Verification
- 918 tests passed, zero failed or skipped. The new Home regression feeds 102 news entries and verifies that the backlog is excluded.
- Production build passed.
- 19 focused browser checks passed at 1440px and 390px: removed banners, no horizontal overflow, help open/Escape close, footer analytics action, action grouping and version display; no page errors.
- Desktop chart and Pace both measured 461.39px. Lower cards both measured 376.69px after adding a 220px layout stress fixture to only one card. The injected fixture tests layout, not financial data accuracy.
- Inspected footer and research-grid screenshots. These are local preview checks, not validation of the user's authenticated deployment or physical installed PWA.

## Prior work and remaining limits
See ACCEPTANCE-RC2.md for earlier earnings sorting, shared preferences, screenshot support and API regression work. That earlier checklist UX is superseded by this pass. The support screenshot migration still requires deployment; no database migration or live payment was performed. No new valuation algorithm or independently reconciled financial dataset is claimed here.

NEXT-FEATURES.md contains proposed work only. None of those proposals should be represented as shipped.
