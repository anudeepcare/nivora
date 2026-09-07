import {formatScore} from "@/lib/nivora-format";
import type {AurynV4CoreAnalysis,CanonicalFactorKey} from "@/lib/auryn/v4/domain";
import {explainReasonCode,formatInvestmentAction,horizonLabel,newMoneyGuidance,ownerGuidance} from "@/lib/auryn/v4/presentation";

const scoreWord=(v:number)=>v>=85?"Exceptional":v>=75?"Strong":v>=65?"Good":v>=50?"Mixed":v>=40?"Weak":"Poor";
const actionTone=(x:string)=>/BUY|ADD|ACCUMULATE|STRONG/.test(x)?"good":/AVOID|REDUCE|EXIT|SELL|WEAK/.test(x)?"bad":"mid";
type Depth="simple"|"investor"|"pro";

const factorLabel:Partial<Record<CanonicalFactorKey,string>>={BUSINESS_QUALITY:"BUSINESS",MOAT:"MOAT",VALUATION:"VALUATION",TECHNICALS:"TECHNICALS",GROWTH_INFLECTION:"GROWTH",FUNDAMENTALS_EARNINGS:"FUNDAMENTALS",CATALYSTS:"CATALYSTS",SECTOR_INDUSTRY:"SECTOR",RISK:"RISK"};

function V4Decision({v4,owns,depth,onDepthChange,marketTruth}:{v4:AurynV4CoreAnalysis;owns:boolean;depth:Depth;onDepthChange?:(depth:Depth)=>void;marketTruth?:any}){
 const action=formatInvestmentAction(v4.primaryAction);
 const reasons=v4.reasonCodes.slice(0,depth==="simple"?3:5).map(explainReasonCode);
 const horizons=v4.horizonDecisions;
 // Product copy is intentionally explicit: NOW · SWING · 6–12M · 3–5Y.
 const horizonCopy=["NOW","SWING","6–12M","3–5Y"];
 const visibleFactors=(Object.keys(factorLabel) as CanonicalFactorKey[]).map(key=>({key,label:factorLabel[key]!,value:v4.factors[key]?.score??null,state:v4.factors[key]?.validationState})).filter(x=>x.value!=null);
 const marketBlocked=marketTruth?.priceSensitiveAllowed===false;
 const summary=v4.primaryAction==="INSUFFICIENT_EVIDENCE"?reasons[0]:`${v4.classification.businessModel.replaceAll("_"," ")} · ${v4.classification.lifecycle.replaceAll("_"," ")}. ${reasons[0]}`;
 return <section className="aurynDecisionSummary aurynV4DecisionSummary">
  <div className="aurynDecisionMain">
   <div className="aurynDecisionTopline"><div className="aurynEyebrow">AURYN V4 · DECISION</div>{onDepthChange&&<div className="aurynDecisionDepth" aria-label="Analysis depth"><button type="button" className={depth==="simple"?"on":""} onClick={()=>onDepthChange("simple")}>Beginner</button><button type="button" className={depth==="investor"?"on":""} onClick={()=>onDepthChange("investor")}>Pro</button><button type="button" className={depth==="pro"?"on":""} onClick={()=>onDepthChange("pro")}>Extreme Pro</button></div>}</div>
   <div className="aurynDecisionTitle"><h2 className={actionTone(action)}>{action}</h2><span><small>DECISION CONFIDENCE</small> {v4.confidence.score}/100 · {v4.confidence.label}</span></div>
   <p>{summary}</p>
   {marketBlocked&&<div className="aurynMarketTruthGate"><b>MARKET PRICE UNVERIFIED</b><span>{marketTruth?.reason||"Independent market sources are not sufficiently aligned."} Structural thesis evidence remains available, but entry, target, stop and risk/reward calculations are blocked until price verification recovers.</span></div>}
   <div className="aurynV4Horizons" aria-label="Decision by horizon">{horizons.map((h,i)=>{const horizonAction=marketBlocked&&(h.horizon==="NOW"||h.horizon==="SWING")?"VERIFY PRICE":formatInvestmentAction(h.action);return <span key={h.horizon}><small>{horizonCopy[i]||horizonLabel(h.horizon)}</small><b className={actionTone(horizonAction)}>{horizonAction}</b></span>})}</div>
   {depth!=="simple"&&<div className="aurynMemoSignals">{visibleFactors.slice(0,depth==="pro"?9:4).map(x=><span key={x.key}><small>{x.label}</small><b>{Math.round(Number(x.value))}/100</b><em>{x.key==="RISK"?"Higher = more risk":scoreWord(Number(x.value))}{depth==="pro"&&x.state?` · ${x.state.toLowerCase()}`:""}</em></span>)}</div>}
   <div className="aurynMemoReasons">{reasons.map((text,i)=><span key={`${text}-${i}`} className={/risk|broken|missing|weak|valuation/i.test(text)?"risk":""}>{/risk|broken|missing|weak|valuation/i.test(text)?"Watch · ":"✓ "}{text}</span>)}</div>
   {depth==="pro"&&<div className="aurynV4ModelAudit"><span><small>ANALYST MODEL</small><b>{v4.analystModel.id}</b></span><span><small>MODEL FIT</small><b>{Math.round(v4.analystModel.suitability*100)}/100</b></span><span><small>THESIS</small><b>{v4.thesis.strength==null?"—":`${v4.thesis.strength}/100`} · {v4.thesis.direction}</b></span><span><small>MOAT</small><b>{v4.moat.score==null?"Not established":`${Math.round(v4.moat.score)}/100 · ${v4.moat.direction}`}</b></span><span><small>EVIDENCE STATE</small><b>{v4.confidence.validationState}</b></span><span><small>ENGINE</small><b>{v4.engineVersion}</b></span></div>}
  </div>
  <aside className="aurynDecisionSide">
   <div className="aurynDecisionActionBlock"><div className="aurynEyebrow">NEW MONEY</div><b className={actionTone(marketBlocked?"HOLD":v4.primaryAction)}>{marketBlocked?"VERIFY PRICE FIRST":newMoneyGuidance(v4.primaryAction)}</b><span>{marketBlocked?"Do not deploy new capital until AURYN has a verified canonical market price.":v4.primaryAction==="INSUFFICIENT_EVIDENCE"?"Do not force a position until required evidence is available.":"Use the action plan below for staged entry, confirmation and reassessment levels."}</span></div>
   {owns&&<div className="aurynDecisionActionBlock owner"><div className="aurynEyebrow">IF YOU OWN IT</div><strong className={actionTone(marketBlocked&&v4.ownerAction!=="SELL"?"HOLD":v4.ownerAction)}>{marketBlocked&&v4.ownerAction!=="SELL"?"HOLD / VERIFY PRICE":ownerGuidance(v4.ownerAction)}</strong><span>{marketBlocked&&v4.ownerAction!=="SELL"?"Do not react to an unverified print. Manage the position from the structural thesis until market truth recovers.":v4.ownerAction==="SELL"?"The structural thesis/risk decision supports exiting rather than relying on price recovery.":v4.ownerAction==="REDUCE"?"Reduce risk because the structural evidence is weakening, not merely because price is noisy.":v4.ownerAction==="BUY"||v4.ownerAction==="STRONG_BUY"?"The thesis remains strong enough for a staged add if portfolio sizing and market truth permit it.":"Hold the existing position while monitoring thesis breakers and risk."}</span></div>}
  </aside>
 </section>;
}

