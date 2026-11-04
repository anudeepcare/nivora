# Design review coverage

This checklist separates a navigable layout from a fully specified behavior. No row is a claim of production completion.

| Area | Represented in this draft | Remaining before integration approval |
| --- | --- | --- |
| Public | Home, process, pricing layout, approach, Pace, support, contact, legal reading shell | Exact existing plan entitlements, prices and legal copy; all footer content |
| Authentication | Sign-in, signup, recovery forms and validation presentation | Provider errors, verification/reset confirmation, OAuth transition states |
| Home | Portfolio summary, followed companies, news, earnings agenda, concentration | Real-data fixtures with long names, many events, currencies and delayed coverage |
| Research overview | Quote, timeframe and chart style controls, Fib overlay, Pace, analysts, key metrics, scenarios, news | Exact decision states, specialist/crypto variants, all source dates and eligibility gates |
| Business | Performance chart choices; TTM/annual/quarterly controls; statement table; all 36 catalog definitions; evidence layout | Complete statement values, period reconciliation, specialist financial metrics, source links |
| Valuation | Scenarios, cash-flow assumptions, multiples | Existing model eligibility, sensitivity output and calculation parity |
| Technicals | Price map; 31 trend/momentum/volatility/participation indicators; reference levels; Pace history | Actual indicator values, custom-anchor calculations, historical policy evidence and all help definitions |
| Analysts | Distribution, low/average/high targets, coverage/rating table | Real firm coverage, sparse/missing consensus states, historical target data |
| Options | Gamma map, contracts, long-term contracts, seven strategy selectors, learning topics | Skew/term-structure/gamma-curve charts, contract filtering, strategy-specific input/output and payoff behavior |
| Ownership | Business case, institutions, insiders, Congress, research notes | Filing/disclosure tables and sources; actual holdings semantics; complete note persistence flows |
| News & earnings | News feed, calendar, earnings prep | Source filters, article destinations, prior earnings, surprises and guidance data |
| Advanced | Risk, position sizing sample, expectations, market context, historical lens | Exact calculation controls/results and original advanced metric catalog reconciliation |
| Portfolio | Holdings, performance, allocation, risk, transactions, balances | Add/edit/delete/import dialogs; reconciliation; account/currency variants; audit history |
| Watchlist / Explore | Company search/filter/follow, research entry, discovery layout | Saved-list and compare flows; complete discovery eligibility and data behavior |
| Settings | Appearance, text size, research preferences, profile, alerts, plan, privacy | Durable preferences; alert create/edit; account and billing dialogs; confirmation/error states |
| Global | Light/dark, five sample data states, screen map, responsive layout, keyboard dialog dismissal/focus containment | Full keyboard/accessibility checks, all phone/tablet/desktop captures and visual acceptance |

## Integration rule
Do not replace the application until every existing feature is mapped and each screen/state has been reviewed. The reviewed source components and stylesheet are the basis for the eventual integrated frontend; data adapters and event handlers must not silently change the approved layout.
