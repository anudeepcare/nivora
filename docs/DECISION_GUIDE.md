# Action guide and monthly signals

This build adds original, transparent research triage. It is not a recreation of either competitor's private algorithm, a trade execution system, a personalized allocation or a validated source of excess returns.

## First screen

The company page separates **Considering a buy** from **If you already own it**. It shows the latest comparable financial basis and currency, revenue/growth, net income, operating cash flow less capex, and the dated price trend. The monthly multiplier is visible in the summary and opens Technicals. The detailed DCA card shows all 0×–4× zones, six completed monthly observations and a separate forming month.

| Result | Rule and meaning |
| --- | --- |
| Evidence needed / Refresh price / Update history | Missing, invalid, future or stale evidence blocks a current entry assessment. Quote and latest completed close must each be within four calendar days. Financial evidence must end within 400 days for ordinary-company actions. These are conservative availability gates, not an exchange-calendar freshness certification. |
| Buy candidate | Identified ordinary operating company; positive current revenue, profit and cash after capex; positive comparable revenue growth; constructive 50/200-day price trend; no foreign-listing flag. It is a research candidate. A valuation or attractive price has **not** been established. |
| Hold & monitor | Positive profit and cash generation; monitor reporting and allocation. It is conditional guidance for an existing owner, not a claim about their actual holdings. |
| Wait / Watch for entry | Available facts do not meet the candidate rule, or the confirmed monthly price is extended. The reason is displayed. |
| Trim review | Confirmed monthly 0× extension plus RSI at least 70. Review allocation/tax consequences; 0× alone does not sell anything. |
| Sell review | Two comparable periods have negative net income and negative cash after capex, with falling revenue. Review whether the original thesis still holds. A net loss on its own cannot trigger this rule. |
| Specialist review | Banks, insurers, property/REITs, nonbank financials, identified frontier/infrastructure companies, and unknown business classification require their relevant drivers. Generic valuation is blocked for unsupported families. |
| Price setup only | Crypto receives price/risk context, not fabricated corporate accounts or a corporate buy rating. |

These labels are surfaced in the canonical snapshot under `decision`; no broker execution consumes them. Existing generic calculator scenarios remain illustrative sensitivities. Their −5/0/+5 growth assumptions do not establish company-specific bear/base/bull targets. Analyst opinions stay separate from calculations and reported facts.

## Monthly rule

AURYN's original `monthly-v1` rule requires 24 consecutive completed monthly closes. The expected closing session must be present. Above 25% of the 24-month mean it pauses contributions (0×). A drawdown/deviation pair of at least 15%/10%, 30%/20%, or 50%/35% produces 2×, 3×, or 4× respectively. Otherwise it shows 1×. The current month is provisional and never replaces the confirmed verdict. Larger multipliers can occur in deteriorating businesses: the UI explicitly identifies them as price-only context.

This variable-contribution experiment differs from conventional fixed dollar-cost averaging: https://www.investor.gov/introduction-investing/investing-basics/glossary/dollar-cost-averaging . Historical comparisons are hypothetical and do not validate the future rules. No new provider subscription, AI spend or broker order was enabled.
