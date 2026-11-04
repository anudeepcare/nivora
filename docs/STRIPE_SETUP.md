# Clean Plans + Stripe setup

This full-source release adds compact Free/Pro cards, exact owner-configured limits/features, current-plan status, owner full access with a separate Admin link, real Stripe Checkout, a signed webhook, subscription synchronization and the hosted Customer Portal. It does not mark a customer paid from a success URL. Stripe 23.0.1 is pinned in the lockfile.

## After deploying this code

1. In Supabase SQL Editor run `supabase/migrations/20261023144637_stripe_billing.sql`. The earlier `20261023130718_beta_access.sql` must already be applied. These scripts are also included in the complete migrations folder. Do not replay all old migrations over an existing database.
2. In Stripe **sandbox**, Product catalog → Add product: **AURYN Pro**, **USD $2.99**, recurring **monthly**. Copy the `price_…` ID. The server refuses a different amount, currency or billing interval.
3. In Vercel → nivora → Settings → Environment Variables, set the values below for the deployment you will test. Reuse an integration-provided key if it already exists; do not create a second Stripe account or publish secrets in chat.
4. In Stripe Workbench → Webhooks/Event destinations, create a **snapshot-event** destination at `https://www.auryninvest.com/api/billing/webhook`. Select `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.paused`, `customer.subscription.resumed`, `invoice.paid`, `invoice.payment_failed`, `invoice.payment_action_required`, `invoice.voided`, `invoice.marked_uncollectible`, `checkout.session.completed`, and `checkout.session.async_payment_succeeded`. Use the current Stripe API version compatible with the pinned SDK (not legacy invoice/subscription payload formats). Copy its signing secret into `STRIPE_WEBHOOK_SECRET`.
5. Stripe → Billing → Customer portal: enable payment-method changes, invoice history, and subscription cancellation **at the end of the billing period**. Disable plan/price switching for now: AURYN supports one monthly Pro price. Save the portal configuration in the same sandbox/account as the secret key.
6. Redeploy after changing environment variables. Sign in as owner, open **Admin controls**, and save your beta/feature settings. Keep the database billing mode `test` (the migration default).
7. Use a separate Free account, not the owner or a complimentary Pro friend: **Plans → Upgrade to Pro**. Test Checkout with Stripe's documented test card `4242 4242 4242 4242`, any future expiry and any three-digit CVC. No real card in sandbox. After return, confirm Pro unlocks and Stripe shows the subscription plus delivered webhook. Then **Manage subscription** → invoice/payment method → cancel; confirm paid access remains until the shown end date. A failed initial payment must not grant Pro.

### Server-only Vercel values

| Name | Value |
| --- | --- |
| `STRIPE_SECRET_KEY` | Sandbox `sk_test_…` or appropriately permitted `rk_test_…`; integration may already supply it |
| `STRIPE_PRO_PRICE_ID` | Sandbox monthly USD $2.99 `price_…` |
| `STRIPE_WEBHOOK_SECRET` | Signing secret `whsec_…` for this exact destination |
| `AURYN_APP_URL` | `https://www.auryninvest.com` (no path) |
| `AURYN_BILLING_MODE` | `test` |
| `AURYN_BILLING_LIVE_ENABLED` | `false` |
| `AURYN_ACCESS_ENABLED` | `true` |
| `AURYN_OWNER_USER_ID` | Your verified Supabase Auth user UUID |
| `SUPABASE_SERVICE_ROLE_KEY` | Existing server-only database key |

Use your existing Supabase public URL and publishable-key values. No Stripe publishable key is required by this hosted-Checkout implementation. Do not use `NEXT_PUBLIC_` for Stripe secrets or the Supabase service-role key.

Keep `AURYN_EXTERNAL_DATA_LICENSED=false` while testing with sample data. If access controls are disabled, personal mode is unrestricted; the server will refuse paid Checkout until access controls are enabled and owner settings saved.

## Going live later

Finish Stripe account activation, licensing and launch review first. Create the matching **live** product/price, webhook destination and portal configuration. Replace all three Stripe values with live-mode values together; set `AURYN_BILLING_MODE=live`, `AURYN_BILLING_LIVE_ENABLED=true`, and `AURYN_EXTERNAL_DATA_LICENSED=true`. In Supabase run:

```sql
update public.auryn_access_config set billing_mode='live' where id=true;
```

Redeploy. Sandbox purchases do not grant live Pro; customer bindings and subscription records are separated by mode. API access and direct watchlist caps must use the same deployment/database billing mode. Do not point simultaneous sandbox and live deployments at a single access-config row; use a separate preview/test database if needed.

## What is verified and what remains

Automated checks exercise paid-period handling, failed renewals, signature tampering, wrong-mode events, checkout reservation/idempotency, duplicate/stale updates, multiple subscriptions, database permissions and compact pricing-card states. Tests use synthetic payloads and an embedded Postgres database; they do not represent a payment processed by Stripe. This release has not processed an actual sandbox payment, run a full hosted Customer Portal session, or applied the new migration to your live Supabase project. Project credential access was unavailable to the assistant.

Refunds/disputes, tax collection, coupons, proration/plan switching, annual plans and automated account deletion are outside this billing release. Handle refunds/disputes in Stripe and cancel/revoke the associated subscription as appropriate; a refund alone does not automatically revoke AURYN access in this version. No trial is configured. Access follows verified paid invoice periods; a failed renewal does not extend the paid-through date. A cancel-at-period-end subscription remains active until its paid period ends. Immediate cancellation removes subscription access; an independent complimentary grant may still apply.

Official references: [subscriptions](https://docs.stripe.com/billing/subscriptions/build-subscriptions), [webhook signatures](https://docs.stripe.com/webhooks/signature), [customer portal](https://docs.stripe.com/customer-management), [sandbox testing](https://docs.stripe.com/testing).
