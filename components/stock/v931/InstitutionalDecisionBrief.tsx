import type {InstitutionalDecision,PillarKey} from '@/lib/auryn/v931/domain';

type Depth='simple'|'investor'|'pro';
const tone=(s:string)=>/BUY|ADD|ATTRACTIVE|READY|STRONG|CONSTRUCTIVE|TRENDING|CONFIRMED|POSITIVE/.test(s)?'good':/SELL|EXIT|REDUCE|UNATTRACTIVE|DAMAGED|BLOCK|FAILED|NEGATIVE|WEAK/.test(s)?'bad':'mid';
const signed=(n:number)=>`${n>0?'+':''}${n.toFixed(1)}`;
const pretty=(s:string)=>String(s||'').replaceAll('_',' ');

export default function InstitutionalDecisionBrief({decision,marketTruth,depth,onDepthChange}:{decision:InstitutionalDecision;marketTruth:any;depth:Depth;onDepthChange:(depth:Depth)=>void}){
 const attributionByKey=new Map(decision.attribution.map(a=>[a.pillar,a]));
 const ranked=(Object.values(decision.pillars)).map(p=>({pillar:p,attribution:attributionByKey.get(p.key as PillarKey)})).sort((a,b)=>Math.abs(b.attribution?.contribution||0)-Math.abs(a.attribution?.contribution||0));
 const visibleDrivers=depth==='simple'?ranked.slice(0,3):ranked;
 const marketLabel=pretty(String(marketTruth?.priceUse||marketTruth?.priceState||'VERIFYING'));
 const sessionLabel=pretty(String(marketTruth?.session||''));
 const primaryReason=decision.drivers[0]||'AURYN is waiting for decision-grade evidence.';
 const secondaryReason=decision.drivers[1]||decision.counterEvidence[0]||'';
 return <section className="v932DecisionBrief v931DecisionBrief" data-snapshot-id={decision.snapshotId}>
  <header className="v932Hero">
   <div className="v932HeroCopy">
    <small className="v932Eyebrow">AURYN INSTITUTIONAL CALL</small>
    <h2 className={tone(decision.newMoneyAction)}>{pretty(decision.newMoneyAction)}</h2>
    <p>{primaryReason}</p>
    {secondaryReason&&depth!=='simple'?<p className="v932HeroSecondary">{secondaryReason}</p>:null}
   </div>
   <div className="v932MarketState" aria-label="Canonical market truth">
    <b>{marketTruth?.displayPrice!=null?`$${Number(marketTruth.displayPrice).toFixed(2)}`:'—'}</b>
    <span>{marketLabel}</span>
    <small>{sessionLabel}</small>
   </div>
  </header>

  <div className="v932ControlLine">
   <div className="v932Depth" aria-label="Research depth">
    <span>VIEW</span>
    <button type="button" className={depth==='simple'?'active':''} onClick={()=>onDepthChange('simple')}>Beginner</button>
    <button type="button" className={depth==='investor'?'active':''} onClick={()=>onDepthChange('investor')}>Pro</button>
    <button type="button" className={depth==='pro'?'active':''} onClick={()=>onDepthChange('pro')}>Extreme Pro</button>
   </div>
   <div className="v932EvidenceMeta"><span>EVIDENCE QUALITY</span><b>{decision.evidenceCompleteness}/100</b><em>uncalibrated · not a probability</em></div>
  </div>

  <div className="v932ActionStrip" aria-label="Canonical actions">
   <span><small>NEW MONEY</small><b className={tone(decision.newMoneyAction)}>{pretty(decision.newMoneyAction)}</b></span>
   <span><small>OWNER</small><b className={tone(decision.ownerAction)}>{pretty(decision.ownerAction)}</b></span>
   <span><small>LONG TERM</small><b className={tone(decision.longTermAction)}>{pretty(decision.longTermAction)}</b></span>
   <span><small>EXECUTION</small><b className={tone(decision.executionAction)}>{pretty(decision.executionAction)}</b></span>
  </div>

  <section className="v932Drivers" aria-label="Ranked decision drivers">
   <div className="v932SectionHead"><div><small>DECISION DRIVERS</small><h3>What is actually moving the call</h3></div>{depth!=='simple'?<span>Ranked by policy influence, not screen order.</span>:null}</div>
   <div className="v932DriverList">{visibleDrivers.map(({pillar,attribution},i)=><article className="v932DriverRow" key={pillar.key}>
    <span className="v932DriverRank">{String(i+1).padStart(2,'0')}</span>
    <div className="v932DriverCopy"><div><b>{pillar.label}</b><em className={tone(pillar.impact)}>{pillar.impact}</em></div><p>{pillar.why}</p></div>
    <div className="v932DriverScore"><b>{pillar.score==null?'N/A':`${pillar.score}/100`}</b><span className={tone(pillar.state)}>{pillar.state}</span>{depth==='pro'&&attribution?<small>{signed(attribution.contribution)} influence</small>:null}</div>
   </article>)}</div>
  </section>

  <section className="v932DecisionNarrative">
   <article><small>WHY THIS CALL</small>{decision.drivers.slice(0,depth==='simple'?2:3).map(x=><p key={x}>{x}</p>)}</article>
   <article><small>STRONGEST COUNTER-EVIDENCE</small>{decision.counterEvidence.slice(0,depth==='simple'?1:3).map(x=><p key={x}>{x}</p>)}</article>
  </section>

  <section className="v932ChangeStory">
   <div><small>WHAT CHANGED</small>{decision.changeExplanation.changed?<><b>{pretty(String(decision.changeExplanation.from||'INITIAL'))} → {pretty(decision.changeExplanation.to)}</b><p>{decision.changeExplanation.trigger}</p></>:<><b>State stable · {pretty(decision.setupState)}</b><p>{decision.changeExplanation.trigger}</p></>}</div>
   {decision.changeExplanation.changed&&depth!=='simple'?<ul>{decision.changeExplanation.changedEvidence.slice(0,4).map(x=><li key={x}>{x}</li>)}</ul>:null}
  </section>

  <section className="v932TriggerRail">
   <div><small>NEXT DECISION TRIGGER</small><b>{decision.nextDecisionTrigger}</b></div>
   <div><small>INVALIDATION / RISK</small><b>{decision.invalidationTrigger||'No decision-grade structural invalidation is currently established.'}</b></div>
  </section>

  {depth==='pro'?<details className="v932Attribution v931Attribution">
   <summary>DECISION ATTRIBUTION · evidence trace</summary>
   <p>Contribution shows each pillar&apos;s weighted influence relative to a neutral 50/100. It is attribution, not a return forecast.</p>
   <div>{decision.attribution.map(a=><span key={a.pillar}><b>{a.label}</b><em className={a.contribution>0?'good':a.contribution<0?'bad':'mid'}>{signed(a.contribution)}</em><small>{a.score==null?'No verified score':`${a.score}/100 · ${(a.weight*100).toFixed(0)}% policy weight`}</small></span>)}</div>
  </details>:null}
 </section>;
}
