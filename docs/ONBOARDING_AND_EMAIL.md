# Registration, Plans and email flow update

Observed user sandbox acceptance: supplied screenshots show Checkout opens in sandbox, AURYN changes to Pro paid through Nov 23, 2026, and Stripe's Customer Portal shows a paid $2.99 invoice plus subscription cancellation and payment-method controls. This confirms the shown test account's purchase and portal flow, not live-mode acceptance or all failure scenarios. Cancellation completion and later downgrade have not been demonstrated.

Changes in this release:
- Invite-only welcome now has a visible **View plans** action. No manually typed URL is needed; it does not bypass private access rules.
- Email/password signup with an immediate session opens Plans. Login continues to Home; invite-only accounts see a path to Plans.
- Confirmation-required signup explains the inbox/spam and sign-in steps, and offers **Resend confirmation email** with a one-minute client cooldown. Supabase still enforces its server-side email limits. A resend request is not proof of delivery.
- Admitted Free accounts have **Continue with Free** on Plans. Private-mode accounts clearly see that Free entry requires an invitation.
- Payment confirmation/cancellation messages appear above the plan cards. Confirmed subscribers get an **Open your workspace** link.
- The misleading design-preview/account-actions-disabled label is removed from signed-in sample-beta views. Actual public design previews retain it. Sample market-data disclosure remains visible.

## Owner action for open Free registration

**Plans → Admin controls → Who may enter? → All signed-in accounts · sample beta → Save access rules.**

Leaving this on "Owner and invited accounts" intentionally blocks Free workspace entry for people without invitations; paid subscriptions still admit their owners. This setting does not enable licensed external market data. Keep the sample flag while testing; change external-data licensing only when your agreements permit it. No new SQL migration or variable is introduced by this UX update.

## Email setup is separate from the app UI

- Stripe does not automatically email receipts for test-mode invoice payments. A missing sandbox receipt is not evidence that payment failed. View the invoice/receipt in the sandbox dashboard or Customer Portal.
- Registration confirmation/password recovery use Supabase Auth email. Check the Email provider's confirmation setting and configure **custom SMTP** for real users. Supabase's built-in sender is restricted and is not a production mail service for arbitrary customer addresses.
- Check Auth Logs for rejected sends/rate limits. Set Site URL to `https://www.auryninvest.com` and allow `https://www.auryninvest.com/auth/callback` as a redirect before testing email links. Keep intentional existing callback URLs if you use preview deployments.
- No separate marketing/welcome-email campaign or new SMTP provider is provisioned by this release. Live Stripe receipt settings must be enabled in Stripe when you launch real charges. Do not claim an email was delivered until actually tested.

References: https://supabase.com/docs/guides/auth/auth-smtp ; https://supabase.com/docs/guides/troubleshooting/not-receiving-auth-emails-from-the-supabase-project-OFSNzw ; https://support.stripe.com/questions/why-did-stripe-not-send-an-email-receipt-for-my-successfully-paid-invoice
