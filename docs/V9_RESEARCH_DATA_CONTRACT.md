# V9 Research Observation Contract

The Feature Tournament requires point-in-time observations. Do not create rows using future knowledge or restated data that was unavailable on the observation date.

Each JSON row must contain:

```json
{
  "featureId": "MOMENTUM:RSI:rsi14:LEVEL:20D:MARKET_REGIME",
  "symbol": "NVDA",
  "asOf": "2025-01-15T21:00:00Z",
  "archetype": "SEMICONDUCTOR_CYCLICAL",
  "regime": "RISK_ON",
  "horizon": "20D",
  "signal": 0.72,
  "forwardReturnPct": 8.4,
  "benchmarkReturnPct": 2.1,
  "maxDrawdownPct": -5.7,
  "costBps": 15
}
```

Rules:

1. `signal` is signed and should be normalized consistently; positive means the feature expects relative upside and negative means relative downside.
2. `forwardReturnPct` and `benchmarkReturnPct` must use the same observation timestamp and forward horizon.
3. `costBps` must reflect the intended execution style before feature promotion is judged.
4. Data must be split chronologically; V9 handles the split and does not randomly shuffle time-series evidence.
5. Observations may be scoped to one archetype. A feature proven in one archetype is not automatically universal.
6. Missing evidence is omitted, never replaced with zero.
7. Production promotion is explicit even after a feature becomes `PRODUCTION_CANDIDATE`.

The next data-engine step after V9 is to generate these point-in-time observations automatically from AURYN historical replay datasets and provider snapshots.
