/** Payment validation shared by server and transport-free tests. */
export function validProPrice(p: {
  active: boolean;
  currency: string;
  unit_amount: number | null;
  recurring: { interval: string; interval_count: number } | null;
}) {
  return (
    p.active &&
    p.currency === "usd" &&
    p.unit_amount === 299 &&
    p.recurring?.interval === "month" &&
    p.recurring.interval_count === 1
  );
}
export function billingMode() {
  return process.env.AURYN_BILLING_MODE === "live" ? "live" : "test";
}
export function paidThrough(
  invoice: {
    status: string | null;
    lines: { data: { period: { end: number } }[] };
  } | null,
  previous: string | null,
) {
  const old = previous ? Date.parse(previous) : 0;
  const end =
    invoice?.status === "paid"
      ? Math.max(0, ...invoice.lines.data.map((l) => l.period.end * 1000))
      : 0;
  return new Date(Math.max(Number.isFinite(old) ? old : 0, end)).toISOString();
}
export function billingReturnOrigin(value: string) {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  )
    throw Error("Use the canonical HTTPS app origin.");
  return url.origin;
}
