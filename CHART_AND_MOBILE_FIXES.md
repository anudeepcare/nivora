# AURYN — chart and mobile-menu fixes

This update addresses the October 15 feedback on chart gestures, short chart ranges, first-glance decisions, weekly dates, overlapping Technicals sections and mobile menu spacing. It includes the full prior source package and these changes.

- Wheel and vertical touch gestures scroll the page over charts. Zoom uses explicit +, − and Reset buttons. Desktop dragging still pans the chart. Intraday axes show times.
- Crypto 1D requests a full 24-hour window of 15-minute bars; 1W requests seven days of hourly bars. Equities show the latest available regular session or five available trading sessions. Extended-hours entitlement is not required for these views.
- Provider failures have readable explanations and a Retry history action. Changing to a failed range clears the earlier chart. Invalid timestamps/prices and duplicate observations are rejected. Failed provider payloads are rejected before cache insertion; validated responses still share the existing cache.
- The existing canonical new-money, owner and multi-year decisions now appear before the chart. This changes presentation, not investment-engine rules or trading permissions.
- Weekly anchors say “Week of Jul 20, 2026” instead of raw ISO dates. Confirmation dates identify when the two following weeks had closed. Nested Technicals sections have separate gaps and bottom padding; disclosure statuses align beside the expansion control.
- Mobile navigation uses four equal-width tabs in a floating glass dock, consistent icon/label spacing, a clearer selected tab and at least 44px touch targets. Safe-area spacing sits outside the dock. The account menu has larger touch rows and a high-opacity glass surface for readability. Reduced-transparency preferences use opaque surfaces.

No paid service, new dependency, environment variable or database migration was added. The existing Twelve Data service supplies history. Chart observations remain research data; crypto charts do not authorize execution.

Read `verification/VERIFICATION_REPORT.md` for measured results and limits. `verification/CHART_FIX_VISUAL_REVIEW.html` shows production-build captures with intercepted test data. `DEPLOYMENT.md` contains the GitHub/Vercel commands. This source package has not been pushed or deployed by this session. Physical iPhone Safari, deployed end-to-end authentication/database actions and an intended paper order lifecycle still require configured-environment acceptance.
