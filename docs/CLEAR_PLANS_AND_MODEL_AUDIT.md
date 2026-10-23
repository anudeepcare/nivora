> Superseded billing status: this release now implements Checkout/webhook/portal. Read `STRIPE_SETUP.md`. Historical model audit findings below remain unchanged.

# Plans and model comparison — 23 October 2026

## What changed in this source

- Public navigation has a Pricing link and a public `/pricing` page without a sign-in gate.
- Every signed-in page has a direct Plans link to `/plans`. The Settings sheet starts with Plans & access; it is no longer buried below account security.
- Free and planned $2.99/month Pro are explained together. Current access, allowances, complimentary expiry and owner controls are on the Plans page. Payment buttons remain explicitly disabled until billing is connected.
- Overview now renders the actual shared analyst-target component above the separately labelled AURYN scenarios. Missing target coverage is explained. A missing analyst low/high is never invented from a mean target.
- Analyst low/consensus/high, present-value DCF/EPS models and future-year scenario estimates are identified as different quantities. No production targets were copied from competitor observations.

## Connect payments: your account step

1. Open https://vercel.com/marketplace/stripe while signed into the Vercel account that owns AURYN.
2. Add the integration to the existing AURYN project. Choose **Stripe sandbox** first and complete the account connection. Do not create a second AURYN project or enable live charges.
3. In that sandbox, create **AURYN Pro**, recurring **USD 2.99 per month**. Keep the Price ID; this identifier is safe to share. Keep secret API keys and signing secrets out of chat.
4. Enable Stripe's customer portal with cancellation at the end of the billing period. The intended in-app entry is Plans → Manage subscription, including invoices and payment method changes.
5. Complete the application wiring against the provisioned integration: authenticated Checkout and portal sessions, verified account/customer binding, signed webhooks, idempotent processing and subscription reconciliation. Those endpoints are NOT installed in this ZIP; completing the dashboard steps alone does not activate payments.
6. Run sandbox cases: successful payment; failed payment; payment requiring authentication; duplicate/reordered webhook events; refresh after checkout; cancellation; reactivation; refund policy; grant plus paid subscription; expiry and downgrade. Access must follow verified Stripe state, not a success URL.
7. Only after those checks and external-data licensing acceptance, connect the live Stripe account and live price separately. Preview must continue to use sandbox configuration.

Current evidence: `vercel integration discover` could not authenticate in this runtime. The connected Vercel account-scoped Stripe integration query returned no configurations. No live purchase, permission grant, account modification or secret transfer was made. Billing remains a concrete account connection and implementation dependency, not a working subscription flow.

Official sources:
- https://vercel.com/docs/integrations/ecommerce/stripe
- https://vercel.com/marketplace/stripe
- https://docs.stripe.com/customer-management

## Thirty-company audit

Universe: IREN, NBIS, CRWV, APP, ASTS, CIFR, SOFI, TTD, HIMS, NU, SAP, MSFT, AAPL, NVDA, GOOGL, META, NOW, AMZN, TSLA, PLTR, AMD, PYPL, DIS, JPM, XOM, JNJ, KO, BE, ONDS, NVO.

Numerical facts observed through signed-in browser interfaces are in `verification/competitor-audit-30.json`. These are descriptive observations, not verified ground truth.

| Check | Result |
|---|---|
| DCA Optimizer current monthly signals | 30 tickers observed; 28 confirmed and 30 forming readings agree |
| ValueSnapshot visible valuation tab | 30 tickers observed; some displayed zero/missing/negative model outputs |
| ValueSnapshot Projection Studio | Pro upgrade required; not purchased or bypassed |
| Versys future-year scenarios | 15 usable observations; remaining attempts did not yield verified comparable scenarios |
| Historical executable competitor signals | Not obtained; current snapshots cannot establish a historical competitor backtest |

For example, APP's observed ValueSnapshot valuation tab displayed DCF $612.50 and EPS model $501.39; Versys displayed a 2028 base projection of $581. These are different methods/horizons. DCA Optimizer's analyst-consensus target is a fourth quantity. Making all four equal would erase their meaning.

IREN and CRWV had displayed $0 DCF outputs and unavailable EPS cases on the observed ValueSnapshot valuation screen, while Versys showed 2028 projections. Zero is recorded as displayed, never imported as an AURYN valuation or treated as proof that a company is worth nothing.

On the observed Versys APP page, headline analyst target and coverage target differed ($490 and $445). Other examples also differed. Source coverage and timing need reconciliation before deciding either field is the one correct reference. No claim is made that all numbers on any competitor are accurate.

## Historical AURYN test

`verification/dca-backtest-30.json` and its log contain a frozen-policy simulation at 10 bps per purchase and a 50 bps cost stress. Both accounts receive the same 100 model units monthly. Prior confirmed signals execute at the next observed month opening price; adaptive purchases cannot borrow or spend cash that has not been deposited. Future-bar invariance is asserted.

28 securities had sufficient execution history; NBIS and CRWV did not. At 10 bps:

- Adaptive ending assets exceeded fixed DCA for 3 securities, were lower for 15, and tied for 10.
- Mean ending-asset difference was **-2.3038%** versus fixed DCA.
- Nine had lower measured monthly drawdown.
- The later chronological slice restarted both accounts at zero; mean difference was **-0.3642%**, with two wins. This slice is not an independent validation dataset.

This identifies cash drag as a weakness of timing-based contribution deferral. It does not justify selling the multiplier as a return advantage. No production thresholds were retuned to hide the result. Dividends, taxes, cash interest, intramonth drawdowns, universe survivorship and corporate-action provenance remain limitations. Retrospectively designed rules are not a prospective track record even when execution uses only past bars.

## Algorithm acceptance rules

A candidate must be evaluated against ordinary DCA with equal funding, costs, realistic execution and unchanged test definitions. Use different training and test dates/universes; report drawdown, ending assets, idle cash and turnover, failures included. Tuning 30 labels and retesting those same labels is calibration, not proof.

Valuation must use point-in-time financial inputs, consistent currencies, split/ADR-adjusted shares and a stated horizon. Compare like methods under the same assumptions. Current financial forecasts cannot be inserted into historical valuations. Historical forecast vintages and historical competitor signals are required before claiming a fair historical valuation or competitor-performance test.

The production algorithm was not replaced by an unvalidated candidate. The actionable product improvements in this update are clearer model separation, visible consensus, direct plan access and published evaluation evidence. No outperformance, universal numerical parity or automatic buy/sell accuracy claim is made.

## Verify and deploy

Use `npm ci --include=dev`, `npm run verify`, `npm run test:api`, and the Git/Vercel steps in `DEPLOYMENT.md`. This update adds no database migration; the prior beta controls still require their migration and owner configuration. Do not force-push. Review a Vercel preview and physical iPhone PWA before promoting; viewport/safe-area geometry was not changed by this update.
