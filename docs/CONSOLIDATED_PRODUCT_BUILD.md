# Consolidated AURYN continuation

This is the current continuation of the approved product, including the previous screenshot corrections. It contains the full standalone source, not an isolated visual prototype. It is not a certification of all competitor features, investing performance or commercial readiness.

## Changes in this continuation

- **Public storefront:** one product introduction, interactive fictional Business/Value/Discipline example, three connected workflows, research principles, help and legal links. Removed repetitive feature/process sections. Replaced the public stylesheet as one owner; removed older public-section overrides from the authenticated content stylesheet. No unsupported billing or performance promise is advertised.
- **Weekly accumulation:** Technicals now has Monthly/Weekly selection. Weekly v1 uses 52 completed prior consecutive weeks, robust log-price slope/residual spread and documented pullback gates. Confirmed/forming signals, dates, coloured candles, threshold prices and input coverage remain separate. No new data calls are needed. Monthly v3 and its existing historical simulation remain unchanged. Weekly has no simulation or validated investing edge.
- **Extension review:** the existing extreme-extension flag is shown separately from the contribution multiplier. It does not specify a sale amount. Missing inputs do not become a zero multiplier.
- **Home calculations:** lots are combined before ranking concentration and cost drawdown. Older usable USD quotes remain included with a visible older-price label. Invalid/foreign-currency observations remain excluded. Home is a review queue, not another portfolio balance card.
- **Home coverage:** the former silent first-30-company limit is now explicit batches of up to 30. All followed eligible stocks are reachable. Each selected batch uses the existing cached event/news endpoints. This is not automatic monitoring of all batches simultaneously.
- **Previous screenshot corrections retained:** compact Advanced risk brief and separate work areas; reported per-share cash independent of live quotes; compact Overview sparklines/case evidence; conditional valuation methods and personal assumptions; contradictory IREN sector withheld in the header. See SCREENSHOT_FEEDBACK_20261023.md.

## Weekly methodology

The monthly and weekly horizons are different policies. Weekly uses a 3% spread floor instead of monthly's 7%, with the same robust median-pairwise log trend and deviation/drawdown gates. For weekly, 2x/3x/4x require a 12%/25%/40% decline from the prior weekly-close high and at least 0.7/1.35/2 robust spread units below trend. Extension pause requires two units and 25% above trend. The additional review flag requires three units and a 50% rise from 26 prior weekly observations. These are original, unvalidated research rules, not inferred private competitor rules.

US weekly keys end Friday, with standard Friday holiday closures adjusted using the exchange calendar. Early closes still use a conservative 5 PM New York settlement cutoff. Exceptional closures and absent expected final closes withhold a reading. New Year's Saturday has no preceding-Friday year-end holiday. Juneteenth closures apply from 2022. Crypto weeks end Sunday UTC; the current UTC day is never treated as settled.

Reference: https://www.nyse.com/markets/hours-calendars and https://ir.theice.com/press/news-details/2025/NYSE-Group-Announces-2026-2027-and-2028-Holiday-and-Early-Closings-Calendar/

Do not add weekly and monthly multipliers together or present them as guaranteed position sizes. Existing historical comparisons are monthly only. Missing/gapped history and conflicting closes are withheld, not filled with a fabricated signal.

## Competitor patterns and current coverage

| Reference pattern | AURYN implementation | Remaining limitation |
| --- | --- | --- |
| ValueSnapshot business/financial presentation | Overview, Business and Financials; historical statements, cash, dilution and risk | Data coverage is instrument-specific; company-specific moat claims are not invented |
| ValueSnapshot valuation clarity | Conditional supported scenarios, analyst consensus, dated assumptions | Complete automatic sector models and all-stock numeric scenarios are not implemented |
| DCA Optimizer signal presentation | Monthly v3 and separate Weekly v1, confirmed/forming history and dated bands | Private signal parity, intraperiod touches, trim strengths and weekly backtests are not established |
| Versys structured deeper research | Analysts, News/Earnings, ownership and professional work areas where supplied | Full automatic peers, revisions, options coverage and populated company-specific future operating plans remain incomplete |
| Premium connected product | Shared shell, content surfaces, Simple/Pro, saved appearance, portfolio-linked news/events | Rendered parity and installed iPhone acceptance need actual device/browser verification |

## Verification and limits

396 unit/render/database tests, route type generation, TypeScript and production build passed. All 83 compiled API fixture checks passed. Six local HTTP HTML checks returned 200 for the storefront, sample, login, terms, privacy and methodology. See verification/REPORT.json and consolidation-verify.log / consolidation-api.log. Weekly tests cover settlement, holiday weeks, gaps, short history, duplicate conflicts, future bars, price-unit invariance and crypto close. Home tests cover combined lots, older prices, invalid inputs and complete batch reachability.

The local browser binary download returned a truncated archive, so browser rendering could not be completed. Existing cloud-browser local-preview access was blocked previously. Compilation and server rendering do not prove pixel parity, mobile keyboard behaviour or physical iPhone correctness. PWA shell geometry was preserved in this continuation.

There were no live database writes, broker orders, paid AI calls, Git pushes or deployments. No migration is needed for these changes. Billing activation, notifications delivery, broker connections, full cited filing AI and complete commercial licensing are not certified by this package. The broader feature wish list is not complete.
