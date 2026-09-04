# NIVORA V9 — fast-path fix

Changes:
- Auth gate uses local Supabase session first instead of blocking on remote `getUser()`.
- Core stock analysis renders independently; SEC/company/news modules load progressively afterward.
- Core market-data request aborts after 9 seconds with a usable retry state instead of hanging forever.
- Lightweight branded boot state replaces the blank "Loading NIVORA..." screen.
- Mobile navigation becomes a reachable bottom bar and analysis grids collapse cleanly.

If an authenticated page redirects to /login, sign in once again so Supabase refreshes the local session.
