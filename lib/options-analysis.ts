export type OptionContract = {
  id: string;
  type: "call" | "put";
  strike: number;
  expiry: string;
  observed: string;
  bid: number | null;
  ask: number | null;
  oi: number | null;
  volume: number | null;
  iv: number | null;
  delta: number | null;
  gamma: number | null;
  theta: number | null;
  vega: number | null;
  multiplier: number;
  standard: boolean;
};
const n = (x: unknown): number | null =>
  x !== null && x !== undefined && x !== "" && Number.isFinite(Number(x))
    ? Number(x)
    : null;
export function normalizeOptions(
  raw: unknown,
  now = Date.now(),
): OptionContract[] {
  const rows = Array.isArray(raw) ? raw : [];
  const out = new Map<string, OptionContract>();
  for (const item of rows) {
    const a = item?.attributes ?? item;
    if (!a) continue;
    const type = String(a.type ?? "").toLowerCase(),
      strike = n(a.strike),
      expiry = String(a.exp_date ?? "").slice(0, 10),
      observed = String(a.tradetime ?? a.date ?? "").slice(0, 10),
      id = String(a.contract ?? item.id ?? "");
    if (
      !["call", "put"].includes(type) ||
      !strike ||
      strike <= 0 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(expiry) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(observed) ||
      Date.parse(expiry + "T21:00:00Z") <= now ||
      Date.parse(observed + "T00:00:00Z") > now ||
      !id
    )
      continue;
    const nonnegative = (x: unknown) => {
      const v = n(x);
      return v !== null && v >= 0 ? v : null;
    };
    const bid = nonnegative(a.bid),
      ask = nonnegative(a.ask),
      iv = nonnegative(a.volatility),
      gamma = nonnegative(a.gamma),
      oi = nonnegative(a.open_interest),
      volume = nonnegative(a.volume),
      multiplier = n(a.contract_size ?? a.multiplier) ?? 100;
    // Adjusted contracts require a deliverable-aware model; never silently treat them as 100 shares.
    const standard = /^[A-Z.]+\d{6}[CP]\d{8}$/.test(id) && multiplier === 100;
    const c: OptionContract = {
      id,
      type: type as "call" | "put",
      strike,
      expiry,
      observed,
      bid: bid !== null && ask !== null && bid > ask ? null : bid,
      ask: bid !== null && ask !== null && bid > ask ? null : ask,
      oi,
      volume,
      iv: iv !== null && iv > 0 && iv <= 10 ? iv : null,
      delta: n(a.delta),
      gamma,
      theta: n(a.theta),
      vega: n(a.vega),
      multiplier,
      standard,
    };
    const old = out.get(id);
    if (!old || old.observed < c.observed) out.set(id, c);
  }
  return [...out.values()].sort(
    (a, b) =>
      a.expiry.localeCompare(b.expiry) ||
      a.strike - b.strike ||
      a.type.localeCompare(b.type),
  );
}
export function optionMid(c: OptionContract) {
  return c.bid !== null && c.ask !== null && c.ask > 0
    ? (c.bid + c.ask) / 2
    : null;
}
export function liquidity(c: OptionContract) {
  const mid = optionMid(c);
  const spread =
    mid && c.bid !== null && c.ask !== null ? (c.ask - c.bid) / mid : null;
  return {
    spread,
    eligible:
      c.standard &&
      c.bid !== null &&
      c.bid > 0 &&
      spread !== null &&
      spread <= 0.2 &&
      (c.oi ?? 0) >= 100,
  };
}
export function optionsSummary(
  chain: OptionContract[],
  spot: number,
  expiry: string,
  now = Date.now(),
  complete = false,
) {
  const selected = chain.filter((c) => c.expiry === expiry && c.standard);
  const dates = [...new Set(selected.map((c) => c.observed))].sort();
  const asOf = dates.at(-1) ?? null;
  const rows = selected.filter((c) => c.observed === asOf);
  const strikes = [...new Set(rows.map((c) => c.strike))].sort((a, b) => a - b);
  const nearest = strikes.reduce(
    (best, k) => (Math.abs(k - spot) < Math.abs(best - spot) ? k : best),
    strikes[0] ?? spot,
  );
  const call = rows.find((c) => c.type === "call" && c.strike === nearest),
    put = rows.find((c) => c.type === "put" && c.strike === nearest);
  const cm = call ? optionMid(call) : null,
    pm = put ? optionMid(put) : null;
  const straddle = cm !== null && pm !== null ? cm + pm : null;
  const buckets = strikes.map((strike) => {
    const cs = rows.filter((c) => c.strike === strike);
    let callGex = 0,
      putGex = 0,
      callOi = 0,
      putOi = 0;
    for (const c of cs) {
      if (c.oi !== null) {
        if (c.type === "call") callOi += c.oi;
        else putOi += c.oi;
        if (c.gamma !== null) {
          const g = c.gamma * c.oi * c.multiplier * spot * spot * 0.01;
          if (c.type === "call") callGex += g;
          else putGex += g;
        }
      }
    }
    return { strike, callGex, putGex, net: callGex - putGex, callOi, putOi };
  });
  const validGex = rows.filter((c) => c.gamma !== null && c.oi !== null);
  const allInputs =
    rows.length > 0 &&
    validGex.length === rows.length &&
    selected.length === rows.length;
  const canFlip = complete && allInputs && rows.every((c) => c.iv !== null);
  const T = (Date.parse(expiry + "T21:00:00Z") - now) / (365.25 * 86400000);
  const profile = [] as { spot: number; gex: number }[];
  if (canFlip && T > 0 && spot > 0) {
    for (let i = 0; i <= 80; i++) {
      const s = spot * (0.5 + i / 80);
      let gex = 0;
      for (const c of rows) {
        const vol = c.iv!;
        const d1 =
          (Math.log(s / c.strike) + (0.04 + (vol * vol) / 2) * T) /
          (vol * Math.sqrt(T));
        const gamma =
          Math.exp((-d1 * d1) / 2) /
          (Math.sqrt(2 * Math.PI) * s * vol * Math.sqrt(T));
        gex +=
          (c.type === "call" ? 1 : -1) * gamma * c.oi! * 100 * s * s * 0.01;
      }
      profile.push({ spot: s, gex });
    }
  }
  const flips: number[] = [];
  for (let i = 1; i < profile.length; i++) {
    const a = profile[i - 1],
      b = profile[i];
    if (a.gex * b.gex < 0)
      flips.push(a.spot + ((b.spot - a.spot) * -a.gex) / (b.gex - a.gex));
  }
  const oi = (type: "call" | "put") =>
    rows.filter((c) => c.type === type).reduce((s, c) => s + (c.oi ?? 0), 0);
  const callOi = oi("call"),
    putOi = oi("put");
  return {
    rows,
    asOf,
    buckets,
    callOi,
    putOi,
    putCallOi: callOi ? putOi / callOi : null,
    straddle,
    nearest,
    netGex:
      validGex.length && spot > 0 && Number.isFinite(spot)
        ? buckets.reduce((s, b) => s + b.net, 0)
        : null,
    gammaCoverage: rows.length ? validGex.length / rows.length : 0,
    flips,
    profile,
    complete,
    allInputs,
  };
}
export type PayoffLeg = {
  type: "call" | "put";
  strike: number;
  premium: number;
  quantity: number;
};
export function expirationPayoff(
  price: number,
  legs: PayoffLeg[],
  shares = 0,
  stockCost = 0,
) {
  return legs.reduce(
    (sum, l) =>
      sum +
      100 *
        l.quantity *
        ((l.type === "call"
          ? Math.max(0, price - l.strike)
          : Math.max(0, l.strike - price)) -
          l.premium),
    shares * (price - stockCost),
  );
}
export function payoffRisk(legs: PayoffLeg[], shares = 0, stockCost = 0) {
  const strikes = [...new Set([0, ...legs.map((l) => l.strike)])].sort(
    (a, b) => a - b,
  );
  const values = strikes.map((x) =>
    expirationPayoff(x, legs, shares, stockCost),
  );
  const slope =
    shares +
    100 *
      legs.filter((l) => l.type === "call").reduce((s, l) => s + l.quantity, 0);
  const minimum = slope < 0 ? -Infinity : Math.min(...values),
    maximum = slope > 0 ? Infinity : Math.max(...values);
  const breakEven: number[] = [];
  for (let i = 1; i < strikes.length; i++) {
    const a = values[i - 1],
      b = values[i];
    if (a * b < 0)
      breakEven.push(
        strikes[i - 1] + ((strikes[i] - strikes[i - 1]) * -a) / (b - a),
      );
    else if (b === 0) breakEven.push(strikes[i]);
  }
  const last = strikes.at(-1)!,
    v = values.at(-1)!;
  if (slope && last - v / slope > last) breakEven.push(last - v / slope);
  return {
    maxLoss: minimum === -Infinity ? Infinity : Math.max(0, -minimum),
    maxGain: maximum,
    breakEven,
  };
}
