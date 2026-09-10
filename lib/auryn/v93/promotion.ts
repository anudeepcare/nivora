import type {V93Disposition,V93FeatureMetric,V93Policy,V93PromotionAssessment} from './domain';

export function assessV93Promotion(m:V93FeatureMetric,qValue:number,policy:V93Policy):V93PromotionAssessment{
  const checks={
    evidence:m.totalN>0,
    sample:m.totalN>=policy.minTotalN,
    oosSample:m.oosN>=policy.minOosN,
    walkForward:m.validFoldCount===policy.foldCount&&m.folds.length===policy.foldCount&&m.folds.every(f=>f.testN>=policy.minFoldTestN),
    oosAlpha:m.oosAvgEdgePct!=null&&m.oosAvgEdgePct>0,
    costStress:m.costStressOosAvgEdgePct!=null&&m.costStressOosAvgEdgePct>0,
    bootstrap:m.oosConfidence95.iterations>0&&m.oosConfidence95.low>0,
    informationCoefficient:m.oosInformationCoefficient!=null&&m.oosInformationCoefficient>=policy.minOosIC,
    hitRate:m.oosHitRatePct!=null&&m.oosHitRatePct>=policy.minOosHitRatePct,
    foldStability:m.positiveFoldPct!=null&&m.positiveFoldPct>=policy.minPositiveFoldPct,
    regimeBreadth:m.regimesCovered>=policy.minRegimes,
    regimeStability:m.regimePositivePct!=null&&m.regimePositivePct>=policy.minRegimePositivePct,
    archetypeBreadth:m.archetypesCovered>=policy.minArchetypes,
    archetypeStability:m.archetypePositivePct!=null&&m.archetypePositivePct>=policy.minArchetypePositivePct,
    sectorBreadth:m.sectorsCovered>=policy.minSectors,
    sectorStability:m.sectorPositivePct!=null&&m.sectorPositivePct>=policy.minSectorPositivePct,
    drawdown:m.avgMaxDrawdownPct!=null&&m.avgMaxDrawdownPct>=policy.minAvgDrawdownPct,
    falseDiscovery:Number.isFinite(qValue)&&qValue<=policy.fdrAlpha,
  };
  const messages:Record<keyof typeof checks,string>={
    evidence:'No usable point-in-time evidence.',
    sample:`Need at least ${policy.minTotalN} total observations.`,
    oosSample:`Need at least ${policy.minOosN} OOS observations.`,
    walkForward:`Need ${policy.foldCount} valid purged walk-forward folds with at least ${policy.minFoldTestN} OOS observations each.`,
    oosAlpha:'OOS benchmark-relative alpha after stated costs is not positive.',
    costStress:`OOS alpha does not survive ${policy.costStressMultiplier}x transaction-cost stress.`,
    bootstrap:'OOS bootstrap 95% confidence interval does not remain above zero.',
    informationCoefficient:`OOS information coefficient is below ${policy.minOosIC}.`,
    hitRate:`OOS hit rate is below ${policy.minOosHitRatePct}%.`,
    foldStability:`Positive walk-forward fold rate is below ${policy.minPositiveFoldPct}%.`,
    regimeBreadth:`Need evidence across at least ${policy.minRegimes} regimes.`,
    regimeStability:`Positive regime stability is below ${policy.minRegimePositivePct}%.`,
    archetypeBreadth:`Need evidence across at least ${policy.minArchetypes} archetypes.`,
    archetypeStability:`Positive archetype stability is below ${policy.minArchetypePositivePct}%.`,
    sectorBreadth:`Need evidence across at least ${policy.minSectors} sectors.`,
    sectorStability:`Positive sector stability is below ${policy.minSectorPositivePct}%.`,
    drawdown:`Average forward max drawdown breaches the ${policy.minAvgDrawdownPct}% guardrail or is unavailable.`,
    falseDiscovery:`Global BH q-value exceeds ${policy.fdrAlpha}.`,
  };
  const blockers=(Object.keys(checks) as Array<keyof typeof checks>).filter(k=>!checks[k]).map(k=>messages[k]);
  return{eligible:blockers.length===0,checks,blockers};
}

export function dispositionFor(m:V93FeatureMetric,p:V93PromotionAssessment):V93Disposition{
  const c=p.checks;
  if(!c.evidence)return'REJECTED_NO_EVIDENCE';
  if(!c.sample||!c.oosSample)return'REJECTED_SAMPLE';
  if(!c.walkForward)return'REJECTED_WALK_FORWARD';
  if(!c.oosAlpha||!c.bootstrap||!c.informationCoefficient||!c.hitRate)return'REJECTED_OOS';
  if(!c.costStress)return'REJECTED_COST';
  if(!c.foldStability||!c.regimeBreadth||!c.regimeStability||!c.archetypeBreadth||!c.archetypeStability||!c.sectorBreadth||!c.sectorStability||!c.drawdown)return'REJECTED_ROBUSTNESS';
  if(!c.falseDiscovery)return'REJECTED_FDR';
  return'V94_CANDIDATE';
}
