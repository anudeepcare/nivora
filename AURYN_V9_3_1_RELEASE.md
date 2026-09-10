# AURYN V9.3.1 — Institutional Reliability + Astra Analyst

## Milestone
Every migrated AURYN surface is a view of one deterministic investment brain. Current prices come through canonical Market Truth; research stays usable 24/7; execution remains stricter than research; the normal experience shows six meaningful decision pillars; expert depth remains available; and GPT-6 Astra is a grounded challenger that cannot change canonical facts or actions.

## Institutional decision hierarchy
The default decision surface exposes Business Quality, Earnings & Revisions, Valuation / Expected Return, Market Structure, Catalysts / Regime, and Risk / Asymmetry. Lower-level metrics remain evidence beneath those pillars rather than becoming dozens of independent votes.

## 24/7 contract
Premarket, regular session, after-hours, overnight, weekends, holidays and early closes are valid research states. AURYN may use a verified extended-hours price or the last verified regular close for research while keeping execution blocked. No screen should blank merely because the exchange is closed.

## Astra boundary
`gpt-6-astra` is called through the OpenAI Responses API with strict Structured Outputs. It receives only canonical AURYN evidence and may summarize, challenge and explain it. It cannot create or modify price, levels, metrics, canonical actions, sizing or execution permission. Unsupported numbers or evidence IDs fail validation and the deterministic AURYN experience remains available.

## Acceptance gate
Run `npm run gate:v931`. The gate requires V9.3.1 focused tests, the permanent Reliability Lab, the full AURYN regression suite, V8 Reality Audit, V9.2 core gates, V9.3 core gates and the dead-code audit. A code build is not a release pass by itself.

## Trading Lab canonical-decision boundary
Paper execution consumes the persisted V9.3.1 institutional decision metadata. Missing V9.3.1 metadata, a V9.3.1/V5 action divergence, or a non-execution-ready institutional snapshot fails closed before a trade intent can reach the broker.

## Real-world proof
The local code gate can prove deterministic logic, cross-surface consistency, historical safeguards, and fail-closed behavior. It cannot prove the newly built bytes against production providers until this version is deployed. After deployment, run:

```bash
AURYN_BASE_URL=https://getauryn.vercel.app npm run audit:v931-live -- --limit=100
AURYN_REQUIRE_LIVE=1 AURYN_BASE_URL=https://getauryn.vercel.app npm run gate:v931
```

The scheduled `AURYN V9.3.1 Reliability Lab` workflow repeats real-world checks across premarket, regular session, after-hours, overnight, and weekend/closed-market windows.

