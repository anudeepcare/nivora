import type {PrimaryInvestmentAction} from '../v4/domain';
import type {ExecutionPlan,ScenarioMap} from '../v5/domain';

export type TrustAuditState='PASS'|'WARN'|'BLOCK';
export interface TrustAuditCheck{ id:string; pass:boolean; severity:'BLOCK'|'WARN'|'INFO'; message:string; }
export interface CanonicalTrustAudit{ state:TrustAuditState; score:number; checks:TrustAuditCheck[]; blockers:string[]; warnings:string[]; }

export interface CanonicalTrustInput{
  snapshotId:string;
  marketTruth:{snapshotId:string;decisionPrice:number|null;priceSensitiveAllowed:boolean};
  executionPlan:ExecutionPlan;
  scenario:Pick<ScenarioMap,'snapshotId'|'intent'|'bull'>|null;
  valuationAvailable:boolean;
  primaryAction:PrimaryInvestmentAction;
}

const finite=(x:unknown):x is number=>typeof x==='number'&&Number.isFinite(x);
const near=(a:number|null|undefined,b:number|null|undefined)=>finite(a)&&finite(b)&&Math.abs(a-b)<=Math.max(.01,Math.abs(a)*.0001);
const buyLike=(a:PrimaryInvestmentAction)=>a==='BUY'||a==='STRONG_BUY';

export function auditCanonicalTrust(input:CanonicalTrustInput):CanonicalTrustAudit{
  const checks:TrustAuditCheck[]=[];
  const add=(id:string,pass:boolean,severity:'BLOCK'|'WARN'|'INFO',message:string)=>checks.push({id,pass,severity,message});
  const plan=input.executionPlan,scenario=input.scenario,market=input.marketTruth;

  add('snapshot-chain',input.snapshotId===market.snapshotId&&input.snapshotId===plan.snapshotId&&(!scenario?.snapshotId||scenario.snapshotId===input.snapshotId),'BLOCK','Scenario, execution plan and Market Truth must share one canonical snapshot ID.');

  const marketPlanAligned=market.priceSensitiveAllowed?plan.state==='READY':plan.state==='BLOCKED';
  add('market-plan-state',marketPlanAligned,'BLOCK','Execution state must fail closed whenever Market Truth is not price-sensitive.');

  const priceAligned=plan.state==='BLOCKED'||(!market.priceSensitiveAllowed)||near(plan.currentPrice,market.decisionPrice);
  add('canonical-price',priceAligned,'BLOCK','Execution-plan price must equal the canonical Market Truth decision price.');

  const nonAccumulateHasNoDca=plan.intent==='ACCUMULATE'||plan.dcaZones.length===0;
  add('dca-policy',nonAccumulateHasNoDca,'BLOCK','DCA tiers are permitted only when the canonical execution intent is ACCUMULATE.');

  const actionIntentOk=input.primaryAction==='SELL'?plan.intent==='EXIT'||plan.state==='BLOCKED':input.primaryAction==='REDUCE'?plan.intent==='REDUCE'||plan.state==='BLOCKED':input.primaryAction==='HOLD'||input.primaryAction==='INSUFFICIENT_EVIDENCE'?plan.intent!=='ACCUMULATE':true;
  add('action-intent',actionIntentOk,'BLOCK','Execution intent must not contradict the CIO primary action.');

  const valuationOk=input.valuationAvailable||plan.intent!=='ACCUMULATE';
  add('valuation-gate',valuationOk,'BLOCK','Active accumulation requires decision-grade valuation evidence.');

  let orderingOk=true;
  if(plan.state==='READY'&&plan.initialEntry&&plan.invalidation!=null){
    orderingOk=plan.initialEntry.low<=plan.initialEntry.high&&plan.initialEntry.low>plan.invalidation;
    let ceiling=plan.initialEntry.low;
    for(const z of plan.dcaZones){orderingOk=orderingOk&&z.low<=z.high&&z.low>plan.invalidation&&z.high<ceiling;ceiling=z.low;}
    if(plan.confirmation!=null)orderingOk=orderingOk&&plan.confirmation>plan.initialEntry.high;
    let prev=plan.confirmation??plan.initialEntry.high;
    for(const t of plan.targets){orderingOk=orderingOk&&finite(t.price)&&t.price>prev;prev=t.price;}
  }
  add('plan-ordering',orderingOk,'BLOCK','Execution levels must be strictly ordered: confirmation above entry, DCA tiers below entry, invalidation below all accumulation zones, targets ascending.');

  let scenarioAligned=true;
  if(scenario){
    scenarioAligned=scenario.intent===plan.intent;
    if(plan.state==='BLOCKED'){
      scenarioAligned=scenarioAligned&&scenario.bull.trigger==null&&scenario.bull.zoneLow==null&&scenario.bull.zoneHigh==null&&scenario.bull.targetLow==null&&scenario.bull.targetHigh==null&&scenario.bull.invalidation==null;
    }else{
      const initial=plan.initialEntry;
      const t1=plan.targets[0]?.price??null,t2=plan.targets[1]?.price??t1;
      scenarioAligned=scenarioAligned
        &&(plan.confirmation==null?scenario.bull.trigger==null:near(scenario.bull.trigger,plan.confirmation))
        &&(initial==null?(scenario.bull.zoneLow==null&&scenario.bull.zoneHigh==null):(near(scenario.bull.zoneLow,initial.low)&&near(scenario.bull.zoneHigh,initial.high)))
        &&(t1==null?scenario.bull.targetLow==null:near(scenario.bull.targetLow,t1))
        &&(t2==null?scenario.bull.targetHigh==null:near(scenario.bull.targetHigh,t2))
        &&(plan.invalidation==null?scenario.bull.invalidation==null:near(scenario.bull.invalidation,plan.invalidation));
    }
  }
  add('scenario-plan',scenarioAligned,'BLOCK','Scenario Map actionable bull levels must be identical to the canonical ExecutionPlan.');

  const positiveLevels=plan.state==='BLOCKED'||[
    plan.currentPrice,plan.initialEntry?.low,plan.initialEntry?.high,plan.confirmation,plan.invalidation,...plan.dcaZones.flatMap(z=>[z.low,z.high]),...plan.targets.map(t=>t.price)
  ].filter(x=>x!=null).every(x=>finite(x)&&x>0);
  add('positive-levels',positiveLevels,'BLOCK','All published price levels must be finite and positive.');

  const buyWithoutActivePlan=buyLike(input.primaryAction)&&plan.state==='READY'&&plan.intent==='WATCH';
  add('buy-watch-context',!buyWithoutActivePlan,'WARN','CIO is bullish but execution remains WATCH; this is allowed only when valuation/timing gates cap deployment.');

  const blockers=checks.filter(x=>!x.pass&&x.severity==='BLOCK').map(x=>x.message);
  const warnings=checks.filter(x=>!x.pass&&x.severity==='WARN').map(x=>x.message);
  const score=Math.max(0,Math.min(100,100-blockers.length*25-warnings.length*6));
  const state:TrustAuditState=blockers.length?'BLOCK':warnings.length?'WARN':'PASS';
  return{state,score,checks,blockers,warnings};
}
