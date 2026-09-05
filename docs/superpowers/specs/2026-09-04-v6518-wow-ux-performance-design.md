# NIVORA V65.18 — WOW UX + Performance Design

Approved direction: NIVORA must feel like a premium modern product on first impression, not a dashboard. Desktop and mobile must share one coherent visual language while remaining fast.

## Locked experience
- Analyze, Portfolio and Trading Lab use one responsive typography/spacing/navigation system.
- Desktop content is centered with intentional max-width and balanced whitespace.
- Mobile uses restrained frosted/glass navigation and surfaces with safe-area spacing; avoid expensive blur on large scrolling panels.
- Navigation is perfectly centered horizontally and vertically on desktop; active state is visually balanced.
- Typography hierarchy is consistent: page title, section title, metric label/value, body copy, buttons/tabs.
- All info controls use the real SVG circled-i component.
- First viewport must immediately show useful content with strong hierarchy and no giant dead space.
- Portfolio retains meaningful performance/driver/allocation/risk visual analytics and AI portfolio explanation.
- No new dashboard clutter, duplicate data, or decorative charts.
- Preserve existing decision/scoring semantics and Trading Lab safety.

## Performance goals
- Eliminate obvious duplicate client fetches and avoid refetching unchanged data during simple UI interactions.
- Parallelize independent requests when safe.
- Reuse shared quote/market responses through existing cache layers.
- Defer below-fold, non-critical UI work until after the first decision surface is ready.
- Avoid broad backdrop-filter/blur on large scrolling content surfaces.
- Keep interactions immediate: nav, period tabs, portfolio visual modes.
- Do not weaken quote-integrity safety or data correctness for speed.
