# Checkout diagnostics and admin cleanup

This update removes the repeated owner-preview banner from app pages, moves preview switching into Admin controls, corrects stale "No billing" copy and aligns the invitation form. Sample-data identification remains visible so sample observations cannot be mistaken for real holdings or prices.

After deploying, sign in as owner → Plans → Admin controls → **Check Stripe connection**. This makes a real price lookup using the deployed key and checks database billing mode without creating a customer, subscription or charge. A successful connection check is not a successful payment test.

Unexpected billing errors now return a safe error category/reference and log the stage plus allowlisted SDK identifiers in Vercel (`auryn_billing_failure`). Raw SDK messages, payment data, emails, tokens and keys are not intentionally logged. Auth/permission/price failures are distinguished from database configuration failures. Checkout still requires verified authentication, server-selected price/customer and signed subscription updates.

The reported production POST /api/billing 503 has NOT yet been root-caused or verified resolved. No AURYN requests were visible in the supplied Stripe account logs; this alone does not establish where the failure occurred. Vercel team scope rejected project/log access (403), so no production stack trace or credential validation was available. Deploy this update and run the owner connection check to obtain a useful diagnostic instead of repeatedly inspecting the same generic response. No new SQL migration or environment-variable names are introduced by this diagnostic update.
