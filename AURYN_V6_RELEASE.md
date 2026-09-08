# AURYN V6 — 9+ Proof OS

AURYN V6 is the proof-and-governance release layered on the V5.1 canonical Market Truth and Decision OS foundation. The goal is professional-grade decision discipline: one verified snapshot, one company decision, one execution plan, portfolio-aware sizing, and historical proof that must be earned before a model is promoted.

## What V6 adds

- **Model Proof Grade**: `UNPROVEN`, `EMERGING`, `VALIDATED`, `ELITE` based only on matured outcomes from the exact V6 engine cohort.
- **Action-ladder validation**: future benchmark-relative alpha must separate in the expected direction from Strong Buy → Buy → Hold → Reduce → Sell before promotion is eligible.
- **Champion/challenger gate**: minimum sample, positive alpha, drawdown control, regime breadth, horizon breadth and action-ladder checks. Auto-promotion remains OFF.
- **Archetype-scoped proof** on stock pages so an AI-infrastructure company cannot borrow historical proof from an unrelated bank/software cohort.
- **Evidence Confidence vs Model Proof vs Decision Strength** are distinct concepts. None is presented as probability of profit.
- **Daily + weekly technical regime** derived deterministically from verified bars, with explicit alignment/conflict state.
- **Valuation Method Registry** by business model/lifecycle: mature DCF/FCF, growth EV/Sales+FCF, memory/cyclical normalization, AI-infrastructure SOTP/capacity, frontier scenario/runway, bank P/B/ROE/NIM, REIT FFO/AFFO, biotech scenario, energy NAV.
- **Portfolio CIO overlay** that can cap/block an ADD because of concentration/correlation without rewriting the independent company thesis. The Portfolio capital-priority UI consumes this overlay.
- **Canonical V6 learning payload** persists the exact visible action, snapshot ID, execution plan, proof state, valuation method and multi-timeframe state together.
- **Dedicated V6 maturity workflow** measures 30D / 90D / 180D / 1Y / 2Y benchmark-relative outcomes for the exact V6 cohort.
- **Model Health console/API** exposes proof grade, action ladder, promotion blockers, horizon evidence and regime coverage.
- **Reliability harness** combines the existing V5 Market Truth matrix with thousands of V6 proof/portfolio combinations and enforces promotion/portfolio invariants.

## Proof policy

V6 starts `UNPROVEN` until exact-engine forward outcomes mature. That is intentional. A high Evidence Confidence score means the current input snapshot is well-supported; it is not a historical win rate. A model becomes `VALIDATED` or `ELITE` only after its own version-matched outcomes satisfy the published gates.

## Execution policy

- Research, shadow validation and Alpaca Paper are supported.
- Unverified Market Truth blocks price-sensitive action and broker execution.
- Portfolio CIO can reduce or block new exposure without changing the company call.
- Live-money autonomous execution remains disabled by default.
- Production weights do not self-modify. A promoted challenger must become a new immutable engine version.

## Verification commands

```bash
npm ci
npm test
npm run audit:v65
npm run build
```

The release package also contains `AURYN_V6_VERIFICATION.txt` with the exact verification status from the packaging environment.
