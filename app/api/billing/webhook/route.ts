import Stripe from "stripe";
import { billingConfig, stripeClient, syncSubscription } from "@/lib/billing";
import { failure, privateJson, HttpError } from "@/lib/server";
export const runtime = "nodejs";
export async function POST(r: Request) {
  try {
    const c = billingConfig(),
      stripe = stripeClient(),
      signature = r.headers.get("stripe-signature");
    if (!signature) throw new HttpError("Missing signature.", 400);
    if (Number(r.headers.get("content-length")) > 1048576)
      throw new HttpError("Request too large.", 413);
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        await r.text(),
        signature,
        c.secret,
      );
    } catch {
      throw new HttpError("Invalid signature.", 400);
    }
    if (event.livemode !== (c.mode === "live"))
      throw new HttpError("Payment mode mismatch.", 400);
    let id: string | null = null;
    if (event.type.startsWith("customer.subscription."))
      id = (event.data.object as Stripe.Subscription).id;
    else if (
      [
        "invoice.paid",
        "invoice.payment_failed",
        "invoice.payment_action_required",
        "invoice.voided",
        "invoice.marked_uncollectible",
      ].includes(event.type)
    ) {
      const sub = (event.data.object as Stripe.Invoice).parent
        ?.subscription_details?.subscription;
      id = typeof sub === "string" ? sub : (sub?.id ?? null);
    } else if (
      [
        "checkout.session.completed",
        "checkout.session.async_payment_succeeded",
      ].includes(event.type)
    ) {
      const sub = (event.data.object as Stripe.Checkout.Session).subscription;
      id = typeof sub === "string" ? sub : (sub?.id ?? null);
    }
    if (id)
      await syncSubscription(stripe, id, {
        id: event.id,
        created: event.created,
      });
    return privateJson({ received: true });
  } catch (e) {
    return failure(e);
  }
}
