# AURYN V9.3.8 FIX1 — Corrective UX + Request Coalescing

## Corrective UX
- Restores comfortable desktop spacing after the V9.3.8 density regression.
- AURYN Call and Price Structure chart now have matched card heights with an actual gap before the metric rail.
- PriceChart now honors its CSS container height instead of forcing a 430px desktop canvas, which was the root cause of chart clipping/overlap.
- Long actions such as START SMALL and REDUCE use a smaller display size while short actions such as WAIT remain prominent.
- Bull/Base/Bear scenario values render as isolated equal tiles with stable alignment.
- Desktop holdings remain compact but regain premium readability.
- Mobile decision/chart/scenario/technical surfaces retain hierarchy without giant empty cards.

## Reliability
- Missing holding price no longer becomes numeric zero through Number(null); P/L stays unavailable unless current price and cost basis are real.
- Existing canonical AURYN truth rules remain unchanged.

## Performance
- Same-URL JSON GETs share one in-flight promise.
- Short-lived client response caching avoids duplicate canonical/analyze/evidence requests during rapid re-renders and navigation.
- Existing warm cache, progressive rendering and provider pacing remain in place.

## Verification
Run: npm run gate:v938fix1
