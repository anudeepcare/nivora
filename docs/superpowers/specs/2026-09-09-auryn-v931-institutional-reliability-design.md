# AURYN V9.3.1 Institutional Reliability + Astra Analyst Design

## Goal
Make every AURYN surface a view of one deterministic investment brain that remains research-usable 24/7, exposes only meaningful decision drivers by default, preserves expert depth underneath, and uses GPT-6 Astra only as a grounded analyst/challenger over canonical AURYN evidence.

## Hard invariants
- One canonical Market Truth price contract across stock, watchlist, market, portfolio, scans and execution surfaces.
- Research works premarket, regular session, after-hours, overnight, weekends, holidays and early closes.
- Display, analysis and execution prices are separate roles; non-execution-grade prices can never authorize orders.
- Same DecisionSnapshot input must produce the same deterministic decision fingerprint.
- Same symbol + snapshot must expose identical canonical price, action, owner action, levels and setup state everywhere.
- No unexplained decision transition. Every transition has machine-readable changed/unchanged evidence and trigger.
- Default UI shows six decision pillars, not a metric wall. Full metrics remain available in Expert depth.
- Explanations must state what changed, why it matters, evidence, counter-evidence, action impact, next decision trigger and horizon.
- Astra cannot invent prices, metrics, targets, support/resistance, actions, sizing or execution permissions. Every substantive claim must cite canonical evidence IDs.
- Astra disagreement is challenger evidence only; deterministic AURYN policy remains authoritative.

## Architecture
1. `MarketDataGateway` is the only current-price provider entry point. It normalizes provider identity and builds `CanonicalMarketSnapshot`.
2. `DecisionSnapshot` freezes market/data/model cutoffs and receives a stable fingerprint.
3. `InstitutionalDecisionKernel` reduces evidence into six pillars: Business, Earnings & Revisions, Valuation, Market Structure, Catalysts & Regime, Risk & Asymmetry. It emits new-money, owner, long-term and execution states plus causal drivers.
4. `SetupStateMachine` uses allowed adjacent transitions and hysteresis to prevent threshold chatter.
5. `ExpertExplanationContract` validates specificity, grounding, horizon, counter-evidence and next trigger.
6. `AstraAnalyst` calls the Responses API using `gpt-6-astra` and strict Structured Outputs. Output is validated against canonical evidence before it is displayed.
7. `ReliabilityLab` verifies snapshot determinism, cross-surface invariants, 24/7 session behavior, provider chaos safety, unexplained transitions and Astra authority boundaries.

## Surface behavior
Every stock tab uses the same canonical action and snapshot ID. Watchlist, portfolio and market overview consume canonical prices rather than independent direct provider prices. The normal view presents the call, owner/new-money distinction, long-term stance, execution state, six pillars, top positive and negative drivers, and next decision trigger. Expert mode reveals metrics, provenance, attribution and Astra challenger analysis.

## Release gate
V9.3.1 cannot pass unless the focused V9.3.1 suite, full AURYN regression suite, V8 Reality Audit, V9.2 Market Truth tests and V9.3 Feature Tournament tests pass. Source audits reject direct current-price provider calls from migrated current-price surfaces. Astra is optional at runtime; if `OPENAI_API_KEY` is absent or Astra fails validation, deterministic AURYN remains fully functional.
