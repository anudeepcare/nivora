# NIVORA V50 — Investor Decision Engine V2

V50 removes the mode maze and makes one thesis-first decision screen the default.

## Core changes
- Automatically evaluates 3M, 6M, 1Y, 2Y and 3Y; horizons can disagree.
- Separates Company Quality, Thesis, Opportunity and Evidence confidence.
- Adds explicit bearish/avoid vetoes for weak financial, growth and forward evidence so the model is not structurally bullish.
- Price/technicals affect timing/opportunity, not company quality.
- Keeps accumulation area, support, major support, resistance and breakout context, but labels them as timing evidence rather than the thesis.
- New-capital actions: STRONG BUY / ACCUMULATE / WAIT / AVOID. Owner actions can HOLD / REDUCE / EXIT-REASSESS.
- Analyze UX removes horizon and Simple/Investor/Pro button matrices. One optional `I own this` toggle remains.
- Deep research is consolidated to Thesis, Business, Earnings, Ownership, Catalysts and Market.
- Discover opens as soon as real thesis-scan rows exist; it no longer suppresses everything until 75 names are present.
- Discover no longer filters out bearish/neutral names before ranking, so Risk/Avoid research is possible.
- Today keeps material thesis changes and also shows a small current investment radar when there are no material changes.

## Important
The accumulation zone remains market-structure timing context. It is not an intrinsic-value calculation. Street targets are external evidence, not NIVORA fair value. Forward audit/calibration is still required before making performance claims or automated trading decisions.
