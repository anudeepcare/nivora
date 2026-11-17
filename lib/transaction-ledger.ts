export type TransactionType =
  | "deposit"
  | "withdrawal"
  | "buy"
  | "sell"
  | "dividend"
  | "fee"
  | "split";
export type Transaction = {
  id: string;
  account: string;
  date: string;
  type: TransactionType;
  symbol: string;
  quantity: number;
  price: number;
  amount: number;
  fee: number;
  currency: "USD";
};
const types: TransactionType[] = [
  "deposit",
  "withdrawal",
  "buy",
  "sell",
  "dividend",
  "fee",
  "split",
];
const day = (s: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(s) &&
  Number.isFinite(Date.parse(s)) &&
  new Date(s).toISOString().slice(0, 10) === s;
export function cleanTransactions(value: unknown): Transaction[] {
  if (!Array.isArray(value) || value.length > 5000)
    throw Error("A ledger can contain up to 5,000 transactions.");
  const ids = new Set<string>();
  return value.map((raw) => {
    if (!raw || typeof raw !== "object") throw Error("Invalid transaction.");
    const r = raw as Record<string, unknown>,
      str = (k: string) =>
        typeof r[k] === "string" ? (r[k] as string).trim() : "";
    const id = str("id"),
      account = str("account"),
      date = str("date"),
      type = str("type") as TransactionType,
      symbol = str("symbol").toUpperCase();
    if (!/^[A-Za-z0-9_.:-]{1,100}$/.test(id) || ids.has(id))
      throw Error(
        "Transaction IDs must be unique and contain letters, numbers, dots, colons, underscores or hyphens.",
      );
    ids.add(id);
    if (
      !account ||
      account.length > 80 ||
      !day(date) ||
      date > new Date().toISOString().slice(0, 10)
    )
      throw Error("Check the account and transaction date.");
    if (!types.includes(type) || str("currency") !== "USD")
      throw Error("Use a supported transaction type and USD currency.");
    const number = (k: string) => {
      const v = r[k];
      if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > 1e12)
        throw Error(`Invalid ${k}.`);
      return v;
    };
    const quantity = number("quantity"),
      price = number("price"),
      amount = number("amount"),
      fee = number("fee");
    if (
      ["buy", "sell", "split", "dividend"].includes(type) &&
      !/^[A-Z0-9][A-Z0-9./-]{0,19}$/.test(symbol)
    )
      throw Error("Enter the transaction symbol.");
    if (["buy", "sell"].includes(type) && (!(quantity > 0) || !(price > 0)))
      throw Error("Trades need positive quantity and price.");
    if (["buy", "sell"].includes(type) && amount !== 0)
      throw Error("Trades use quantity and price; leave amount empty.");
    if (
      ["deposit", "withdrawal", "fee", "dividend"].includes(type) &&
      (quantity !== 0 || price !== 0)
    )
      throw Error("Cash entries use amount; leave quantity and price empty.");
    if (
      type === "split" &&
      (!(quantity > 0) || fee !== 0 || amount !== 0 || price !== 0)
    )
      throw Error(
        "Splits use a positive new/old share ratio and no price, cash or fee.",
      );
    if (
      ["deposit", "withdrawal", "fee", "dividend"].includes(type) &&
      amount <= 0
    )
      throw Error("Cash entries need a positive amount.");
    if (["deposit", "withdrawal", "fee"].includes(type) && symbol)
      throw Error("Cash-only entries do not use a symbol.");
    return {
      id,
      account,
      date,
      type,
      symbol,
      quantity,
      price,
      amount,
      fee,
      currency: "USD",
    };
  });
}
/** Average-cost research ledger; not a tax-lot calculation. Input order breaks same-day ties. */
export function reconcileTransactions(rows: Transaction[]) {
  const accounts = new Map<string, number>(),
    positions = new Map<
      string,
      { account: string; symbol: string; quantity: number; basis: number }
    >(),
    errors: string[] = [];
  let realized = 0,
    income = 0,
    fees = 0,
    external = 0;
  for (const r of [...rows].sort((a, b) => a.date.localeCompare(b.date))) {
    let cash = accounts.get(r.account) ?? 0;
    const key = r.account + "|" + r.symbol,
      p = positions.get(key) ?? {
        account: r.account,
        symbol: r.symbol,
        quantity: 0,
        basis: 0,
      };
    if (r.type === "deposit") {
      cash += r.amount;
      external += r.amount;
    }
    if (r.type === "withdrawal") {
      cash -= r.amount;
      external -= r.amount;
    }
    if (r.type === "buy") {
      cash -= r.quantity * r.price + r.fee;
      p.quantity += r.quantity;
      p.basis += r.quantity * r.price + r.fee;
      positions.set(key, p);
    }
    if (r.type === "sell") {
      if (r.quantity > p.quantity + 1e-9) {
        errors.push(
          `${r.id}: ${r.account} sells more ${r.symbol} than recorded. Add opening purchases or correct the transaction.`,
        );
        continue;
      }
      const basis = p.quantity > 0 ? (p.basis * r.quantity) / p.quantity : 0;
      realized += r.quantity * r.price - r.fee - basis;
      cash += r.quantity * r.price - r.fee;
      p.quantity -= r.quantity;
      p.basis -= basis;
      if (p.quantity < 1e-9) {
        p.quantity = 0;
        p.basis = 0;
      }
      positions.set(key, p);
    }
    if (r.type === "split") {
      if (p.quantity <= 0) {
        errors.push(`${r.id}: split has no recorded ${r.symbol} shares.`);
        continue;
      }
      p.quantity *= r.quantity;
      positions.set(key, p);
    }
    if (r.type === "dividend") {
      cash += r.amount - r.fee;
      income += r.amount;
    }
    if (r.type === "fee") {
      cash -= r.amount;
      fees += r.amount;
    }
    if (["deposit", "withdrawal", "fee"].includes(r.type)) cash -= r.fee;
    fees += r.fee;
    accounts.set(r.account, cash);
    if (cash < -0.005)
      errors.push(
        `${r.id}: ${r.account} has negative recorded cash. Check missing deposits or margin borrowing.`,
      );
  }
  return {
    accounts: [...accounts].map(([account, cash]) => ({ account, cash })),
    positions: [...positions.values()].filter((p) => p.quantity > 0),
    realized,
    income,
    fees,
    external,
    errors,
  };
}
function csv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [],
    field = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        field += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (quoted) throw Error("Unclosed CSV quote.");
  row.push(field);
  if (row.some((x) => x.trim())) rows.push(row);
  return rows;
}
export function parseTransactionCsv(text: string) {
  if (text.length > 2000000) throw Error("CSV must be under 2 MB.");
  const table = csv(text.replace(/^\uFEFF/, "")),
    header = table.shift()?.map((s) => s.trim().toLowerCase()) ?? [];
  const required = [
    "id",
    "account",
    "date",
    "type",
    "symbol",
    "quantity",
    "price",
    "amount",
    "fee",
    "currency",
  ];
  if (
    required.some((k) => !header.includes(k)) ||
    new Set(header).size !== header.length
  )
    throw Error("Use the transaction template headers.");
  if (table.length > 5000)
    throw Error("Import up to 5,000 transactions at a time.");
  const rows: Transaction[] = [],
    errors: string[] = [],
    ids = new Set<string>();
  table.forEach((cells, i) => {
    try {
      if (cells.length !== header.length)
        throw Error("Column count does not match the header.");
      const raw: Record<string, unknown> = Object.fromEntries(
        header.map((k, j) => [k, cells[j].trim()]),
      );
      for (const k of ["quantity", "price", "amount", "fee"])
        raw[k] = raw[k] === "" ? 0 : Number(raw[k]);
      const r = cleanTransactions([raw])[0];
      if (ids.has(r.id)) throw Error("Duplicate transaction ID.");
      ids.add(r.id);
      rows.push(r);
    } catch (e) {
      errors.push(`Row ${i + 2}: ${(e as Error).message}`);
    }
  });
  return { rows, errors };
}
/** Each flow occurs at period end and is included in the supplied ending value. */
export function timeWeightedReturn(
  periods: { start: number; end: number; flow: number }[],
) {
  if (!periods.length) return null;
  let growth = 1;
  for (const p of periods) {
    if (
      ![p.start, p.end, p.flow].every(Number.isFinite) ||
      p.start <= 0 ||
      p.end - p.flow < 0
    )
      return null;
    growth *= (p.end - p.flow) / p.start;
  }
  return Math.round((growth - 1) * 1e10) / 1e8;
}
/** Annualized XIRR. Return null when cash flows lack one sign change or no unique bracket. */
export function moneyWeightedReturn(flows: { date: string; amount: number }[]) {
  if (
    flows.length < 2 ||
    flows.some((f) => !day(f.date) || !Number.isFinite(f.amount))
  )
    return null;
  const grouped = new Map<string, number>();
  for (const f of flows)
    grouped.set(f.date, (grouped.get(f.date) ?? 0) + f.amount);
  const rows = [...grouped]
    .sort(([a], [b]) => a.localeCompare(b))
    .filter(([, v]) => v !== 0);
  if (rows.length < 2) return null;
  let changes = 0;
  for (let i = 1; i < rows.length; i++)
    if (Math.sign(rows[i][1]) !== Math.sign(rows[i - 1][1])) changes++;
  if (changes !== 1) return null;
  const start = Date.parse(rows[0][0]);
  const npv = (r: number) =>
    rows.reduce(
      (s, [d, v]) =>
        s + v / Math.pow(1 + r, (Date.parse(d) - start) / 31536000000),
      0,
    );
  let lo = -0.9999,
    hi = 1000,
    a = npv(lo),
    b = npv(hi);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a * b > 0) return null;
  for (let i = 0; i < 160; i++) {
    const mid = (lo + hi) / 2,
      n = npv(mid);
    if (Math.abs(n) < 1e-8) return mid * 100;
    if (a * n > 0) {
      lo = mid;
      a = n;
    } else hi = mid;
  }
  return ((lo + hi) / 2) * 100;
}

