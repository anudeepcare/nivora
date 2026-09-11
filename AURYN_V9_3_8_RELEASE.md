# AURYN V9.3.8 — Reliability, Mobile & Performance

## Product contract
- Preserve one canonical AURYN decision; presentation never creates a second verdict.
- Missing evidence remains N/A.
- Price-sensitive metrics continue to use verified market truth.
- Opportunity and asymmetry are decision aids, not probabilities or expected-return forecasts.

## V9.3.8 changes
- Desktop first viewport now bounds the AURYN Call and Price Structure chart to fit together at normal desktop heights.
- Mobile app chrome, security masthead, evidence tabs, decision hero, chart, progressive research state and technical evidence are substantially denser.
- Bull/Base/Bear scenario values have safer column sizing and no forced truncation.
- Holdings use a seven-fact desktop grid so Current, Qty, Avg Cost, Value, Return, P/L %, and Weight stay on one row.
- Mobile holdings are compact and move edit/delete controls out of a dedicated wasteful row.
- Non-critical company/context/institutional evidence requests are staggered instead of launched as one burst.
- Canonical refresh is paced to 30 seconds and news/context refresh to five minutes while warm-cache behavior remains intact.
- Existing V9.3.7 metric provenance language remains: Opportunity is not probability of profit; Expected Asymmetry is not an expected-return forecast; Current Price is never inferred from portfolio value.

## Verification
- V9.3.8 reliability/UI contract: 6/6 passing.
- V9.3.7 regression + trading/portfolio contracts: 33/33 passing.
- V9.3.6 regression: 20/20 passing.
- `next build` could not be executed in the artifact environment because the Next CLI dependency is not installed there; Vercel remains the full Next.js compile gate.
