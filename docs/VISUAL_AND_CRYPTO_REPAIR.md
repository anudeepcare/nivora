# Research workspace and crypto repair · October 17, 2026

The latest user direction is a ValueSnapshot-style AURYN workspace. The public website, stock-page shell and interactive research example were inspected. Subscriber content was gated; this source is not a verified pixel-for-pixel replica of every ValueSnapshot screen. No competitor code, data feed, brand assets or report copy was added to the product.

## Changes

- Crypto routes previously used only the first segment after research. A decoded BTC/USD or ETH/USD URL could therefore open the BTC/ETH equity listing. Research now preserves the full pair; all visible research links and research/chart/analyst API paths use slash-free USD slugs. Older encoded and split URLs still work. Explicitly selected ETF listings remain distinct.
- Quotes and histories with a mismatched returned provider symbol are rejected rather than relabeled. Regression checks inspect company identity as well as numbers.
- A compact desktop navigation rail, neutral light/dark surfaces, lighter typography, a single icon-and-label research tab row and restrained chart colors follow the inspected public reference. Mobile retains labelled navigation and safe-area handling.
- Removed Your thesis, Add a note, Save snapshot and the Compare research tab. Removed the comparison entry from Preferences. Historical comparison/note endpoints and stored data remain intact.
- Added the missing responsive layouts for financial evidence and insider records. AI generation controls appear only when availability is confirmed. The confusing No AI credits label is now Reported data.
- Technical readings precede the reference chart: EMA20, MACD12/26/9, Bollinger20/2, RSI, daily/weekly averages, relative volume, ATR and Fibonacci levels. These reuse completed historical bars and add no provider requests. Indicators describe price history; they are not validated investment recommendations.
- Events leads with the next scheduled earnings date and estimated EPS, followed by the earnings calendar and clean insider rows. Purchases/sales are separated from grants, exercises and withholding. No speculative catalyst story is fabricated.
- The portfolio currency notice now accurately describes missing labels on older positions. Set costs to USD updates only the selected owned records whose labels are missing, using the existing authenticated endpoint. It does not convert amounts. No account records were changed during development.

## Verification

64 automated domain/component/database tests and 40 built-handler checks passed, along with generated routes, TypeScript and the production build. BTC/ETH split-route regressions failed before the routing fix and passed afterward. Constant/trending/short/forming histories test the new indicator formulas. The API suite tests mismatched crypto identity and canonical USD slugs.

The current live crypto identity result is recorded separately in verification/crypto-identity-provider-check.json. It uses local built handlers, fixture authentication and real read-only market-provider requests, not deployed browser authentication.

## Boundaries

AI is disabled in the user screenshot. Vercel configuration inspection returned a project-scope 403; no Vercel CLI is installed here. The deployment needs an enabled AI flag plus a configured OpenAI key/model before generated reports can be tested. This repair does not switch on paid generation or spend API credits.

Automated checks are not rendered UI acceptance. Browser QA for the changed local build and physical iPhone PWA testing remain unverified; no claim of an exact private-screen replica or complete production acceptance is made. The separate reviewer checked routing/formulas provisionally but could not finish because its usage limit was reached; the final change review was performed inline. The inherited scope gaps in RELEASE_STATUS.md still apply.
