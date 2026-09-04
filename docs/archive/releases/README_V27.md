# NIVORA V27 — Live Intelligence Suite

V27 turns NIVORA from a data dashboard into a synthesis engine.

## New intelligence layer
- NIVORA Thesis tab with a proprietary multi-factor synthesis score.
- Different weighting by Now / Swing / Long term / I own it.
- Contradiction detector: finds cases such as strong business + poor entry, strong trend + weak flow, or positive news + high risk.
- Bull / Base / Bear scenario engine with changing evidence-weighted probabilities.
- Explicit “what would make NIVORA more bullish?” and “what would make NIVORA more cautious?” triggers.
- Confidence score based on evidence coverage and disagreement.
- Correct separation of positive fundamental evidence from negative fundamental evidence.

## Options Lab
- Expiration-aware API.
- Auto best-fit expiration by style.
- Scrollable expiration selector with DTE.
- Calls / Puts.
- Safer / Balanced / Aggressive / LEAPS.
- Contract ranking using liquidity, spread quality, delta fit, DTE, moneyness, theta and IV penalties.
- Gamma / OI positioning remains available.
- Shared server caching remains enabled.

## Important production notes
- MARKETDATA_TOKEN remains server-side only.
- Free/trial options data can be delayed. The UI must not present delayed options data as live.
- NIVORA is decision support. Scenarios and contract scores are evidence rankings, not guarantees or trade execution instructions.
- For live market days, production quality depends on the freshness/licensing of the underlying data providers.
