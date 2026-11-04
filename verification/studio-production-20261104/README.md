# AURYN Studio production integration — November 4, 2026

This is a real Next.js source integration, not a replacement static mock. Production has not been deployed.

Implemented:
- New component-owned desktop sidebar, tablet rail and mobile dock. Shared search retains keyboard shortcut and dialog behavior; links retain actual routes.
- Blue five-stage Pace component on all consumers, including public/auth consumers; confirmed/forming/exploration state still comes from the existing policy adapter.
- Research section icons and category colors.
- Four overview evidence panels using overviewEvidence, with available reported metrics, null handling, descriptions and dates. Crypto suppresses unsupported financial and valuation destinations.
- Compact workspace heading/metric primitives with icons for value, return and watchlist metrics.
- Tighter settings geometry and shared warm neutral surface tokens.

Verification:
- Final full regression suite passed 881/881.
- Final optimized Next.js production build passed, including TypeScript checking and all 34 static pages.
- Added two regression checks for short-window sidebar scrolling and unsupported crypto destinations, both observed failing before correction and passing afterwards.
- Browser checked eight actual React preview routes: overview, research library, watchlist, portfolio, discover, settings, alerts, compare. All rendered and no document horizontal overflow at desktop viewport.
- Research technicals opened and retained detailed daily studies, averages, momentum, volume, volatility and price levels.
- Browser data was the existing clearly labeled demo adapter; these checks do not validate live provider results.
- 390px iframe QA was blocked by the app's frame protection. No security headers were weakened. Physical-device/mobile browser verification remains incomplete.

Limitations:
- This integrates the shared visual foundation and research overview, not a finished redesign of every individual legacy panel. Legacy compatibility styles remain for existing feature panels.
- Authenticated live-provider, billing, notification-delivery and 200-ticker accuracy validation were not performed.
- Existing uncommitted work was preserved. This archive includes that current source state and must be reviewed before release.

Run locally: npm ci, configure your own environment variables, then npm run dev. Normal pages use the actual integrations. Local-only demo routes require AURYN_ENABLE_PREVIEW=true and use /preview/overview or /preview/research/APP. Never ship demo settings as production configuration.
