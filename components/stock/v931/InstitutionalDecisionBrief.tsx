import type {InstitutionalDecision,PillarKey} from '@/lib/auryn/v931/domain';

const tone=(s:string)=>/BUY|ADD|ATTRACTIVE|READY|STRONG|CONSTRUCTIVE|TRENDING|CONFIRMED|POSITIVE/.test(String(s||'').toUpperCase())?'good':/SELL|EXIT|REDUCE|UNATTRACTIVE|DAMAGED|BLOCK|FAILED|NEGATIVE|WEAK/.test(String(s||'').toUpperCase())?'bad':'mid';
const signed=(n:number)=>`${n>0?'+':''}${n.toFixed(1)}`;
const pretty=(s:string)=>String(s||'').replaceAll('_',' ');

export default function InstitutionalDecisionBrief({decision,marketTruth}:{decision:InstitutionalDecision;marketTruth:any}){
 const attributionByKey=new Map(decision.attribution.map(a=>[a.pillar,a]));
 const ranked=(Object.values(decision.pillars))
  .map(p=>({pillar:p,attribution:attributionByKey.get(p.key as PillarKey)}))
  .sort((a,b)=>Math.abs(b.attribution?.contribution||0)-Math.abs(a.attribution?.contribution||0));
 const topDrivers=ranked.slice(0,3);
 const marketLabel=pretty(String(marketTruth?.priceUse||marketTruth?.priceState||'VERIFYING'));
 const sessionLabel=pretty(String(marketTruth?.session||''));
 const primaryReason=decision.drivers[0]||'AURYN is waiting for decision-grade evidence.';
 const secondaryReason=decision.drivers[1]||decision.counterEvidence[0]||'';
 return <section className="v932DecisionBrief v931DecisionBrief" data-snapshot-id={decision.snapshotId}>
  <div className="v932DecisionCard">
   <header className="v932Hero">
    <div className="v932HeroCopy">
     <small className="v932Eyebrow">AURYN INSTITUTIONAL CALL</small>
     <h2 className={tone(decision.newMoneyAction)}>{pretty(decision.newMoneyAction)}</h2>
     <p>{primaryReason}</p>
     {secondaryReason?<p className="v932HeroSecondary">{secondaryReason}</p>:null}
    </div>
    <div className="v932MarketState" aria-label="Canonical market truth">
     <small>MARKET TRUTH</small>
     <b>{sessionLabel||'RESEARCH ACTIVE'}</b>
     <span>{marketLabel}</span>
    </div>
   </header>

   <div className="v932ActionStrip" aria-label="Canonical actions">
    <span><small>NEW MONEY</small><b className={tone(decision.newMoneyAction)}>{pretty(decision.newMoneyAction)}</b></span>
    <span><small>OWNER</small><b className={tone(decision.ownerAction)}>{pretty(decision.ownerAction)}</b></span>
    <span><small>LONG TERM</small><b className={tone(decision.longTermAction)}>{pretty(decision.longTermAction)}</b></span>
    <span><small>EXECUTION</small><b className={tone(decision.executionAction)}>{pretty(decision.executionAction)}</b></span>
   </div>

   <div className="v932EvidenceMeta"><span>EVIDENCE QUALITY</span><b>{decision.evidenceCompleteness}/100</b><em>uncalibrated · not a probability</em></div>
  </div>

  <section className="v932Drivers" aria-label="Ranked decision drivers">
   <div className="v932SectionHead"><div><small>WHAT MATTERS NOW</small><h3>The three forces driving this decision</h3></div><span>Ranked by policy influence.</span></div>
   <div className="v932DriverList">{topDrivers.map(({pillar,attribution},i)=><article className="v932DriverRow" key={pillar.key}>
    <span className="v932DriverRank">{String(i+1).padStart(2,'0')}</span>
    <div className="v932DriverCopy"><div><b>{pillar.label}</b><em className={tone(pillar.impact)}>{pillar.impact}</em></div><p>{pillar.why}</p></div>
    <div className="v932DriverScore"><b>{pillar.score==null?'N/A':`${pillar.score}/100`}</b><span className={tone(pillar.state)}>{pillar.state}</span>{attribution?<small>{signed(attribution.contribution)} influence</small>:null}</div>
   </article>)}</div>
  </section>

  <section className="v932DecisionNarrative">
   <article><small>WHY THIS CALL</small>{decision.drivers.slice(0,3).map(x=><p key={x}>{x}</p>)}</article>
   <article><small>STRONGEST COUNTER-EVIDENCE</small>{decision.counterEvidence.slice(0,3).map(x=><p key={x}>{x}</p>)}</article>
  </section>

  {decision.changeExplanation.changed?<section className="v932ChangeStory">
   <div><small>WHAT CHANGED</small><b>{pretty(String(decision.changeExplanation.from||'INITIAL'))} → {pretty(decision.changeExplanation.to)}</b><p>{decision.changeExplanation.trigger}</p></div>
   <ul>{decision.changeExplanation.changedEvidence.slice(0,4).map(x=><li key={x}>{x}</li>)}</ul>
  </section>:null}

  <section className="v932TriggerRail">
   <div><small>NEXT DECISION TRIGGER</small><b>{decision.nextDecisionTrigger}</b></div>
   <div><small>INVALIDATION / RISK</small><b>{decision.invalidationTrigger||'No decision-grade structural invalidation is currently established.'}</b></div>
  </section>

  <details className="v932DeepEvidence">
   <summary>Full evidence & model trace</summary>
   <div className="v932DeepEvidenceIntro">All six decision pillars and their weighted contribution to the same canonical call. This is evidence attribution, not a return forecast.</div>
   <div className="v932DeepDriverList">{ranked.map(({pillar,attribution})=><article key={pillar.key}>
    <div><b>{pillar.label}</b><span className={tone(pillar.impact)}>{pillar.impact}</span></div>
    <p>{pillar.why}</p>
    <strong>{pillar.score==null?'N/A':`${pillar.score}/100`}</strong>
   </article>)}</div>
   <div className="v932Attribution v931Attribution">
    <small>DECISION ATTRIBUTION</small>
    <div>{decision.attribution.map(a=><span key={a.pillar}><b>{a.label}</b><em className={a.contribution>0?'good':a.contribution<0?'bad':'mid'}>{signed(a.contribution)}</em><small>{a.score==null?'No verified score':`${a.score}/100 · ${(a.weight*100).toFixed(0)}% policy weight`}</small></span>)}</div>
   </div>
  </details>
 </section>;
}
