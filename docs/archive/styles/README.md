# Archived compatibility sources

These 40 original stylesheets are the pre-consolidation reference, not application imports. Their ordered cascade now lives in `app/core/legacy-panels.css`, reached through `app/core/compatibility.css`. The active file retains `BEGIN legacy-source` / `END legacy-source` comments so feature regression tests inspect current rules through `tests/read-compat-css.mjs`.

`foundation.before.css` records the foundation before its font registration and root/theme tokens moved into `app/core/tokens.css`. Keeping font registration with the token prefix preserves the exact expanded node order.

`tests/css-consolidation.test.mjs` expands the archived and current import trees and compares every ordered semantic AST node, including declarations, importance, selectors, media conditions and layer boundaries. It also checks that relocated asset URLs do not depend on their old directory. Archives must remain unchanged; future intentional style changes should update the relevant equivalence baseline explicitly after review.
