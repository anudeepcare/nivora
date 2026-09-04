# NIVORA V65.15 Product Quality Design

Approved correction pass on exact V65.14 baseline.

## Locked requirements
- One responsive typography/design system across Analyze, Portfolio and Trading Lab.
- Desktop typography/navigation must be readable, not tiny. Mobile body baseline 16px with >=44px interactive targets where practical.
- Every explanatory info control visually renders a small circled `i`; hit target remains >=40px. No naked info `i`.
- Quote integrity must reject materially stale/provider-disagreeing quotes from decision display. Prefer verified/fresher fallback; otherwise mark price unverified and block price-sensitive intelligence/trading.
- Portfolio remains decision-first and keeps meaningful graphs: Portfolio vs SPY/QQQ, Drivers, Allocation, Risk, X-Ray.
- Portfolio Health must explain: score meaning, strongest contributors, what hurts it, how to improve it, and goal impact. Never recommend a trade solely to increase the score.
- No duplicate holdings surfaces, Unknown-sector intelligence, fake precision, or giant empty states.
- Portfolio quantity label is `Qty` for equities/ETFs/crypto on desktop/mobile.
- Preserve V65 scoring and Trading Lab safety behavior unless quote-integrity hardening requires blocking unsafe execution.
