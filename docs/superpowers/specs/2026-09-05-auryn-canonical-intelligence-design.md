# AURYN Canonical Intelligence Design

## Goal
Make AURYN's Business, Earnings, Future, Valuation, Risk, Thesis and action outputs current, period-aware, asset-aware, traceable and internally coherent without redesigning the approved V3.8.4 UI.

## Architecture
All decision-grade evidence passes through one canonical pipeline:

provider/raw payload -> normalized evidence -> integrity/freshness/conflict resolution -> asset/archetype classification -> independent factor engines -> thesis synthesis -> action policy -> presentation.

No missing input becomes a neutral 50. Missing/stale/conflicting evidence lowers coverage and may block a confident conclusion. Coverage is not model confidence.

## Evidence contract
Every decision-grade fundamental carries value, metric definition, fiscal period, period end, reported-at date, source/provider, GAAP/non-GAAP basis, annual/quarter/TTM scope, freshness and confidence/integrity state.

Source priority for conflicting fundamentals is filing/SEC first, issuer-reported earnings second, trusted structured provider third, derived calculation last. Derived values retain provenance to their inputs.

## Asset routing
Classify EQUITY, ETF, REIT, FINANCIAL, BIOTECH_PREPROFIT, COMMODITY_MINER, CRYPTO and OTHER, plus operating archetypes where evidence permits. ETFs do not receive fake company Business/Financial scores. Missing dimensions are excluded and weights are renormalized.

## Engines
Business measures current operating quality, normalized profitability/cash economics, balance sheet, durability and multi-year record.

Earnings measures the latest event: actuals, estimates when available, surprise, margins, guidance, revisions, acceleration and one-offs. It labels the event as noise, improvement, inflection, deterioration or structural break only when evidence supports it.

Future/Execution measures guidance, revisions, backlog/RPO/contracts, capacity, secular runway, competitive position, management execution and financing/capital requirements.

Valuation is asset/archetype-aware and expectations-aware. Analyst price targets are not valuation and cannot be double-counted across multiple dimensions.

Risk is multidimensional and remains directionally consistent: higher Risk Pressure is worse.

Technicals remain price-derived and separate Technical Strength from Entry Quality.

Thesis combines independent evidence without allowing timing to redefine business quality. New-money action combines thesis, valuation, entry and risk; owner action can differ.

## Score semantics
Use one centralized score-to-label mapping across the product. 100 is rare. N/A remains N/A. Contradictory labels such as 49/100 Strong are impossible by construction.

## Validation
Golden cases: BE, IREN, MU, MSFT, QQQ and APP. Add fixtures for a financial, REIT, pre-profit biotech, cyclical/commodity exposure and a deteriorating company. Tests assert period consistency, asset routing, missing-data behavior, score-label consistency, analyst de-duplication, action gates and explanation/input coherence.

## UI
Preserve V3.8.4 visual design. Existing Thesis, Business and Earnings surfaces consume canonical factor outputs and show period/freshness/provenance where useful. Do not reintroduce duplicate score systems.

## Calibration
Keep frozen decision history/outcomes. Data completeness is displayed honestly until sufficient realized outcomes support empirical confidence. Calibration must never rewrite historical snapshots.
