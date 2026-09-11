# AURYN V9.3.4.3 — Decision Policy De-Bias + Expert UX

## Milestone
Make V9.3.4 the actual evidence-driven decision authority without imposing a BUY quota, while keeping V5 as a challenger/safety source rather than an ordinary HOLD→WAIT veto.

## User-visible changes
- New-money actions: STRONG BUY, BUY, START SMALL, WAIT, AVOID.
- Owner actions: ADD, HOLD, WATCH, REDUCE, EXIT.
- Missing valuation/evidence lowers evidence quality and can cap conviction, but does not become a bearish zero.
- Current setup meaning and action implication are visible on the first screen.
- Market Plan levels remain always visible and use recovery/watch language for damaged structures.
- Five high-value decision metrics appear on the first screen: Entry Quality, Relative Strength, Participation, Reward/Risk, Volatility.
- Legacy duplicate Setup Map is removed from Technicals; detailed indicators/chart remain there.

## Safety
- Confirmed structural invalidation remains a hard veto.
- Severe risk and genuine fundamental thesis breaks remain hard vetoes.
- Trading Lab uses the canonical institutional action; V5 disagreement alone is not an execution veto.
- START SMALL uses half the normal paper risk budget.
- Market Truth, quote integrity, history fallback, and V9.3.4 multi-timeframe behavior are unchanged.

## Release gate
V9.3.4.3 does not advance on compilation alone. It must pass focused de-bias/setup/UX/distribution tests, full regression, preserved V8/V9.2/V9.3/V9.3.1/V9.3.4 gates, and then live validation after deployment.
