# AURYN commercial launch plan

## Positioning and initial offer
Self-directed retail investors first. Proposed founding price: USD4.99/month, recurring monthly, cancel through a visible Billing action, access retained through the paid period. This is a proposed offer, not an active checkout. Avoid unlimited paid AI or unlimited uncached API use at this price.

Stripe Checkout + Billing + Customer Portal is the recommended subscription stack. Keep existing Supabase Auth; payment processing does not replace identity. Stripe-hosted checkout avoids handling card details in AURYN. Customer Portal supports payment methods, invoices and cancellation. Provision a real Stripe account and test-mode price before writing or exposing billing UI; do not advertise a functioning paywall until webhook tests pass.

At listed standard US domestic-card fees of 2.9% + $0.30 and Billing 0.7%, a $4.99 payment leaves about $4.51 before tax, refunds, disputes, infrastructure, data licensing and AI. 100 subscribers produce $499 gross, about $451 after those fees alone. Rates vary by account/payment method. Commercial licensing may dominate this budget.

## Necessary user setup
1. Obtain written commercial display/redistribution terms for EODHD and Twelve Data, including derived scores, chart history, logos, caching, public samples and required attribution. Personal API access is not a commercial distribution license. Do not remove attribution required by a contract.
2. Create/activate Stripe with the actual business/operator and payout bank details. Do not send account passwords or secret keys in chat. Use test mode first.
3. Configure real support email, operator name, refund policy and billing terms. Get appropriate financial-product and consumer-law review; a 'not advice' disclaimer alone does not determine regulatory status.

## Subscription implementation acceptance
- Server creates Checkout for authenticated Supabase user and a fixed allowlisted price; never accept arbitrary client price or owner identity.
- Store unique Stripe customer↔Supabase user mapping. Subscription entitlements are server-managed, never editable user_metadata or client flags.
- Verify webhook signatures using raw request body; deduplicate event IDs, handle out-of-order events and reconcile authoritative subscription state.
- Paid access requires server-side entitlement checks on every paid API, not hidden buttons. Active/trial policy, past-due grace, incomplete payments, cancellation and refunds must be explicit.
- Customer Portal sessions use the authenticated user's mapped customer only. Cancel at period end, no new renewal; keep entitled access until paid expiry. Account deletion and subscription cancellation are separate flows and must explain consequences.
- RLS: users read only their subscription row; no client writes. Service secrets remain server-side. Admin MFA, email confirmation, password recovery, production redirect allowlist, auth throttling and custom transactional SMTP must be checked.
- Test duplicate checkout, abandoned checkout, invalid signature, duplicate/reordered webhooks, failed renewal, successful retry, period-end cancellation, access expiry, cross-user portal access and deletion.

## Feedback backlog and delivery order
All feedback is retained, not represented as already shipped.

| Stage | Deliverables | Acceptance |
|---|---|---|
| Credibility | Per-metric reported/derived/estimated/conflicting provenance; period/currency/unit/ADR/share reconciliation; visible financing risk; missing-score explanations | Filing-backed reconciliation on diversified tickers; extreme values reviewed rather than arbitrarily clamped |
| Retention | Persisted previous-view snapshot, what changed, threshold-crossing alerts, earnings prep | Point-in-time snapshots, first-observation baseline, deduplicated events, email opt-out, no fabricated historical changes |
| Paid launch | Licensed public sample, onboarding, tested subscription/access lifecycle, clear methodology/changelog | Payment acceptance matrix above; legal/operator configuration; production read-only verification |
| Research depth | Cash runway with burn basis, dilution history/convertibles, sector models, adjustable scenarios, cited filing Q&A and filing changes | Period-matched evidence, explicit unavailable states, calibrated scope; no invented debt maturities or AI numbers |
| Portfolio and process | Portfolio risk/concentration/threshold counts, journal, pre-mortem and dated outcome review | No composite presented as personalized advice or validated return predictor |
| Optional tools | Compare, peer medians, screener, PDF/share cards, public ticker pages, weekly digest | Licensed cohort coverage, comparable periods, privacy-safe sharing, cost caps and export permission |
| Later distribution | Read-only brokerage import, clubs/teams, educators, affiliates/widgets, B2B, extension, education | Separate security/licensing/compliance review and demonstrated demand |

The user previously removed comparisons, downloads and journal panels because they cluttered the product; their renewed request places these in optional tools rather than the main Overview. Do not reintroduce them as mandatory boxes.

## Changes in this package
Discover, Strategy Lab and Paper Trading links are hidden from the settings navigation; direct routes and guarded code remain intact. DCA text now distinguishes the completed-month contribution policy from provisional current-month conditions, and explicitly says it is not buying activity. Overview risks are promoted above the answer cards. Login/registration now explain the product with a real content panel rather than an empty decorative area.

Billing, automated new alerts, peer medians and every new backlog feature are not activated by this package. No customers charged, emails sent, production database changed or deployment performed.

## Sources checked October 18, 2026
https://stripe.com/billing/pricing
https://docs.stripe.com/customer-management
https://eodhd.com/financial-apis/commercial-vs-personal-license-use
https://support.twelvedata.com/en/articles/5332349-commercial-and-personal-usage
https://support.twelvedata.com/en/articles/12647398-attribution-guidelines-for-using-twelve-data
https://www.sec.gov/files/divisions/investment/iaregulation/memoia.htm

Latest October 19 research/visual additions and exact remaining scope: see docs/RESEARCH_RETENTION_RELEASE.md (RESEARCH_RETENTION_RELEASE.md from this docs directory). Latest automated verification: 216 tests, TypeScript, production build and 64 API fixtures. Billing and the full commercial roadmap are not complete.
