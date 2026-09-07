# AURYN V5 Decision OS Release

Release date: 2026-09-07
Engine: `auryn-v5-decision-os-1`
Domain: `auryn-v5-domain-1`

## What changed

AURYN V5 replaces the stock page's competing presentation/level systems with one canonical V5 snapshot. Market Truth remains the price authority; V4 remains an evidence/classification migration source underneath V5, not a second user-facing decision engine.

### Canonical decision

- Strong Buy / Buy / Hold / Reduce / Sell / Insufficient Evidence.
- NOW / Swing / 6–12M / 3–5Y horizon calls.
- New-money and owner guidance separated.
- Missing valuation alone does not manufacture a bearish zero or force the entire thesis into Insufficient Evidence.
- Technical weakness can constrain entry/timing without independently forcing a long-term Sell.
- Structural thesis failure can still produce Sell even when short-term charts are strong.

### One execution plan

One `ExecutionPlan` now owns:

- initial entry zone,
- staged DCA 1 / DCA 2 / DCA 3 and multipliers,
- confirmation level,
- structural invalidation,
- scenario targets,
- canonical snapshot id.

The V5 technical chart consumes these exact levels. Legacy Fib/wave/DCA calculations are suppressed whenever V5 is available, preventing two different entry or target sets on one page.

### Professional evidence

V5 includes interpreted professional metrics across trend, momentum, volume/flow, volatility, structure, relative strength and structural investment evidence. Technical diagnostics include RSI, MACD, stochastic, CCI, MFI, CMF, OBV slope, ROC, ATR, realized volatility, Bollinger, Keltner/squeeze, Donchian, ADX/DMI, Ichimoku context, anchored VWAP, approximate 60D volume-profile POC, relative volume, MA distance, drawdown and benchmark-relative strength when sufficient bars exist.

Each metric carries state, interpretation, role, source scope and timeframe instead of appearing as an unexplained number.

### Pattern and scenario intelligence

V5 detects structural setups without ticker hardcoding and builds Bull / Base / Bear scenario maps. Supported first-release states include reversal candidates, confirmed reversals, base building, breakout readiness/confirmation and double-bottom structure. Elliott-style wave context is explicitly supporting/probabilistic only.

### UI synchronization

- The stock hero is V5-only; it never silently falls back to a legacy V4 decision surface.
- Thesis factor cards consume V5 professional metrics, so unsupported valuation displays N/A everywhere.
- Business headline/detail scores use the same canonical score.
- Technical headline/detail strength is synchronized.
- The 5-year record no longer mixes an overall numeric score with an unrelated revenue-trend adjective.
- Developer-facing analyst-model/model-fit/engine identifiers are removed from the normal thesis/decision UI.
- V5 decision, execution plan, scenario and metric surfaces share the stock-page width and mobile-safe layout.

### Market Truth and broker safety

V4.2 Market Truth protections are preserved: exchange holidays, stale quotes, provider disagreement and unverified price states can block price-sensitive output. V5 paper-execution metadata carries the canonical snapshot/action into the paper runner. Live-money automatic execution remains disabled.

## Reliability harness

The V5 deterministic reliability matrix executes 16,384 combinations and asserts core invariants, including:

- no price-sensitive execution from unverified Market Truth,
- no missing valuation converted into bearish zero,
- no independently recalculated user-visible execution levels,
- no chart-only Sell against an intact structural thesis,
- snapshot identity preserved into paper execution metadata.

This validates software behavior and consistency; it does not guarantee investment returns.
