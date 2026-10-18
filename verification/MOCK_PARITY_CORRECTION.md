# Mock parity correction — October 17, 2026

Reviewed all eight supplied screenshots against the approved HTML and source. Corrected missing active tab class, restored Company / Quantity / Avg. cost / Price / Value / Return columns, reduced portfolio summary to the compact invested-value and return layout, removed duplicate allocation heading and per-row date clutter, and removed the duplicated Portfolio balance hero from Home. Overview chart uses the left price axis to match the reference. TradingView attribution is retained.

EODHD v1.1 trend records can omit currency; a failing regression reproduced the resulting missing scenario inputs. Normalization now inherits the explicitly reported income-statement currency when trend currency is absent. It never substitutes listing currency when reporting currency is unknown. This allows valid same-currency annual EPS ranges into the existing disclosed sensitivity model.

Bear/Base/Bull layout remains present when estimates are missing, with unavailable values. It does not relabel analyst consensus as three scenarios. Model details expose inputs and assumptions. Targets are forecast sensitivities, not validated intrinsic fair values; no guaranteed three-year forecasts or sample prices are manufactured.

Verification: 148 tests, TypeScript, production build, and 58 fixture API checks passed. Public EODHD AAPL demo trend inspected read-only; no private credentials or live account were tested. Source checks do not establish exact rendered parity. Browser screenshot comparisons and physical installed-iPhone acceptance remain open. No deployment, push, database mutation, paid AI call or order was performed.
