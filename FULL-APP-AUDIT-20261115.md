# Full-app source audit and mobile refinement

## What this candidate is

A route-by-route source audit and targeted follow-through on the existing AURYN design. It includes meaningful corrections across public pages, signed-in screens, Research, Options, Settings and Admin. It is **not** a claim that every rendered screen or interaction has been visually accepted. Browser/device acceptance remains open.

## Changes

- Home: fixed the phone agenda creating an unintended extra column.
- Alerts, Discover and Compare: separated loading, failed and empty states; guarded repeated alert read actions.
- Settings: clearer section headings, compact phone spacing, 44px motion and shortcut targets, width-safe form controls and readable phone inputs. Account feedback now appears after the heading.
- Monthly Plan: corrected light-only fallback colors, shortened the title and metric labels, aligned surfaces with the app, and removed a nested main landmark. All allocation logic and qualifications remain.
- Public pages: Help search now has match feedback and a clear action; narrow pricing features use one column; long concentration symbols wrap; legal controls have larger touch targets.
- Research and Options: keyboard-accessible, named scrolling regions retain every table column. Forecast and financial-period controls have larger targets. Earnings metrics adapt to narrow panels.
- Admin: narrow feature fields stack, touch/input sizing improves, and handbook reference tables can be keyboard-scrolled.

The existing pearl/sage and forest/citron visual direction, useful cards and metric grids are retained. This pass does not replace evidence with empty styling, remove advanced metrics, simplify financial formulas, change provider selection, or execute account actions.

## Coverage

Detailed route and state inventories:

- [Public pages and auth](verification/full-app-20261115/public-audit.md)
- [Home, Watchlist, Portfolio, Alerts and Discover](verification/full-app-20261115/workspace-audit.md)
- [Research, all sections, Labs and Options](verification/full-app-20261115/research-audit.md)
- [Settings, Compare, Monthly Plan, all Admin areas and shared states](verification/full-app-20261115/settings-admin-audit.md)

Inventories distinguish source tracing from automated rendered-component checks and from unperformed browser acceptance. Authentication handlers are not app screens. Market and earnings tools are embedded surfaces, not additional page routes. All declared page routes are included in the HTTP smoke check, but signed-out HTML does not prove signed-in screen behavior.

## Evidence and integrity

Current aggregate outcomes are in [the verification summary](verification/full-app-20261115/summary.json). Independent review inspected every changed baseline component/style diff and found no confirmed new defect; its 48 focused tests passed. New tests were observed failing before the related fixes. Intermediate runs during simultaneous edits had expected failures; only the final aggregate result is authoritative.

The baseline ZIP was verified by SHA-256. No baseline source file was removed. All 336 files under lib, services, API routes and database/migration directories are byte-identical to that input. No production deployment, push, migration, purchase or real account mutation occurred.

## Required acceptance before deployment

1. Use Node 24, install with npm ci, then run npm run verify and npm run test:api.
2. For fixture-only review, run AURYN_ENABLE_PREVIEW=true npm run dev. Preview routes remain localhost-only and unavailable in production.
3. Open every route and inventory state at 320, 390, 768 and 1440px. Check both themes and increased text, long company names, missing data and expanded controls. Confirm visual grouping, readable financial meaning, no document overflow and useful tap targets.
4. Test navigation, repeated clicks, Back/Forward, search, dialogs, Escape, backdrop/Close/Cancel, keyboard focus and horizontal-table access. Inner Research view/input resets on outer-tab unmount are unchanged and need evaluation.
5. Test real authorized account loading/saves, sign-in/recovery/sign-out, access/billing states, support delivery and live provider data separately. Do not infer these from fixture tests.
6. Test installed iOS/Android portrait/landscape, keyboard appearance, safe areas, offline recovery and explicit Update & reload.

The available cloud computer could not support the previous browser-preview attempts; no other connected environment is available. No denied action was retried. There are no new screenshots or measured browser/device results for this final candidate. Tests and source review do not guarantee zero failures or premium visual quality.
