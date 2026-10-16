# Route and action matrix

Recorded: 2026-10-16T15:52:18.786155+00:00. Inventory status: source-read; all actual-release browser/action states initially pending. Redirect destinations do not count as extra page designs.

## Route coverage

| Route | Source | Source guard | Actions and important states | Current browser result |
|---|---|---|---|---|
| `/about` | `app/about/page.tsx` | public/client/session flow | Public navigation and product explanation. | pending |
| `/alerts` | `app/alerts/page.tsx` | AuthGuard | Create/remove/pause/resume/filter price target, source disclosure, event-alert extensions and supported notification boundary. | pending |
| `/analyze` | `app/analyze/page.tsx` | AuthGuard | Company/ticker/crypto search with keyboard and fallback, recent/saved research, clear recent, Today/workspace feature extensions. | pending |
| `/auth/callback` | `app/auth/callback/page.tsx` | public/client/session flow | Code exchange, expired/provider-error state, safe destination redirect. | pending |
| `/calibration` | `app/calibration/page.tsx` | AuthGuard | Outcome/model evidence and missing-history states; proof limitations. | pending |
| `/dashboard` | `app/dashboard/page.tsx` | AuthGuard | Auth/onboarding and primary-view redirect. | pending |
| `/disclaimer` | `app/disclaimer/page.tsx` | public/client/session flow | Research-risk/legal navigation. | pending |
| `/discover` | `app/discover/page.tsx` | server redirect | Server redirect to /analyze. | pending |
| `/faq` | `app/faq/page.tsx` | public/client/session flow | Search/category and disclosure/navigation controls from current source. | pending |
| `/forgot-password` | `app/forgot-password/page.tsx` | public/client/session flow | Required email, reset request, non-enumerating acknowledgment/error, login link. | pending |
| `/login` | `app/login/page.tsx` | public/client/session flow | Required email/password, password visibility, sign-in success/error, reset/register navigation, configured social provider buttons. | pending |
| `/methodology` | `app/methodology/page.tsx` | public/client/session flow | Evidence and methodology disclosures/navigation. | pending |
| `/onboarding` | `app/onboarding/page.tsx` | AuthGuard | Investment interest, experience level, save/continue and failure state. | pending |
| `/` | `app/page.tsx` | public/client/session flow | Primary research/sign-up/sign-in CTAs, public navigation; no sign-up request is sent in public mode. | pending |
| `/personalization` | `app/personalization/page.tsx` | AuthGuard | Theme/accent/density/chart style/primary view, device-local save, welcome continuation. | pending |
| `/portfolio` | `app/portfolio/page.tsx` | AuthGuard | Add/edit/delete stock/crypto/USD cash, duplicate-lot merge, table search/sort, tabs, ranges, record balance, links, refresh and failure states. | pending |
| `/privacy` | `app/privacy/page.tsx` | public/client/session flow | Policy/legal navigation. | pending |
| `/profile` | `app/profile/page.tsx` | AuthGuard | Name save, disabled email display, appearance save, password/onboarding navigation. | pending |
| `/register` | `app/register/page.tsx` | public/client/session flow | Required name/email/password/terms, sign-up, confirmation state, login/legal links. | pending |
| `/research-lab` | `app/research-lab/page.tsx` | AuthGuard | Research candidates/model comparison and unproven/empty states. | pending |
| `/reset-password` | `app/reset-password/page.tsx` | AuthGuard | Authenticated recovery session, password validation/update/error, dashboard redirect. | pending |
| `/stock/[symbol]` | `app/stock/[symbol]/page.tsx` | AuthGuard | Eleven evidence tabs; search; watchlist/save links; chart ranges, zoom, weekly settings/manual anchors, dialogs, scenario controls, Quick/Research/Advanced and approved feature extensions. | pending |
| `/terms` | `app/terms/page.tsx` | public/client/session flow | Policy/legal navigation. | pending |
| `/trading-lab` | `app/trading-lab/page.tsx` | AuthGuard | Order/Paper check/Trade history/Strategies tabs; manual paper preview/confirm, source/runtime diagnostics, refresh/check, error/blocked states; all writes intercepted in fixture mode. | pending |
| `/watchlist` | `app/watchlist/page.tsx` | AuthGuard | Add/remove/filter/refresh, confirm removal, source disclosures, symbol research links, awaited-condition extensions. | pending |

## Shared controls and workflow checks

