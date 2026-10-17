# UI control and responsive source audit — 17 October 2026

This audit inspects the standalone `product/` application and the approved `docs/design/approved-pwa-20261017.html`. It does **not** certify the rendered patched application or an installed iPhone PWA. No browser, local server, account mutation, alert creation, password change, AI generation or paper order was performed for this audit. The earlier deployed-app audit is separately recorded in `LIVE_UI_AUDIT_20261017.md`.

## Repaired source defects

- Shared metric Help rendered a native dialog, headings and paragraphs directly inside its callers, including portfolio `<p>` elements and inline data stamps. Server-rendered paragraph content was invalid and could be repaired by the HTML parser before hydration. Help now renders only its trigger inline and mounts the opened native dialog through a body portal. Native modal focus, Escape and close behavior remain in use; dialog padding clicks no longer count as backdrop clicks.
- Search advertised an expanded listbox even when an empty query rendered no listbox. ARIA references now follow the actual results visibility. Keyboard selection scrolls into view, clearing returns focus to the input, leaving the search closes its results, and clicking options preserves input focus until selection.
- Search dialogs previously nested a limited-height scrolling results list inside an already scrolling dialog. Results now participate in the dialog's single scrolling area. Search dialogs start below the top safe area on mobile. Shared dialog width/height account for all four safe-area edges; background document scrolling is locked while a dialog is open.
- The shell already reserves `64px + env(safe-area-inset-top)` for the mobile header. That rule is preserved. Missing lateral safe-area protection was added to the mobile header, content and dock; desktop header/sidebar reserve safe areas too. No speculative extra top offset was added. Header search and navigation flex items can shrink correctly; long actions and search result text can wrap.
- A search modal closes on the actual pathname change, including transitions between research instruments. The keyboard shortcut does not open a second search modal over an existing editor. The skip link has a focusable main-content target; mobile Preferences identifies its active route.
- Portfolio's mobile holding summaries squeezed Price, Value and Unrealized into three narrow columns. They now use full-width label/value rows, with related source dates and percentages grouped with their value. The total can wrap; dashboard columns use explicit zero minimum tracks. Allocation labels can wrap within their track.
- Portfolio filters now match company names, tickers and cash. Portfolio/watchlist filters show a no-match state and a Clear filter action instead of a blank table or misleading empty-account message. The watchlist add dialog explains that selecting a company opens research, where Save to watchlist performs the action. The position editor has an accessible title and clears its error when closed by any native close path.

## Route/control inspection

Every allowed page route was traced through the catch-all page, Product router and its actual component. “Inspected” below means source handlers and destinations exist; it does not mean the action was clicked against production.

