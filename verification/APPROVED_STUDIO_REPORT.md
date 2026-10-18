# Approved design implementation — 17 October 2026

## Source and scope

Built from GitHub `anudeepcare/nivora` main commit `53655c82ed00bcacdafc5e97da1b1493a39d6db6` in a separate local checkout/branch. The recovered source package matched every application file on that main revision. The new canonical visual reference is `docs/design/approved-studio-20261017.html`, explicitly approved by the user in chat. The later instruction to keep exactly the same primary metrics and omit additional/redundant panels is captured in the spec.

## Implemented

- Approved light navigation, company identity, contrasting research canvas, four-item floating mobile dock and compact settings sheet. AURYN/company assets are preserved.
- Overview has the quote/change, buy/owner context, concise decision, DCA, real price chart, outlook, four agreed financial metrics and short strengths/risks. No extra earnings or market-metric grids.
- Financials has Revenue, Operating margin, Cash after capex and Net debt, followed by the four-row Income/Cash flow/Balance sheet table. TTM, annual and quarterly use their own observations.
- Value has three cases where eligible, case explanations and exactly P/E TTM, Forward P/E and EV/revenue. Removed cash-flow example and assumption-calculator panels are not rendered.
- Technicals has RSI, MACD, relative volume and ATR, Fibonacci references, moving-average/additional-study disclosures and amount-free DCA. Daily/weekly/monthly changes aggregate the actual chart bars. The extended anchor editor is a dialog.
- Thesis has at most three reported drivers/risks, three watch points and the three approved question buttons. When configured AI is available, a deliberate question click can request the existing bounded analysis endpoint. Otherwise a clearly labelled evidence explanation is generated locally without an AI request. No paid AI configuration was changed.
- Home/Watchlist/Portfolio use live workspace records, existing cached quote batches, compact rows, filters and the approved hierarchy. A holding has one action button; remove confirmation is inside its editor. Search suggestions use the account's saved instruments, not hardcoded recommendations.
- Existing auth, provider routing, request budgets, asset/currency guards, alerts and guarded paper endpoints remain. No database migration, broker submission, push or deployment was performed.

## Numbers and model limits

The prototype contains illustrative prices/targets/technical readings. They were not copied into live research. The outlook uses a dated positive low/average/high annual EPS range and applies 80%/100%/120% of the reported forward P/E as explicit sensitivity assumptions. It uses the actual forecast date rather than silently calling every horizon three years. This is not a fully company-specific intrinsic valuation or a validated investing edge. Missing ranges, stale evidence, foreign-listing basis, currency mismatches and unsuitable sector/asset cases withhold targets. A consensus fallback must also be current and displays its observation date.

## Verification

- `npm run verify`: **146 tests passed, zero failures; Next TypeScript generation/typecheck and production build passed**.
- Final CSS-only cleanup: `npm run build` rerun successfully; all three active stylesheets parsed successfully with PostCSS.
- `npm run test:api`: built handlers tested with fixture identities/transports; see `approved-studio-api.log`. Covers 32 API checks, the research regression group and 10 hybrid-provider checks.
- Meaningful regressions include delayed list content, user-gesture cancellation, active-tab no-op, per-route memory, expired consensus, scenario calculation/currency guards, exact financial metric/table scope, saved-instrument search and actual weekly/monthly aggregation.
- A fresh independent review identified two issues: the three-second scroll deadline and stale consensus fallback. Both were reproduced RED, fixed and verified GREEN. Loading now remains pending past the deadline until the content settles or errors, while user intent and route cleanup cancel restoration.

## Not verified

- No supported browser control is available in this managed workspace. No rendered desktop/mobile comparison, screenshot audit, visual pixel acceptance or actual installed-iPhone PWA test was performed. **An exact visual match cannot be certified from these checks.** Safe-area and responsive CSS are implemented but still need device acceptance.
- No new signed-in live Supabase/EODHD/Twelve Data session, provider entitlement matrix, paid AI response or Alpaca order was tested. Passing fixture tests is not proof of a live account connection.
- The inherited broader requirements still listed in `docs/RELEASE_STATUS.md` remain open; this build does not certify commercial readiness or universally correct buy/sell judgments.

## Review rulings

- Live numbers must remain dated source values rather than fixed prototype numbers. Cost if wrong: displaying invented investment information.
- Use the actual forecast horizon and label the outlook as a sensitivity. Cost if wrong: representing assumed multiple changes as verified fair value.
- Use one document scroller with deferred restoration instead of reproducing the prototype iframe's scroll jump. Cost if wrong: changed navigation feel; needs real-browser acceptance.

No minor review findings were deferred. The two important review findings were fixed. Browser/device acceptance remains an explicitly open verification gate.
