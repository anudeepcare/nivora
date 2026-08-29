# NIVORA V18 — Decision First + Explainability + Options/Gamma Foundation

## What changed
- Primary action (BUY / WAIT / HOLD / DON'T CHASE / REASSESS) is now the first major card.
- NIVORA score moved below the action + price plan + chart so it supports the decision instead of competing with it.
- Mode-specific score weighting: Now, Swing, Long term and I own it no longer use the same score weights.
- Tap-friendly info controls explain business quality, trend, entry, risk, confidence, score ranges, and technical metrics.
- Decision confidence explicitly shows whether all important evidence layers are available.
- Registration requires Terms + investment/data disclaimer acknowledgement.
- Added Options / Gamma analysis tab architecture. It does NOT fabricate gamma data from candles.
- Gamma will require a permitted options-chain source with open interest + Greeks before live gamma levels are enabled.

## Score ranges
- 80–100: Excellent evidence
- 65–79: Promising / selective
- 50–64: Mixed / wait
- <50: Weak setup

The score is not the action. A strong company can still be DON'T CHASE when timing is poor.

## Options / Gamma
Dealer-gamma / gamma-wall analysis cannot be responsibly derived from OHLCV alone. V18 adds the UX and calculation plan, but deliberately does not scrape Cboe's delayed quote pages or invent dealer positioning. Connect a licensed options-chain API before enabling live gamma levels.
