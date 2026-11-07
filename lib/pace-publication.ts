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

export type PublishedPaceRecord = {
  id: number;
  symbol: string;
  signal_period: string;
  policy: string;
  policy_hash: string;
  evidence_hash: string;
  pace: number;
  published_at: string;
  quote_at: string;
  reference_price: number;
};

/** Links a study row to a server-read receipt; a caller-supplied receipt is not authenticated. */
export function verifyProspectivePublication(
  symbol: string,
  row: {
    signalDate: string;
    signalKnownAt: string;
    executionAt: string;
    policyHash: string;
    multiplier: number;
  },
  records: PublishedPaceRecord[],
) {
  const matches = records.filter(
    (r) =>
      r.symbol === symbol &&
      r.signal_period === row.signalDate.slice(0, 7) &&
      r.policy === "monthly-v5" &&
      r.policy_hash === row.policyHash,
  );
  if (matches.length !== 1)
    throw Error(
      "Exactly one matching same-stock publication receipt is required.",
    );
  const r = matches[0];
  const instant = (value: string) =>
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|\+00:00)$/.test(value)
      ? Date.parse(value)
      : NaN;
  const published = instant(r.published_at),
    quote = instant(r.quote_at),
    known = instant(row.signalKnownAt),
    execution = instant(row.executionAt),
    signal = instant(row.signalDate);
  const nextMonth = new Date(signal);
  nextMonth.setUTCDate(1);
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
  nextMonth.setUTCHours(0, 0, 0, 0);
  if (
    ![published, quote, known, execution, signal].every(Number.isFinite) ||
    published < known ||
    published < nextMonth.getTime() ||
    published >= execution ||
    quote > published ||
    quote < signal ||
    published - quote > 4 * 86400000
  )
    throw Error(
      "Publication must follow completed evidence and precede execution.",
    );
  if (
    !Number.isInteger(r.pace) ||
    r.pace < 0 ||
    r.pace > 4 ||
    [0, 0, 1, 2, 4][r.pace] !== row.multiplier ||
    !Number.isInteger(r.id) ||
    r.id < 1 ||
    !/^[a-f0-9]{64}$/.test(r.evidence_hash) ||
    !/^[a-f0-9]{64}$/.test(r.policy_hash) ||
    !Number.isFinite(Number(r.reference_price)) ||
    Number(r.reference_price) <= 0
  )
    throw Error(
      "Publication identity, evidence, or contribution rule does not match.",
    );
  return { publicationId: r.id, publishedAt: r.published_at, symbol };
}
