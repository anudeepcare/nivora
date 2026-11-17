# Automatic scenario coverage correction

## Confirmed systematic issue

The revenue model required field-specific simultaneous market-cap/share/price observations that production EOD normalization never produced. The new path uses genuinely dated reported shares instead of synthesizing those timestamps. The existing independently dated market-cap reconciliation path is retained.

## Automatic changes

- Normalize actual historical outstandingShares dateFormatted with explicit shares or sharesMln units, or dated balance-sheet commonStockSharesOutstanding. Record source field, period date and retrieval/knowledge date separately. Dataset UpdatedAt never becomes an economic observation date.
- For explicitly identified US ordinary common listings, pair that dated count with an independently recent compatible quote. Counts older than 120 days, foreign/ADR ambiguity, currency mismatch, malformed/future dates, known intervening splits and material contradictions with supplied current counts remain blocked. This is calculated capitalization, not independent market-cap verification.
- Use the accepted dated count throughout revenue EV and per-share calculations, rather than silently returning to undated SharesStats. Disclose differing dates and unmodeled subsequent financing. Multiple and dilution changes remain stress assumptions, not predictions.
- Accept complete annual EPS forecast periods 90–269 days away, matching the revenue minimum remaining horizon. Quarterly, expired, incomplete, nonpositive, inverted and mismatched-currency forecasts remain excluded. Annual reporting duration is not confused with time remaining to fiscal end.
- Preserve calculated-multiple attribution as a typed flag rather than parsing explanatory prose.

## What was actually validated

Four explicitly synthetic EOD normalization-to-scenario cases (IREN/HIMS/CIFR/NBIS labels with controlled US ordinary-common metadata) produce automatic ranges without manually injecting listing timestamps. These are algorithm tests, not real financial observations or proof those real companies meet the listing safeguards. Three synthetic ordinary-company EPS cases verify the shorter annual horizon.

Authentic archived IREN, observed October 19, 2026: one real Research snapshot tested; automatic range remains unavailable. It contains future revenue ranges and matched cash/debt, but no dated share observation or reported shares fact. It has not been altered to fabricate them. User screenshots show unavailable IREN/NBIS/ASTS ranges; HIMS/CIFR live payloads are not available. No 40-stock or representative live coverage rate has been established. The user's 30/40 observation is user-reported.

The historical 200-ticker audit only validates price histories. It cannot establish scenario coverage. ASTS remains frontier; infrastructure/financial/foreign routing safeguards have not been relaxed without supporting data.

## Remaining access and evidence

The existing preview browser remains at Vercel login. Complete its sign-in handoff and provide the tested ticker list for a live sample. Alternatively provide sanitized Research responses containing company, quote, history, evidence and facts, excluding cookies, keys and private holdings. Connected Twelve Data estimates/balance-sheet probes were entitlement-denied; no new subscription or permissions were purchased or changed.

This corrects automatic ingestion/calculation paths where required source observations exist. It does not guarantee numeric ranges for all five named stocks. A manual funding workbench is not counted as an automatic-coverage repair. No remote push or deployment was performed.

## Final verification

The integrated suite passed 1,295 tests; lint, full formatting and typecheck passed. After a final selected-reference freshness correction, 105 affected scenario/UI tests passed. A usable selected reference no longer inherits a discarded quote's stale flag; no-reference input remains unchanged. The final release build is reported at delivery.

Final optimized release build passed on the exact packaged source.