| Surface | Inspected controls and destinations | Boundary or follow-up |
| --- | --- | --- |
| Shell / all routes | Four desktop/mobile primary links, brand to Overview, Preferences, footer methodology, theme toggle, search shortcut/mobile trigger, skip link | Mobile header crop is not reproducible from source alone. Physical device acceptance remains necessary. |
| Login | Sign in, signup, reset-link request, switches between forms; reset redirects to Settings | No credentials submitted, email sent or reset flow executed. |
| Overview | Research action, allocation portfolio link, watchlist View all, company links, search | Quote/account loading must be checked after deployment. |
| Research home | Search, saved-universe company cards | No newly fetched live-data claims. |
| Company Research | Five tabs, saved-watchlist toggle, refresh, chart ranges/style, help, chart and thesis disclosures | Research/domain and approved-design changes belong to the main implementation owner. |
| Financials | TTM/annual/quarterly, chart/statement toggle, metric search/groups, expand, plot interaction, source links, close | Expanded metric dialog still closes when its own padding is clicked (`Financials.tsx`); consider the same bounds-based backdrop handling if that is undesirable. |
| Valuation / Technicals | Scenario choices and input changes; Fibonacci/manual-anchor controls; chart scroll options | Chart source disables wheel, drag and pinch capture. Physical page scrolling is unverified. |
| Watchlist | Search dialog, research navigation, filter, clear filter, refresh, remove | Selection intentionally opens research; the actual save action is there. Removal was not executed. |
| Portfolio | Add/edit form, cash toggle, cost currency, save, remove confirmation/cancel, old-currency confirmation, refresh, filter | No saved record changed. Unsupported instruments/currency need account-specific review. |
| Settings | Appearance, text size, motion, tool links, account sign-out, password update | No auth mutation. Theme preference and system-listener wiring inspected. |
| Discover | Saved criteria, bounded screen form, four filters, save screen, company links | At inspection, `Annual FCF` still labels `perspective.last`, which can now be TTM; owner follow-up. |
| Compare | Two-to-four-symbol form, saved comparisons, save, company links | At inspection, `Annual period` can label TTM. Failed/new requests retain old rows; owner should clear rows or label retained results explicitly. Intentionally absent from primary navigation. |
| Alerts | Create rule, threshold inputs, check now, delete, mark read, company links | No rule/history mutation. Manual/scheduled and no-email/push boundaries are stated. |
| Research validation | Symbol/cost input, comparison request, CSV export | At inspection, failed/new symbol requests retain previous results, and the displayed result heading omits the actual loaded symbol. Owner follow-up. |
| Paper trading | Save paused plan, pause all, arm/pause, run, reconcile, cancel | Source gating inspected only; no privileged call or order. Server authorization/configuration remains a separate gate. |
| Help / methodology | Static explanatory sections; route reachable from footer and Settings | At inspection, sources text still describes SEC-only statements despite the EODHD routing decision; owner follow-up. |
| AI disclosure | Availability check, explicit generation formats, download, citations | Generation stays unavailable when disabled. At inspection, evidence copy still says annual where `perspective.last` can be TTM; owner follow-up. |

Removed PortfolioTools and private-thesis/snapshot components are not restored to primary UI by these changes. Unsupported routes still invoke the route's not-found handling.

## Additional source finding

`Session.mutate()` awaits `reloadWorkspace()`, but `reloadWorkspace()` catches refresh errors without rejecting. A successful write followed by a failed reload therefore resolves to its caller, which can close an editor while the page still displays the preceding record snapshot. `workspaceError` is shown, but the interaction is not a confirmed fresh-state save. This was handed to the owner rather than changing shared session behavior in the shell repair scope.

## Verification actually run

- Added two actual-component server-rendering regressions in `tests/ui-controls.test.mjs`: paragraph-safe Help markup and empty-search listbox semantics. Both failed for the original behavior and passed after the changes. These tests assert rendered component output, not stylesheet/source text.
- `npm run typecheck` passed after the UI changes.
- Full `npm test` at this handoff: 118 passed, 2 failed. Both failures were the existing `tests/release-review.test.mjs` Research extraction tests (`the actual Snapshot renders quote fallback provenance` and `unverified upcoming EPS is never formatted in the listing currency`) because the owner's new `DecisionBrief` component was not yet supplied to that test harness. The owner was notified and is updating its bindings. This is not a green whole-suite claim.
- No pixel comparison, browser rendering, software-keyboard test, VoiceOver test, installed-PWA safe-area measurement, or end-to-end mutation acceptance was performed. Compilation and SSR checks cannot establish those outcomes.

## Required rendered acceptance

At minimum, check 320/375/393px widths and landscape, light/dark and large text; the installed iPhone launch/scroll header; search with keyboard visible and many long results; modal close/Escape/focus return and background lock; all five research tabs; long-name/high-value portfolio records; filter no-match recovery; and normal page scrolling across charts. This is an acceptance boundary, not evidence that those checks already passed.

## Integration follow-up

The owner repaired the noted TTM labels in Discover, Compare and Analyst; updated the data-source help; cleared Research Lab and Compare results before new requests; added the actual ticker to the Research Lab heading; and corrected metric-dialog padding click handling. The DecisionBrief test bindings were updated. The final integrated run passed 124 tests plus TypeScript and the production build. Shared-session refresh-after-write remains a reported limitation: a successful write with failed reload displays workspaceError but may leave the preceding account snapshot visible. No account mutation was used to validate that path.
