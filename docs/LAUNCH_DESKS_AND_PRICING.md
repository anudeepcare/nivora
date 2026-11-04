# Launch, research desks and extended-hours repair — 23 October 2026

This document supersedes earlier status notes for this source revision. Existing investment research, monthly-v4 accumulation, portfolio accounting and account data are retained. No production deployment, Git push, live database grant or new paid subscription was performed.

## Implemented

- Google and X OAuth buttons on sign-in/registration, SSR code callback, fixed allowlisted destinations, email confirmation, password recovery, shared sign-out and protection against a stale initial session restoring an account after logout. Login and recovery do not show workspace navigation. Signed-in login returns to Home; authenticated deep links remain supported.
- Settings account/security and preference groups, public mobile sign-in ordering and a tighter public landing introduction. Exact domain/provider setup is in `LAUNCH_AUTH_SETUP.md`.
- Value has a new scenario presentation with selectable assumptions, one shared numeric scale including the reference quote, separated analyst opinion and reported pricing multiples. Unsupported scenarios are withheld. The presentation is new; its existing validated scenario calculations remain in use and have not been represented as a new proprietary valuation method.
- Advanced has a new five-part navigation: Risk & conditions, Position design, Expectations, Market context and Historical lens. Workbenches load on selection. Risk uses drawdown and return-distribution visuals plus dated measurements. Position planning does not assume a success probability. Benchmark and industry-candidate requests happen only when requested and use existing bounded cached routes. The historical lens describes next-observed-open outcomes, costs and incomplete samples; it does not establish predictive edge.
- The Expectations workbench uses a newly written operating-company FCFF model (`expectation-engine.ts`), not the old fading per-share cash-flow calculator. Revenue growth, operating margin, cash taxes, return on incremental capital, required return and terminal growth are explicit user assumptions. Growth requires reinvestment; cash deficits trigger a funding-gap refusal. Enterprise value reconciles to equity through net debt once. The reverse calculation solves the operating margin consistent with the reference price only inside supported bounds. Worked arithmetic, monotonicity, inverse recovery and invalid/funding-deficit cases are tested.
- The operating model is deliberately simplified: constant margin and growth during the explicit period, immediate terminal transition, no future financing/dilution, debt amortization or nonoperating assets. It is not validated intrinsic value. Banks, insurers, REITs and crypto are excluded. Users must reconcile currency, current shares and any ADR ratio before calculation. Missing or future inputs are not invented. Method background: https://pages.stern.nyu.edu/~adamodar/New_Home_Page/littlebook/cashflows.htm .
- Stock-context strip adds available completed-period return, traded-value and reported forward-P/E information. Corporate P/E is not applied to crypto.
- Removed duplicate active-tab underline. Mobile Overview metrics now use two columns with legible numbers and static sparklines; Financials describes a profit/loss sign crossing instead of a misleading growth percentage. Analyst target summary uses a compact mobile grid. Value scenarios stack on small screens so long currency amounts do not collide.
- Home updates appear before the compact session summary. Existing PWA root, safe-area and scroll-container geometry is preserved.

## Pricing repair

Both subscriptions remain in use: Twelve Data first for quote/intraday requests; EODHD for financials/daily history and quote fallback; configured EODHD streaming remains separate.

Twelve quote requests now explicitly set `prepost=true` for equities. An explicit pre/post entitlement denial triggers one regular-quote fallback and an in-process one-hour capability cooldown. Timeouts, invalid tickers and rate limits do not trigger duplicate retries or disable the feature for other instruments. Crypto does not receive the equity-only parameter. Completed one-minute fallback requests also request pre/post when entitlement has not been denied. Session labels preserve extended observation time; request time is never used as a trade time.

EODHD delayed fallback and displayed quote-health now tighten age checks during the scheduled 4 AM–8 PM New York extended session. An old regular close cannot become fresh simply because the regular session ended or a different provider returned it. Delayed observations retain their delayed/indicative provenance. Trading calendars/entitlement cannot be inferred from the clock.

Official Twelve documentation states realtime extended data requires an eligible Pro-or-higher plan. The user's Growth subscription is not assumed entitled. No upgrade was purchased. See https://support.twelvedata.com/en/articles/5195429-pre-post-market-data . EODHD HTTP quotes remain delayed/indicative; WebSocket availability depends on entitlement and configured deployment. Neither this source change nor a polling timer guarantees live trades.

## Verification and remaining launch gates

436 automated tests, route type generation, TypeScript and the production build passed, followed by 83 compiled API fixture checks and 12 local production-server HTTP checks. No CSS compilation warnings were emitted. The authoritative command results are in `verification/REPORT.json` and `verification/launch-desks-pricing-verify.log`. API fixture checks simulate identity and transport; they are not live provider entitlement tests. Arithmetic tests are not investment-performance validation.

Google/X still require provider credentials, exact domain redirects and a completed live consent roundtrip. Production email requires configured delivery. The supplied access-hardening SQL was tested locally and was not applied to the live database. Read `LAUNCH_AUTH_SETUP.md` before launch.

Patched-source rendered browser, physical iPhone standalone PWA, live extended-hours data roundtrip and multi-user production-load acceptance remain unverified. The old working PWA geometry was not replaced by a new safe-area hack. This revision does not claim universal DCA parity, accuracy across every ticker, validated returns, complete inherited scope, subscriptions or 2FA.
