import { SUPPORT_EMAIL } from "./site-metadata";
import { accessDb } from "./access-server";
/** Saved request is the source of truth. Delivery failures never remove it. */
export async function deliverSupport(id: string) {
  const key = process.env.RESEND_API_KEY,
    from = process.env.AURYN_SUPPORT_FROM,
    to = process.env.AURYN_SUPPORT_NOTIFY_EMAIL || SUPPORT_EMAIL;
  if (
    process.env.AURYN_SUPPORT_EMAIL_ENABLED !== "true" ||
    process.env.VERCEL_ENV === "preview" ||
    !key ||
    !from ||
    !to
  )
    return { notified: false, receipt: false };
  const db = accessDb();
  const { data: r, error } = await db
    .from("auryn_support_requests")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !r) throw Error("Saved request unavailable.");
  const send = async (kind: "owner" | "receipt") => {
    const owner = kind === "owner";
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `auryn-support-${id}-${kind}`,
      },
      body: JSON.stringify({
        from,
        to: [owner ? to : r.email],
        reply_to: owner ? r.email : to,
        subject: owner
          ? `AURYN · ${r.category} · ${id.slice(0, 8)}`
          : `AURYN received your message · ${id.slice(0, 8)}`,
        text: owner
          ? `Reference: ${id}\nTopic: ${r.category}\nFrom: ${r.email}\nPage: ${r.page}\n\n${r.message}`
          : `Thank you for contacting AURYN. Your message has been saved.\n\nReference: ${id}\nTopic: ${r.category}\n\nWe will reply to this email address. You can reply here to add details. Never send passwords or payment card information.`,
      }),
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return false;
    const saved = await db
      .from("auryn_support_requests")
      .update({
        [owner ? "owner_notified_at" : "receipt_sent_at"]:
          new Date().toISOString(),
      })
      .eq("id", id);
    return !saved.error;
  };
  await db
    .from("auryn_support_requests")
    .update({ attempts: r.attempts + 1 })
    .eq("id", id);
  const notified = r.owner_notified_at ? true : await send("owner");
  // Do not send receipts before owner notification succeeds. Limits public email amplification.
  const receipt = r.receipt_sent_at
    ? true
    : notified
      ? await send("receipt")
      : false;
  return { notified, receipt };
}
export async function retrySupport(manual = false) {
  const db = accessDb();
  let query = db
    .from("auryn_support_requests")
    .select("id")
    .is("receipt_sent_at", null);
  if (!manual) query = query.lt("attempts", 5);
  const { data, error } = await query.order("created_at").limit(2);
  if (error) throw Error("Support retry queue unavailable.");
  const results = [];
  for (const row of data ?? [])
    results.push(
      await deliverSupport(row.id).catch(() => ({
        notified: false,
        receipt: false,
      })),
    );
  return results;
}
