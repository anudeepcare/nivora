# Entry surfaces: clean presentation migration

Scope: PublicLanding, Session/PasswordRecovery auth, LaunchScreen, Shell and Search. No account/network/data/mutation handlers changed.

- Public no longer imports IntegratedExperience. Uses its own footer, brand/navigation, sample-guide and illustration styles. Retains approved two-column public structure and no fabricated live market values. CSS has a single rule per selector per responsive context; obsolete local styles removed.
- Shell rewritten scoped CSS owns desktop header, selected links, mobile dock, safe-area padding, all account tools, search modal and route progress. All existing router/history restoration and signout handlers preserved.
- Auth stylesheet rewritten with full field/provider/password/recovery/message/brand primitives. It needs no Product lazy CSS, avoiding first-load/revisit differences. PasswordRecovery uses same composition. 48px text fields, 44px icon controls and16px input fonts retained.
- Search now owns form, suggestions and result positioning/colors/touch targets; old green focus override removed. Behavior and query/selection logic unchanged.
- Launch owns skeleton/retry/slow/loading/empty recovery state presentation. No artificial minimum wait added.

Dependencies: canonical token/foundation resets and shared standalone Ui ProductFooter, AccessNotice and ReleaseNotice. No legacy-panel or appearance override import in these renderers/modules.

Validation: 32 entry/ownership/auth/public/recovery tests passed; TypeScript and edited TSX ESLint passed. Source-only review; browser visual fidelity and actual auth/network journeys not claimed.
