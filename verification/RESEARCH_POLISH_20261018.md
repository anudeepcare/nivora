# Research polish — 18 October 2026

## Changed in source
- Technical indicator tiles: consistent grid, semantic trend colours, neutral volatility, aligned Fibonacci and six study cells. Removed duplicate study rows; one definitions control remains.
- Thesis: separate supporting/risk grids with prominent reported figures, consistent spacing and readable explanatory text.
- Authenticated pages: copyright footer and accessible research disclosure. Footer scrolls inside the content region rather than covering navigation.
- Provider attribution is behind an explicit disclosure within data details, rather than a prominent provider heading. Observation dates remain visible. Chart attribution remains intact.

## Verification
- 156 domain/component/database tests passed; TypeScript and production build passed.
- 61 fixture checks of built API handlers passed. These use mocked data transport, not paid account verification.
- Actual signed-in production Chrome inspection: Salesforce CRM search resolves correctly; Overview, Financials, Value, Technicals and Thesis render; weekly chart range finishes loading.
- CRM overview displayed revenue, operating margin, cash after capex, forward P/E, DCA and three forecast sensitivities. This establishes rendering, not independent verification of every supplied financial observation or investment model.
- Deployed CSS still uses a fixed mobile dock. Latest source uses an in-flow dock. This archive has not been pushed or deployed by this session.

## Unresolved acceptance gates
- No physical installed-iPhone Safari PWA runtime is available here. The reported header/search clipping and safe areas are NOT certified fixed. Desktop Chrome inspection is not device proof.
- No screenshot comparison of the newly polished source against the approved design has been completed.
- Every instrument and provider entitlement has not been independently validated. Missing evidence must remain unavailable rather than be invented.
- Provider-reported ownership transaction categorisation needs further validation before treating every record as a corporate insider trade.
- Production portfolio contained two invalid/unpriced saved identities; no user records were edited.

## OSCR screenshot investigation
The deployed decision guide correctly classified Healthcare Plans as insurance, while the outlook used an independent regex that missed Healthcare Plans. That allowed an unsuitable EPS/multiple scenario to appear alongside Specialist review. The outlook now uses the same modelCoverage classification. A regression reproduced the incorrect admission before the fix and passes after it. The source withholds these unsupported insurance scenarios; it does not replace them with copied competitor targets.

AppLovin comparison is still a methodological gap: the uploaded competitor screen labels a present fair value, whereas AURYN labels an FY2027 earnings/multiple sensitivity. Different price timestamps are also visible. Neither screenshot alone validates either company's intrinsic value. A validated present-value model has not been built by this correction.

## Forecast period clarity
Each available outlook now displays forecast end date and months ahead beside the three cases, in Overview and Value. Explicit fiscal labels more than one year away from the forecast calendar year are rejected (one-year differences can arise from fiscal-year naming conventions). Missing fiscal labels remain Annual forecast rather than inventing a fiscal-year designation. All three cases still share exactly one forecast record/date and horizon. Company forecasts may cover different future years; cross-company fair-value comparability is not established by this change. Two added regressions check contradictory labels and the visible forecast horizon.
