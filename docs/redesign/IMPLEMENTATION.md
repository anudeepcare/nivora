# AURYN approved UX implementation

Reference: docs/redesign/approved-reference.png. Source: V9.9.9.42.
Scope: public pages, authentication, onboarding, appearance, Research and evidence tabs, Portfolio, Watchlist, Monitor, paper Trading Lab, account, responsive and error states.

1. Preserve canonical market/research engines and paper-only broker protections.
2. Replace visual chrome with blue/white light and navy dark themes, shared spacing, typography and accessible controls.
3. Complete signup confirmation, OAuth callback, password recovery, onboarding and persistent preferences.
4. Match the three-column research overview and expose Financials, Valuation and News; retain existing detailed evidence.
5. Improve portfolio/monitor/watchlist/error behavior without fabricating market or account data.
6. Run production build, existing regression suites and browser desktop/mobile checks. Record external integration limits explicitly.
7. Deliver one source ZIP with reference, exact scope, test results and deployment commands.

Authorization: user explicitly requested implementation of the approved UX and final ZIP without repeated confirmation.
Ruling: preserve engines while replacing presentation; no live deployment or database mutation is needed to deliver source.
