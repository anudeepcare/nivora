# AURYN V9.7 — CIO Formula Book

## Philosophy
AURYN separates **what the business is** from **when capital should be deployed**.

A weak chart cannot make a durable compounder a bad business.
A great business cannot make any price attractive.
One weak quarter cannot break a thesis.
Persistent corroborated deterioration can.

## Slow Brain — Compounder Quality

```
CompounderQuality =
  0.58 × BusinessQuality
+ 0.27 × EarningsAndRevisions
+ 0.05 × CatalystsAndRegime
+ 0.10 × RiskAsymmetry
```

Tactical technical scores are intentionally excluded.

The large BusinessQuality weight is deliberate: durable economics, reinvestment, moat, cash generation and capital allocation should dominate the 3–5 year thesis.

## Deterioration

Weak evidence families:
- BusinessQuality < 42
- EarningsAndRevisions < 42
- RiskAsymmetry < 30
- confirmed structural break

Base deterioration:

```
BusinessWeakness = max(0, 50 - BusinessQuality) × 1.40
EarningsWeakness = max(0, 50 - EarningsAndRevisions) × 1.25
RiskWeakness     = max(0, 35 - RiskAsymmetry) × 0.80

Deterioration =
  0.42 × BusinessWeakness
+ 0.38 × EarningsWeakness
+ 0.20 × RiskWeakness
+ 23 × max(0, WeakFamilyCount - 1)
+ 18 if structural break
```

If only one evidence family is weak, deterioration is capped at 45. This prevents a single noisy quarter or isolated metric from breaking a long-term thesis.

States:
- 0–31 Stable
- 32–57 Watch
- 58–74 Deteriorating
- 75–100 Severe

## Fast Brain — Deployment Quality

```
TechnicalComposite =
  0.35 × Trend
+ 0.30 × Structure
+ 0.20 × Momentum
+ 0.15 × Participation

DeploymentQuality =
  0.25 × Valuation
+ 0.18 × MarketStructure
+ 0.23 × RiskAsymmetry
+ 0.10 × CatalystsRegime
+ 0.24 × TechnicalComposite
```

Valuation and risk/asymmetry carry more authority than a single timing indicator. Technicals govern deployment, not long-term business quality.

## Agreement and Confidence

```
Agreement = 100 - min(60, 1.65 × stdev(
  Business,
  Earnings/Revisions,
  Valuation,
  MarketStructure,
  Risk/Asymmetry,
  TechnicalComposite
))

Confidence =
  EvidenceCompleteness
× (0.72 + 0.28 × Agreement/100)
× ValuationAvailabilityPenalty
```

ValuationAvailabilityPenalty = 1.00 when valuation exists, 0.86 when unavailable.

This means missing or contradictory evidence reduces confidence instead of being silently interpreted as bearish.

## CIO Actions

### Hard break
AVOID is mandatory when any of these is true:
- Business < 30 and Earnings/Revisions < 30
- Risk/Asymmetry < 20
- structural break and CompounderQuality < 50
- Deterioration >= 78

### New money
- STRONG_BUY: Compounder >= 84, Deployment >= 76, Confidence >= 78, Risk >= 62
- BUY: Compounder >= 74, Deployment >= 66, Confidence >= 68, Risk >= 52
- START_SMALL: Compounder >= 70, Deployment >= 49, Confidence >= 60, Risk >= 40
- START_SMALL alternate: Compounder >= 60, Deployment >= 60, Confidence >= 66
- AVOID: hard break, or very weak quality and deployment
- otherwise WAIT

There is no target quota. If the evidence says 95% WAIT, the engine may still produce 95% WAIT; V9.7 makes that outcome diagnosable rather than forcing artificial BUYs.

### Existing owner
- EXIT: severe deterioration >= 86, or structural break with weak compounder quality
- REDUCE: deterioration >= 68
- ADD: Compounder >= 78, Deployment >= 58, Confidence >= 65
- HOLD: Compounder >= 60
- WATCH: Compounder >= 45
- otherwise REDUCE

### Long term
- ATTRACTIVE: Compounder >= 74 and Deterioration < 55
- UNATTRACTIVE: hard break, Deterioration >= 70 or Compounder < 43
- otherwise SELECTIVE

## Counterfactual Decisioning
Each snapshot creates explicit upgrade/downgrade conditions from:
- valuation / expected return
- market structure
- risk/asymmetry
- business/fundamental deterioration
- structural invalidation

The purpose is to make WAIT actionable rather than generic.

## Research foundation
The architecture synthesizes public, testable concepts from owner-earnings and reinvestment economics, quality/profitability research, expectations-based valuation, momentum/trend evidence, risk control and capital allocation. No famous investor is treated as an authority whose rules are copied blindly; signals must survive AURYN calibration and outcome testing.
