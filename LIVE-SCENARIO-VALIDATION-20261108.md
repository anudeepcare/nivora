# Authenticated live scenario check

Authenticated browser sign-in succeeded. Tested the real preprod UI at nivora-dxwi6y8mq-anudeeppaleru.vercel.app, deployment dpl_82DJqyA3dnzyDCHrZ6HU9vnyufGW, READY, commit 91529471b3a1a536c808d4c4e606de93477b0c31. Remote preprod still has that commit. It predates the latest automatic-scenario ZIP, so these observations do not validate that ZIP in production or preprod.

| Ticker | Live automatic range | Observed blocker / result |
| --- | --- | --- |
| IREN | Unavailable | Generic matching cash/debt message; USD quote but displayed cash/net debt in AUD (September 30). Monetary basis needs reconciliation, not relabeling. |
| HIMS | Unavailable | Dated listing/share bridge missing. FY2027 EPS low/base/high -0.09/0.42/1.44 USD: positive-EPS range genuinely unavailable. Revenue estimates exist (rounded UI low/base/high $3.7B/$4B/$4.6B). |
| CIFR | Unavailable | Dated listing/share bridge missing. |
| NBIS | Unavailable | Dated listing/share bridge missing. |
| ASTS | Unavailable | Sector-specific automatic model unsupported. |
| APP | Available | Price-anchored earnings FY2027: displayed bear/base/bull $308.13/$493.45/$667.58. These are model sensitivities, not validated forecasts. |
| MSFT | Available | Conditional earnings FY2028: displayed bear/base/bull $482.11/$636.30/$816.32. These are model sensitivities, not validated forecasts. |

Five of five user-named cases lack numeric scenarios. Two additional profitable-company controls display them. This seven-stock convenience sample is not a market-wide coverage estimate or the user's full 40-stock sample. No company was substituted to improve a pass rate; JPM was opened but not inspected and is not counted.

Raw response access remains separate from UI access: navigating the authenticated research API directly returned “Sign in to continue.” The app uses its client authentication flow; no credentials or tokens were extracted or bypassed. Thus underlying raw provider fields and the new normalization output are not confirmed from this browser check. Visible values are rounded observations, not reconstructed raw fixtures.

The latest source fixes the automatic path when genuine dated shares and compatible financials are provided. It does not prove current IREN/HIMS/CIFR/NBIS can pass all guards; ASTS remains unsupported automatically. The shorter EPS horizon does not fix HIMS's negative low estimate. No changes were deployed or pushed.

Source follow-up: the unavailable revenue diagnostic now distinguishes a complete dated financial balance pair in another currency (for example AUD) from the quote currency (USD). No exchange rate, date, conversion or share basis is fabricated. 54 focused outlook/revenue/financial tests and focused ESLint passed; formatting passed. The previous automatic-fix build passed, but a full release build was not repeated for this diagnostic-only change.
