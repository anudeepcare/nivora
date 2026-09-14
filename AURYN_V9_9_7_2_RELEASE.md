# AURYN V9.9.7.2 — Market Truth Arbiter

Root cause confirmed from production evidence and source tracing:
- `/api/quote` used `Promise.any`, so the fastest provider became display truth even when another configured provider disagreed.
- Alpaca latest quote/trade requests did not explicitly pin the IEX feed.
- Regular-session research quotes allowed provider timestamps up to 15 minutes old.
- UI could downgrade from a recently accepted live display quote back to canonical verified research truth during transient refresh/provider state changes.

Fix:
- Alpaca latest quote and trade requests explicitly use `feed=iex`.
- Regular-session fast quotes must be <=60 seconds old.
- Configured fast providers are evaluated together; >1.5% fresh-provider disagreement is rejected rather than displayed.
- When providers agree, the newer timestamp wins.
- The page keeps the last accepted live display quote for the existing 90-second grace window and does not downgrade during transient refresh.
- Execution verification remains independently gated by canonical market truth.
- No CIO formulas, scores, thresholds, validation queue, Supabase schema, or UX layout changes.
- `vercel.json` remains `{}`.
- No SQL or Supabase migration is required.
