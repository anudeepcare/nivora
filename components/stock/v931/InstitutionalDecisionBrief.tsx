import type {InstitutionalDecision} from '@/lib/auryn/v931/domain';
import type {ExecutionPlan} from '@/lib/auryn/v5/domain';
import {formatMoney} from '@/lib/nivora-format';
import MarketTimeframeTape from '@/components/market/MarketTimeframeTape';
import MarketActionMap from '@/components/market/MarketActionMap';

const tone=(s:string)=>/BUY|ADD|ATTRACTIVE|READY|STRONG|CONSTRUCTIVE|TRENDING|CONFIRMED|POSITIVE/.test(String(s||'').toUpperCase())?'good':/SELL|EXIT|REDUCE|UNATTRACTIVE|DAMAGED|FAILED|NEGATIVE|WEAK/.test(String(s||'').toUpperCase())?'bad':'mid';
const pretty=(s:string)=>String(s||'').replaceAll('_',' ');
const money=(v:number|null|undefined)=>Number.isFinite(Number(v))?formatMoney(Number(v)):'—';
const zone=(p:ExecutionPlan|null|undefined)=>p?.initialEntry?`${money(p.initialEntry.low)}–${money(p.initialEntry.high)}`:'—';

export default function InstitutionalDecisionBrief({decision,marketTruth,executionPlan,support,marketIntelligence}:{decision:InstitutionalDecision;marketTruth:any;executionPlan?:ExecutionPlan|null;support?:number|null;marketIntelligence?:any}){
 const session=pretty(String(marketTruth?.session||'')).toUpperCase();
 const marketStatus=session&&session!=='REGULAR'?`${session} · RESEARCH ACTIVE`:'RESEARCH ACTIVE';
 const primaryReason=decision.drivers[0]||'AURYN is waiting for stronger decision-grade evidence.';
 const counter=decision.counterEvidence[0]||'';
 const t1=executionPlan?.targets?.find(x=>x.label==='T1')?.price??executionPlan?.targets?.[0]?.price??null;
 const t2=executionPlan?.targets?.find(x=>x.label==='T2')?.price??executionPlan?.targets?.[1]?.price??null;
 const reasons=[...decision.drivers.slice(0,2),...decision.counterEvidence.slice(0,1)].filter(Boolean).slice(0,3);
 return <section className="v933DecisionBrief" data-snapshot-id={decision.snapshotId}>
  <div className="v933Core">
   <div className="v933Call">
    <small>AURYN CALL</small>
    <h2 className={tone(decision.newMoneyAction)}>{pretty(decision.newMoneyAction)}</h2>
    <p>{primaryReason}</p>
    {counter?<p className="v933Counterline">Main constraint: {counter}</p>:null}
   </div>
   <div className="v933CoreMeta">
    <span>{marketStatus}</span>
    <span>Evidence quality {decision.evidenceCompleteness}/100 · uncalibrated, not a probability</span>
   </div>
   <div className="v933Actions" aria-label="Canonical investment actions">
    <span><small>NEW MONEY</small><b className={tone(decision.newMoneyAction)}>{pretty(decision.newMoneyAction)}</b></span>
    <span><small>OWNER</small><b className={tone(decision.ownerAction)}>{pretty(decision.ownerAction)}</b></span>
    <span><small>LONG TERM</small><b className={tone(decision.longTermAction)}>{pretty(decision.longTermAction)}</b></span>
   </div>
  </div>

  {marketIntelligence?<MarketTimeframeTape marketIntelligence={marketIntelligence}/>:null}
  {marketIntelligence?.actionMap||marketIntelligence?.levels?<MarketActionMap marketIntelligence={marketIntelligence}/>:<div className="v933LevelRail" aria-label="Decision levels">
   <span><small>PREFERRED ENTRY</small><b>{zone(executionPlan)}</b></span>
   <span><small>CONFIRM</small><b>{money(executionPlan?.confirmation)}</b></span>
   <span><small>SUPPORT</small><b>{money(support)}</b></span>
   <span><small>T1</small><b>{money(t1)}</b></span>
   <span><small>T2</small><b>{money(t2)}</b></span>
   <span><small>RISK</small><b>{money(executionPlan?.invalidation)}</b></span>
  </div>}

  <div className="v933Story">
   <article>
    <small>WHY THIS CALL</small>
    {reasons.length?reasons.map(x=><p key={x}>{x}</p>):<p>AURYN is waiting for decision-grade evidence before making a stronger call.</p>}
   </article>
   <article>
    <small>WHAT UPGRADES IT</small>
    <p>{decision.nextDecisionTrigger}</p>
    <small>WHAT BREAKS IT</small>
    <p>{decision.invalidationTrigger||'No decision-grade structural invalidation is currently established.'}</p>
   </article>
  </div>

  {decision.changeExplanation.changed?<div className="v933Change">
   <small>WHAT CHANGED</small><b>{pretty(String(decision.changeExplanation.from||'INITIAL'))} → {pretty(decision.changeExplanation.to)}</b><span>{decision.changeExplanation.trigger}</span>
  </div>:null}
 </section>;
}
