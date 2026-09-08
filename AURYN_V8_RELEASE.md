# AURYN V8 — Reality Audit & CIO Consistency

AURYN V8 is the cross-sectional reliability release on top of the V7 Trust & Precision OS. It does not add another independent decision engine. It hardens the existing canonical chain against the real-stock failures exposed by HIMS, ASTS and other difficult company archetypes.

## Canonical production chain

`Market Truth → Canonical Evidence → Evidence-aware Classification/Lifecycle → Specialist Engines → CIO Arbitration → One ExecutionPlan → AURYN Setup Map → Canonical Trust Audit → Portfolio CIO → Alpaca Paper / Immutable Learning → Model Proof`

## What V8 adds

- **100-ticker offline Reality Audit** across software, semiconductors, AI/power infrastructure, digital health, biotech/medtech, frontier/space, financials, consumer, industrials, energy/miners, REITs and insurance.
- **DIGITAL_HEALTH_PLATFORM** archetype so HIMS/TDOC/DOCS-style businesses are not treated like biotech pipelines.
- **UNKNOWN lifecycle** when evidence is insufficient. Missing lifecycle evidence no longer silently becomes MATURITY.
- **Frontier lifecycle safeguards** for ASTS/RKLB-style companies: maturity requires positive mature-business evidence.
- **Entity-type precedence** so REIT/bank/insurer identity is not overwritten by generic infrastructure or technology keywords.
- **CIO horizon-consensus arbitration** so an overwhelmingly bearish NOW/SWING/6–12M/3–5Y stack cannot hide behind a HOLD headline solely because valuation is unavailable.
- **Owner-action consistency** so owner guidance cannot contradict a structural REDUCE/EXIT posture.
- **Strength vs trend separation** in normal UI: Thesis Strength and Thesis Trend are distinct; Moat Strength and Moat Trend are distinct.
- **Human-readable archetype/lifecycle labels** rather than raw enums such as `BIOTECH_PHARMA` in the normal research surface.
- **Live 100-ticker audit runner** for Vercel/deployed environments with provider credentials. The source package never embeds API secrets and never claims a live audit passed unless it actually ran.

## 100-ticker release gate

The offline golden universe contains exactly 100 unique real tickers. The audit checks classification, allowed lifecycle, analyst model and valuation-method compatibility. Critical failures block release.

Run locally/CI:

```bash
npm run audit:v8-reality
```

Run against a deployed environment with live provider credentials:

```bash
AURYN_BASE_URL=https://YOUR_DEPLOYMENT.vercel.app npm run audit:v8-live
```

See `docs/V8_LIVE_100_AUDIT.md` for rate-limit and optional authorization settings.

## Decision semantics

- Missing valuation remains N/A and caps bullish new-money conviction; it does not manufacture bearish zero.
- Broad bearish horizon consensus plus a weak structural thesis can resolve the CIO posture to REDUCE even if valuation is unavailable.
- A strong/intact longer-term thesis can still preserve HOLD while NOW/SWING are weak; horizon conflict is resolved explicitly rather than averaged blindly.
- Technical/setup specialists inform timing and execution. They do not independently overwrite the canonical CIO action.

## Proof / execution policy

- Evidence Confidence remains current-input quality, not probability of profit.
- Model Proof remains archetype-scoped and must be earned from matured outcomes.
- Autonomous execution remains **Alpaca Paper only**.
- Live-money autonomous execution remains disabled.
- Offline 100-ticker correctness is not a claim of market alpha; live provider audit and forward outcome proof remain required.

## Deployment verification

```bash
npm ci
npm test
npm run audit:v8-reality
npm run audit:v65
npm run build
```

See `AURYN_V8_VERIFICATION.txt` for the exact packaging-environment result.
