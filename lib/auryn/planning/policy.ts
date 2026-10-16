/** Research allocation only. These thresholds are versioned heuristics, not calibrated return forecasts. */
export const PLANNING_POLICY_VERSION = 'auryn-planning-2026-10-16.1';
export const MULTIPLIERS = [0, 0.5, 1, 2, 4] as const;
export type Multiplier = typeof MULTIPLIERS[number];
export type PlanningEvidence = {
  snapshotId: string; knownAt: string; thesis: 'intact' | 'uncertain' | 'broken' | 'unknown';
  valuation: 'supported' | 'neutral' | 'expensive' | 'unknown'; fundingRisk: 'normal' | 'elevated' | 'critical' | 'unknown';
  evidenceReady: boolean; tacticalSetup: 'confirmed' | 'weak' | 'unknown'; references: string[];
};
export type AllocationPlan = {
  contribution: number; requestedMultiplier: Multiplier; strategy: 'recurring' | 'tactical';
  cadence: 'weekly' | 'monthly' | 'quarterly'; budgetCap: number; cashAvailable: number;
  portfolioValue: number | null; positionValue: number | null; maxPositionPct: number;
  reviewDate: string; paused: boolean; pauseConditions: string[]; asOf: string;
};
export function previewAllocation(plan: AllocationPlan, evidence: PlanningEvidence) {
  const reasons: string[] = [];
  let multiplier: number = plan.requestedMultiplier;
  const valid = [plan.contribution, plan.budgetCap, plan.cashAvailable, plan.portfolioValue, plan.positionValue, plan.maxPositionPct].every(v => typeof v === 'number' && Number.isFinite(v) && v >= 0)
    && plan.contribution > 0 && plan.maxPositionPct <= 100 && plan.portfolioValue! >= plan.positionValue! + plan.cashAvailable
    && MULTIPLIERS.includes(plan.requestedMultiplier) && ['recurring','tactical'].includes(plan.strategy) && ['weekly','monthly','quarterly'].includes(plan.cadence)
    && Number.isFinite(Date.parse(plan.asOf)) && Number.isFinite(Date.parse(plan.reviewDate));
  const pause = (reason: string) => {multiplier = 0; reasons.push(reason);};
  if (!['intact','uncertain','broken','unknown'].includes(evidence.thesis) || !['supported','neutral','expensive','unknown'].includes(evidence.valuation) || !['normal','elevated','critical','unknown'].includes(evidence.fundingRisk) || !['confirmed','weak','unknown'].includes(evidence.tacticalSetup)) pause('Unrecognized evidence state; review the source before allocating.');
  if (!valid) pause('Complete valid contribution, cash, portfolio values, allocation cap and review date.');
  if (plan.paused || plan.requestedMultiplier === 0) pause('You paused this plan.');
  if (plan.reviewDate.slice(0,10) < plan.asOf.slice(0,10)) pause('The review date has passed. Review before allocating.');
  if (!evidence.evidenceReady || !evidence.snapshotId || !evidence.references.length || !Number.isFinite(Date.parse(evidence.knownAt)) || Date.parse(evidence.knownAt) > Date.parse(plan.asOf)) pause('Current, attributable evidence known by the planning time is required.');
  if (evidence.thesis !== 'intact') pause(`Business thesis is ${evidence.thesis}; allocation is paused.`);
  if (evidence.fundingRisk === 'critical' || evidence.fundingRisk === 'unknown') pause(`Funding risk is ${evidence.fundingRisk}; review financing first.`);
  if (evidence.valuation === 'unknown') pause('Valuation support is unavailable. A declining price is insufficient.');
  if (plan.strategy === 'tactical' && evidence.tacticalSetup !== 'confirmed') pause('Tactical entries require a confirmed setup. This does not invalidate the business thesis.');
  if (multiplier > 0 && evidence.valuation === 'neutral') {multiplier = Math.min(multiplier, 1); reasons.push('Neutral valuation caps the policy at the planned 1x contribution.');}
  if (multiplier > 0 && evidence.valuation === 'expensive') {multiplier = Math.min(multiplier, 0.5); reasons.push('Expensive valuation reduces the policy to at most 0.5x.');}
  if (multiplier > 0 && evidence.fundingRisk === 'elevated') {multiplier = Math.min(multiplier, 0.5); reasons.push('Elevated funding risk reduces the policy to at most 0.5x.');}
  if (multiplier > 0 && !reasons.length) reasons.push('Intact thesis, supporting valuation and normal funding risk permit the selected research policy.');
  const requestedAmount = valid ? plan.contribution * plan.requestedMultiplier : 0;
  const exposureRoom = valid ? Math.max(0, plan.portfolioValue! * plan.maxPositionPct / 100 - plan.positionValue!) : 0;
  const policyAmount = valid ? plan.contribution * multiplier : 0;
  // Round down so fractional cents never exceed a hard cap.
  const amount = Math.floor(Math.max(0, Math.min(policyAmount, plan.cashAvailable || 0, plan.budgetCap || 0, exposureRoom)) * 100 + 1e-8) / 100;
  if (policyAmount > plan.cashAvailable) reasons.push('Available recorded cash caps this preview; future contributions are not borrowed.');
  if (policyAmount > plan.budgetCap) reasons.push('Your per-period budget caps this preview.');
  if (policyAmount > exposureRoom) reasons.push('The aggregate position exposure cap limits this preview.');
  return {policyVersion: PLANNING_POLICY_VERSION, requestedAmount, policyMultiplier: multiplier, effectiveMultiplier: amount / (plan.contribution || 1), amount,
    exposureRoom, reasons, experimental: true as const, execution: 'PREVIEW_ONLY' as const, snapshotId: evidence.snapshotId};
}

/** Carries a proposal to the existing manual paper review. It grants no execution eligibility. */
export function paperReviewHref(input:{symbol:string;amount:number;snapshotId:string;policyVersion:string}):string|null {
  if(!/^[A-Z][A-Z0-9.-]{0,9}$/.test(input.symbol)||!Number.isFinite(input.amount)||input.amount<=0||!input.snapshotId||!input.policyVersion)return null;
  return '/trading-lab?'+new URLSearchParams({view:'manual',planSymbol:input.symbol,planAmount:String(input.amount),planSnapshot:input.snapshotId,planPolicy:input.policyVersion}).toString();
}
