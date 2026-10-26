# Added technical studies and motion — October 25, 2026

## New studies (Technicals tab, two new groups)
`lib/technical-more.ts` computes, from the same completed daily bars as the existing studies: Supertrend (10, 3), Parabolic SAR (0.02/0.2), Ichimoku (9, 26, 52, cloud as it stands today), Aroon (25), Keltner channel (EMA20 ± 2×ATR10), Awesome oscillator, TRIX (15), Ultimate oscillator (7/14/28), 20-day volatility percentile, past-year return and volatility, return per unit of volatility and of downside, and the Ulcer index.

- Each study returns `null` when its minimum history is missing; the UI shows "History needed" or "Not established". No zero or NaN is substituted.
- The risk ratios subtract **no risk-free rate** and are labelled that way; they are not Sharpe or Sortino ratios.
- Studies describe past price behaviour. They are not buy or sell rules, have no demonstrated edge, and do not feed the existing decision labels, Monthly Pace or scenarios.
- Existing studies (RSI, MACD, Stochastic, ADX, CCI, Williams %R, MFI, ATR, Bollinger, OBV, Chaikin money flow, Donchian, pivots, Fibonacci, weekly WMAs, beta/correlation) are unchanged.
- `tests/technical-more.test.mjs` checks exact reference values on synthetic series (for example Tenkan 395 and Kijun 386.5 on a one-point-per-session rise, Awesome oscillator ±14.5), mirrored falls, bounds of the Ultimate oscillator, null on short history and finiteness on the MSFT fixture.

## Motion
`app/decision-scale.css` adds a short settle-in on the Overview scale and Technicals, press feedback on evidence stones, a shared easing so the scale's pans stay level while the beam swings, and `content-visibility: auto` on Technicals study groups. All animation is disabled under `prefers-reduced-motion`. No render-time or frame-rate measurement was made.

## Not claimed
No algorithm here is validated as better than another. Rendered performance, mobile behaviour and PWA install behaviour are unmeasured.
