# Supporting presentation migration

Source-only review. No browser acceptance is claimed: the parent specification records unavailable authorized rendering. No provider/model/backend changes, purchases, or deployment.

| Renderer / route | Presentation ownership after retirement | Preserved contracts |
| --- | --- | --- |
| Discover | SupportingScreens discover root; OpportunityMap existing module | Scan, filters, save criteria, open stock, missing/error/busy data |
| Compare | SupportingScreens compare root; ComparisonCharts/ContributionCompare existing modules | Selection, saved comparisons, loading/error/empty, dated currencies, contribution comparison |
| Alerts | SupportingScreens alerts root | Rules/event refresh, create/delete, acknowledge, conditional field inputs and disabled states |
| Strategy lab | SupportingScreens lab root | Symbol/rule-set/cost controls, replay, export, stale-result clearing, limitations |
| Paper trading | SupportingScreens trading root | Administrator access guard, paper-only notice, exact order inputs, arm/pause/run/reconcile/cancel and disabled guards |
| Monthly plan | MonthlyPlan module | Budget/cash, candidate selection, notes, computed allocation, mutation actions |
| Plans | Plans module | Actual access state, plan details, account actions, links; no price or plan change |
| Contact | Contact module | Email/topic/message/screenshot, diagnostics opt-in, validation/error/success; honeypot explicitly hidden locally |
| Legal/help/methodology | Rewritten LegalDocument module; HelpPage SupportingScreens help root | Existing documents, search, feedback, privacy controls, source prose and routes |
| Release notes | ReleaseNotes module | Version/date/history and existing navigation |
| Owner access | OwnerAccess module | Permissions, membership actions, dialogs, support inbox and access controls |
| Owner handbook | OwnerHandbook module | Topic navigation, search, expanded reference, loading states |
| Owner evidence / validation | SupportingScreens owner roots | Consent, validation task fields, append-only publication form and mutations |
| About / Pace | PublicFrame module + PublicEducation | Public navigation, five actual Pace descriptions, evidence boundaries |
| Portfolio check | PublicFrame layout/entry/weights | Local-only holdings parsing, 500-entry limit, validation, concentration calculation; no network upload added |
| Public evidence | PublicFrame module (shared frame) | Existing record contents/actions unchanged |

Canonical inputs, buttons, feedback, card/panel and table-scroll are supplied by parent foundation. Unique grids, form group composition, tables, records, public header/footer and document navigation are scoped. No stylesheet imports legacy-panels. Previous repeated exact-selector declarations in existing supporting modules consolidated; LegalDocument rewritten rather than retaining escalation resets. Owner important declarations removed, minimum controls 44px. Public/owner modules retain their local responsive behavior.

## Checks
- New `supporting-clean-presentation.test.mjs`: pre-rebuild action/validation/accessibility attribute contract hashes for 14 renderers; explicit scoped route roots; contact form and honeypot; no cascade escalation/imports in main supporting modules.
- Fixture hashes generated from pre-rebuild source and compared against new source, not invented new behavior. These catch event handler/disabled/required/ARIA drift; they are not comprehensive interaction/browser tests.
- Existing Comparison and ResearchLab render harnesses updated only to inject the new CSS module binding; all prior behavioral assertions retained.
- TypeScript `tsc --noEmit` passed during shared-tree build.
