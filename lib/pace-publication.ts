export function publicationInput(
  input: {
    symbol: string;
    period: string;
    pace: number;
    price: number | null;
    quoteAt: string;
    stale: boolean;
    policyHash: string;
    evidenceHash: string;
  },
  now: string,
) {
  const clock = Date.parse(now),
    quote = Date.parse(input.quoteAt);
  const d = new Date(clock);
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - 1);
  const previous = d.toISOString().slice(0, 7);
  if (
    !/^[A-Z][A-Z0-9.-]{0,14}$/.test(input.symbol) ||
    input.period !== previous ||
    !Number.isInteger(input.pace) ||
    input.pace < 0 ||
    input.pace > 4
  )
    throw Error(
      "Only the latest completed monthly stock signal can be recorded.",
    );
  if (
    input.stale ||
    !Number.isFinite(quote) ||
    quote > clock ||
    clock - quote > 4 * 86400000 ||
    input.price == null ||
    !Number.isFinite(input.price) ||
    input.price <= 0
  )
    throw Error("A fresh dated reference quote is required.");
  if (
    ![input.policyHash, input.evidenceHash].every((h) =>
      /^[a-f0-9]{64}$/.test(h),
    )
  )
    throw Error("Policy and evidence fingerprints are required.");
  return {
    symbol: input.symbol,
    signal_period: input.period,
    policy: "monthly-v5",
    pace: input.pace,
    reference_price: input.price,
    quote_at: input.quoteAt,
    policy_hash: input.policyHash,
    evidence_hash: input.evidenceHash,
  };
}
