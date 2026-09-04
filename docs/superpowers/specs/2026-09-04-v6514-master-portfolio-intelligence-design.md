# NIVORA V65.14 Master Portfolio Intelligence Design
Approved direction: Portfolio must answer How am I doing? Why? What is my real risk? What should I do next? It must be meaningfully better than a brokerage P/L view without duplicating information.

## Locked UX
- Mobile-first AND desktop-first-quality responsive behavior. Desktop typography/menu cannot be tiny.
- Portfolio, Analyze and Trading Lab share larger readable type, spacing, navigation and touch targets.
- Visible information affordance is a small circled `i`; invisible target >=40px.
- Portfolio uses `Qty` everywhere for stock/ETF/crypto. Never Shares/Units.
- One holdings experience only.
- No `Unknown`, classification-pending, `— / —`, or giant missing-data cards as intelligence.
- Graph -> insight -> decision. No decorative visualization.

## Portfolio command center
Total value, selected-period actual/reconstructed status, dollar/percent performance where supportable, SPY, QQQ, alpha, cash, concentration and concise Portfolio Brief.

## Performance
Working periods: 1D,1W,1M,3M,6M,YTD,1Y,2Y,3Y,4Y,ALL.
Primary normalized line chart: Portfolio vs SPY vs QQQ. Actual snapshots are authoritative. Unsupported actual periods are not fabricated. Current-holdings reconstruction may be used only when historical price inputs support it and must be labeled `CURRENT HOLDINGS BACKTEST — NOT ACTUAL PORTFOLIO RETURN`.

## Meaningful visual analytics
1. Portfolio vs Market line: did I beat SPY/QQQ?
2. Return contribution bars: what made/lost portfolio dollars/percentage points?
3. Allocation treemap: where capital sits, grouped by useful classification.
4. Risk contribution bars: what creates portfolio risk?
5. Concentration: compact Top-3/Top-5 and cash/crypto.
6. Correlation/hidden exposure heatmap only with reliable evidence.
7. Risk-vs-return bubble map only with reliable history.
8. Drawdown/volatility comparison only with reliable history.
Visual switcher prevents dashboard clutter.

## Portfolio X-Ray
Interactive Sector/Theme/Asset/Risk/Correlation. Sector/theme classification must use known metadata or deterministic mapping; missing classifications are omitted from claims rather than displayed as Unknown.

## Decision intelligence
Company thesis remains independent from portfolio action. Portfolio action uses company evidence + sizing + concentration + available cash. Compact priorities only: Add/Hold/Watch/Trim/Exit when meaningful. No giant repetitive action buckets.

## Portfolio Analyst
Engine-first analysis. Deterministic facts drive concise AI-like brief: relative performance, key drivers, concentration/risk, available cash, strongest/weakest actionable positions. No invented facts or independent LLM buy/sell decision.

## Holdings
One table/list: symbol/name, Qty, price, value, weight, P/L context, NIVORA view/action. Clicking holding routes to Analyze/deep evidence. Mobile uses cards, desktop uses available width with readable text.

## Cross-app
Analyze and Trading Lab receive same larger desktop/mobile typography, navigation sizing, glass mobile treatment, circled-i standard and consistent spacing.
