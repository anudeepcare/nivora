# AURYN V8 Reality Audit & CIO Consistency Design

## Goal
Make AURYN trustworthy across a broad real-stock universe by validating classification, lifecycle, decision arbitration, execution-plan consistency, and presentation semantics against a fixed 100-ticker golden universe before release.

## Architecture
V8 keeps the V7 Market Truth / canonical snapshot / specialist engines / CIO / execution-plan architecture. It adds three hardening layers: (1) evidence-aware classification with explicit UNKNOWN lifecycle instead of guessing maturity, (2) a CIO consistency arbiter that reconciles horizon actions into one coherent primary/owner action, and (3) a 100-ticker Reality Audit harness with release-gating invariants.

## Classification
Business classification uses weighted evidence from industry, sector, company description, strategic theme, and legacy hint. Explicit entity types such as REIT, bank, insurer, and digital-health platform outrank generic keyword matches. Generic hints can never override more specific source-backed evidence.

Add `DIGITAL_HEALTH_PLATFORM` for telehealth, digital health, consumer-health subscription/platform businesses. These companies use a growth/platform analyst model and growth-style valuation rather than biotech pipeline valuation.

## Lifecycle
Add `UNKNOWN` as a valid lifecycle. When revenue/growth/profitability evidence is insufficient, AURYN must return UNKNOWN rather than MATURITY. Frontier SPACE_SATELLITE companies with pre-profit or commercialization evidence should resolve to PRE_COMMERCIAL / VALIDATION / INFLECTION; maturity requires positive evidence of a mature business.

## CIO consistency
Primary action represents the resolved current CIO posture, not a valuation-null default. Missing valuation caps bullish new-money conviction but cannot hide broad bearish consensus. If NOW/SWING/6-12M/3-5Y are overwhelmingly REDUCE/SELL and thesis strength is weak, the primary action must be REDUCE or SELL according to structural state. Existing-owner action must not contradict an EXIT/REDUCE structural posture.

Strength and direction are separate concepts. UI wording must expose `Thesis Strength` and `Thesis Trend`, and `Moat Strength` and `Moat Trend`, so a weak but stable thesis cannot look healthy merely because its direction is stable.

## 100-ticker Reality Audit
A fixed 100-symbol golden universe spans software, semiconductors, AI/power infrastructure, health/digital health, frontier/defense, financials, consumer, industrials, energy/miners, and REIT/insurance.

Each entry defines representative source-backed classification input and expected business model / allowed lifecycle family. The audit runs the production classifier and model registry and checks release invariants.

Critical invariants:
- 100 entries exactly.
- No confident generic fallback when a specific archetype is expected.
- No MATURITY fallback from missing lifecycle evidence.
- HIMS/TDOC/DOCS-style businesses route to DIGITAL_HEALTH_PLATFORM, not BIOTECH_PHARMA.
- ASTS/RKLB-style frontier names route to SPACE_SATELLITE and never default to MATURITY without mature evidence.
- REITs remain REIT even when their descriptions mention data centers or infrastructure.
- Analyst model and valuation method are compatible with classification.
- CIO primary/owner/horizon actions obey consistency invariants.

## Release gates
V8 is releasable only when the 100-ticker offline Reality Audit has zero critical violations, the existing full regression suite is green, production/dead-code audit passes, and exact extracted ZIP verification passes. Live-provider 100-ticker testing is shipped as a script/API contract for execution in Vercel where provider credentials are available; no secrets are embedded in the ZIP.
