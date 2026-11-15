# Login, scenario clarity and visual refinement

## Scope

Continues the full-app audit candidate. Its 1,602 archive files matched the input source byte-for-byte before this pass. All eight owner screenshots were inspected as examples, not as the scope limit. Shared tokens and component styles were swept across public/home, auth, Research, Portfolio/Watchlist, Plans, Options/contribution, owner guide and settings/chrome; this is source-level coverage rather than a claim that every route/state was rendered.

- Login: the shell used Session.module.css, but social buttons, their SVG sizing and form primitives depended on a stylesheet imported by the dynamically loaded Product. The Session module now owns these rules, so direct login does not depend on visiting the workspace first. Authentication behavior and credentials are unchanged.
- Scenarios: the screenshot shows all three labels with unavailable values, not hidden cards. Both views use the same selector. Missing evidence now identifies the model rejection and distinguishes incomplete analyst bounds from supplied but inconsistent bounds. Existing targets remain untouched; no analyst low/high or fundamental prices are invented. Symbol-keyed requests and stale-completion guards were traced; no production race was proved from the screenshots. The exact FPS response was not supplied.
- Composition: the overview read and scenario panel share a desktop row with consistent insets; consensus follows on its own row. Responsive stacking is retained.
- Color: the dominant canvas, selected/hover navigation and key surfaces use a cooler opal/ink/iris direction rather than repeated beige/forest. The faceted diamond remains recognizable; semantic positive/negative/neutral colors remain differentiated.

## Verification and limitations

See verification/reliability-20261115/summary.json for final automated outcomes. New focused regressions cover auth CSS ownership, scenario evidence/short-history consistency and layout/color contracts. Full checks and controlled API fixtures are run against the integrated source.

Chromium could not launch in this environment because the OS disallowed a required socket. No final browser screenshots, device tests, real sign-in or live-provider validation are claimed. The supplied screenshots establish the reported symptoms, not the final visual result.

Before deployment, use Node 24 and run npm ci, npm run verify and npm run test:api. Check direct /login in a fresh browser context, homepage-to-login navigation, Back/Forward/revisit and narrow layouts; verify compact OAuth icons, password reveal/recovery and loading/error states. The optional scripts/check-auth-styles.mjs harness checks auth primitives without Product CSS where a local browser is available.

Review both themes at 320, 390, 768 and 1440px, including navigation hover/focus, long/missing data, the overview paired cards, consensus expanded, and Valuation scenarios. Use actual authorized accounts and current provider responses separately to confirm sign-in and the exact FPS evidence state. No deployment or account mutation was performed.
