# AURYN V3.3 — Complete Product Shell

## What changed
- Added shared AURYN product footer to authenticated application shell.
- Restored About, Methodology, FAQ, Terms, Privacy and Risk Disclosure navigation.
- Extended authentication legal/product navigation.
- Completed V3 Portfolio presentation for capital summary, condition, periods, metrics, capital priorities, visual intelligence, holdings, allocation/risk and deeper evidence.
- Added responsive Portfolio evidence components and performance chart styling.
- Added AURYN V3 containment/styling for deeper Stock evidence and Thesis screens.
- Preserved Stock route inside AppShell.
- Removed user-visible `Current NIVORA evidence...` portfolio copy.
- Added V3 legal page styling.
- Preserved Monitor and Trading Lab behavior; Trading Lab remains paper only.

## Verification
- AURYN V3 contract suite: 18 tests, 18 pass.
- CSS braces and active AURYN Portfolio selector coverage checked.
- Production build cannot be executed in the artifact environment because dependency installation is unavailable and the source package intentionally does not contain node_modules. Vercel must perform the dependency install/build.
