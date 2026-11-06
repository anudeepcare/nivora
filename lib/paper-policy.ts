export function canManagePaper(
  user: {
    id: string;
    app_metadata?: Record<string, unknown>;
    user_metadata?: unknown;
  },
  config: { ownerId?: string; adminIds?: string },
) {
  const admin =
    user.app_metadata?.role === "admin" ||
    (Array.isArray(user.app_metadata?.roles) &&
      user.app_metadata.roles.includes("admin")) ||
    (config.adminIds ?? "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .includes(user.id);
  return !!config.ownerId && config.ownerId === user.id && admin;
}
export type PaperPlan = {
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  limitPrice: number;
  maxPositionPct: number;
  minimumCash: number;
  enabled: boolean;
};
export function cleanPaperPlan(body: Record<string, unknown>): PaperPlan {
  const p = {
    symbol: String(body.symbol ?? "")
      .trim()
      .toUpperCase(),
    side: body.side === "sell" ? ("sell" as const) : ("buy" as const),
    quantity: Number(body.quantity),
    limitPrice: Number(body.limitPrice),
    maxPositionPct: Number(body.maxPositionPct),
    minimumCash: Number(body.minimumCash),
    enabled: body.enabled === true,
  };
  if (
    !/^[A-Z][A-Z0-9.-]{0,9}$/.test(p.symbol) ||
    !["buy", "sell"].includes(String(body.side)) ||
    !Number.isInteger(p.quantity) ||
    p.quantity < 1 ||
    p.quantity > 10000 ||
    !Number.isFinite(p.limitPrice) ||
    p.limitPrice <= 0 ||
    p.limitPrice > 100000 ||
    !Number.isFinite(p.maxPositionPct) ||
    p.maxPositionPct < 1 ||
    p.maxPositionPct > 50 ||
    !Number.isFinite(p.minimumCash) ||
    p.minimumCash < 0
  )
    throw Error(
      "Use a US ticker, whole shares, a positive limit price and a 1–50% position cap.",
    );
  p.limitPrice = Math.round(p.limitPrice * 100) / 100;
  if (p.limitPrice <= 0) throw Error("Limit price must be at least one cent.");
  return p;
}
export function paperChecks(
  p: PaperPlan,
  s: {
    marketOpen: boolean;
    tradable: boolean;
    accountActive: boolean;
    cash: number;
    equity: number;
    heldQuantity: number;
    heldValue: number;
    price: number;
    quoteAt: string;
    now: string;
    openOrders: number;
  },
) {
  const errors: string[] = [];
  const age = Date.parse(s.now) - Date.parse(s.quoteAt);
  if (!p.enabled) errors.push("Plan is paused.");
  if (!s.marketOpen) errors.push("Regular market session is closed.");
  if (!s.tradable)
    errors.push("This asset is not an active, tradable US equity.");
  if (!s.accountActive)
    errors.push("The paper account is not active or trading is blocked.");
  if (
    ![s.cash, s.equity, s.heldQuantity, s.heldValue, s.price].every(
      Number.isFinite,
    ) ||
    s.equity <= 0 ||
    s.price <= 0
  )
    errors.push("Account or price evidence is incomplete.");
  if (!Number.isFinite(age) || age < -60000 || age > 15 * 60_000)
    errors.push("A quote within the last 15 minutes is required.");
  if (s.openOrders > 0)
    errors.push("Reconcile existing paper orders before submitting another.");
  if (Math.abs(p.limitPrice / s.price - 1) > 0.05)
    errors.push("Limit price is more than 5% from the verified quote.");
  const amount = p.quantity * p.limitPrice;
  if (p.side === "buy") {
    if (s.cash - amount < p.minimumCash)
      errors.push("The order would breach the cash reserve.");
    if (((s.heldValue + amount) / s.equity) * 100 > p.maxPositionPct)
      errors.push("The order would breach the position cap.");
  } else if (s.heldQuantity < p.quantity)
    errors.push("Selling more shares than held is disabled.");
  return { allowed: errors.length === 0, errors, notional: amount };
}
export const terminalPaperStatus = (s: string) =>
  [
    "filled",
    "canceled",
    "expired",
    "rejected",
    "done_for_day",
    "replaced",
  ].includes(s);
export async function afterPaperClaim<R, T>(
  claim: () => Promise<R>,
  validate: () => Promise<{ allowed: boolean; errors: string[] }>,
  submit: (run: R) => Promise<T>,
  block: (run: R, errors: string[]) => Promise<T>,
): Promise<T> {
  const run = await claim();
  let check;
  try {
    check = await validate();
  } catch {
    check = {
      allowed: false,
      errors: [
        "Fresh account verification failed after reservation. No order was submitted.",
      ],
    };
  }
  return check.allowed ? submit(run) : block(run, check.errors);
}
export async function scheduledCandidates<T>(
  ids: string[],
  execute: (id: string) => Promise<T>,
  maximum = 3,
) {
  const result: ({ id: string; value: T } | { id: string; error: string })[] =
    [];
  for (const id of ids.slice(0, maximum)) {
    try {
      const value = await execute(id);
      result.push({ id, value });
      break;
    } catch (e) {
      result.push({
        id,
        error: e instanceof Error ? e.message : "Pre-submission check failed",
      });
    }
  }
  return result;
}
