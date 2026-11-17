import type { OptionContract } from "./options-analysis";
export type SimulationExit = {
  quantity: number;
  premium: number;
  observed: string;
  at: string;
};
export type SimulationPosition = {
  id: string;
  symbol: string;
  contract: OptionContract;
  quantity: number;
  remaining: number;
  entryPremium: number;
  openedAt: string;
  notes: string;
  exits: SimulationExit[];
};
export type SimulationLedger = {
  version: 1;
  initialCash: 100000;
  cash: number;
  positions: SimulationPosition[];
};
const DAY = 86400000;
const MAX_BYTES = 19000;
const serializedSize = (value: unknown) =>
  new TextEncoder().encode(JSON.stringify(value)).length;
const finite = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
const money = (v: number) => Math.round(v * 1e8) / 1e8;
function dateTime(v: unknown): number | null {
  if (
    typeof v !== "string" ||
    !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z)?$/.test(v)
  )
    return null;
  const t = Date.parse(v.length === 10 ? v + "T00:00:00Z" : v);
  return Number.isFinite(t) &&
    new Date(t).toISOString().slice(0, 10) === v.slice(0, 10)
    ? t
    : null;
}
function validContract(c: OptionContract): boolean {
  const occ =
    c && typeof c.id === "string"
      ? c.id.match(/^([A-Z.]+)(\d{6})([CP])(\d{8})$/)
      : null;
  if (
    !occ ||
    occ[2] !== c.expiry?.replaceAll("-", "").slice(2) ||
    occ[3] !== (c.type === "call" ? "C" : "P") ||
    Number(occ[4]) / 1000 !== c.strike
  )
    return false;
  return (
    !!c &&
    typeof c.id === "string" &&
    /^[A-Z.]+\d{6}[CP]\d{8}$/.test(c.id) &&
    ["call", "put"].includes(c.type) &&
    finite(c.strike) &&
    c.strike > 0 &&
    c.standard === true &&
    c.multiplier === 100 &&
    dateTime(c.expiry) !== null &&
    c.expiry.length === 10 &&
    dateTime(c.observed) !== null &&
    [
      c.bid,
      c.ask,
      c.oi,
      c.volume,
      c.iv,
      c.delta,
      c.gamma,
      c.theta,
      c.vega,
    ].every((v) => v === null || finite(v))
  );
}
export function simulationQuoteIssue(
  c: OptionContract,
  now = Date.now(),
): string | null {
  if (!validContract(c))
    return "Only standard 100-share calls and puts with valid source dates are supported.";
  const t = dateTime(c.observed)!;
  if (t > now) return "The quote is dated in the future.";
  if (Math.floor(now / DAY) - Math.floor(t / DAY) > 3)
    return "The quote is older than three calendar days.";
  if (Date.parse(c.expiry + "T21:00:00Z") <= now)
    return "Expired positions need a verified closing price dated at expiry. Settlement is pending.";
  if (
    c.bid === null ||
    c.ask === null ||
    c.bid < 0 ||
    c.ask <= 0 ||
    c.bid > c.ask
  )
    return "A valid bid and ask are required.";
  return null;
}
export function newSimulationLedger(): SimulationLedger {
  return { version: 1, initialCash: 100000, cash: 100000, positions: [] };
}
function quantity(q: number) {
  if (!Number.isInteger(q) || q < 1 || q > 100)
    throw Error("Choose a whole number of contracts from 1 to 100.");
}
function bounded(x: SimulationLedger): SimulationLedger {
  if (
    x.positions.length > 15 ||
    x.positions.reduce((n, p) => n + p.exits.length, 0) > 45 ||
    serializedSize(x) >= MAX_BYTES
  )
    throw Error(
      "This simulation reached its 15-position, 45-exit, or 19 KB save limit. The last action was not applied.",
    );
  return x;
}
function sameContract(a: OptionContract, b: OptionContract) {
  return (
    a.id === b.id &&
    a.type === b.type &&
    a.strike === b.strike &&
    a.expiry === b.expiry &&
    a.multiplier === b.multiplier &&
    a.standard === b.standard
  );
}
function snapshot(c: OptionContract): OptionContract {
  return {
    id: c.id,
    type: c.type,
    strike: c.strike,
    expiry: c.expiry,
    observed: c.observed,
    bid: c.bid,
    ask: c.ask,
    oi: c.oi,
    volume: c.volume,
    iv: c.iv,
    delta: c.delta,
    gamma: c.gamma,
    theta: c.theta,
    vega: c.vega,
    multiplier: c.multiplier,
    standard: c.standard,
  };
}
export function openSimulation(
  ledger: SimulationLedger,
  input: {
    contract: OptionContract;
    symbol: string;
    quantity: number;
    notes: string;
  },
  now = Date.now(),
): SimulationLedger {
  quantity(input.quantity);
  const issue = simulationQuoteIssue(input.contract, now);
  if (issue) throw Error(issue);
  if (
    !/^[A-Z][A-Z0-9.-]{0,14}$/.test(input.symbol) ||
    typeof input.notes !== "string" ||
    input.notes.length > 500
  )
    throw Error("Use a valid symbol and notes of at most 500 characters.");
  const cost = money(input.contract.ask! * 100 * input.quantity);
  if (cost > ledger.cash)
    throw Error(
      "Insufficient simulated cash. These positions must be fully paid.",
    );
  const at = new Date(now).toISOString();
  const id = at + "-" + ledger.positions.length;
  return bounded({
    ...ledger,
    cash: money(ledger.cash - cost),
    positions: [
      ...ledger.positions,
      {
        id,
        symbol: input.symbol,
        contract: snapshot(input.contract),
        quantity: input.quantity,
        remaining: input.quantity,
        entryPremium: input.contract.ask!,
        openedAt: at,
        notes: input.notes,
        exits: [],
      },
    ],
  });
}
export function closeSimulation(
  ledger: SimulationLedger,
  id: string,
  q: number,
  quote: OptionContract,
  now = Date.now(),
): SimulationLedger {
  quantity(q);
  const p = ledger.positions.find((p) => p.id === id);
  if (!p || q > p.remaining)
    throw Error("Close quantity exceeds the open position.");
  if (!sameContract(p.contract, quote))
    throw Error("A current quote for this exact contract is required.");
  const issue = simulationQuoteIssue(quote, now);
  if (issue) throw Error(issue);
  if (dateTime(quote.observed)! < dateTime(p.contract.observed)!)
    throw Error("The close quote predates entry.");
  return bounded({
    ...ledger,
    cash: money(ledger.cash + q * 100 * quote.bid!),
    positions: ledger.positions.map((row) =>
      row.id === id
        ? {
            ...row,
            remaining: row.remaining - q,
            exits: [
              ...row.exits,
              {
                quantity: q,
                premium: quote.bid!,
                observed: quote.observed,
                at: new Date(now).toISOString(),
              },
            ],
          }
        : row,
    ),
  });
}
export function simulationSummary(
  ledger: SimulationLedger,
  quotes: OptionContract[],
  now = Date.now(),
) {
  let realized = 0,
    marked = 0,
    marketValue = 0,
    unpriced = 0,
    wins = 0,
    closedPositions = 0;
  for (const p of ledger.positions) {
    const pnl = p.exits.reduce(
      (n, e) => n + (e.premium - p.entryPremium) * 100 * e.quantity,
      0,
    );
    realized += pnl;
    if (p.remaining === 0) {
      closedPositions++;
      if (pnl > 0) wins++;
      continue;
    }
    const q = quotes
      .filter(
        (q) =>
          sameContract(q, p.contract) &&
          !simulationQuoteIssue(q, now) &&
          dateTime(q.observed)! >= dateTime(p.contract.observed)!,
      )
      .sort((a, b) => dateTime(b.observed)! - dateTime(a.observed)!)[0];
    if (!q) {
      unpriced++;
      continue;
    }
    marketValue += q.bid! * 100 * p.remaining;
    marked += (q.bid! - p.entryPremium) * 100 * p.remaining;
  }
  return {
    realized: money(realized),
    marked: unpriced ? null : money(marked),
    marketValue: unpriced ? null : money(marketValue),
    equity: unpriced ? null : money(ledger.cash + marketValue),
    unpriced,
    closedPositions,
    winRate: closedPositions ? wins / closedPositions : null,
  };
}
/** Untrusted stored data is replayed; no client-supplied balance is trusted. */
export function cleanSimulationLedger(raw: unknown): SimulationLedger | null {
  try {
    if (!raw || typeof raw !== "object" || serializedSize(raw) >= MAX_BYTES)
      return null;
    const x = raw as SimulationLedger;
    if (
      x.version !== 1 ||
      x.initialCash !== 100000 ||
      !finite(x.cash) ||
      !Array.isArray(x.positions) ||
      x.positions.length > 15
    )
      return null;
    const ids = new Set<string>();
    let cash = 100000;
    const positions: SimulationPosition[] = [];
    for (const p of x.positions) {
      if (
        !p ||
        typeof p.id !== "string" ||
        p.id.length > 80 ||
        ids.has(p.id) ||
        !validContract(p.contract) ||
        simulationQuoteIssue(p.contract, dateTime(p.openedAt) ?? NaN) ||
        typeof p.symbol !== "string" ||
        !/^[A-Z][A-Z0-9.-]{0,14}$/.test(p.symbol) ||
        typeof p.notes !== "string" ||
        p.notes.length > 500 ||
        dateTime(p.openedAt) === null ||
        dateTime(p.openedAt)! > Date.now() ||
        !Array.isArray(p.exits) ||
        p.entryPremium !== p.contract.ask
      )
        return null;
      ids.add(p.id);
      quantity(p.quantity);
      let remaining = p.quantity;
      cash -= p.quantity * 100 * p.entryPremium;
      let last = dateTime(p.openedAt)!;
      for (const e of p.exits) {
        quantity(e.quantity);
        if (
          !finite(e.premium) ||
          e.premium < 0 ||
          dateTime(e.observed) === null ||
          dateTime(e.at) === null ||
          dateTime(e.at)! > Date.now() ||
          dateTime(e.at)! < last ||
          dateTime(e.observed)! > dateTime(e.at)! ||
          dateTime(e.observed)! < dateTime(p.contract.observed)! ||
          Math.floor(dateTime(e.at)! / DAY) -
            Math.floor(dateTime(e.observed)! / DAY) >
            3 ||
          dateTime(e.at)! >= Date.parse(p.contract.expiry + "T21:00:00Z")
        )
          return null;
        remaining -= e.quantity;
        cash += e.quantity * 100 * e.premium;
        last = dateTime(e.at)!;
        if (remaining < 0) return null;
      }
      if (remaining !== p.remaining) return null;
      positions.push({
        id: p.id,
        symbol: p.symbol,
        contract: snapshot(p.contract),
        quantity: p.quantity,
        remaining,
        entryPremium: p.entryPremium,
        openedAt: p.openedAt,
        notes: p.notes,
        exits: p.exits.map((e) => ({
          quantity: e.quantity,
          premium: e.premium,
          observed: e.observed,
          at: e.at,
        })),
      });
    }
    if (money(cash) !== x.cash || cash < 0) return null;
    return bounded({
      version: 1,
      initialCash: 100000,
      cash: x.cash,
      positions,
    });
  } catch {
    return null;
  }
}
