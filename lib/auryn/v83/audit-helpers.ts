export function finiteNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function blockedDecisionPriceLeak(researchAllowed: boolean, rawDecisionPrice: unknown): boolean {
  return !researchAllowed && finiteNumberOrNull(rawDecisionPrice) !== null;
}

export function canonicalAnalyzeGapPct(canonical: unknown, analyzed: unknown): number | null {
  const c = finiteNumberOrNull(canonical);
  const a = finiteNumberOrNull(analyzed);
  if (c === null || a === null || Math.abs(c) < 0.01) return null;
  const gap = Math.abs(a - c) / Math.max(0.01, Math.abs(c)) * 100;
  return Math.round(gap * 100) / 100;
}

export function isCanonicalAnalyzeGapCritical(
  researchAllowed: boolean,
  canonical: unknown,
  analyzed: unknown,
  thresholdPct = 3,
): boolean {
  if (!researchAllowed) return false;
  const gap = canonicalAnalyzeGapPct(canonical, analyzed);
  return gap !== null && gap > thresholdPct;
}
