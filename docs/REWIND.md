# Rewind — October 25, 2026

A panel on the Overview tab, below the evidence scale. A slider moves a cursor through the company's last five years of completed daily bars. For the chosen day it shows the trend state (price against its 50- and 200-day averages), RSI, and distance from the one-year high, then what the price did 1, 3 and 6 months later. The part of the chart after the cursor is veiled.

**Days like this one** compares all past days with the same trend state and RSI band against all observed days: share higher after three months and the median change. It is shown only when the matching days cover at least three separate three-month windows, and it says how much the days overlap.

- Source: the company's own completed daily bars only (`lib/rewind.ts`). No new data, endpoint or dependency.
- Each day uses only information up to that day. Outcomes are null until observed.
- It describes one stock's past. It is not a forecast, not a signal rule, and does not feed any decision label, scenario or Monthly Pace.
- Tests: `tests/rewind.test.mjs` (exact reference values, no look-ahead, bounded window, finite output).
