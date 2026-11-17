# Scenario priority and older quotes — 2026-10-19

The prior global `scenarioEligible: false` flag was a presentation regression. It hid supported earnings scenarios while removing the inflated revenue sensitivities. The selector is now model-specific:

1. Valid, reconciled positive annual EPS low/base/high and positive forward P/E: show Bear/Base/Bull earnings scenarios before analyst consensus.
2. Unsupported or incomplete earnings model: show separately labelled analyst consensus where available.
3. No valid model or target: explain the missing evidence without manufacturing outputs.

These EPS × assumed-multiple cases are conditional future price sensitivities, not a DCF, present intrinsic value or validated target. The forecast end date is visible. This release does not implement automatic sector-specific DCF valuations or copy competitor output numbers. Revenue-multiple sensitivity outputs remain excluded from the headline.

A recent dated older quote within four days remains usable as a labelled reference for earnings scenarios; target amounts do not change merely because quote.stale changes. Price-anchored revenue sensitivities still require a current quote. Trading execution and other entry freshness checks are not relaxed. Missing/very old/invalid reference prices do not fabricate percentage gaps. Analyst consensus survives a missing quote independently.

Regression tests cover fresh → older target stability and priority over the analyst fallback, and fallback for a revenue-only case. Fixture ticker changes are synthetic policy tests, not live validation of every named stock. Physical iPhone standalone acceptance and deployed rendering are not verified.

Read-only ValueSnapshot comparison of APP, NOW, MSFT and META observed separate DCF, EPS, Rule of 40 and PEG displays. Different end-of-day prices and assumptions mean these outputs are not ground truth or exact-number acceptance criteria. No saved competitor models were edited.

The same build includes scoped analyst card polish: compact quote/date row, metric grouping and optional coverage notes. PWA shell geometry and provider request cadence are unchanged.
