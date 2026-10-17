# AURYN — full-source UX repair

The repair replaces the stack of global styles with one active stylesheet, fixes authentication navigation, improves Home/Saved quote loading, removes duplicate holdings and empty panels, and repairs controls across mobile and desktop.

## What changed

- Login, registration, password recovery and onboarding use a standalone account layout.
- Home requests quotes for every held/followed symbol instead of silently stopping after 12 positions. Saved refresh also refreshes prices; missing quotes remain explicitly missing.
- Portfolio has one holdings view, a bounded balance chart, aligned add/edit fields, spaced action buttons, accurate quantity/cost handling and simpler allocation. Recorded balances are not presented as cash-flow-adjusted returns.
- Research horizon updates the visible assessment. Decision/DCA stay before the chart. Weekly candidate support/reclaim levels are visible independently of execution permission. Candidate levels never grant an entry or become fair value.
- Technical cards fit narrow screens. More menus align their arrows. Chart ranges preserve the canvas, scrolling works over the chart, and close/Escape interactions are tested.
- Financial sparklines show observation dots and explain gaps. Empty financial coverage shows one clear state instead of several blank cards. Business evidence avoids repeated placeholder panels.
- Research Lab does not present empty performance cards or an unvalidated candidate inventory as useful results. Denied Paper Lab access identifies the permission issue without claiming the broker is unconfigured.
- Settings previews fit their controls. Account/profile and onboarding use the same forms and buttons; duplicate appearance settings were removed from the profile page.
- Mobile header padding accounts for safe-area insets. Main touch controls are enlarged. Notes, expanded financial panels and paper-order controls have consistent spacing.

## Verification and limits

**Production build and 961 tests passed.** Browser verification passed 139 route/section checks, 14 final interaction checks and 38 final defect/responsive checks with no runtime errors. See `verification/repair-2026-10-17/VERIFICATION_REPORT.md` for exact commands, reports, counts, builds and scope. Browser fixtures validate the rendered application and interactions; they do not prove live account permissions, database RLS, provider entitlements or broker fills.

The complete source is provided. This is **not a claim that every requested product capability is production verified**. No push or deployment occurred. Trusted owner/admin setup and paper-safety migration status require live checks. Physical iPhone/Safari and email delivery were not tested. Six-to-twelve-month forward evidence and advanced portfolio exposure/transaction-history capabilities retain the limitations in `verification/next-build/REMAINING_GAPS.md`. Unsupported valuations and metrics are not fabricated. DCA intensity remains experimental, with no validated performance claim.

Follow `GIT_AND_VERCEL.md` to apply and verify the source. A successful local build does not update GitHub or Vercel by itself.
