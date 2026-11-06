/** Shadow-only comparison. It is deliberately incapable of changing visible research state. */

import { researchToValuationInput } from "./valuation-adapter.ts";

export type ShadowRecord = {
  symbol: string;
  observedAt: string;
  currentStatus: string | null;
  currentPace: string | null;
  candidateStatus: string | null;
  candidateTraceId: string | null;
  differences: Array<{ field: string; current: unknown; candidate: unknown }>;
  visibleDecision: string | null;
};

export function compareShadow(current: unknown, candidate: unknown): ShadowRecord {
  const oldValue = current && typeof current === "object" ? current as Record<string, any> : {};
  const newValue = candidate && typeof candidate === "object" ? candidate as Record<string, any> : {};
  const currentStatus = typeof oldValue.status === "string" ? oldValue.status : typeof oldValue.action === "string" ? oldValue.action : null;
  const currentPace = typeof oldValue.pace === "string" ? oldValue.pace : oldValue.pace && typeof oldValue.pace.confirmed === "string" ? oldValue.pace.confirmed : null;
  const differences: ShadowRecord["differences"] = [];
  for (const field of ["status", "price", "family", "baseValue"]) {
    const candidateField = field === "baseValue" ? newValue.cases?.base?.value : newValue[field];
    const currentField = oldValue[field] ?? (field === "status" ? currentStatus : undefined);
    if (currentField !== candidateField && (currentField !== undefined || candidateField !== undefined)) differences.push({ field, current: currentField ?? null, candidate: candidateField ?? null });
  }
  return {
    symbol: typeof oldValue.symbol === "string" ? oldValue.symbol : typeof newValue.symbol === "string" ? newValue.symbol : "",
    observedAt: new Date().toISOString(),
    currentStatus,
    currentPace,
    candidateStatus: typeof newValue.status === "string" ? newValue.status : null,
    candidateTraceId: typeof newValue.traceId === "string" ? newValue.traceId : null,
    differences,
    visibleDecision: currentStatus,
  };
}

export function valuationShadowEnabled(env: Record<string, unknown> = {}): boolean {
  return env.AURYN_VALUATION_SHADOW === "1";
}

export function createShadowRecord(research: unknown, candidate: unknown): ShadowRecord {
  const snapshot = researchToValuationInput(research);
  const source = research && typeof research === "object" ? research as Record<string, any> : {};
  return compareShadow({ symbol: snapshot.symbol, status: source.status ?? source.action ?? null, pace: source.pace }, candidate);
}

