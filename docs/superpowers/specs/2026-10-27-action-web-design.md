# AURYN action, mobile and website readiness — approved design

User approved the conversational design and requested implementation across the app on 27 October 2026. Baseline 8066ab2. Continue this isolated feature checkout; no push/deployment. Preserve approved visual identity and all useful financial detail.

## Intent and approach
Pace helps users buy and accumulate; it must be integrated with the decision, not compete with it. Keep P0–P4 branding, a single action, and ownership-specific guidance. Rejected alternatives: automatically turn every P4 into Buy (ignores business risk); leave large raw P badges beside unrelated instructions (confusing). User chose shared action/Pace behavior across new purchases and holdings, all surfaces, mobile first.

## Financial behavior
- New purchases use Buy/Wait/Avoid; existing holdings use Add/Hold/Reduce/Sell, with Wait reserved for an assessment that cannot be established.
- Raw current and completed readings retain dates. Confirmed Pace drives the contribution instruction; forming readings remain explicitly developing. Confirmed P0 pauses additions even when the business case is attractive. Missing Pace alone does not invalidate independent usable business/valuation evidence.
- One calculation returns both entry and holding actions; watchlists do not establish ownership. The default view is explicitly For new purchases, not a claim that the user owns nothing.
- Add a transparent funded-growth path for ordinary operating companies: comparable annual/TTM growth >=20%, operating-margin improvement >=5 percentage points, positive cash and nonpositive net debt, known diluted-share growth <=10%, operating cash nonnegative or operating runway >=24 months, and free cash nonnegative or investment runway >=18 months. All required inputs must be finite and financial conflicts/freshness gates still apply. These are disclosed screening heuristics, not calibrated investment probabilities. Attractive dated valuation remains required. Specialized sectors retain their own restrictions. Builder-selected conservative thresholds are to be documented and regression-tested; no promise of outperformance.
- Show specific blocked conditions, scenario assumptions, modelled annual returns, and point-in-time balance dates. Forward multiples expose real update dates or explicitly undated status. Never invent a missing forecast period.

## Interface
Shared PaceGuidance on Research, Watchlist, Compare and Discover; Home/Portfolio use its same action label. Inactive raw readings live in compact details. No duplicate Pending tiles: short/invalid history gets a single neutral state. Existing chart/Pace drawers retain full evidence. Relevant metrics, semantic colours, readable company names, safe mobile grids, touch controls, dark/light parity; no full redesign.

## Website
support@auryninvest.com is the default public/support reply address. Preserve opt-in email delivery and do not claim delivery without configuration. Canonical domain https://www.auryninvest.com. Public route metadata, sitemap, robots, social image, Organization/WebSite structured data, About/Pace educational pages and public navigation. Private/account/preview routes noindex; no account data in public metadata.
GA4 is optional, enabled only with a valid configured ID and explicit analytics consent. No script or event before consent; revoke stops collection. Events are allowlisted, routes coarse-grained and stripped of tickers/query/hash; no email, holdings, balance, user ID or support text. Track page views once, core actions, aggregate search success/failure/duration and web performance. No external analytics property/DNS changes or invented IDs. Provide concrete activation instructions for required account-side steps.

## Verification and delivery
Behavioral regressions, actual mobile/desktop browser checks, 769-test baseline plus new tests, typecheck, production build, compiled API scripts and fresh branch review. Deliver one complete replacement ZIP with checklist and logs. Distinguish tested code from live account/provider/analytics delivery checks that require credentials.
