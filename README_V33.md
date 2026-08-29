# NIVORA V33 — Institutional Intelligence UX

## What changed
- SEC 13F sync now stores prior/current shares per named manager, absolute and percentage QoQ change, status, and prior/current reported value.
- Adds separate ranked lists for largest holders, biggest adders, biggest trimmers, new positions, and exits.
- Institutional API now returns add-vs-trim breadth percentages and a transparent 0–100 quarterly institutional trend score.
- Investor research UI exposes current/prior shares and manager-level QoQ percentage changes without confusing delayed 13F data with today's flow.
- Keeps Today's Accumulation Proxy explicitly separate from named institutional filings.
- Decision red treatment is softened to address UX feedback that the previous red was too visually striking.

## Deploy
1. Replace the project with this build / copy changed files.
2. `git add . && git commit -m "NIVORA V33 institutional intelligence" && git push origin main`
3. After Vercel deploy succeeds, run **NIVORA SEC 13F Sync** once from GitHub Actions. This refresh is required because older cached rows do not contain the new manager-level prior-share fields.
4. Re-open a stock such as ZETA and use **Explore analysis → Fundamentals** to inspect the institutional layer.

## Data honesty
Form 13F is delayed reported holdings data. NIVORA does not describe it as today's institutional buying. Reported value changes can also reflect stock-price movement, so share change and manager breadth are emphasized.
