# AURYN Intelligence OS — rebuilt source

Start with **PROJECT_STRUCTURE.md**, **DEPLOYMENT.md** and **verification/VERIFICATION_REPORT.md**.

This package contains the complete application source, redesigned routes, preserved research/investment engines, Supabase SQL, paper-trading integrations, approved reference material, executable tests and verification evidence. It is not a claim of fully verified production operation: some live service connections and read isolation are now verified; end-to-end authentication, broker execution and deployment of this rebuilt source still require acceptance. Historical source-contract suites remain separately reported. The precise status is recorded in the verification report.

## October 16 weekly research and product UX update

Weekly Fibonacci research is now available in Technicals and the expandable Overview study: inspect swing anchors, select simple/weighted 50/200-week averages, choose linear/logarithmic geometry, and read support/reclaim/hold explanations. The shared product finish improves typography, contrast, touch targets, form readability, navigation and card spacing across the existing routes in both themes. See **FIBONACCI_RESEARCH.md** for exact rules and **verification/WEEKLY_UX_REPORT.md** for fresh evidence and limits. No additional paid dependency or provider is required.

## October 15 product research update

This update corrects SEC reporting currency and annual/quarter selection, distinguishes continuing operations and comparable history, adds source-backed business evidence, explains the three action horizons, makes missing valuation implementation explicit, and reduces duplicate research/chart requests. Mobile research puts decision context before the chart. No additional subscription was purchased.

Read **PRODUCT_DIRECTION.md** for the affordable product sequence, including validated valuation, proposed DCA/signal rules and the path from paper testing to a later customer product. These proposed features are not advertised as implemented. Read **verification/PRODUCT_REVIEW_REPORT.md** for current results and limitations.

## Local application

Use Node 22 LTS and npm. Copy `.env.example` to `.env.local`, supply your own environment values, then run:

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Authentication is required for private workspace routes. Missing configuration produces a clear unavailable state; no fake account or live prices are injected by the application.

## What changed

- Unified blue/white and navy design system; rebuilt landing, authentication, onboarding, preferences, app shell and secondary pages.
- Rebuilt research overview with thesis, chart, key data, three clocks, scenarios and evidence. Eleven working evidence tabs, selectable chart ranges, chart appearance, moving averages and expanded chart.
- Portfolio position create/edit/delete, known-versus-unpriced value, balance history, allocation and owner context; watchlist and price-target monitoring.
- Administrator-only shared Alpaca Paper workspace, automatic checks, execution evidence, manual paper limit-order review, verified order/fill history and explicit cancellation review. No real-money endpoint is used. Manual orders require a separate audit migration and broker-enforced cash-only/long-only settings.
- Fail-closed authentication, authenticated portfolio APIs, guarded shared paper APIs, correct watchlist ownership, reliable logout, truthful save/error states, abort-safe research requests and empty-chart resets.
- Original investment engine preserved, with a regression-tested correction preventing undated regular closes from becoming verified prices during an open session.

## Tests and evidence

```sh
npm run build
npm test
npm run test:historical
```

`npm test` / `test:release` runs current acceptance, including the additional runtime suites audited for this package. `test:engine` / `test:historical` retains the original historical aggregate unchanged. See `verification/RELEASE_TEST_POLICY.md` for the mapping and CI policy; a passing acceptance gate does not make the old source-contract failures disappear. Existing version scripts and tests are retained.

Open `verification/VISUAL_REVIEW.html` for reference and screenshot review. Browser runs use synthetic fixtures and do not prove live vendor, database or broker behavior. The original mockup is a collage, so no pixel-perfect claim is made.

Historical release notes in the source describe earlier versions. This README, DEPLOYMENT.md and the current verification report take precedence for this package.
