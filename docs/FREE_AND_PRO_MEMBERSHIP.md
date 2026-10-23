# Free and Pro membership

This release supersedes earlier invitation-only onboarding instructions.

## One-time database update
After the existing access and Stripe migrations, run `supabase/migrations/20261023155152_open_free_membership.sql` in the Supabase SQL Editor, then deploy this source. It preserves users, subscriptions and grants. No account-by-account invitations or owner mode changes are needed.

## Customer experience
- Every verified new account starts Free. Signup with an immediate session opens Home. If email confirmation is required, the user confirms their email and returns to Home; the signup screen offers resend confirmation.
- Free includes 100 distinct researched companies per UTC calendar month. Revisiting a company does not use another slot. Quotas belong to the account, not a browser.
- Pro is $2.99 USD per month with unlimited company research. Provider budgets, request-rate protections and separate AI/watchlist allowances still apply.
- Plans is directly accessible from navigation. Free users can continue into the app or choose Pro; no invitation screen blocks content.
- Checkout runs on Stripe. A success URL alone never grants Pro. Verified Stripe status and signed webhook processing determine access; return handling polls briefly while confirmation completes.
- Manage subscription opens Stripe's portal. Returning synchronizes subscription status and refreshes membership. Cancellation at period end retains Pro until the paid-through date, then returns to Free.
- Owner grants provide complimentary Pro and can expire or be revoked. They never control admission to Free.
- Feature rules, watchlist limits and AI limits remain in owner controls. Monthly company limits are fixed to the advertised tiers.

## Setup and verification limits
Use `STRIPE_SETUP.md` for keys, the matching $2.99 monthly price, webhook and portal configuration. A previous user-supplied screenshot confirmed sandbox checkout, Pro activation and a paid test invoice; it does not verify live charges. This release does not provision SMTP, send a marketing welcome email, or demonstrate a completed real cancellation. Supabase confirmation mail needs production SMTP configured for delivery to ordinary users.

Tests cover new and legacy configurations, expired subscriptions, distinct monthly quotas/revisits, watchlist enforcement and authenticated ownership, plus existing Stripe event handling. Local tests cannot prove production email delivery or the live account's settings.
