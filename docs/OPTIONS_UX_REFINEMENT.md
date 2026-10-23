# Options workspace refinement — October 23, 2026

The preceding screen wasted vertical space with a duplicated expiry picker, unsupported positioning panels and repeated explanatory text. A selected short expiry also made the long-term table appear empty, and strict default filters hid quoted contracts without OI.

## Revised experience

- One listed-expiration selector. Arbitrary calendar dates no longer enter the list.
- Compact, contrasting summary with underlying price, days remaining and the straddle-based range when actual two-sided inputs exist. Otherwise the returned contract count appears, not a fabricated range.
- Market map: call/put concentrations, estimated GEX, conditional charts and styled strike/expiry heatmap. If positioning inputs are absent, one explanation links directly to contract inspection.
- Contracts: calls/puts/all controls, optional liquidity filter, per-share quotes, one-contract ask cost, OI/IV/delta/spread, and a payoff link when strategy checks pass. Additional Greeks and activity remain available under a compact disclosure.
- Long-term selects a returned expiration at least 365 days ahead. If pagination omits such dates, explains that gap instead of pretending a short expiry is LEAPS.
- Strategy cards explain intent before contract selection. Missing OI or failed liquidity checks lead to a clear explanation and contract inspection. Incomplete two-leg spreads no longer fall back to a single-leg payoff.
- Illustrated learning cards with a contract-specific delta example when available. Detailed risk and pricing assumptions remain accessible without dominating the screen.
- Prior contract observations merge by contract identity when selecting expirations; switching symbols clears the old dataset. Narrow-expiry completeness cannot certify a different expiry's gamma profile.

## Data limitations

Alpaca indicative quotes remain modified and trades delayed. This design does not unlock absent Greeks/OI, infer actual dealer holdings or establish commercial display rights. No broker orders are placed. Positive call/negative put gamma is a disclosed modeling convention. Coverage and partial-chain limitations remain visible.

Verification logs accompanying this release distinguish simulated provider/API tests and static Chromium component checks from a real account or physical iPhone test. Live account entitlement is not verified by this workspace.

## Checks run

504 tests and TypeScript passed; final production build passed. Existing built API suite passed with synthetic transports. 36 Chromium component layout checks covered six views at 1440/402/320px in both themes, including missing positioning inputs. Four built-app preview navigation checks passed without horizontal overflow or post-click errors. Existing initial research-preview React 418 warnings remained in two light-mode checks. No physical iPhone or live Alpaca entitlement verification was performed.
