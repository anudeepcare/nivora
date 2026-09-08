# AURYN V7 — Trust & Precision OS

AURYN V7 is the trust-and-precision hardening release on top of the V6 Proof OS and V5 Market Truth / canonical Decision OS foundation. It is a 9.5-target engineering release: the product is designed to be internally consistent, fail closed on untrusted data, expose full professional evidence without raw-number clutter, and preserve proof discipline. It is not a guarantee of investment profit and current Evidence Confidence is not probability of profit.

## Canonical production chain

`Market Truth → Canonical Evidence Snapshot → Specialist Engines → CIO Decision → One ExecutionPlan → AURYN Setup Map → Portfolio CIO → Canonical Trust Audit → Paper Broker / Immutable Learning → Model Proof`

## What V7 adds

- **Runtime Canonical Trust Audit** checks snapshot IDs, Market Truth price, execution state, DCA policy, valuation eligibility, plan ordering and Setup Map/ExecutionPlan equality before price-sensitive values are treated as trustworthy.
- **Fail-closed execution and learning**: a trust `BLOCK` suppresses entry/DCA/target output, prevents validation history from learning the inconsistent snapshot, and prevents Alpaca paper intent generation.
- **Signature AURYN Setup Map**: one compact summary and one full Technicals view, both consuming the exact canonical ExecutionPlan rather than recalculating levels.
- **One formatting contract** for professional metrics and score bands; raw floating-point provider output is not rendered directly.
- **One stock-page decision vocabulary** across Thesis, Business, Earnings, Technicals, Ownership, Catalysts and Options.
- **Full professional metric depth remains available** in Extreme Pro, including trend, momentum, volume/flow, volatility, structure, relative strength, business, fundamentals, valuation, thesis/moat, narrative, positioning, catalysts, sector, macro and risk evidence.
- **Mobile preservation contract**: the existing successful phone UX is protected; decision, Setup Map, execution plan and metric explorer stack without page-level horizontal overflow.
- **V6 Model Proof is preserved** and remains archetype-scoped. Model Proof starts UNPROVEN and must be earned from version-matched matured outcomes.

## Setup Map contract

The AURYN Setup Map can show setup state, structure, confluence, bull/base/bear scenarios, confirmation trigger, structural entry/watch zone, targets, invalidation and confidence. Price-sensitive fields are identical to the canonical ExecutionPlan. WATCH is never labeled as active DCA, REDUCE/SELL never averages down, and blocked Market Truth or canonical trust removes actionable price levels.

## Proof and execution policy

- Evidence Confidence is current-input quality, not probability of profit.
- Model Proof is historical/forward evidence for the exact engine/archetype cohort.
- No self-tuning or silent champion promotion.
- Autonomous execution remains **Alpaca Paper only**.
- Live-money autonomous execution remains disabled until separate real-world proof, governance and operational controls justify promotion.

## Verification commands

```bash
npm ci
npm test
npm run audit:v65
npm run build
```

The release package contains `AURYN_V7_VERIFICATION.txt` with the packaging-environment verification status.
