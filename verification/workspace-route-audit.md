# Workspace source review, 15 November 2026

This is source/screenshot review, not rendered runtime acceptance. No deployment performed.

## Directly reviewed and refined
- `/` and `/sample`: PublicLanding paired hero/demo composition; tabs and account actions preserved.
- `/login`, session loading: existing Session composition reviewed; removed duplicate responsive padding. Parent handles loading/PWA/global palette.
- `/overview`: Home briefing typography and ornament, WorkspacePace table density and interaction palette.
- `/watchlist`: companies shown before compact attention evidence, count replaces billboard; add/remove/filter/undo logic unchanged.
- `/portfolio`: WorkspaceVisuals surfaces and table styling shared with Watchlist; no accounting or benchmark changes.
- `/settings`: all preference, account/password, support shortcuts retained. Consolidated Settings stylesheet, no repeated horizontal separators, transparent segmented backgrounds, compact rows with 44px targets; narrow input/fieldset safeguards retained. Controls are CSS-only changes.
- OwnerHandbook ancillary help reader: spacing and bullet list density refined; navigation and table accessibility retained. Actual `/help` routes to LegalDocument (see inventory below).
- `/owner`: SupportInbox Priority/Status label width corrected; ticket actions unchanged. Other admin components use parent/global styling.

## Independent cross-owner source checks
- Research masthead uses existing currentPace helper, cleans interval on unmount, and does not manufacture data for design.
- PriceStudyChart moves the existing chart above controls; levels, history and range props remain intact.
- PacePriceZones changes current indicator markup, not its values or eligibility.
- ResearchEvidenceGrid retains overflow metrics in visible additional articles rather than truncating data. Caught lost sourceURL/periodBasis from deduplicated CompanyMetrics; corrected in Evidence Help, including unique source URLs, with rendered regression coverage.
- Session and PWA theme color updates reviewed as color-only; worker owns their tests.

## Route inventory / coverage limitations
The catch-all router also exposes plans/pricing, compare, alerts, research-lab, trading, discover, contact, terms, privacy, risk, methodology, reliability, reset-password, monthly-plan, changelog. Explicit pages include about, pace, track-record, portfolio-check. These have not all received individual visual acceptance in this scoped pass. Existing tests cover monthly-plan, comparison keyboard region, admin touch targets and handbook tables; global token inheritance alone is not a per-route visual audit.

Research and its subtabs are owned/reviewed separately. No claim of 100% mock fidelity, authenticated runtime coverage or measured performance follows from source tests.


## Remaining route source inventory (completed)
All entries below were inspected in their actual renderer and style owner, not browser-rendered.

| Routes | Actual renderer / style owner | Source finding / action |
| --- | --- | --- |
| `/plans`, `/pricing` | Plans / Plans.module.css | Same pricing cards, public/account wrapper differs. Responsive single-column breakpoint and minmax columns exist; retained plan/billing actions. No confirmed defect requiring layout rewrite. |
| `/contact` | Contact / Contact.module.css | Form split collapses at 700px and inputs 44px/16px. Replaced hardcoded teal intro/file-picker and green checkbox with blue; outer surface now shared glass. Submission/attachments unchanged. |
| `/help`, `/terms`, `/privacy`, `/risk`, `/methodology`, `/reliability` | LegalDocument / LegalDocument.module.css | Product's early legal route intercepts Help. Shared reader has responsive scrolling navigation, 44px links and search. Removed hardcoded teal active-nav/alternating-section tint in favor of blue/shared glass. No legal content edited. |
| `/changelog` | ReleaseNotes / ReleaseNotes.module.css | Removed retired green headline gradient and hardcoded dark-green metadata color; glass articles, tighter header/article spacing. Dismissal/storage behavior unchanged. |
| `/reset-password` | PasswordRecovery / Session.module.css | Confirmed legacy-only auth class names prevented rebuilt login styles applying. Added existing shared auth/story/main classes to current markup; password validation and recovery session logic unchanged. |
| `/compare` | SupportingViews Compare / shared table + ComparisonCharts + ContributionCompare | Named keyboard-scrollable region already exists; comparison/source compatibility logic intact. No confirmed edit needed. |
| `/alerts` | AlertCenter / core compatibility form, compact-record, panel styles | Builder fields, refresh/delete event controls and empty/error states inspected. Functional notices retained; no route-specific green decorations. No additional confirmed edit. |
| `/research-lab` | ResearchLab / shared form-grid/panel styles | Technical-only replay limits and model disclosure essential, retained. Existing row/panel layout and buttons intact; no data or replay changes. |
| `/trading` | Trading / shared form-grid, panel, compact-record styles | Administrator paper-only workspace, confirmation workflow and form constraints preserved. No trading actions executed. |
| `/discover` | Discover / OpportunityMap.module.css + shared table styles | Results scroll container lacked keyboard reachability. Added labelled region/tabIndex. Numeric growth/semantic scale colors untouched; screening logic unchanged. |
| `/monthly-plan` | MonthlyPlan / MonthlyPlan.module.css | 48px inputs, minmax grids and mobile single column/2-column summary rules already exist. Notice/cash constraints retained; no confirmed edit needed. |
| `/about`, `/pace` | PublicEducation / PublicFrame.module.css | Shared navigation, mobile stacking, bounded text, focus styles exist. Educational labels and Pace scale retained. |
| `/track-record` | PublicFrame + PaceRecordFeed | Same responsive frame, evidence feed and limitations retained. No performance/evidence claims changed. |
| `/portfolio-check` | PublicPortfolioCheck / PublicFrame.module.css | Two columns collapse at700, weights use min-width:0/overflow-wrap. Concentration-only disclaimer retained. No accounting changes. |

Targeted verification: password recovery and Discover TSX ESLint passed; 32 tests across auth style/launch/providers, public surface, discovery saved criteria, recovery and workspace fidelity passed. These are source/unit checks, not live signup, payment, trading, or rendering acceptance.
