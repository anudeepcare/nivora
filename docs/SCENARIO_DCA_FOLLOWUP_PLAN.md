# Scenario and accumulation follow-up

Requested: resolve the observed SOFI/TTD mismatch, include CRWV, and put numeric bear/base/bull cases ahead of consensus. EODHD remains primary.

Implementation: version the original accumulation rule; keep prior-window-only calculations, settlement and gap checks; support a separately labelled 12–23-prior-month listing history. Calibrate explicit deviation/spread thresholds without ticker branches and report both current agreement and historical regressions. Preserve v4 for reproducibility and backtest version selection.

Scenario selection: eligible earnings cases first; otherwise display empirical historical price-risk cases with explicit horizon/reference/sample counts. These are not company valuations or analyst targets. Missing/invalid/too-short histories still cannot produce honest numbers. Consensus remains only as separately labelled analyst opinion, never relabelled Base. Preserve existing styles, PWA geometry, provider routing and account data.

Verify threshold, short-history, no-lookahead, gap, scale, empirical-percentile and invalid-input behavior; compare the supplied screenshots and broader existing reference sample; run full verification and compiled APIs; ship one full-source ZIP with exact limits.
