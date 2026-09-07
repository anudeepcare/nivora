# AURYN V4 Production — Decision-First Analyst Core

## What ships

- Canonical `lib/auryn/v4` analyst domain with explicit engine/model versions.
- Evidence-backed business-model and lifecycle classification.
- Sector/lifecycle model routing instead of one universal stock formula.
- Evidence-aware factor aggregation across business quality, growth/inflection, moat, narrative/expectations, fundamentals/earnings, valuation, technicals, positioning, catalysts, sector/industry, macro/regime and risk.
- Missing required evidence stays missing; it is never silently converted to a neutral score.
- Slow thesis and moat state are separated from fast price/timing evidence.
- Deterministic multi-horizon decisions for NOW, SWING, 6–12M and 3–5Y.
- Canonical primary actions: Strong Buy, Buy, Hold, Reduce, Sell, or Insufficient Evidence.
- Decision confidence measures evidence/model quality; it is not a probability of profit.
- Golden-company regression cases for compounders, frontier/pre-scale opportunities, semiconductor cycles, deteriorating theses, extreme valuation, broken theses and missing evidence.
- Production stock-page wiring with Beginner, Pro and Extreme Pro presentation depths using the same underlying V4 decision.
- Existing portfolio intelligence, calibration/outcome infrastructure, Trading Lab and Alpaca Paper safeguards are preserved.
- Scheduled paper-runner, portfolio-learning and calibration-maturity GitHub workflows are included.

## Deliberately not claimed

- No LLM is allowed to invent numeric market/fundamental scores in this release.
- Decision confidence is not a backtested win probability. Calibrated predictive probabilities remain gated on sufficient matured outcome data.
- Live-money autonomous execution remains disabled. Trading Lab is Alpaca Paper only.
- Agentic investment-committee/red-team orchestration and market-wide 4,500-symbol V4 scanning are later phases, not silently simulated here.

## Deployment requirements

Install dependencies and run the full deployment gates in a normal networked CI/Vercel environment:

```bash
npm ci
npm test
npm run audit:v65
npm run build
```

The app continues to require the provider/Supabase variables documented in `.env.example` and `README.md`. Scheduled GitHub workflows additionally require repository secrets:

- `AURYN_PRODUCTION_URL`
- `TRADING_LAB_CRON_SECRET`

Do not commit `.env.local` or broker/provider secrets.
