# NIVORA V65.15 — Product Quality + Portfolio Health

- Unified responsive typography across Analyze, Portfolio and Trading Lab.
- Visible small circled info controls with enlarged invisible tap targets.
- Quote provider disagreement is now a hard display/execution rejection: suspect prices are not selected.
- Quote API returns PRICE UNVERIFIED semantics on provider disagreement instead of a suspect quote.
- Existing Trading Lab integrity policy continues to block disagreement/stale execution.
- Portfolio Health now explains Why this score, Holding it back, Improve portfolio and Goal fit.
- Health is explicitly diagnostic; NIVORA does not recommend trades solely to raise the score.
- Preserves Portfolio Performance/Drivers/Allocation/Risk visual intelligence, SPY benchmark logic, X-Ray and one Qty-based holdings surface.
- No new Supabase SQL required.
