# Screenshot-led regression repair

The eight screenshots supplied on November 16 show identifiable missing presentation ownership after the compatibility cascade was removed. This is not evidence of a cache problem. The earlier direct CSS-module export test did not check raw class selectors, and therefore did not catch these regressions.

## Observed and repaired

- Investment case: native unstyled Ask AURYN buttons, ownership surface absent, business driver numbers concatenated with labels. Dedicated Analyst/Ownership owners, explicit business row spacing and responsive grouping added.
- Financials: black cash-waterfall SVG bars, ungrouped explorer summary values, oversized uneven detail cards. Explicit fills now match actual SVG data-tone values; explorer metrics own their layout; financial detail cards have natural height rather than unsupported equal-height filler.
- Technicals: current/confirmed Pace values concatenate, chart time-range controls use browser defaults, chart footer controls occupy an oversized full row, indicator popup labels/counts concatenate, price risk metrics lack grouping. Dedicated TechnicalPresentation/PaceReadings/TimingContext owners added, including 44px controls, grouped indicator triggers and responsive risk grid. Actual data/financial calculations are unchanged.
- Additional active-component audit found similar ownership gaps outside these screenshots: portfolio balances/context/risk, Discover/Compare Pace guidance, overview metrics/case highlights, Settings method metadata and Home agenda. Those are separately documented in post-legacy-owner-coverage.md.

## Scope and limits

Original screenshots were inspected directly. Source ownership, SSR control contracts and regressions are checked. No successful fresh browser render is claimed; previous local and cloud rendering attempts were explicitly blocked. These fixes must not be described as pixel-perfect acceptance. No claim is made that the displayed deployment hash matches the current source without checking /build-info.json on that deployment.
