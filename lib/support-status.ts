/** Safe owner-facing diagnostics. Never expose provider response bodies or secrets. */
export function supportDeliveryStatus(
  env: Record<string, string | undefined> = process.env,
) {
  const recipient = env.AURYN_SUPPORT_NOTIFY_EMAIL || "support@auryninvest.com";
  const sender = env.AURYN_SUPPORT_FROM || "";
  const issue =
    env.VERCEL_ENV === "preview"
      ? "Email is disabled on preview deployments."
      : env.AURYN_SUPPORT_EMAIL_ENABLED !== "true"
        ? "Support email sending is disabled."
        : !env.RESEND_API_KEY
          ? "The email API key is missing."
          : !sender
            ? "The support sender address is missing."
            : /@resend\.dev\b/i.test(sender)
              ? "The sender uses the Resend test domain. Verify your sending domain and use its address before sending to customers or Zoho."
              : null;
  return { recipient, sender, issue, ready: !issue };
}
export function supportDeliveryError(status: number, message = "") {
  if (/testing emails|own email address/i.test(message))
    return "Resend test sender cannot deliver to this inbox. Verify auryninvest.com in Resend and configure a sender on that domain.";
  if (/domain.*not verified/i.test(message))
    return "The sender domain is not verified in Resend. Complete domain verification before retrying.";
  if (status === 401 || status === 403)
    return "Email provider rejected authorization. Check the API key, sender domain and sending permissions.";
  if (status === 429) return "Email provider limit reached. Retry later.";
  if (status === 409)
    return "The provider rejected this retry key. Wait for its idempotency window to expire before retrying.";
  return "Email provider did not accept the message. Check Resend logs for the delivery failure.";
}
