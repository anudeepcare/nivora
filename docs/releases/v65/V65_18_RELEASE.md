# NIVORA V65.18 — WOW UX + Performance

## UX
- Mathematically centered desktop navigation independent of logo/avatar width.
- Unified typography, spacing and component rhythm across Analyze, Portfolio and Trading Lab.
- Cleaner first-impression Analyze composition with less dead space and stronger above-fold hierarchy.
- Restrained premium glass treatment on mobile navigation and shell only; large scrolling panels avoid expensive blur.
- Desktop content width and spacing tuned to feel like a premium product rather than a dense dashboard.
- Existing SVG circled info affordance preserved.

## Performance
- Analyze quote polling reduced to 20s and only refreshes while the page is visible.
- Below-fold evidence load is deferred to idle/short-timeout work after the primary decision surface is ready.
- Calibration fetch is cached in-memory and deferred.
- Trading Lab refresh polling reduced to 30s and visibility-aware.
- Large scrolling glass surfaces avoid broad backdrop blur/compositing costs.

## Safety
- No change to V65 scoring semantics.
- No change to Trading Lab risk gates or paper-only safety.
- Quote-integrity protections remain in place.

## Database
- No new Supabase migration required.
