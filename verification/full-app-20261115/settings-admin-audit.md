# Settings, admin and shared-state audit · 15 November 2026

Source and regression-test coverage only. The only available environment is the same cloud computer where prior browser access was blocked. No denied browser operation was retried. No final screenshots, physical-device or real-account acceptance is implied.

## Screens and paths checked

- Settings: direct entry and return-to-context navigation, account loading/failure, Free/Pro/owner label, plan shortcut, sign-out busy/error, light/dark/system theme, standard/large text, motion preference, simple/detailed research, spacing/reset, research style/horizon, saved chart period/watchlist order/evidence cards/concentration threshold, saved-preference pending/error, identity providers, password idle/busy/error/success/preview-disabled and support/analytics/admin links. Existing account/auth APIs unchanged. Confirmed corrections: accessible h2 section headings; feedback positioned directly after heading; 44px motion target with compact inner track; narrow fields/fieldset constrained to available width; compact phone card padding; readable 16px phone inputs; touch-sized shortcuts and reset.
- Compare: initial guidance, saved comparisons, company search/input validation, loading, fetch issues, multiple company table/chart, missing/incompatible periods/currencies, save, contribution comparison. Confirmed correction: loading/error no longer show unrelated first-use empty guidance; comparison table is a named keyboard-scrollable region. Calculation and comparison compatibility unchanged.
- Monthly Plan: no workspace, quote refresh, sample data, contribution/cap inputs, candidate selection and limit, incomplete inputs, priced allocation/retained cash, position rows, research links, notes and draft download. Confirmed corrections: use actual theme tokens rather than undefined light fallbacks, remove nested main landmark, shorten headings/metric labels without altering allocation qualifications or values, keep phone fields at 16px and use consistent surfaces.
- Admin People: owner-only gate, initial load/error/retry, access preview, member search/filter, active/expired grants, duration/custom-date dialog, close/cancel, busy/result, revoke/all-revoke disclosure and activity. Source unchanged except shared mobile control CSS. Phone feature fields now stack at 480px; action/date/text controls are at least 44px with 16px phone input text.
- Admin Features: Free/Pro defaults, quotas, per-feature access rows, save status. Mobile layout/control fixes only; no rule/entitlement/API changes.
- Admin Payments: billing check, configured/unavailable status, plan configuration. Same mobile control correction; no checkout or billing action executed.
- Admin Support: list loading/error, unread/all/status filters, search, ticket expansion, triage state, selection/bulk actions, assignment, receipt status and screenshot links. Existing responsive CSS, busy guards and consent/privacy information retained. No support mutation executed.
- Admin Owner handbook: private server-only fetch, loading/error retry, chapter search/no matches/clear, technical-reference toggle, mobile topic selector, active chapter focus, concise overview/full detail, tables, previous/next and download. Added named keyboard-scroll regions to reference tables; private content/API stays unchanged.
- Admin Validation & records: anonymous-observation form with consent, loading/save status; public Pace observation form and append-only disclosure. Preserved every permission warning and submission path. No record created.
- Shared shell: main/mobile active route, tools menu, account error, settings return context, search dialog/keyboard shortcut/backdrop/close, disabled preview account actions, footer/help/return. Existing source and navigation regressions retained.
- Shared search/select/help: native one-control selects, 16px text input, results loading/error/no matches/clear, focus/keyboard selection, native dialogs, help targets with coarse-pointer enlargement. No additional confirmed defect changed.
- Loading/access/error: LaunchScreen short-height recovery padding, retry/sign out, skeleton and partial access states; 404 recovery; offline page safe-area/theme/readability and update consent. No additional confirmed defect changed. Session/auth/runtime failures and actual focus return require browser checks.

## Regression evidence

Eight initial CSS/source regressions failed before implementation; all pass after. A second group failed for comparison loading/error and handbook table accessibility, then passed. Three comparison cases render the actual component with fixture state; CSS tests inspect declarations and responsive contracts rather than claiming computed layout. Existing Settings return-context/sign-out/motion behavior and allocation tests also passed in a 33-test focused run.

## Remaining gates

All final rendered responsive layouts, light/dark/large-text appearance, real keyboard focus and Back/Forward behavior, physical iOS/Android safe areas, installed/offline app, account password/sign-out/save, billing, support delivery, grants and live market data remain unverified. These are acceptance tasks, not completed claims. No financial formulas, protected API/database/provider files or production configuration were edited.

## Combined candidate verification

After all presentation edits finished, the final `npm run verify` completed successfully: 1,616 tests passed, zero failed or skipped, with lint, formatting, typecheck and production build also passing. The parent summary records API/HTTP/package outcomes separately. Earlier concurrent runs above are historical, not the final result. Browser and device acceptance remain unverified.
