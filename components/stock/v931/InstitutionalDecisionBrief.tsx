import type {InstitutionalDecision} from '@/lib/auryn/v931/domain';
import type {ExecutionPlan,ScenarioMap} from '@/lib/auryn/v5/domain';
import {describeSetupState} from '@/lib/auryn/v934/setup-explanations';
import {formatMoney} from '@/lib/nivora-format';
import MarketTimeframeTape from '@/components/market/MarketTimeframeTape';
import MarketActionMap from '@/components/market/MarketActionMap';

const tone=(s:string)=>/STRONG_BUY|BUY|ADD|ATTRACTIVE|READY|STRONG|CONSTRUCTIVE|TRENDING|CONFIRMED|POSITIVE/.test(String(s||'').toUpperCase())?'good':/AVOID|SELL|EXIT|REDUCE|UNATTRACTIVE|DAMAGED|FAILED|NEGATIVE|WEAK/.test(String(s||'').toUpperCase())?'bad':'mid';
const pretty=(s:string)=>String(s||'').replaceAll('_',' ');
const money=(v:number|null|undefined)=>Number.isFinite(Number(v))?formatMoney(Number(v)):'—';
const zone=(p:ExecutionPlan|null|undefined)=>p?.initialEntry?`${money(p.initialEntry.low)}–${money(p.initialEntry.high)}`:'—';
const scoreBand=(x:number|null)=>x==null?'Unavailable':x>=72?'Strong':x>=60?'Constructive':x>=45?'Mixed':'Weak';