| Surface | Actions | Verification boundary |
|---|---|---|
| App shell | Desktop/mobile navigation, account open/Escape/outside click, watchlist shortcut, sign out | Fixture click/route behavior; real auth revocation unverified |
| Search | Input, async results, ArrowUp/Down, Enter, Escape, fallback exact ticker | Fixture search uses explicitly labeled synthetic data; no provider success claim |
| Research | Overview, Business, Earnings, Financials, Valuation, Ownership, Catalysts, Options, News, Technicals, Risk | Every tab rendered at each required width/theme; supported/unsupported valuation separately |
| Weekly chart | SMA/EMA/WMA, linear/log, averages/Fibonacci/extensions/custom level, auto/manual anchors, invalid anchors, expand/Escape, reset/zoom, scroll | Synthetic historical bars only; no historical return validation |
| Persistence | Holdings/watchlist/alerts/profile/onboarding/preferences | In-memory fixture CRUD verifies UI request shape and state transition; no live RLS claim |
| Paper plan | Enter ticket, review, explicit confirm, accepted/rejected status | Mocked server responses only; no actual paper or real-money order |
| Accessibility | Labels, keyboard focus, reduced motion, input readability, document overflow, small controls | Automated findings; not full WCAG or physical-device certification |

## API contracts

Methods and guard calls are lexical source observations. A guard in an imported helper may enforce additional policy; missing text in a route is not proof of no authorization. Authentication/RLS and actual request/response behavior need runtime tests.

| Route | Methods | Source guard/policy identifiers | Response-related status literals |
|---|---|---|---|
| `/api/analyze/[symbol]` | GET | no named guard matched; inspect handler/helpers | 422, 429, 500, 503 |
| `/api/arena` | GET | no named guard matched; inspect handler/helpers |  |
| `/api/astra/[symbol]` | POST | no named guard matched; inspect handler/helpers | 400, 422, 429, 502, 503 |
| `/api/audit/universe` | GET | no named guard matched; inspect handler/helpers | 429, 500, 503 |
| `/api/calibration/mature` | GET | no named guard matched; inspect handler/helpers | 401, 500, 503 |
| `/api/calibration` | GET | no named guard matched; inspect handler/helpers |  |
| `/api/canonical/[symbol]` | GET | no named guard matched; inspect handler/helpers | 400, 429 |
| `/api/canonical` | GET | no named guard matched; inspect handler/helpers | 429 |
| `/api/chart/[symbol]` | GET | no named guard matched; inspect handler/helpers | 400, 503 |
| `/api/company/[symbol]` | GET | no named guard matched; inspect handler/helpers |  |
| `/api/context/[symbol]` | GET | no named guard matched; inspect handler/helpers |  |
| `/api/decision-audit` | GET | no named guard matched; inspect handler/helpers | 401, 500, 503 |
| `/api/decision/summaries` | GET | no named guard matched; inspect handler/helpers | 429 |
| `/api/discover` | GET | no named guard matched; inspect handler/helpers |  |
| `/api/factor-integrity` | GET | no named guard matched; inspect handler/helpers | 503 |
| `/api/health` | GET | no named guard matched; inspect handler/helpers |  |
| `/api/institutional/[symbol]` | GET | no named guard matched; inspect handler/helpers |  |
| `/api/investment` | GET | no named guard matched; inspect handler/helpers |  |
| `/api/market-intelligence/live/[symbol]` | GET | no named guard matched; inspect handler/helpers | 200, 429, 503 |
| `/api/market` | GET | no named guard matched; inspect handler/helpers | 503 |
| `/api/model-health/mature` | GET | no named guard matched; inspect handler/helpers | 401, 500, 503 |
| `/api/model-health` | GET | no named guard matched; inspect handler/helpers | 500, 503 |
| `/api/news/[symbol]` | GET | no named guard matched; inspect handler/helpers |  |
| `/api/options/[symbol]` | GET | no named guard matched; inspect handler/helpers | 200 |
| `/api/portfolio/learn` | GET | no named guard matched; inspect handler/helpers | 401, 500, 503 |
| `/api/portfolio/pulse` | GET, POST | authorizeRequest | 400, 500, 503 |
| `/api/portfolio/risk` | POST | authorizeRequest | 400, 500, 503 |
| `/api/quote/[symbol]` | GET | no named guard matched; inspect handler/helpers | 429, 503 |
| `/api/relative-rank` | GET | no named guard matched; inspect handler/helpers | 400 |
| `/api/research-lab` | GET | no named guard matched; inspect handler/helpers |  |
| `/api/research-workspace` | GET, POST | authorizeRequest |  |
| `/api/scan` | GET | no named guard matched; inspect handler/helpers |  |
| `/api/search` | GET | no named guard matched; inspect handler/helpers |  |
| `/api/system/health` | GET | no named guard matched; inspect handler/helpers |  |
| `/api/trading-lab/control` | POST | authorizeRequest | 400, 503 |
| `/api/trading-lab/diagnostics` | GET, POST | authorizePaperCron | 401, 409, 500 |
| `/api/trading-lab/evaluate` | POST | no named guard matched; inspect handler/helpers | 400, 409 |
| `/api/trading-lab/manual` | DELETE, GET, POST | assertPaperLease, authorizeRequest |  |
| `/api/trading-lab/run-now` | POST | authorizeRequest | 500, 503 |
| `/api/trading-lab/run-paper` | GET, POST | assertLease, assertPaperLease, authorizePaperCron | 401, 500, 503 |
| `/api/trading-lab/status` | GET | authorizeRequest |  |
| `/api/validation/finalize` | GET | no named guard matched; inspect handler/helpers | 401, 500, 503 |
| `/api/validation/model-health` | GET | no named guard matched; inspect handler/helpers | 401, 503 |
| `/api/validation/orchestrate` | GET | no named guard matched; inspect handler/helpers | 400, 401, 500, 503 |
| `/api/validation/outcomes` | GET | no named guard matched; inspect handler/helpers | 401, 500, 503 |
| `/api/validation/snapshot` | POST | authorizeRequest | 400, 429, 503 |
| `/api/validation/watchdog` | GET | no named guard matched; inspect handler/helpers | 401, 503 |
| `/api/validation/worker` | GET | assertShadowDecisionReady | 401, 500, 503 |

