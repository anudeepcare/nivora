# Live UI and HIMS reconciliation — 17 October 2026

## Confirmed on the deployed application before these source changes

Signed in through a secure browser credential handoff. Read-only testing covered Overview, Portfolio, Watchlist, Settings (both themes), APP research's five tabs, chart periods 1D/1W/1Y, financial TTM/annual and help/expanded dialogs, plus research loading for HIMS, SAP, OSCR, BTC/USD and ETH/USD. Discover screening and the historical DCA comparison returned results. Alerts and Help loaded. No holdings changes, trades, paid AI calls or new alerts were performed.

Found mobile company-name/price overlap, desktop-width holdings on mobile, misplaced watchlist search icon, concatenated allocation labels, excessive provider/date text, misleading empty/zero loading states, empty forecast amounts, a zero P/E sentinel, generic valuation assumptions driving headline ratings, stale annual headline evidence, and documentation links called filings.

## HIMS: comparison actually observed

| Metric | AURYN annual default | AURYN TTM | ValueSnapshot overview |
|---|---:|---:|---:|
| Revenue | $2.3B | $2.6B | $2.6B |
| Cash flow after provider capex | $74M | $89.9M | $89.9M labelled FCF |
| Operating margin | 4.5% | −3.6% | −3.6% |
| Gross margin | 73.8% | 64.7% | 64.7% |
| Headline profitability | Profitable | Net income −$142M | Mixed quality / losses |

AURYN's TTM ended June 30, 2026. Its headline and thesis used December 31, 2025 despite the newer evidence. This is a presentation/period-selection defect, not proof that all underlying numbers or the paid data connection are wrong.

AURYN showed $28.07 dated October 16; ValueSnapshot showed $30.92, with its overview chart labelled EOD October 8. Observation dates must be aligned before treating quote differences as provider errors. No independent current-quote certification was performed.

ValueSnapshot's overview showed $32.17 fair value and its Valuation view showed a $41.34 DCF result. It also displayed a negative EPS-model result of −$5.47 in its combined comparison while stating that an EPS model was inapplicable to the TTM loss. These are observations, not an endorsement of either site's model. Exact adjustable DCF inputs could not be inspected because browser credential protection blocked the workspace interaction. No numerical reconciliation to that $41.34 target is claimed.

ValueSnapshot pages read: https://valuesnapshot.io/stock/HIMS and https://valuesnapshot.io/stock/HIMS?tab=valuation

## Independent filing check

HIMS's 2025 10-K reports operating cash flow $300.006M, property/equipment/intangibles cash investment $226.045M, and software investment $16.546M. The company's FCF is $57.415M. AURYN's $73.961M arithmetic equals the first two fields, omitting the separate software deduction. The fix explicitly labels the calculation and does not overwrite historical source data with a ticker-specific number.

Source: https://www.sec.gov/Archives/edgar/data/1773751/000177375126000022/hims-20251231.htm

## Source repairs

- Latest complete TTM evidence drives the research headline, financial cards and investment case; annual fallback is explicit and year-over-year comparisons use matching periods.
- Generic −5/0/+5 growth calculator examples no longer establish cheap/expensive headline verdicts. They are labelled cash-flow sensitivities, not researched bear/base/bull targets. The existing calculator remains available for explicit assumption exploration.
- Nonpositive P/E is N/M. Forecasts keep available numeric estimates without inventing a currency; upcoming fiscal periods include completed quarters not yet reported.
- Source metadata moves into Data details; methodology links are no longer called filings.
- Mobile header layout stacks identity and price, holdings use a three-column summary per row, watchlist search aligns correctly, and allocation labels use the actual markup. Header safe-area space is reserved and anchor scroll padding added.
- Account-scoped in-memory caching survives navigation and clears on account switch/sign-out. Workspace loading no longer masquerades as an empty account. Quote batches publish one settled snapshot instead of progressively changing totals.
- Removed the obsolete saved-observations panel and its nonexistent Business-tab instructions.

## Boundaries

The live browser audit above covers the deployed PRE-REPAIR application. It is not a visual acceptance test of this patched source. The patched source has automated component/domain/API checks and a production build; physical iPhone PWA and rendered preview acceptance remain outstanding. Vercel connector access returned an authorization/scope error. Local preview browser control is unavailable under the managed Sites workflow, so no improvised local browser or pixel-match claim was used.

AI is disabled in the deployed configuration. Paper Trading denies this account administrator access; its trusted owner/admin mapping must be checked. Neither was enabled. Two existing unsupported portfolio records require instrument/currency review; records were not silently rewritten. Commercial launch and a company-specific, validated fair-value engine remain outside the verified completion claim.
