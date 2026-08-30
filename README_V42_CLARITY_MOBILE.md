# NIVORA V42 — Clarity + Mobile

This release is a stabilization and UX-clarity pass on V41.

Key changes:
- Removed unreachable legacy V31 Intelligence Grid code that was causing strict TypeScript nullability failures.
- Fixed Simple / Investor / Pro active-state text contrast.
- Made the price plan easier to understand: Best Buy Area, Now, Buy if Strength Confirms, Target, Reassess Below.
- Separated the pullback target from the post-confirmation objective so confirmation and target logic no longer conflict visually.
- Replaced confusing missing-data wording with an evidence-coverage note.
- Improved research-card labels: Business Quality, Price Setup, Risk, News / Catalysts.
- Reduced empty-space/min-height artifacts in the research panel.
- Mobile decision plan is now visible without horizontal scrolling: the five plan states stack into an app-like grid.
- Improved mobile touch targets for horizon, position and Simple / Investor / Pro controls.
- Updated Radar language from R:R to Reward / Risk.
- Updated model version label to NIVORA V42.

Validation performed in the build environment:
- TypeScript parser/transpile diagnostics: 0 syntax errors in StockClient.tsx and TodayClient.tsx.
- SEC 13F Python sync script: py_compile passed.
- Full `next build` cannot run in this environment because project dependencies / `next` are not installed. Vercel should run the authoritative production build.