## Lexical interactive-control inventory

This is exhaustive across TSX files inspected in `app/` and `components/`, including legacy components that may no longer mount. Counts are JSX elements, not distinct rendered instances. Dynamic arrays, menu contents and disabled states are verified in the browser separately. Every listed source file remains a review item until its mounted route/actions are accounted for.

| Source | Buttons | Inputs | Selects | Textareas | Forms | Details/summary | Dialogs | Links |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `app/about/page.tsx` | 0 | 0 | 0 | 0 | 0 | 0/0 | 0 | 4 |
| `app/auth/callback/page.tsx` | 0 | 0 | 0 | 0 | 0 | 0/0 | 0 | 1 |
| `app/calibration/page.tsx` | 2 | 0 | 0 | 0 | 0 | 0/0 | 0 | 1 |
| `app/disclaimer/page.tsx` | 0 | 0 | 0 | 0 | 0 | 0/0 | 0 | 2 |
| `app/error.tsx` | 1 | 0 | 0 | 0 | 0 | 0/0 | 0 | 1 |
| `app/faq/page.tsx` | 0 | 0 | 0 | 0 | 0 | 0/0 | 0 | 3 |
| `app/forgot-password/page.tsx` | 1 | 1 | 0 | 0 | 1 | 0/0 | 0 | 1 |
| `app/login/page.tsx` | 1 | 1 | 0 | 0 | 1 | 0/0 | 0 | 2 |
| `app/methodology/page.tsx` | 0 | 0 | 0 | 0 | 0 | 11/11 | 0 | 1 |
| `app/not-found.tsx` | 0 | 0 | 0 | 0 | 0 | 0/0 | 0 | 1 |
| `app/onboarding/page.tsx` | 3 | 0 | 0 | 0 | 0 | 0/0 | 0 | 0 |
| `app/page.tsx` | 0 | 0 | 0 | 0 | 0 | 0/0 | 0 | 8 |
| `app/portfolio/page.tsx` | 8 | 3 | 2 | 0 | 1 | 2/2 | 0 | 1 |
| `app/privacy/page.tsx` | 0 | 0 | 0 | 0 | 0 | 0/0 | 0 | 2 |
| `app/profile/page.tsx` | 1 | 2 | 0 | 0 | 1 | 0/0 | 0 | 2 |
| `app/register/page.tsx` | 1 | 3 | 0 | 0 | 1 | 0/0 | 0 | 4 |
| `app/research-lab/page.tsx` | 0 | 0 | 0 | 0 | 0 | 0/0 | 0 | 1 |
| `app/reset-password/page.tsx` | 1 | 0 | 0 | 0 | 1 | 0/0 | 0 | 0 |
| `app/secondary-frame.tsx` | 0 | 0 | 0 | 0 | 0 | 0/0 | 0 | 8 |
| `app/terms/page.tsx` | 0 | 0 | 0 | 0 | 0 | 0/0 | 0 | 2 |
| `app/trading-lab/page.tsx` | 4 | 0 | 0 | 0 | 0 | 6/6 | 0 | 5 |
| `components/AppShell.tsx` | 2 | 0 | 0 | 0 | 0 | 0/0 | 0 | 14 |
| `components/AppearanceSettings.tsx` | 5 | 0 | 1 | 0 | 0 | 0/0 | 0 | 0 |
| `components/AurynLogo.tsx` | 0 | 0 | 0 | 0 | 0 | 0/0 | 0 | 1 |
| `components/AuthGuard.tsx` | 1 | 0 | 0 | 0 | 0 | 0/0 | 0 | 1 |
| `components/HelpQuestions.tsx` | 0 | 1 | 0 | 0 | 0 | 1/1 | 0 | 1 |
| `components/InvestorDecisionHero.tsx` | 1 | 0 | 0 | 0 | 0 | 1/1 | 0 | 6 |
| `components/LegalNav.tsx` | 1 | 0 | 0 | 0 | 0 | 0/0 | 0 | 0 |
| `components/ManualPaperTicket.tsx` | 8 | 3 | 1 | 0 | 1 | 1/1 | 0 | 0 |
| `components/MetricHelp.tsx` | 3 | 0 | 0 | 0 | 0 | 0/0 | 1 | 0 |
| `components/PriceChart.tsx` | 3 | 0 | 0 | 0 | 0 | 0/0 | 0 | 0 |
| `components/ProductFooter.tsx` | 0 | 0 | 0 | 0 | 0 | 0/0 | 0 | 6 |
| `components/ResearchHome.tsx` | 1 | 0 | 0 | 0 | 0 | 0/0 | 0 | 3 |
| `components/SearchBox.tsx` | 1 | 1 | 0 | 0 | 1 | 0/0 | 0 | 1 |
| `components/StockClient.tsx` | 13 | 0 | 0 | 0 | 0 | 20/20 | 0 | 6 |
| `components/auth/AuthShell.tsx` | 0 | 0 | 0 | 0 | 0 | 0/0 | 0 | 2 |
| `components/auth/PasswordField.tsx` | 1 | 1 | 0 | 0 | 0 | 0/0 | 0 | 0 |
| `components/auth/SocialAuth.tsx` | 1 | 0 | 0 | 0 | 0 | 0/0 | 0 | 0 |
| `components/market/MarketTimeframeTape.tsx` | 0 | 0 | 0 | 0 | 0 | 1/1 | 0 | 0 |
| `components/portfolio/HoldingsIntelligence.tsx` | 10 | 2 | 0 | 0 | 0 | 1/1 | 0 | 0 |
| `components/portfolio/HoldingsTable.tsx` | 4 | 1 | 2 | 0 | 0 | 0/0 | 0 | 2 |
| `components/portfolio/PortfolioCompositionGraph.tsx` | 5 | 0 | 0 | 0 | 0 | 0/0 | 0 | 1 |
| `components/portfolio/PortfolioPerformanceChart.tsx` | 1 | 0 | 0 | 0 | 0 | 0/0 | 0 | 0 |
| `components/portfolio/PortfolioPulse.tsx` | 1 | 0 | 0 | 0 | 0 | 0/0 | 0 | 0 |
| `components/portfolio/PortfolioVisualAnalytics.tsx` | 1 | 0 | 0 | 0 | 0 | 0/0 | 0 | 0 |
| `components/portfolio/PortfolioXRay.tsx` | 1 | 0 | 0 | 0 | 0 | 0/0 | 0 | 0 |
| `components/portfolio/TrackedList.tsx` | 5 | 3 | 0 | 0 | 1 | 1/1 | 0 | 3 |
| `components/premium/AurynResearchOverviewV2.tsx` | 13 | 0 | 1 | 0 | 1 | 5/5 | 1 | 1 |
| `components/research/BusinessEvidence.tsx` | 3 | 0 | 0 | 0 | 0 | 6/6 | 0 | 4 |
| `components/research/ValuationWorkbench.tsx` | 5 | 3 | 0 | 0 | 1 | 3/3 | 0 | 4 |
| `components/research/WeeklyStructure.tsx` | 2 | 1 | 6 | 0 | 0 | 4/4 | 1 | 0 |
| `components/stock/StockEvidenceNav.tsx` | 1 | 0 | 0 | 0 | 0 | 0/0 | 0 | 0 |
| `components/stock/StockSecurityHeader.tsx` | 2 | 0 | 0 | 0 | 0 | 0/0 | 0 | 0 |
| `components/v65/MetricInfo.tsx` | 2 | 0 | 0 | 0 | 0 | 0/0 | 0 | 0 |

## Baseline gaps requiring current-release evidence

- Existing browser harnesses intercept auth/APIs and were authored for earlier releases; their passing reports cannot verify this release or live integrations.
- All 104 requirements remain tracked independently; rendering a route does not prove every new feature or data-dependent capability exists.
- The source has no `/verify-email`, `/settings`, `/help` or `/logout` page. Verification is a registration state plus `/auth/callback`; account/preferences are `/profile` and `/personalization`; help is `/faq`; sign out is an AppShell action. These mappings must be checked, not treated as missing routes automatically.
- Event alerts, Today briefing, saved comparison/research views and accumulation/portfolio preview controls are new approved additions whose final browser selectors require the current integration.
