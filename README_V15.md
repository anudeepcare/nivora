# NIVORA V15 — Mobile + Performance

- Decision-first stock loading: core Twelve Data analysis renders before SEC/Finnhub evidence.
- Shorter upstream timeouts and Vercel CDN cache headers for repeated/multi-user searches.
- Singleton Supabase browser client and 12-second sign-in fail-fast UX.
- iPhone chart reduced to 260–280px; mobile price-line label collisions removed.
- Mobile tabs are swipeable, non-sticky, safe-width controls.
- Catalysts/news/earnings/fundamentals/technical layouts corrected for narrow screens.
- Bottom navigation respects iOS safe areas and content has enough bottom padding.
- Portfolio/watchlist narrow-screen overflow and editing controls improved.

Important: add environment variables in Vercel. `.env.local` is intentionally excluded.
