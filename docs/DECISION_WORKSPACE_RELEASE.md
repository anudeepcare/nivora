# Decision workspace — October 18, 2026

The supplied Northwind HTML informs the eight-lens layout, selected metric explanations, style preferences, cash-flow sensitivity controls and for/against presentation. Its fabricated scores, random chart series and management statistics are not included as real observations.

## Included
- Overview separates business evidence, valuation evidence, technical timing and next reported event. Eight selectable lenses show available reported/calculated metrics; missing facts remain missing.
- Five research style presets adjust composite weights. Essential/advanced detail and long/swing presentation preferences persist on the current device. Preferences do not change reported financial facts.
- Ten-year fading cash-flow sensitivity, reverse growth and implied discount-rate solvers; explicit assumptions, dilution limitations and parameter shocks. Generic cash-flow modelling is withheld for financial businesses, crypto and unreconciled foreign listings.
- Volatility, observed drawdown, range position and MACD context supplement existing technical and accumulation tools.
- Additional statement fields: depreciation, receivables, inventory, payables and retained earnings where supplied. They reuse the existing fundamentals response rather than creating one paid request per metric.
- Public, searchable Help; Terms, Privacy, Risk and Methodology documents; footer and login links.
- Bounded glass accents and short colour transitions. Reading surfaces remain opaque; reduced-motion settings are respected. Working PWA shell files and original global styles are preserved.

## Evidence boundaries
Scores use disclosed absolute anchors, not validated sector percentiles or probabilities. An overall score requires at least four scored lenses. Moat and ownership lenses show evidence without manufacturing competitive-advantage scores. Cash flow less capex per share is a proxy, not a complete enterprise DCF or distributable equity cash flow. Subtracting SBC is an optional sensitivity. Implied discount rate is not a forecast return. Analyst targets and internal assumptions remain separate.

## Full supplied specification mapping
| Area | Status in this release |
|---|---|
| Data, periods, currencies, missing values | Existing reconciliation plus five additional statement fields; no complete point-in-time archive |
| Financial metrics and sector-relative ranks | Reported/calculated metric views; no licensed full-universe peer ranking |
| Eight lenses and five investing styles | Implemented; absolute anchor scores are uncalibrated screeners |
| Cash-flow and reverse valuation | Interactive proxy sensitivity implemented; not full sector-specific intrinsic valuation |
| Red flags and tripwires | Current evidence thresholds and headroom; no automated threshold alert delivery |
| Technicals and monthly accumulation | Existing indicators/history plus risk context; no proprietary competitor algorithm copied |
| Management promises, transcripts and delivery record | Not implemented; no fabricated management statistics |
| Sector-specific bank, insurer, REIT models | Generic scoring/model guardrails; dedicated sector valuation not implemented |
| Public historical model scoreboard | Not implemented; requires point-in-time storage and outcome history |
| Journal and behavioural coaching | No new journal or behavioural scoring added |
| AI narrative | Existing explicit AI workflow retained; numeric calculations stay deterministic |
| Bias controls and calibration | Formula/regression tests; no claimed predictive validation or 50-company filing audit |
| Subscription commercialization | Not released; operator details, licensing and legal review remain prerequisites |

## Operator configuration and legal review
Set NEXT_PUBLIC_AURYN_OPERATOR and NEXT_PUBLIC_AURYN_SUPPORT_EMAIL in deployment configuration. These are public display details, never secrets. Document wording is maintained in lib/legal-content.ts. Update it to reflect actual hosting, retention, AI providers and support procedures. The documents are product templates, not lawyer-approved terms. Review market-data redistribution rights and applicable obligations before selling access. No fictional corporation, jurisdiction, registration or guaranteed deletion deadline is asserted.

## Verification limits
Automated tests, TypeScript, production build and fixture API checks are recorded in verification/. Live paid-provider entitlement, every ticker's financial correctness, pixel parity and native iPhone visual acceptance are not established by these checks. The user reported the earlier PWA status-bar issue resolved after removing and re-adding the installed app; this release preserves that shell. No deployment, database change or broker order is performed.