export function mergeTransactionImport(
  current: Transaction[],
  incoming: Transaction[],
  mode: "append" | "replace",
) {
  const valid = cleanTransactions(incoming);
  if (mode === "replace") return { rows: valid, skipped: 0 };
  const ids = new Map(cleanTransactions(current).map((r) => [r.id, r]));
  let skipped = 0;
  for (const r of valid) {
    const old = ids.get(r.id);
    if (old) {
      if (JSON.stringify(old) !== JSON.stringify(r))
        throw Error(
          `Transaction ${r.id} differs from the saved entry. Export and correct the ledger, then choose Replace entire ledger.`,
        );
      skipped++;
    } else ids.set(r.id, r);
  }
  return { rows: cleanTransactions([...ids.values()]), skipped };
}
export function holdingDifferences(
  ledger: { symbol: string; quantity: number }[],
  holdings: { symbol: string; quantity: number; assetType: string }[],
) {
  const totals = (rows: { symbol: string; quantity: number }[]) => {
    const out = new Map<string, number>();
    for (const r of rows)
      out.set(r.symbol, (out.get(r.symbol) ?? 0) + r.quantity);
    return out;
  };
  const a = totals(ledger),
    b = totals(holdings.filter((p) => p.assetType !== "cash"));
  return [...new Set([...a.keys(), ...b.keys()])]
    .filter(
      (symbol) => Math.abs((a.get(symbol) ?? 0) - (b.get(symbol) ?? 0)) > 1e-6,
    )
    .map(
      (symbol) =>
        `${symbol}: ledger ${(a.get(symbol) ?? 0).toLocaleString()} units; holdings ${(b.get(symbol) ?? 0).toLocaleString()}`,
    );
}
