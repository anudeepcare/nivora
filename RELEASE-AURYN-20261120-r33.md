# Auryn r33 · Readability and mobile refinement

The approved r32 layout and Auryn branding are the baseline. r33 reworks legacy sections rather than replacing the product.

- Public Home: reorganized lower walkthrough, use cases and Pace section. Sign-in: compact controls, a labeled Close action, and bounded security icon. No additional sign-in provider.
- Today: Market Radar clearly separates the daily snapshot from optional local evidence. A storage setup, interruption, loading or empty state is not counted as ready. If preprod still reports a storage problem, the administrator should check the deployment database schema, grants and schema cache against its existing migrations. This ZIP does not diagnose the deployed database or apply its migrations.
- Research: scenarios are easier to find below Atlas; research lenses use cleaner secondary controls, legible metric values, more readable tables, and fewer nested frames.
- Workspace: compact Portfolio mobile controls and holdings, tighter discovery and screener layouts, and cleaner Watchlist and Compare sections.
- Settings, Owner, Help and Support plus shared metric explanations and application dialogs now follow the same theme; keyboard focus and mobile safe areas are preserved.

Provider calls, quote and research models, permissions and database migrations were not changed. App reference boards are not verification of live data. The owner deploys this archive; do not treat it as already published.
