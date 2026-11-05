import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { ExposureBoard } from "./exposure-board";
export type ExposureObservation = {
  price: number;
  strike?: number;
  gex: number | null;
  observedAt: string;
  fingerprint: string;
  universe?: string;
  reference?: string;
};
function stable(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(stable).join(",") + "]";
  return (
    "{" +
    Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => JSON.stringify(k) + ":" + stable(v))
      .join(",") +
    "}"
  );
}
export function sealCheckpoint<T>(snapshot: T, user: string, key: string) {
  if (key.length < 32) throw Error("A server signing key is required.");
  return {
    kind: "options-v1",
    snapshot,
    signature: createHmac("sha256", key)
      .update(user + "\n" + stable(snapshot))
      .digest("hex"),
  };
}
export function verifyCheckpoint(
  value: unknown,
  user: string,
  key: string,
): boolean {
  try {
    const v = value as ReturnType<typeof sealCheckpoint>;
    if (
      key.length < 32 ||
      v?.kind !== "options-v1" ||
      !/^[a-f0-9]{64}$/.test(v.signature) ||
      !v.snapshot
    )
      return false;
    const expected = sealCheckpoint(v.snapshot, user, key).signature;
    return timingSafeEqual(Buffer.from(expected), Buffer.from(v.signature));
  } catch {
    return false;
  }
}
export function compactCheckpoint(board: ExposureBoard): ExposureBoard {
  const expiries = [...new Set(board.cells.map((c) => c.expiry))]
      .sort()
      .slice(0, 6),
    strikes = [...new Set(board.cells.map((c) => c.strike))]
      .sort((a, b) => Math.abs(a - board.spot) - Math.abs(b - board.spot))
      .slice(0, 40);
  return {
    ...board,
    universe: createHash("sha256").update(board.universe).digest("hex"),
    cells: board.cells
      .filter((c) => expiries.includes(c.expiry) && strikes.includes(c.strike))
      .slice(0, 240),
  };
}
export function evaluateExposureRule(
  rule: {
    type: string;
    threshold: number | null;
    enabled: boolean;
    symbol: string;
    marginPercent?: number;
  },
  previous: ExposureObservation | null,
  current: ExposureObservation,
  now = Date.now(),
) {
  if (
    !rule.enabled ||
    !previous ||
    rule.threshold === null ||
    ![current.price, previous.price, rule.threshold].every(Number.isFinite) ||
    rule.threshold <= 0 ||
    current.price <= 0 ||
    previous.price <= 0 ||
    !current.fingerprint ||
    previous.fingerprint === current.fingerprint ||
    previous.reference !== current.reference
  )
    return null;
  const time = Date.parse(current.observedAt),
    priorTime = Date.parse(previous.observedAt);
  if (
    !Number.isFinite(time) ||
    !Number.isFinite(priorTime) ||
    time > now + 60000 ||
    time <= priorTime ||
    now - time > 4 * 86400000 ||
    time - priorTime > 7 * 86400000
  )
    return null;
  if (rule.type === "exposure-change") {
    if (
      current.gex === null ||
      previous.gex === null ||
      ![current.gex, previous.gex].every(Number.isFinite) ||
      previous.gex === 0 ||
      !current.universe ||
      current.universe !== previous.universe ||
      current.strike !== previous.strike
    )
      return null;
    const rebased = previous.gex * (current.price / previous.price) ** 2;
    const change =
      ((Math.abs(current.gex) - Math.abs(rebased)) / Math.abs(rebased)) * 100;
    if (!Number.isFinite(rebased) || rebased === 0 || !Number.isFinite(change))
      return null;
    if (Math.abs(change) < rule.threshold) return null;
    return {
      title: `${rule.symbol}: exposure concentration changed`,
      detail: `Absolute modeled exposure changed ${change.toFixed(1)}% after rebasing the earlier input to the latest underlying price. Source observations ${previous.observedAt} → ${current.observedAt}; not a live-flow or direction signal.`,
    };
  }
  const strike = current.strike ?? rule.threshold,
    previousStrike = previous.strike ?? rule.threshold;
  if (strike !== previousStrike || strike <= 0) return null;
  const distance = Math.abs(current.price / strike - 1) * 100,
    oldDistance = Math.abs(previous.price / strike - 1) * 100;
  const margin = rule.marginPercent ?? 0.5;
  if (!Number.isFinite(margin) || margin < 0.01 || margin > 10) return null;
  const hit =
    rule.type === "exposure-approach"
      ? distance <= margin && oldDistance > margin
      : rule.type === "exposure-cross"
        ? (previous.price < strike && current.price >= strike) ||
          (previous.price > strike && current.price <= strike)
        : false;
  return hit
    ? {
        title: `${rule.symbol}: ${rule.type === "exposure-approach" ? "approaching" : "crossed"} exposure reference`,
        detail: `Observed underlying ${current.price.toFixed(2)} near reference ${strike.toFixed(2)}. Checked between dated snapshots, not a guaranteed intraday tap. Exposure is modeled, not observed dealer inventory.`,
      }
    : null;
}
