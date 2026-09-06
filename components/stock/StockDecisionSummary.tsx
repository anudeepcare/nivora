import {formatScore} from "@/lib/nivora-format";

const scoreWord=(v:number)=>v>=85?"Exceptional":v>=75?"Strong":v>=65?"Good":v>=50?"Mixed":v>=40?"Weak":"Poor";
const actionTone=(x:string)=>/BUY|ADD|ACCUMULATE|STRONG/.test(x)?"good":/AVOID|REDUCE|EXIT|WEAK/.test(x)?"bad":"mid";

export default function StockDecisionSummary({decision,owns}:{decision:any;owns:boolean}){
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
 </section>
}
