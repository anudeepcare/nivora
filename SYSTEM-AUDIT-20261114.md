# AURYN system audit, November 14, 2026

## Status

This is a source candidate with concrete reproducible corrections, not a claim that the whole product now matches a third-party service or makes proven profitable decisions. It was built from the exact latest delivered private-target-preview ZIP (SHA-256 `062a60fd6da797153223aa517f90ba6ac319001fd6874d3fb89a454d4618fc38`), not from a mix of earlier workspaces.

No deployment, production database change, subscription change, purchase, broker action, new reference-service extraction or live provider request was performed in this audit. The private target-preview adapter retains its existing restrictions.

## Corrected defects

1. **Different dates inside one research snapshot.** Pace and the price reference accepted the settled same-day US close, while several technical filters still discarded that date. RSI, moving averages, EMA/bands, advanced/professional studies and technical-context metrics could therefore lag the headline and feed a different decision input. They now share the validated settlement boundary: US observations after the existing 17:00 New York cutoff, crypto after UTC midnight, and a conservative delay for unknown exchange calendars. Duplicate/conflicting and malformed bars no longer silently enter those studies. The history snapshot's own retrieval clock remains authoritative: a newer quote alone cannot certify an earlier captured forming bar as final.
2. **Invalid share counts could qualify buying.** Zero or negative current diluted shares produced -100% or lower dilution, which passed the funded-growth screen. Missing/invalid current or prior share counts now remain unknown, and impossible dilution is rejected at the independent screen too. Genuine positive share counts representing modest buybacks or dilution retain their previous behavior.
3. **Missing quotes hid business-risk reviews.** The engine correctly assessed a current funding/solvency risk before the entry-price gate, but its generic paused flag caused Portfolio/Watchlist attention to demote Sell/Reduce/Avoid to an unavailable Review behind Hold. Paused status now follows the actual failed prerequisite. Valid financial risk stays visible with its reason and change condition; unusable financial evidence still prevents an unsupported risk verdict.

4. **The business quick read could contradict its own decision.** The displayed CBRS example led with a positive revenue-growth sentence while the decision called for review of funding/operations. For an unqualified business or a financial-risk gate, the Business row now repeats the shared decision's actual prerequisite explanation instead of selecting an isolated positive factor. Qualified-business detail remains available. This changes the explanation, not the investment policy.

These are rule-based research screens, not instructions to trade and not investment-performance validation.

## Evidence and checks

- The original 1,458-test suite passed before this audit. New failing regressions exposed gaps that the prior count did not cover.
- Added 19 regression checks for invalid shares, risk-review continuity, settlement clocks, a quote-only refresh, duplicate/malformed bars and shared technical context. Each production correction was demonstrated failing before the correction and passing afterward; the quote-refresh safeguard was added during independent review before acceptance.
- Final exact-source verification passed: **1,477/1,477 tests**, lint, formatting, typecheck, production build and the full controlled API suite. Both aggregate commands exited 0. The production trace check covered 56 routes.
- Independent targeted review checked the calculation path, memoization and the financial-risk cases. The final machine-readable verification summary records exact completed commands and counts.
- Real archived November 6 histories for IREN, NBIS, HIMS and CIFR reproduced the prior-day technical-reference error and match their actual settled closes after the correction. These are dated historical replays, not current company recommendations. Empty financial evidence correctly remains Review in these tests.
- Captured November 14 SentiSense target/profile responses for IREN, NBIS and APP retain their exact low/consensus/high values through normalization and consumption. Stale targets are withheld. Their wrapper contains no full company financial dataset, so this is not full live end-to-end validation. Target bands do not establish business qualification.
- An independent live preprod screen inspection reproduced the same-date problem before deployment: MSFT Overview/Pace displayed $523.88 for November 13 while Technicals displayed $521.67 even though it described evidence through November 13. This is before-change evidence only.
- All active Pace classifier/model/runtime source and the generated policy fingerprint remain byte-identical to the input ZIP. No training, per-ticker override or target fabrication was introduced. Archived comparison results remain historical and do not establish current or exact third-party parity.

## Open acceptance gates

1. **After-change visual and interaction QA is blocked in this environment.** Local Chromium aborts with socket EPERM, and the cloud browser cannot reach this local preview. Existing preprod screenshots do not validate the modified local source. Do not mark desktop/mobile acceptance complete or deploy merely to bypass this limit.
2. **No complete current Research capture exists here for the requested representative companies.** Full current IREN/NBIS/HIMS/CIFR provider-to-API-to-screen checks, including both entry and holding decisions, still need an authorized accessible preview and actual financial/estimate/history payloads. The saved November 6 histories and November 14 target-only captures are deliberately labeled separately.
3. **Reference parity is not established.** The existing model is an approximation. Comparing old explored snapshots, matching analyst values on different dates or adding unit tests does not prove exact DCA behavior. No new bulk extraction was attempted. A permitted dated reference sample or licensed/disclosed signal specification is required before stronger claims.
4. **Forecast usefulness is not validated.** Analyst targets, explicit valuation assumptions, historical risk ranges and quote-anchored sensitivities are different concepts. None is evidence of future returns by itself. This audit does not fill missing financial inputs or relabel sensitivity bands as predictions.

## Reproduce

Use Node 24 and the lockfile, then run `npm ci` and `NEXT_TELEMETRY_DISABLED=1 npm run verify`, followed by `npm run test:api`. The telemetry setting avoids this environment's read-only home configuration and does not change application behavior. The API suite uses controlled fixture transports, not real payments/accounts or provider purchases.

New regression files: `tests/settled-technical-consistency.test.mjs`, `tests/invalid-dilution-decision.test.mjs`, and `tests/risk-attention-continuity.test.mjs`. Dated replay results and exact verification status are in `verification/system-audit-20261114/`.
