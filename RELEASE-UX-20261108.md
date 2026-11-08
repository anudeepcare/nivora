# AURYN — Pace, scenarios and simpler research

Source handoff. No deployment, database migration or scheduled-job change was performed.

## Visible changes

- Pace shows approximate stock-specific dollar edges under all five P0–P4 stages, highlights the current zone and displays the current price. Full conditional bands and history stay one step deeper. Disconnected bands are retained; the interface does not assume the classifier is monotonic.
- Bear/base/bull scenarios are visible on Overview and Valuation. All three research surfaces share one scenario component and fiscal-year selection. Only supplied, eligible annual forecasts become year choices.
- A compatible reported multiple remains the preferred earnings input. When that input cannot be reconciled and no qualified independent model is available, a clearly labeled price-anchored EPS sensitivity uses current price / nearest supplied annual EPS as its central multiple. Cases combine low/average/high EPS with 0.8×/1×/1.2× multiples. These presentation scenarios do not change the Pace or investment-decision engine.
- Valuation has six primary multiple cards in three columns. Earnings yields sit under the corresponding P/E; dividend yield remains secondary. Analyst consensus stays separate; low/high analyst targets are never invented.
- Repeated Business hero metrics were removed. Statement metrics, Pro tools, research styles, technicals and options practice remain available.
- Financial-history charts observe their HTML container and preserve SVG aspect ratio. The cash-generation bridge has an explicitly labeled spending deduction and a minimum visible mark.
- The Home news panel fills its row, earnings rows are compact, the checked timestamp moves into refresh detail, and a daily-brief banner links to the calendar.
- Owner topics use short titles, a plain-language summary and three takeaways. Full explanations and formulas remain expandable. The mobile chapter picker is hidden on desktop.
- Saved-view controls and the Research notes/print block were removed as requested. Existing stored notes and legacy saved data were not deleted. Account snapshots, replay and exposure diagnostics remain.
- Backup quotes use a small amber badge. Price/volume context is open by default; chart inspection instructions have normal weight, and price-scale padding leaves more space below the series.

## Scope and limits

The existing saved 589-stock agreement comparison is unchanged. It is category agreement on that snapshot, not future-price forecast accuracy. Live protected APP data was not accessed or verified. No guaranteed future-price accuracy or 100% competitor match is claimed.

A dark floating control visible in the supplied screenshots was not found among the application's rendered controls; no unrelated browser control was hidden. TradingView attribution remains present.

## Verification

- Full suite: 1,229 passing tests, zero failures.
- Browser fixtures: 40 passing checks across 320/390/768/1440 widths and light/dark themes; includes year synchronization, financial-chart aspect ratio, owner navigation, Pro calculator and options navigation.
- Shared Pace engine: 589 saved stocks reproduced with zero differences from the enabled classifier snapshot. Reserved agreement remains 159/182; deeper reserved agreement remains 53/69.
- ESLint, formatting and TypeScript/build checks run for this handoff. Fixtures are not a substitute for live provider or physical-device validation.
