# Approved experience — full-source preprod handoff

## What changed
This is a whole-app presentation rebuild around the approved colorful graphical Overview, with the approved page-family boards guiding Portfolio, Watchlist, Settings and public/account pages. Data, authentication, access, payment and portfolio accounting contracts are preserved. This is not a new validated stock-prediction engine, and no competitor numerical parity is claimed.

| Screen family | Presentation changes | Existing function preserved |
|---|---|---|
| Public home/sample | Product canvas beside the value proposition; compact benefits and calls to action | Public sample, account/pricing routes |
| Login/signup/recovery | Focused form with graphical explanation, consistent controls and states | Email/password, Google/X, recovery and confirmation |
| Home | Greeting, priced-investment/session context, company focus, contributor bars, exposure, dates, news and company list | First-use/watchlist/holding paths; real account feed and quote cache |
| Overview | Compact assessment; green business history, blue shared price scale, purple RSI/MA evidence; risk strip, Pace, holder context, explainer and checkpoints | Conditional scenario limitations, chart, analyst context and detail |
| Business | Two-sided case, compact company description and business driver evidence | Source record, thesis tools and detailed lenses |
| Financials | Reconciled OCF/capex/FCF waterfall, chart explorer, compact statements and interpretations | Annual/TTM/quarterly periods, full detail and funding context |
| Value | Colored scenarios with a shared reference scale, optional personal assumptions and reported multiples | All model fits, scenarios, assumptions and source context |
| Technicals | Chart and risk context above four colored study groups | Every existing study, formula, custom anchors and monthly policy history |
| Analysts/news | Recommendation distribution; editorial/filing/event sections and disclosures | Unknown versus zero counts; on-demand disclosures, source links |
| Advanced/options | Compact graphical risk workbench and five options views; education usable without a chain | Position design, expectations, market context, historical lens, chain/LEAPS/gamma/strategies |
| Watchlist | Responsive company/price/change/observation table | Add/remove/filter/refresh/navigation |
| Portfolio | Compact equity breakdown, Holdings/Allocation/Risk views, ticker-weight bars | Cash, margin, managed balances, edit/add/remove, charts, sector and stress tools |
| Settings/Plans/owner | Clear categories, consistent appearance controls, current membership first, support filtering | Security, preferences, billing, owner grants, support and notifications |
| Help/contact/legal | Reading layout, quiet support form and truthful saved/delivery status | Existing policies, contact storage and optional email delivery |

## Correctness changes discovered in review
- Historical price-risk cases retain their own listing currency when an unused revenue model uses a different reporting currency.
- A negative FCF waterfall uses risk color, not green. FCF history is calculated from free cash flow/revenue, not operating margin.
- Missing quote changes stay neutral, never green zero returns.
- SVG titles render as one text node, fixing a hydration mismatch that otherwise rebuilt the research tree in the browser.
- An unusually optimistic sensitivity is not promoted into a confident headline upside. Model values remain labelled conditional sensitivities.

## Deployment
Use your existing preprod branch before copying the AURYN folder contents. Keep .git and environment files. Run npm ci --include=dev, npm run verify and npm run test:api. Review the diff, commit and push preprod. Do not force-push or reset main.

No new database migration or environment variable is introduced by this visual rebuild. Support email still needs the prior additive support migration, verified sending domain and server email settings in docs/SUPPORT_SETUP.md. Preview suppresses email sends and should keep live billing/paper execution disabled.

## Honest acceptance boundaries
Browser tests run isolated labelled fixtures at desktop/mobile sizes in light/dark. They do not establish physical iPhone Add to Home Screen behavior, live quote entitlement, real Stripe/OAuth/email delivery, or every possible instrument/account. Those require acceptance on your own preprod URL. No push, deployment, payment, broker order, real email or live database write was performed here. The source has been visually reviewed against references; pixel-perfect equivalence is not certified.
