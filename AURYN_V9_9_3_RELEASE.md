# AURYN V9.9.3 — Paged Validation Universe Loader

Fixes the Supabase Gateway Timeout seen when V9.9.2 requested up to 6,000 full `nivora_market_universe` rows in one `select("*")`.

- selects only `symbol,sector,asset_type,name,priority`
- reads deterministic pages of up to 1,000 rows
- stops when the final partial page is reached
- retains V9.9.1 stratification and V9.9.2 immutable run lifecycle
- no UX or CIO algorithm changes
