import type {PrimaryInvestmentAction} from '../v4/domain';
import type {ActionLadderAssessment,ExactOutcomeObservation,ModelProofSummary,PromotionGate} from './domain';

const ACTION_ORDER:PrimaryInvestmentAction[]=['STRONG_BUY','BUY','HOLD','REDUCE','SELL'];
const finite=(x:unknown):x is number=>typeof x==='number'&&Number.isFinite(x);
const round=(x:number,d=2)=>+x.toFixed(d);

export function assessActionLadder(rows:ExactOutcomeObservation[]):ActionLadderAssessment{
  const buckets=ACTION_ORDER.map(action=>{
    const xs=rows.filter(r=>r.action===action&&finite(r.alphaPct));
    return{action,n:xs.length,avgAlphaPct:xs.length?round(xs.reduce((s,r)=>s+r.alphaPct,0)/xs.length):null};
  });
  const comparable=buckets.filter(b=>b.n>=5&&b.avgAlphaPct!=null);
  const violations:string[]=[];
  let comparablePairs=0;
  for(let i=0;i<comparable.length-1;i++){
    const a=comparable[i],b=comparable[i+1];
    comparablePairs++;
    if(Number(a.avgAlphaPct)<Number(b.avgAlphaPct))violations.push(`${a.action} alpha ${a.avgAlphaPct}% is below ${b.action} ${b.avgAlphaPct}%.`);
  }
  return{orderedActions:[...ACTION_ORDER],buckets,monotonic:comparablePairs>=2&&violations.length===0,comparablePairs,violations};
}

export function evaluatePromotionGate(input:{exactSampleN:number;avgAlphaPct:number|null;avgMaxDrawdownPct:number|null;regimesCovered:number;horizonsCovered:number;actionLadder:ActionLadderAssessment}):PromotionGate{
  const checks={
    exactSample:input.exactSampleN>=120,
    positiveAlpha:input.avgAlphaPct!=null&&input.avgAlphaPct>0,
    drawdownControlled:input.avgMaxDrawdownPct==null||input.avgMaxDrawdownPct>=-20,
    actionLadder:input.actionLadder.monotonic,
    regimeBreadth:input.regimesCovered>=2,
    horizonBreadth:input.horizonsCovered>=1,
  };
  const blockers:string[]=[];
  if(!checks.exactSample)blockers.push(`Need at least 120 exact-engine matured outcomes; have ${input.exactSampleN}.`);
  if(!checks.positiveAlpha)blockers.push('Exact-engine benchmark-relative alpha is not positive.');
  if(!checks.drawdownControlled)blockers.push('Average max drawdown breaches the -20% promotion guardrail.');
  if(!checks.actionLadder)blockers.push('Decision action ladder is not monotonic enough for promotion.');
  if(!checks.regimeBreadth)blockers.push('Evidence must cover at least two market regimes.');
  if(!checks.horizonBreadth)blockers.push('No matured proof horizon is available.');
  return{eligible:Object.values(checks).every(Boolean),blockers,checks};
}

export function summarizeModelProof(rows:ExactOutcomeObservation[]):ModelProofSummary{
  const valid=rows.filter(r=>finite(r.alphaPct));
  const exactSampleN=valid.length;
  const avgAlphaPct=exactSampleN?round(valid.reduce((s,r)=>s+r.alphaPct,0)/exactSampleN):null;
  const hitRatePct=exactSampleN?round(valid.filter(r=>r.alphaPct>0).length/exactSampleN*100,1):null;
  const dd=valid.map(r=>r.maxDrawdownPct).filter(finite);
  const avgMaxDrawdownPct=dd.length?round(dd.reduce((s,x)=>s+x,0)/dd.length):null;
  const regimesCovered=new Set(valid.map(r=>r.regime).filter(r=>r&&r!=='UNKNOWN')).size;
  const horizonsCovered=new Set(valid.map(r=>r.horizon).filter(Boolean)).size;
  const archetypesCovered=new Set(valid.map(r=>r.archetype).filter(Boolean)).size;
  const actionLadder=assessActionLadder(valid);
  const promotion=evaluatePromotionGate({exactSampleN,avgAlphaPct,avgMaxDrawdownPct,regimesCovered,horizonsCovered,actionLadder});
  let grade:ModelProofSummary['grade']='UNPROVEN';
  if(exactSampleN>=30)grade='EMERGING';
  if(promotion.eligible)grade='VALIDATED';
  const elite=promotion.eligible&&exactSampleN>=600&&horizonsCovered>=3&&regimesCovered>=3&&(avgAlphaPct??-Infinity)>=2&&(avgMaxDrawdownPct==null||avgMaxDrawdownPct>=-15)&&actionLadder.comparablePairs>=4;
  if(elite)grade='ELITE';
  const note=grade==='UNPROVEN'?'Not enough exact-engine matured evidence to characterize historical model performance.':grade==='EMERGING'?'Exact-engine evidence is accumulating, but promotion gates are not all satisfied.':grade==='VALIDATED'?'Exact-engine proof gates are satisfied; this is validation evidence, not a guarantee of future returns.':'Broad exact-engine evidence satisfies the stricter elite proof gate; future outcomes remain uncertain.';
  return{grade,exactSampleN,avgAlphaPct,hitRatePct,avgMaxDrawdownPct,regimesCovered,horizonsCovered,archetypesCovered,actionLadder,promotion,note};
}
