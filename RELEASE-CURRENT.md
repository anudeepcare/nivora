# Current release — synchronized analyst targets and Pace v6

This release supersedes earlier notes saying the candidate was offline or monthly-v5 remained the current app engine.

## UX priority release
- Simplified Pace into one reading, one action line, the next conditional zone and one Levels & history disclosure. Stage exploration, historical context and the link to full technicals remain available.
- Replaced 627 lines of overlapping Pace CSS with a focused module; no classifier or investment-policy change in this pass.
- Added Since you last checked: device-local prior-visit comparisons of compatible Pace, same-period EPS estimates, analyst consensus and newer price observations. Maximum three changes, no first-visit noise, provider/date/currency validation, refresh updates against the original visit baseline.
- Preserved advanced/Pro tools and metrics. Restored the expectations calculator under Valuation; estimate coverage and earnings yields open on demand. Empty Overview scaffolding stays hidden while full tabs remain available.
- Refined owner documentation with a calm cover, topic navigation, search, proper lists/tables, mobile chapter selection, reading time and keyboard-friendly chapter navigation. Technical source remains owner-only and opt-in; full download remains available.
- Updated the guide to explain active monthly-v6, historical v5 fallback and current validation limits.

## Options cleanup
- Removed the session-activity panel.
- Saved views and account controls remain collapsed; empty saved-view and replay selectors are hidden.
- Shortened control labels and removed repeated keyboard/tutorial paragraphs.
- Expiration comparison stays collapsed and full width, retaining actual observation dates and missing-data distinctions.

## Target synchronization
- Overview, Valuation and the Analyst targets tab reuse AnalystTargets and consensusOutlook. Values, reference price, changes and target dates are identical for the same research snapshot.
- Valid analyst targets take the headline position; calculated AURYN scenarios stay separately labelled. Overview falls back to the selected AURYN model if analyst targets are absent.
- Low / consensus / high retain distinct coral / gold / teal cards. Missing bounds are never invented.
- Removed repeated target metadata paragraphs. This does not establish provider parity with DCA Optimizer.
- APP live payload remains unverified because protected-preview access was blocked; no corrected APP figures are asserted.

## App changes
- Enabled the frozen monthly-v6 technical classifier in the shared analysis engine used by Research and portfolio/watchlist assessments. No per-ticker overrides or runtime training.
- Preserved monthly-v5 historical readings before the model cutoff and fallback for crypto/insufficient history. Legacy backtests remain explicitly labeled.
- Current conditional levels are recalculated using the new classifier; obsolete v5 buy thresholds are not displayed for v6 readings.
- Pace remains first on Overview. Historical closing zones stay distinct from current provisional zones.
- Removed duplicate valuation scenarios. Restored coral/gold/teal bear/base/bull styling; negative percentage changes remain negative regardless of scenario label.
- Targets uses the same selected default scenario model; explicit user P/E assumptions remain separate.
- Removed repeated earnings thesis/preparation commentary and redundant notes fetching. Kept actual EPS, estimate, surprise, next report date and earnings history.
- Removed the long options-map tutorial and its unused CSS.

## Verification
The actual shared TypeScript engine reproduces all 589 saved candidate outputs exactly. In the saved reserved subset, agreement is 159/182 (87.4%); reference deeper categories match 53/69 (76.8%). This explored snapshot is not independent future-date validation or return-prediction accuracy. No 99% claim.

## Delivery
Source only; no deployment or database changes. Optional public Pace record publishing requires scripts/sql/enable-pace-v6.sql to accept the new version. App display/calculation does not require that SQL. Existing public-record permissions are preserved. No newly verified APP forecast values are claimed.

## Reference-led responsive refinement — November 8
- Valuation now leads with the HTML-inspired editable “What the price needs” sentence, followed by the existing bear/base/bull view. EPS requirements use the selected price reference; comparable positive estimates have a common-scale bar comparison.
- Ownership and Ask AURYN share their own row; the investment case and business map retain their desktop alignment.
- Financial categories, technical panels, Overview evidence, Home, Watchlist and public examples use coordinated gutters and card sizing.
- Model-fit detail remains accessible without dominating the valuation page. Calculations, scenarios and Pro tools remain available.

## Reference completeness — November 8
- Added the 30-second read with the selected holding/entry decision, available price movement, target comparison and momentum context.
- Equalized top fact cells, kept individual help/dates and preserved scheduled earnings priority.
- Added switchable analyst-target and moving-average chart references, alongside the existing independent Fibonacci overlay.
- Paired consensus with data freshness; compact freshness strip when target coverage is missing.
- Aligned Pace/chart boundaries and condensed repeated evidence/risk text.
- Reworked public product questions into three consistent cards.

## Readability and workspace review — November 8

Clearer Pace summary with a filled diamond; stronger text contrast; compact mobile financial-period controls; short evidence reads in Business, Case, Technicals, Targets, Options and Portfolio. Ownership adds the largest supplied holder and explanations. Options groups its command/filter surfaces and removes repeated expiry/range metadata. The valuation sentence keeps accessible labels outside the visible text. Portfolio distinguishes missing calendar coverage and defers five optional analysis modules until opened. Research navigation follows the selected tab as layout settles. Calculations, scenarios and tools remain in place.

This is a source release; no production deployment or database changes were performed.
