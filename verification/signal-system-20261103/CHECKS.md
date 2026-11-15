# Shared design implementation — 2026-11-03

This records the actual local application build, not the generated design board. Screenshots use the existing guarded /preview routes with illustrative fixture data. Production data fetching and financial calculations were not replaced.

## Changed
- Shared light/dark styling, navigation, typography, controls and page spacing for public, authentication, legal and signed-in routes.
- Research now has one primary navigation row. Remaining research sections are available through More research.
- Chart and valuation scenarios are consecutive in one column; Pace and analyst coverage use a separate rail.
- The summary shows the business assessment and first risk without opening a drawer. Expanded evidence retains explanation, entry/holding context and actions.
- Visible confirmed P0–P4 scale, clearly styled help triggers, compact chart timeframes and colored Fibonacci overlays.
- Public product guide has keyboard-operable Business/Value/Pace tabs, with a distinct How it works introduction.
- Portfolio, Watchlist, Home and Settings share the design. Settings display controls start expanded. Saved theme/accent/spacing/text preferences remain supported.
- Document scrolling replaces conflicting workspace/inline evidence scroll containers. Wide tables and intentional overlays retain their own overflow behavior.

## Browser checks
Desktop viewport approximately 1353 × 929. Verified actual UI:
- Public homepage and product-guide tab changes via keyboard.
- How it works route and anchor scrolling to its guide.
- Terms via footer link; matching document layout.
- Signup, login and recovery mode navigation without submitting credentials.
- Home and Research directory.
- Portfolio scrolling and filtering to MSFT.
- Watchlist table and scrolling.
- Settings in light and dark appearance; Ocean accent resolved to #00777d; Larger text resolved to 16px. Preferences reset to defaults afterward.
- Research Overview, Business, Technicals, Analysts and Options.
- Chart period changed to 3M (67 observations), Fibonacci toggle and chart crosshair.
- Research root/inline content overflow is visible; desktop root has no horizontal overflow.

## Verification limits
- Responsive rules are implemented, but this browser surface does not expose viewport resizing. Physical mobile/device QA remains pending.
- The local authentication configuration reports sign-in temporarily unavailable. No real login, registration or password reset was submitted.
- Fixture data contains no usable options snapshot or analyst consensus. Empty states were verified; live options/analyst payload rendering was not browser-verified here. Existing automated tests cover their data handling.
- This is a local source handoff. The existing GitHub integration rejected writes earlier (403), and command-line Git has no write credential. No updated Vercel deployment is claimed.
- Visual similarity is subject to review against the approved board; no pixel-identical or 10/10 claim is made.
