import type { OptionContract } from "./options-analysis";
export type FlowTrade = {
  id: string;
  contract: string;
  type: "call" | "put";
  strike: number;
  expiry: string;
  time: string;
  price: number;
  size: number;
  premium: number;
  exchange: string;
  condition: string;
};
export type FlowReply = {
  status: "available" | "unavailable";
  message?: string;
  trades: FlowTrade[];
  contracts: string[];
  fetchedAt?: string;
  start?: string;
  partial: boolean;
  chainComplete?: boolean;
  source: string;
};
function contractParts(id: string) {
  const m = /^([A-Z.]{1,10})(\d{6})([CP])(\d{8})$/.exec(id);
  if (!m) return null;
  const expiry = `20${m[2].slice(0, 2)}-${m[2].slice(2, 4)}-${m[2].slice(4, 6)}`;
  if (
    !Number.isFinite(Date.parse(expiry)) ||
    new Date(expiry).toISOString().slice(0, 10) !== expiry
  )
    return null;
  const strike = Number(m[4]) / 1000;
  if (strike <= 0) return null;
  return {
    underlying: m[1],
    expiry,
    strike,
    type: m[3] === "C" ? "call" : "put",
  };
}
export function selectFlowContracts(
  rows: OptionContract[],
  symbol: string,
  expiry: string | null = null,
): OptionContract[] {
  const unique = new Map<string, OptionContract>();
  for (const c of rows) {
    const p = contractParts(c.id);
    if (
      !p ||
      p.underlying !== symbol ||
      !c.standard ||
      c.multiplier !== 100 ||
      p.strike !== c.strike ||
      p.expiry !== c.expiry ||
      p.type !== c.type ||
      (expiry && p.expiry !== expiry)
    )
      continue;
    unique.set(c.id, c);
  }
  return [...unique.values()]
    .sort(
      (a, b) =>
        (b.oi ?? -1) - (a.oi ?? -1) ||
        a.expiry.localeCompare(b.expiry) ||
        a.id.localeCompare(b.id),
    )
    .slice(0, 30);
}
export function normalizeFlowTrades(
  raw: unknown,
  contracts: OptionContract[],
  now = Date.now(),
): FlowTrade[] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw Error("The options trade source returned an unsupported response.");
  const scope = new Map(contracts.map((c) => [c.id, c]));
  const result = new Map<string, FlowTrade>();
  let inspected = 0;
  for (const [symbol, entries] of Object.entries(raw)) {
    if (!Array.isArray(entries))
      throw Error("The options trade source returned an unsupported response.");
    const c = scope.get(symbol);
    if (!c) continue;
    for (const item of entries) {
      if (++inspected > 500) break;
      if (!item || typeof item !== "object") continue;
      const r = item as Record<string, unknown>,
        price = r.p,
        size = r.s,
        time = r.t;
      if (
        typeof price !== "number" ||
        !Number.isFinite(price) ||
        price <= 0 ||
        typeof size !== "number" ||
        !Number.isSafeInteger(size) ||
        size <= 0 ||
        typeof time !== "string" ||
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
          time,
        ) ||
        !Number.isFinite(Date.parse(time)) ||
        Date.parse(time) > now ||
        new Date(time.slice(0, 10)).toISOString().slice(0, 10) !==
          time.slice(0, 10)
      )
        continue;
      const premium = price * size * 100;
      if (!Number.isFinite(premium)) continue;
      const exchange =
        typeof r.x === "string" ? r.x.slice(0, 20) : "Unavailable";
      const condition =
        typeof r.c === "string"
          ? r.c.slice(0, 100)
          : Array.isArray(r.c)
            ? r.c
                .filter((v): v is string => typeof v === "string")
                .slice(0, 20)
                .map((v) => v.slice(0, 30))
                .join(", ")
            : "Unavailable";
      const providerId =
        typeof r.i === "string" || typeof r.i === "number"
          ? String(r.i).slice(0, 100)
          : "";
      const id = `${symbol}:${providerId || [time, price, size, exchange, condition].join(":")}`;
      result.set(id, {
        id,
        contract: symbol,
        type: c.type,
        strike: c.strike,
        expiry: c.expiry,
        time,
        price,
        size,
        premium,
        exchange,
        condition: condition || "None reported",
      });
    }
  }
  return [...result.values()].sort(
    (a, b) =>
      Date.parse(b.time) - Date.parse(a.time) || a.id.localeCompare(b.id),
  );
}
export function rankFlowPremium(trades: FlowTrade[]) {
  const result = new Map<
    string,
    { contract: string; premium: number; prints: number; size: number }
  >();
  for (const t of trades) {
    const r = result.get(t.contract) ?? {
      contract: t.contract,
      premium: 0,
      prints: 0,
      size: 0,
    };
    r.premium += t.premium;
    r.prints++;
    r.size += t.size;
    result.set(t.contract, r);
  }
  return [...result.values()].sort(
    (a, b) => b.premium - a.premium || a.contract.localeCompare(b.contract),
  );
}