export default function InstitutionalDecisionBrief({decision,marketTruth,executionPlan,support,marketIntelligence,scenario,entryQuality}:{decision:InstitutionalDecision;marketTruth:any;executionPlan?:ExecutionPlan|null;support?:number|null;marketIntelligence?:any;scenario?:ScenarioMap|null;entryQuality?:number|null}){
 const session=pretty(String(marketTruth?.session||'')).toUpperCase();
 const marketStatus=session&&session!=='REGULAR'?`${session} · RESEARCH ACTIVE`:'RESEARCH ACTIVE';
 const tfRating=(tf:string)=>marketIntelligence?.confirmed?.[tf]?.rating??marketIntelligence?.timeframes?.[tf]?.confirmed??null;
 const technicalParts=['4H','1D','1W'].map(tf=>[tf,tfRating(tf)] as const).filter((x):x is readonly [string,string]=>Boolean(x[1]));
 const technicalSummary=technicalParts.map(([tf,r])=>`${tf} ${r}`).join(' · ');
 const map=marketIntelligence?.actionMap??marketIntelligence?.levels??null;
 const confirmLevel=Number(map?.confirm);
 const invalidation=Number(map?.invalidation??executionPlan?.invalidation);
 const setupLabel=String(decision.setupState||'UNKNOWN');
 const setup=describeSetupState({setup:setupLabel,newMoneyAction:decision.newMoneyAction,confirm:Number.isFinite(confirmLevel)?confirmLevel:null,invalidation:Number.isFinite(invalidation)?invalidation:null});
 const patternLabel=scenario?.setup&&scenario.setup!=='UNKNOWN'&&String(scenario.setup)!==setupLabel?String(scenario.setup):null;
 const pattern=patternLabel?describeSetupState({setup:patternLabel,newMoneyAction:decision.newMoneyAction,confirm:Number.isFinite(confirmLevel)?confirmLevel:null,invalidation:Number.isFinite(invalidation)?invalidation:null}):null;
 const primaryReason=decision.newMoneyAction==='STRONG_BUY'
  ?`Exceptional evidence alignment supports new capital${technicalSummary?` with ${technicalSummary} confirmed`:''}.`
  :decision.newMoneyAction==='BUY'
   ?`Available decision-grade evidence supports new capital${technicalSummary?` while confirmed structure reads ${technicalSummary}`:''}.`
   :decision.newMoneyAction==='START_SMALL'
    ?`${decision.policyReasons[0]||'Evidence is positive, but one material uncertainty still caps initial size.'}${technicalSummary?` Confirmed structure: ${technicalSummary}.`:''}`
    :decision.newMoneyAction==='AVOID'
     ?`${decision.policyReasons[0]||'Current evidence does not support new capital.'}${technicalSummary?` Confirmed structure: ${technicalSummary}.`:''}`
     :technicalSummary?`Confirmed structure is ${technicalSummary}; AURYN is waiting for better alignment between setup, asymmetry and decision quality.`:(decision.policyReasons[0]||'AURYN is waiting for stronger decision-grade evidence.');
 const reasons=[technicalSummary?`Confirmed market structure: ${technicalSummary}.`:null,...decision.policyReasons.slice(0,1),...decision.counterEvidence.slice(0,1)].filter(Boolean) as string[];
 const daily=marketIntelligence?.confirmed?.['1D']??null;
 const relPct=Number(daily?.relativeStrength?.relativePct);
 const relBenchmark=String(daily?.relativeStrength?.benchmark||'benchmark');
 const participation=Number(daily?.participation?.score);
 const atrPct=Number(daily?.volatility?.atrPct);
 const volatility=String(daily?.volatility?.regime||'').toUpperCase();
 const eLow=Number(map?.preferredEntry?.low),eHigh=Number(map?.preferredEntry?.high),t1=Number(map?.t1),t2=Number(map?.t2),risk=Number(map?.invalidation);
 const planned=Number.isFinite(eLow)&&Number.isFinite(eHigh)?(eLow+eHigh)/2:NaN;
 const riskPerShare=Number.isFinite(planned)&&Number.isFinite(risk)&&planned>risk?planned-risk:NaN;
 const rr1=Number.isFinite(riskPerShare)&&riskPerShare>0&&Number.isFinite(t1)&&t1>planned?(t1-planned)/riskPerShare:null;
 const rr2=Number.isFinite(riskPerShare)&&riskPerShare>0&&Number.isFinite(t2)&&t2>planned?(t2-planned)/riskPerShare:null;
 return <section className="v933DecisionBrief v9343DecisionBrief" data-snapshot-id={decision.snapshotId}>
  <div className="v933Core">
   <div className="v933Call">
    <small>AURYN CALL</small>
    <h2 className={tone(decision.newMoneyAction)}>{pretty(decision.newMoneyAction)}</h2>
    <p>{primaryReason}</p>
   </div>
   <div className="v933CoreMeta"><span>{marketStatus}</span><span>Evidence quality {decision.evidenceCompleteness}/100 · uncalibrated, not a probability</span></div>
   <div className="v933Actions" aria-label="Canonical investment actions">
    <span><small>NEW MONEY</small><b className={tone(decision.newMoneyAction)}>{pretty(decision.newMoneyAction)}</b></span>
    <span><small>OWNER</small><b className={tone(decision.ownerAction)}>{pretty(decision.ownerAction)}</b></span>
    <span><small>LONG TERM</small><b className={tone(decision.longTermAction)}>{pretty(decision.longTermAction)}</b></span>
   </div>
  </div>

  <section className="v9343SetupIntel" aria-label="Market setup explanation">
   <div className="v9343SetupHead">
    <div><small>MARKET SETUP</small><h3>{setup.title}</h3><p>{scenario?.structure?`${scenario.structure} · `:''}{scenario?.confluenceScore!=null?`Confluence ${Math.round(Number(scenario.confluenceScore))}/100 · `:''}{scenario?.bull?.confidence?`${scenario.bull.confidence} confidence`:''}</p></div>
    {pattern?<div className="v9343Pattern"><small>PATTERN EVIDENCE</small><b>{pattern.title}</b><span>{pattern.meaning}</span></div>:null}
   </div>
   <div className="v9343SetupMeaning">
    <div><small>WHAT IT MEANS</small><p>{setup.meaning}</p></div>
    <div><small>ACTION IMPLICATION</small><p>{setup.actionImplication}</p></div>
   </div>
  </section>

  <section className="v934DecisionPlan" aria-label="Market plan">
   <div className="v934SectionLabel"><small>MARKET PLAN</small><span>Confirmed structure drives the decision; tactical intraday context updates separately.</span></div>
   {marketIntelligence?<MarketTimeframeTape marketIntelligence={marketIntelligence}/>:null}
   {marketIntelligence?.actionMap||marketIntelligence?.levels?<MarketActionMap marketIntelligence={marketIntelligence} newMoneyAction={decision.newMoneyAction} setup={setupLabel}/>:<div className="v933LevelRail" aria-label="Decision levels">
    <span><small>PREFERRED ENTRY</small><b>{zone(executionPlan)}</b></span><span><small>CONFIRM</small><b>{money(executionPlan?.confirmation)}</b></span><span><small>SUPPORT</small><b>{money(support)}</b></span><span><small>RISK</small><b>{money(executionPlan?.invalidation)}</b></span>
   </div>}
  </section>

  <section className="v9343DecisionMetrics" aria-label="Decision metrics">
   <div><small>ENTRY QUALITY</small><b>{Number.isFinite(Number(entryQuality))?`${Math.round(Number(entryQuality))}/100`:'—'}</b><span>{Number.isFinite(Number(entryQuality))?scoreBand(Number(entryQuality)): 'Evidence unavailable'}</span></div>
   <div><small>RELATIVE STRENGTH</small><b>{Number.isFinite(relPct)?`${relPct>=0?'+':''}${relPct.toFixed(1)}%`:'—'}</b><span>{Number.isFinite(relPct)?`vs ${relBenchmark}`:'Benchmark comparison unavailable'}</span></div>
   <div><small>PARTICIPATION</small><b>{Number.isFinite(participation)?`${Math.round(participation)}/100`:'—'}</b><span>{Number.isFinite(participation)?scoreBand(participation):'Volume evidence unavailable'}</span></div>
   <div><small>REWARD / RISK</small><b>{rr1!=null?`${rr1.toFixed(1)}×`:'—'}</b><span>{rr2!=null?`T2 ${rr2.toFixed(1)}×`:'Plan ratio unavailable'}</span></div>
   <div><small>VOLATILITY</small><b>{volatility||'—'}</b><span>{Number.isFinite(atrPct)?`ATR ${atrPct.toFixed(1)}%`:'ATR unavailable'}</span></div>
  </section>

  <section className="v934DecisionLogic" aria-label="Decision logic">
   <div className="v933Story"><article><small>WHY THIS CALL</small>{reasons.length?reasons.slice(0,3).map(x=><p key={x}>{x}</p>):<p>Evidence is not yet strong enough to justify a stronger action.</p>}</article><article><small>WHAT UPGRADES IT</small><p>{decision.nextDecisionTrigger}</p><small>WHAT BREAKS IT</small><p>{decision.invalidationTrigger||'No decision-grade structural invalidation is currently established.'}</p></article></div>
  </section>
  {decision.changeExplanation.changed?<div className="v933Change"><small>WHAT CHANGED</small><b>{pretty(String(decision.changeExplanation.from||'INITIAL'))} → {pretty(decision.changeExplanation.to)}</b><span>{decision.changeExplanation.trigger}</span></div>:null}
 </section>;
}
