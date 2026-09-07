# AURYN V4.2 — Market Truth Reliability Release

## What changed

AURYN V4.2 hardens the system around one canonical market/evidence truth before any price-sensitive decision is allowed.

- Added AURYN Market Truth as the canonical price/session gate.
- U.S. exchange holiday and early-close awareness added to session handling.
- Stale open-session quotes cannot become the displayed/decision price.
- Large provider disagreements fail closed instead of silently choosing a price.
- Extreme single-source jumps require independent confirmation for decision/execution use.
- Closed-market behavior prefers a verified regular close rather than stale pseudo-live data.
- Header, technicals, action plan and decision-sensitive surfaces use the same verified market state.
- Price-sensitive levels are suppressed when Market Truth is unverified.
- Autonomous paper execution requires verified market data and will not trade on unverified pricing.
- Unverified prices are blocked from decision-history/calibration snapshots.
- Missing valuation is no longer converted to a bearish zero and no longer makes the whole structural thesis unavailable by itself.
- Missing genuinely required business evidence can still block a confident decision.
- AI/HPC/data-center classification remains source/context driven rather than ticker-hardcoded.
- Owner and new-money actions stay distinct so entry unattractiveness does not automatically mean an existing owner should sell.

## Decision behavior

AURYN can issue STRONG BUY / BUY / HOLD / REDUCE / SELL when required evidence is decision-grade. It can also fail closed when the market/evidence state is not trustworthy. SELL remains reserved for structural thesis failure or material deterioration rather than a single weak factor.

## Verification

- Full engine/regression suite: 364/364 passing.
- V65 production/dead-code audit: PASS.
- `git diff --check`: PASS.
- `npm run build`: not runnable in this sandbox because project dependencies are not installed and the `next` binary is unavailable (`next: not found`). Run `npm ci && npm run build` in Vercel/normal CI before deployment.

## Security / packaging

The production ZIP excludes `.env.local`, `.env`, `.git`, `node_modules`, `.next`, `.engine-test`, build caches and log files. `.env.example` is retained as a configuration template.
