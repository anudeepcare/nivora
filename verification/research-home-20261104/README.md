# Home and interface refinement — November 4, 2026

## Changed
- Home now opens with company search and an interactive Growth / Expectations / Resilience research lens. Removed the portfolio summary and holdings-history hero. Portfolio remains the destination for balances and allocation.
- No-followed-company accounts get the research starting point without empty personal news/calendar panels. Watchlist-only accounts retain company news and events without a zero-value portfolio.
- Public hero now demonstrates Business / Value / Pace in an interactive product guide, with citron/orchid/jade accents and the approved diamond identity. No fabricated prices or company scores.
- Settings switch track/knob geometry is owned by the component. Removed the inherited border above the preferences column. Sign out sits with account details.
- Search focus uses one restrained ring; native duplicate clear affordance suppressed.
- Congressional disclosures load on mount and symbol change; stale responses cannot overwrite the selected symbol. Component-owned transaction card styles replace obsolete wrapper-dependent styles. Trade and disclosure dates and reported amount ranges remain separate. Preview does not fetch or invent transactions.

## Verification
- Browser: Home lens responds to Expectations; public Value tab displays the correct panel with transparent background on charcoal; settings switch responds and measures 46×28 with centered 20×20 thumb at top 4px; settings group top border is 0px.
- Regression suite: 887 pass, 0 fail, including new-account Home and watchlist-only Home.
- Production build result saved alongside this report.

## Scope and limitations
No production deployment. No changes to valuation formulas, forecast assumptions or market data. Congressional live data was not requested through the illustrative preview. Physical iPhone/PWA testing remains necessary; prior mobile fixes are included. The screenshot is the actual local rendered public page, not a generated mockup.