export default function StockDecisionSummary({decision,owns,v4,depth="investor",onDepthChange,marketTruth}:{decision:any;owns:boolean;v4?:AurynV4CoreAnalysis|null;depth?:Depth;onDepthChange?:(depth:Depth)=>void;marketTruth?:any}){
 if(v4)return <V4Decision v4={v4} owns={owns} depth={depth} onDepthChange={onDepthChange} marketTruth={marketTruth}/>;
 const c=decision.canonical;
 const longTerm=c?.longTerm||{label:decision.longTermThesis?.label||decision.thesisLabel,score:decision.longTermThesis?.score||decision.thesisScore,reason:decision.oneLine};
 const newMoney=c?.newMoney||{action:decision.today?.action||decision.action,reason:decision.today?.reason||decision.actionReason};
 const owner=c?.owner||{action:"HOLD",reason:"Owner guidance is unavailable."};
 const entry=c?.entry||{action:decision.timing?.label||"WAIT",score:decision.opportunityScore,reason:decision.timing?.reason||""};
 const strategic=decision.strategicContext;
 const drivers=[...(strategic?.drivers||[]),...(decision.drivers||[])].filter(Boolean).slice(0,4);
 const risks=[...(strategic?.risks||[]),(decision.adversarialRisks||[])[0]?.evidence].filter(Boolean).slice(0,3);
 return <section className="aurynDecisionSummary">
  <div className="aurynDecisionMain">
   <div className="aurynEyebrow">AURYN · LONG-TERM THESIS</div>
   <div className="aurynDecisionTitle"><h2>{longTerm.label}</h2><span>{longTerm.score}/100 · {scoreWord(longTerm.score)}</span></div>
   <p>{decision.oneLine}</p>
   <div className="aurynMemoSignals">
    <span><small>CONVICTION</small><b>{formatScore(decision.thesisScore)}/100</b><em>{scoreWord(decision.thesisScore)}</em></span>
    <span><small>BUSINESS</small><b>{formatScore(decision.companyScore)}/100</b><em>{scoreWord(decision.companyScore)}</em></span>
    <span><small>FUTURE</small><b>{formatScore(strategic?.score??longTerm.score)}/100</b><em>{strategic?.label?String(strategic.label).toLowerCase().replace(/^./,(x:string)=>x.toUpperCase()):scoreWord(longTerm.score)}</em></span>
    <span><small>ENTRY</small><b>{formatScore(entry.score)}/100</b><em>{entry.action}</em></span>
   </div>
   <div className="aurynMemoReasons">{drivers.map((x:string)=><span key={x}>✓ {x}</span>)}{risks.map((x:any,i:number)=><span key={i} className="risk">Watch · {String(x)}</span>)}</div>
  </div>
  <aside className="aurynDecisionSide">
   <div className="aurynDecisionActionBlock"><div className="aurynEyebrow">NEW MONEY</div><b className={actionTone(newMoney.action)}>{newMoney.action}</b><span>{newMoney.reason}</span></div>
   {owns&&<div className="aurynDecisionActionBlock owner"><div className="aurynEyebrow">IF YOU OWN IT</div><strong className={actionTone(owner.action)}>{owner.action}</strong><span>{owner.reason}</span></div>}
  </aside>
 </section>;
}
