import Stripe from "stripe";
import { accessDb, exactOwner, getAccess } from "./access-server";
import { HttpError } from "./server";
import {
  billingMode,
  billingReturnOrigin,
  paidThrough,
  validProPrice,
} from "./billing-policy";
import { cleanAccessConfig } from "./access-policy";
export function billingConfig() {
  const mode = billingMode(),
    key = process.env.STRIPE_SECRET_KEY || "",
    price = process.env.STRIPE_PRO_PRICE_ID || "",
    secret = process.env.STRIPE_WEBHOOK_SECRET || "";
  const missing: string[] = [];
  if (!new RegExp(`^(sk|rk)_${mode}_`).test(key))
    missing.push("Stripe secret key for " + mode + " mode");
  if (!price.startsWith("price_")) missing.push("monthly Pro price");
  if (!secret.startsWith("whsec_")) missing.push("webhook signing secret");
  if (process.env.AURYN_ACCESS_ENABLED !== "true")
    missing.push("access controls");
  if (!process.env.AURYN_OWNER_USER_ID) missing.push("workspace owner");
  let origin = "";
  try {
    origin = billingReturnOrigin(process.env.AURYN_APP_URL || "");
  } catch {
    missing.push("canonical app URL");
  }
  if (
    mode === "live" &&
    (process.env.AURYN_BILLING_LIVE_ENABLED !== "true" ||
      process.env.AURYN_EXTERNAL_DATA_LICENSED !== "true")
  )
    missing.push("live launch approval and data licensing");
  return {
    mode,
    key,
    price,
    secret,
    origin,
    missing,
    ready: missing.length === 0,
  };
}
export function stripeClient() {
  const c = billingConfig();
  if (!c.ready)
    throw new HttpError(
      "Subscriptions are not open yet. Please try again later.",
      503,
    );
  return new Stripe(c.key, { timeout: 10000, maxNetworkRetries: 1 });
}
async function binding(user: string) {
  const r = await accessDb()
    .from("auryn_billing_customers")
    .select("*")
    .eq("user_id", user)
    .eq("mode", billingMode())
    .maybeSingle();
  if (r.error) throw new HttpError("Billing setup is unavailable.", 503);
  return r.data;
}
export async function billingStatus(user: string) {
  const c = billingConfig(),
    db = accessDb(),
    [a, r, b] = await Promise.all([
      getAccess(user),
      db.from("auryn_access_config").select("body").eq("id", true).single(),
      binding(user),
    ]);
  if (r.error) throw new HttpError("Plans are temporarily unavailable.", 503);
  const config = cleanAccessConfig(r.data.body);
  const sub = await db
    .from("auryn_stripe_subscriptions")
    .select("status,paid_until,cancel_at_period_end")
    .eq("user_id", user)
    .eq("mode", c.mode)
    .in("status", ["active", "trialing", "past_due"])
    .order("paid_until", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (sub.error) throw new HttpError("Billing setup is unavailable.", 503);
  return {
    ready: c.ready,
    mode: c.mode,
    config,
    access: a,
    subscription: sub.data,
    canManage: !!b,
    setup: a.owner ? c.missing : [],
  };
}
export async function syncSubscription(
  stripe: Stripe,
  subscriptionId: string,
  event?: { id: string; created: number },
) {
  const started = Date.now(),
    s = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["latest_invoice"],
    });
  const mode = billingMode();
  if (s.livemode !== (mode === "live"))
    throw new HttpError("Payment mode mismatch.", 400);
  const customer = typeof s.customer === "string" ? s.customer : s.customer.id,
    db = accessDb();
  const b = await db
    .from("auryn_billing_customers")
    .select("user_id")
    .eq("customer_id", customer)
    .eq("mode", mode)
    .maybeSingle();
  if (b.error) throw Error("Customer lookup unavailable");
  if (!b.data) return; // A subscription outside AURYN never grants access.
  if (!s.items.data.some((i) => i.price.id === process.env.STRIPE_PRO_PRICE_ID))
    return;
  const old = await db
    .from("auryn_stripe_subscriptions")
    .select("paid_until")
    .eq("subscription_id", s.id)
    .maybeSingle();
  if (old.error) throw Error("Subscription lookup unavailable");
  const invoice =
    s.latest_invoice && typeof s.latest_invoice !== "string"
      ? s.latest_invoice
      : null;
  const until = paidThrough(invoice, old.data?.paid_until ?? null);
  const result = await db.rpc("auryn_billing_apply", {
    p_user: b.data.user_id,
    p_mode: mode,
    p_customer: customer,
    p_subscription: s.id,
    p_status: s.status,
    p_until: until,
    p_cancel: s.cancel_at_period_end,
    p_observed: started,
    p_event: event?.id ?? `sync:${s.id}:${crypto.randomUUID()}`,
  });
  if (result.error) throw Error("Subscription update unavailable");
}
export async function syncCustomer(user: string, stripe: Stripe) {
  const b = await binding(user);
  if (!b) return;
  // Auto-pagination avoids silently dropping a customer's older active subscription.
  for await (const s of stripe.subscriptions.list({
    customer: b.customer_id,
    status: "all",
    limit: 100,
  }))
    await syncSubscription(stripe, s.id);
}
export async function billingAction(
  user: string,
  email: string | undefined,
  action: string,
  progress: (stage: string) => void = () => {},
) {
  progress("configuration");
  const c = billingConfig(),
    stripe = stripeClient(),
    db = accessDb();
  if (action === "check") {
    if (!exactOwner(user)) throw new HttpError("Owner access required.", 403);
    progress("price_lookup");
    const price = await stripe.prices.retrieve(c.price);
    if (!validProPrice(price) || price.livemode !== (c.mode === "live"))
      throw new HttpError(
        "Pro must use an active monthly USD $2.99 price in the same Stripe mode.",
        503,
      );
    progress("database_check");
    const schema = await db
      .from("auryn_access_config")
      .select("billing_mode")
      .eq("id", true)
      .single();
    if (schema.error) throw schema.error;
    if (schema.data.billing_mode !== c.mode)
      throw new HttpError(
        "Database billing mode does not match this deployment.",
        503,
      );
    return {
      message: `Stripe ${c.mode} connection and monthly $2.99 price verified. No payment was created.`,
    };
  }
  if (action === "sync") {
    await syncCustomer(user, stripe);
    return { synced: true };
  }
  progress("customer_lookup");
  let b = await binding(user);
  if (action === "portal") {
    if (!b) throw new HttpError("No subscription to manage yet.", 400);
    progress("portal_create");
    const portal = await stripe.billingPortal.sessions.create({
      customer: b.customer_id,
      return_url: c.origin + "/plans",
    });
    return { url: portal.url };
  }
  if (action !== "checkout")
    throw new HttpError("Unknown billing action.", 400);
  if (exactOwner(user))
    throw new HttpError("Your owner account already has full access.", 409);
  const access = await getAccess(user);
  if (access.plan === "pro")
    throw new HttpError("You already have Pro access.", 409);
  progress("price_lookup");
  const price = await stripe.prices.retrieve(c.price);
  if (!validProPrice(price) || price.livemode !== (c.mode === "live"))
    throw new HttpError("The monthly plan is not configured correctly.", 503);
  progress("access_configuration");
  const conf = await db
    .from("auryn_access_config")
    .select("enforced,owner_id,billing_mode")
    .eq("id", true)
    .single();
  if (
    conf.error ||
    !conf.data.enforced ||
    conf.data.owner_id !== process.env.AURYN_OWNER_USER_ID ||
    conf.data.billing_mode !== c.mode
  )
    throw new HttpError("The owner must finish access setup.", 503);
  if (!b) {
    progress("customer_create");
    const customer = await stripe.customers.create(
      { email, metadata: { auryn_user_id: user } },
      { idempotencyKey: `auryn-customer:${c.mode}:${user}` },
    );
    const insert = await db
      .from("auryn_billing_customers")
      .upsert(
        { user_id: user, mode: c.mode, customer_id: customer.id },
        { onConflict: "user_id,mode", ignoreDuplicates: true },
      );
    if (insert.error) throw insert.error;
    b = await binding(user);
    if (!b) throw Error("Customer not found");
  }
  progress("checkout_reservation");
  const lease = await db.rpc("auryn_billing_checkout_lease", {
    p_user: user,
    p_mode: c.mode,
  });
  if (lease.error) throw lease.error;
  if (!lease.data?.allowed)
    throw new HttpError(
      "Checkout is already opening. Try again in a moment.",
      409,
    );
  const nonce = lease.data.nonce;
  try {
    progress("subscription_lookup");
    for await (const s of stripe.subscriptions.list({
      customer: b.customer_id,
      status: "all",
      limit: 100,
    })) {
      if (
        [
          "active",
          "trialing",
          "past_due",
          "unpaid",
          "incomplete",
          "paused",
        ].includes(s.status)
      )
        throw new HttpError(
          "A subscription already exists. Use Manage subscription.",
          409,
        );
    }
    if (lease.data.session) {
      const old = await stripe.checkout.sessions.retrieve(lease.data.session);
      if (old.status === "open" && old.url) return { url: old.url };
      throw new HttpError(
        "Your previous checkout is processing. Refresh your plan shortly.",
        409,
      );
    }
    progress("checkout_create");
    const session = await stripe.checkout.sessions.create(
      {
        mode: "subscription",
        customer: b.customer_id,
        client_reference_id: user,
        line_items: [{ price: c.price, quantity: 1 }],
        subscription_data: { metadata: { auryn_user_id: user } },
        success_url: c.origin + "/plans?checkout=success",
        cancel_url: c.origin + "/plans?checkout=cancelled",
        expires_at: lease.data.expires,
      },
      { idempotencyKey: `auryn-checkout:${c.mode}:${user}:${nonce}` },
    );
    progress("checkout_save");
    const save = await db
      .from("auryn_billing_customers")
      .update({ checkout_session: session.id })
      .eq("user_id", user)
      .eq("mode", c.mode)
      .eq("checkout_nonce", nonce);
    if (save.error) throw save.error;
    if (!session.url) throw Error("Checkout could not be saved");
    return { url: session.url };
  } finally {
    await db
      .from("auryn_billing_customers")
      .update({ lease_until: null })
      .eq("user_id", user)
      .eq("mode", c.mode)
      .eq("checkout_nonce", nonce);
  }
}
