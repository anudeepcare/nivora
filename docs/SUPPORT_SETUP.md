# Contact and owner notifications

1. Review and run `supabase/migrations/20261025002448_auryn_support_inbox.sql` in the intended Supabase project. It only adds support records/function/indexes, does not modify holdings or membership. It is not applied automatically by the application.
2. Contact is available at `/contact`, including when signed out. Owner controls have a Support tab. Only the server service role can access support records; the API additionally checks the exact owner for inbox/status/retry operations.
3. Email is optional and disabled by default. To enable it on production after testing, configure:
   - `RESEND_API_KEY`: server secret for your email sender.
   - `AURYN_SUPPORT_FROM`: a verified sender such as `AURYN <support@your-verified-domain>`; use a domain you control and have verified with your email provider.
   - `AURYN_SUPPORT_NOTIFY_EMAIL`: the inbox where you want notifications and replies to receipts.
   - `AURYN_SUPPORT_EMAIL_ENABLED=true`.
   - Existing server Supabase URL and service role key must be configured. Never put secrets in NEXT_PUBLIC variables or chat.
4. Preview deployments suppress outgoing support emails, including if the enabled flag is accidentally copied. Saved requests are still real records in the selected database. Use a test database for destructive tests.
5. A successful contact response means the request was durably saved. It shows receipt sent only after the provider accepts and the delivery state is saved. No receipt is promised when email is disabled or fails.
6. Owner notification uses the submitter as reply-to; user receipt uses your configured support notification address as reply-to. No attachments or portfolio/account secrets are collected automatically.
7. Existing authenticated `/api/jobs` runs retry a bounded batch if scheduled by your deployment. This build does not install a new cron schedule. The owner can always use Retry pending emails, including after five automatic attempts have paused. Batch size is two; individual email calls time out after four seconds. Resend idempotency keys reduce duplicate sends, but crash recovery beyond the provider's deduplication window is not exactly-once delivery.
8. Abuse controls: same-origin POST, bounded input, honeypot, stable request ID, persistent limit of three requests per hashed ingress address per hour and 200 requests globally per day. These limits are conservative and should be monitored for real traffic; they do not replace a full anti-abuse service.

No paid email plan is required by application code. Check your sender's current entitlement and verified-domain requirements before enabling delivery. A live send was not tested in this workspace.
