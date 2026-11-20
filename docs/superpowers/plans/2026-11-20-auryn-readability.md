# Auryn r33: carry the approved visual language across the app

Use the user's six deployed screenshots; keep Auryn's logo, floating workspace navigation, Atlas structure, light/dark support, data and controls. Do not replace the design or add providers. Use consistent readable values, emphasis only for meaning, short help, visible focus, flat grouping without nesting/top accent bars, and aligned widths.

1. Sign-in and public welcome: fix oversized lock, visible accessible Close/back-to-Auryn flow, compact header and auth controls while retaining existing auth providers/logic; make the legacy walkthrough visually match the existing new public hero. Regress via auth/public tests and mobile width checks.
2. Market Radar: compact unified layout for loading, unavailable, actionable setup and actual/sampled scope; no duplicate lower evidence wrapper or fake data. Ensure retry and controls remain operable in tests; preserve data behavior and access rules.
3. Research: apply on Atlas and all main/subtabs through shared composition and consistent chart/table/help patterns, improve actual metric and unavailable text, preserve lookup, scenarios, Pace, and chart data. Test selectors and current views.
4. Settings/admin and Help: improve all surfaced controls and view hierarchy, keep permissions, text, and links; verify focus/layout and semantic structure.
5. Whole UI pass: shared buttons, table/readability, popups, navigation and dialogs (including reserve for keyboard focus & mobile scroll). Verify compile, representative routes and tests. Package one clean ZIP, no push or deploy, state only what was proven.
