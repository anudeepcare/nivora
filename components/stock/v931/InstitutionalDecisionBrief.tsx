import type {InstitutionalDecision} from '@/lib/auryn/v931/domain';

type Depth='simple'|'investor'|'pro';
const tone=(s:string)=>/BUY|ADD|ATTRACTIVE|READY|STRONG|CONSTRUCTIVE|TRENDING|CONFIRMED/.test(s)?'good':/SELL|EXIT|REDUCE|UNATTRACTIVE|DAMAGED|BLOCK|FAILED/.test(s)?'bad':'mid';
const signed=(n:number)=>`${n>0?'+':''}${n.toFixed(1)}`;

export default function InstitutionalDecisionBrief({decision,marketTruth,depth,onDepthChange}:{decision:InstitutionalDecision;marketTruth:any;depth:Depth;onDepthChange:(depth:Depth)=>void}){
 const pillars=Object.values(decision.pillars);
 return <section className="v931DecisionBrief" data-snapshot-id={decision.snapshotId}>
  <div className="v931DecisionTop">
   <div>
    <small>AURYN INSTITUTIONAL CALL</small>
    <h2 className={tone(decision.newMoneyAction)}>{decision.newMoneyAction.replaceAll('_',' ')}</h2>
    <p>{decision.drivers[0]||'AURYN is waiting for decision-grade evidence.'}</p>
   </div>
   <div className="v931TruthBadge">
    <b>{marketTruth?.displayPrice!=null?`$${Number(marketTruth.displayPrice).toFixed(2)}`:'—'}</b>
    <span>{String(marketTruth?.priceUse||'VERIFYING').replaceAll('_',' ')}</span>
    <small>{String(marketTruth?.session||'').replaceAll('_',' ')}</small>
   </div>
  </div>

  <div className="v931Depth" aria-label="Research depth">
   <span>VIEW</span>
   <button type="button" className={depth==='simple'?'active':''} onClick={()=>onDepthChange('simple')}>Beginner</button>
   <button type="button" className={depth==='investor'?'active':''} onClick={()=>onDepthChange('investor')}>Pro</button>
   <button type="button" className={depth==='pro'?'active':''} onClick={()=>onDepthChange('pro')}>Extreme Pro</button>
  </div>

  <div className="v931Actions">
   <span><small>NEW MONEY</small><b className={tone(decision.newMoneyAction)}>{decision.newMoneyAction.replaceAll('_',' ')}</b></span>
   <span><small>EXISTING OWNER</small><b className={tone(decision.ownerAction)}>{decision.ownerAction.replaceAll('_',' ')}</b></span>
   <span><small>LONG TERM</small><b className={tone(decision.longTermAction)}>{decision.longTermAction}</b></span>
   <span><small>EXECUTION</small><b className={tone(decision.executionAction)}>{decision.executionAction}</b></span>
  </div>

  <div className="v931EvidenceQuality">
   <div><small>EVIDENCE QUALITY</small><b>{decision.evidenceCompleteness}/100</b></div>
   <p>This is evidence completeness and quality, <strong>not a probability of profit</strong>. Predictive confidence is shown only after it is historically calibrated out of sample.</p>
  </div>

  <div className="v931Pillars">{pillars.map(p=><article key={p.key}>
   <div><small>{p.label}</small><b>{p.score==null?'—':`${p.score}/100`}</b></div>
   <span className={tone(p.state)}>{p.state}</span>
   <p>{p.why}</p>
  </article>)}</div>

  <div className="v931DecisionWhy">
   <article><small>WHY THIS CALL</small>{decision.drivers.slice(0,3).map(x=><p key={x}>{x}</p>)}</article>
   <article><small>STRONGEST COUNTER-EVIDENCE</small>{decision.counterEvidence.slice(0,3).map(x=><p key={x}>{x}</p>)}</article>
  </div>

  <div className="v931Change">
   <small>WHAT CHANGED</small>
   {decision.changeExplanation.changed?<>
    <b>{String(decision.changeExplanation.from||'INITIAL').replaceAll('_',' ')} → {decision.changeExplanation.to.replaceAll('_',' ')}</b>
    <p>{decision.changeExplanation.trigger}</p>
    {decision.changeExplanation.changedEvidence.slice(0,4).map(x=><span key={x}>• {x}</span>)}
   </>:<><b>STATE STABLE · {decision.setupState.replaceAll('_',' ')}</b><p>{decision.changeExplanation.trigger}</p></>}
  </div>

  <div className="v931Next">
   <div><small>NEXT DECISION TRIGGER</small><b>{decision.nextDecisionTrigger}</b></div>
   {decision.invalidationTrigger?<div><small>INVALIDATION / RISK</small><b>{decision.invalidationTrigger}</b></div>:null}
  </div>

  {depth==='pro'?<details className="v931Attribution">
   <summary>DECISION ATTRIBUTION</summary>
   <p>Contribution shows each pillar's weighted influence relative to a neutral 50/100. It is attribution, not a return forecast.</p>
   <div>{decision.attribution.map(a=><span key={a.pillar}><b>{a.label}</b><em className={a.contribution>0?'good':a.contribution<0?'bad':'mid'}>{signed(a.contribution)}</em><small>{a.score==null?'No verified score':`${a.score}/100 · ${(a.weight*100).toFixed(0)}% policy weight`}</small></span>)}</div>
  </details>:null}
 </section>;
}
