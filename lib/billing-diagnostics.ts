/** Allowlisted diagnostics only: never return/log raw SDK errors, keys or personal data. */
export function billingDiagnostic(
  error: unknown,
  stage: string,
  reference: string,
) {
  const e = (error && typeof error === "object" ? error : {}) as {
    type?: string;
    code?: string;
    requestId?: string;
    statusCode?: number;
  };
  let code = "billing_unavailable",
    message = "Checkout could not be opened. Please contact support.";
  if (e.type === "StripeAuthenticationError") {
    code = "stripe_auth";
    message =
      "The payment connection needs attention. The owner must verify the Stripe sandbox secret key.";
  } else if (e.type === "StripePermissionError") {
    code = "stripe_permission";
    message =
      "The payment key lacks a required permission. The owner must update the Stripe key permissions.";
  } else if (e.code === "resource_missing") {
    code = "stripe_resource";
    message =
      "The configured price or customer was not found in this Stripe account. The owner must check that the key and price belong to the same sandbox.";
  } else if (
    e.type === "StripeConnectionError" ||
    e.type === "StripeAPIError"
  ) {
    code = "stripe_connection";
    message =
      "The payment service could not be reached. Please try again shortly.";
  } else if (
    e.code?.startsWith("PGRST") ||
    ["42P01", "42703", "42501", "23503"].includes(e.code ?? "")
  ) {
    code = "billing_database";
    message =
      "Billing database setup needs attention. The owner must apply the billing migration to the configured Supabase project.";
  } else if (e.type === "StripeInvalidRequestError") {
    code = "stripe_request";
    message =
      "Stripe rejected the checkout configuration. The owner can find the request in Stripe Logs.";
  }
  const safe = (s: string | undefined) =>
    s &&
    /^[a-zA-Z0-9_:-]{1,100}$/.test(s) &&
    !/(?:sk|rk|pk)_(?:test|live)_|whsec_|bearer/i.test(s)
      ? s
      : undefined;
  return {
    code,
    message: `${message} Reference: ${reference}.`,
    reference,
    stage: safe(stage),
    stripeRequest: safe(e.requestId),
    providerCode: safe(e.code),
    providerType: safe(e.type),
  };
}
