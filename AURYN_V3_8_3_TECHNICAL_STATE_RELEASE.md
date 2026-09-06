# AURYN V3.8.3 — Technical State

This release separates technical strength from entry quality and makes the Technical tab use the same canonical indicator calculations as the live analysis API/backtest engine.

Key changes:
- Wilder RSI(14) and ATR(14) remain canonical.
- Standard seeded EMA/MACD diagnostics.
- 20-day realized volatility uses sample standard deviation of log returns, annualized.
- Current-volume participation is compared with the prior 20-session average.
- Technical Strength, Entry Quality, Trend, Momentum, Participation, Extension Risk and Volatility Risk are separate.
- A strong trend can remain bullish while Entry Quality falls after an extended move.
- API publishes canonical indicator diagnostics and technical-state version `auryn-tech-v2` so the UI does not recompute a conflicting headline score.
