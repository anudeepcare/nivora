# NIVORA V5 Clean
This pass deliberately removes UI noise instead of adding features.

Changes:
- 3-item navigation only: Home, Analyze, Watchlist.
- Profile, Alerts and Logout moved into one account menu.
- Home reduced to one primary search + three discovery choices.
- Cleaner beginner-first language on analysis.
- Existing real chart, levels, fundamentals, filings, news integration, auth, watchlist and alerts retained.
- Existing fast company-name/ticker/crypto alias search retained.

No database migration is required from V4.
Use the same `.env.local`, then `npm install` and `npm run dev`.
