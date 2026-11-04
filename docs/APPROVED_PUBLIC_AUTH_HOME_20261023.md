# Approved public, authentication and Home implementation

## Design scope

- Public: approved “The market is loud. Find your conviction.” direction. One connected Business / Value / Timing research panorama, light page, blue actions, compact benefits and footer. All sample data is fictional and labelled. The scenario preview uses one correct linear scale. Perspective buttons highlight their respective chapter without hiding the other evidence.
- Sign-in/create-account/recovery: approved focused form, desktop blue wireframe landscape, serif welcome heading, sign-in/create-account controls, Google/X and email paths, reset-password and compact legal links. Mobile is a single focused column. Existing auth handlers, provider tri-state availability, recovery and redirects remain intact. No authenticated navigation is rendered on the entry screen.
- Home: greeting with account display name when supplied, selected-company daily closing-price chart, next company calendar event, relevant company headlines and compact holdings list. Three desktop columns become a mobile briefing. The chart uses actual daily history; it does not pretend to represent portfolio performance. One-month/three-month/year controls reuse the same cached annual series. Real account data replaces illustrative mock numbers; absent data has honest empty/error states. No fabricated benchmark, event, return series or company thesis.
- Home uses one existing quote subscription and bounded cached company-feed requests, thirty companies per selectable group. No second portfolio-total calculation or full research fetch per holding. Existing stable PWA shell/safe-area geometry is retained.

## EODHD-first routing

EODHD is now primary for quotes, intraday and daily history. Twelve Data is fallback. Successful fresh primary quotes avoid a duplicate backup request; a stale or failed primary permits fallback. If both are stale, the newest usable dated observation is retained. Entire price-history series are selected from one source, never spliced. EODHD already supplies financial research/search/events when configured. Existing cache, shared budget and backoff limits remain. This routing preference does not establish real-time/extended-session entitlement.

## Analyst range versus valuation

Overview retains eligible calculated earnings scenarios first. Analyst consensus is a distinct fallback, not intrinsic value. Where both low/high analyst target fields are explicitly supplied and ordered around consensus, the analyst card displays Low / Consensus / High on one linear scale. Missing or contradictory bounds do not become invented Bear/Bull valuations. Current EODHD evidence in the inspected app supplies consensus only; the connected Twelve `/price_target` check denies access on the current key. No paid plan change was made.

Automatic numeric cases cannot honestly be guaranteed for every security: a bank, an unprofitable infrastructure company, ETF and cryptocurrency need different evidence/frameworks. Existing invalid-listing/currency/share-count/funding guards remain.

## New screenshot audit

The supplied reference screenshots show settled prices through October 22, 2026:

| Ticker | Reference confirmed / forming | AURYN v4 confirmed / forming |
| --- | --- | --- |
| SOFI | 3× / 3× | 2× / 2× |
| TTD | 4× / 3× | 3× / 2× |
| CRWV | 1× / 4× | Insufficient history for the existing policy |

SOFI/TTD recalculation used independently fetched monthly OHLC observations with the current month dated to October 22 and completed months to their final US session. It is not a daily-series audit or performance validation. See `verification/sofi-ttd-reference-audit.json`. The original policy is not retuned or hardcoded to hide these mismatches. Earlier selected-sample agreement must not be described as universal parity.

## Verification limits

See `verification/REPORT.json`, `approved-entry-home-verify.log`, `approved-entry-home-api.log` and `launch-auth-http.json` for executed checks. Automated component tests cover real versus fictional Home data, missing history and empty-account behavior. Compiled API tests use fixtures, not every live paid endpoint. Local production HTTP checks verify routes and signed-out protection, not rendered visuals or an OAuth consent journey. Physical installed-iPhone/PWA behavior and pixel-level visual comparison remain unverified. No production deploy, Git push or database write was performed.
