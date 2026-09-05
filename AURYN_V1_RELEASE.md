# AURYN V1 — Ground-Up Product Foundation

AURYN replaces the legacy NIVORA presentation layer while preserving the existing Supabase project and validated market/portfolio engine services.

## New foundation
- New AURYN name, sigil, wordmark, graphite/ivory/bronze design system and app icon.
- New public landing experience and product vocabulary: Research, Portfolio, Monitor, Lab.
- Rebuilt responsive shell with dedicated desktop and mobile navigation.
- Re-skinned sign-in, registration and legal surfaces into the AURYN identity.
- Research home rebuilt around Business, Fundamentals, Technicals, Expectations, Catalysts and Risk.
- Stock research workstation restyled around answer → why → evidence → reassess, while preserving the existing decision engine.
- Portfolio command surface now exposes total value, unrealized P/L, benchmark context, cash, concentration, cost basis and capital priorities before deep evidence.
- Help/info affordances are intentionally low-attention and become stronger only on interaction.
- Existing Supabase auth and data schema remain compatible; no destructive migration is included.

## Engineering boundary
Internal `nivora-*` engine module names are intentionally preserved in V1 to avoid a risky cosmetic rename of validated logic. User-facing product copy is AURYN.
