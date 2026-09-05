import {deriveV65Actions} from "@/lib/v65/action-policy";
import {formatScore} from "@/lib/nivora-format";
const words=(x:any)=>String(x||"—").replaceAll("_"," ");
export default function StockDecisionSummary({decision,owns}:{decision:any;owns:boolean}){
 const today=decision.today?.action||decision.action;
 const actions=deriveV65Actions({thesisLabel:decision.thesisLabel,thesisScore:decision.thesisScore,thesisState:decision.thesisState,todayAction:today,timingLabel:decision.timing?.label,ownerAction:owns?today:"HOLD"});
 const longTerm=words(actions.longTerm==="STARTER_BUY"?"BUY CANDIDATE":actions.longTerm);
 const newMoney=words(actions.newMoney);
 const owner=words(actions.owner);
 const drivers=(decision.drivers||[]).slice(0,3),risks=(decision.adversarialRisks||[]).slice(0,2);
 return <section className="aurynDecisionSummary">
  <div className="aurynDecisionMain"><div className="aurynEyebrow">AURYN CALL · LONG TERM</div><h2>{longTerm}</h2><p>{decision.oneLine}</p><div className="aurynMemoSignals"><span><small>CONVICTION</small><b>{formatScore(decision.thesisScore)}/100</b></span><span><small>BUSINESS</small><b>{formatScore(decision.companyScore)}/100</b></span><span><small>ENTRY</small><b>{formatScore(decision.opportunityScore)}/100</b></span></div><div className="aurynMemoReasons">{drivers.map((x:string)=><span key={x}>✓ {x}</span>)}{risks.map((x:any,i:number)=><span key={i} className="risk">Watch · {x.evidence||x.category||String(x)}</span>)}</div></div>
  <aside className="aurynDecisionSide"><div className="aurynEyebrow">NEW MONEY</div><b>{newMoney}</b><span>{decision.today?.reason||decision.actionReason||decision.timing?.reason}</span>{owns&&<><div className="aurynEyebrow">OWNER</div><strong>{owner}</strong></>}</aside>
 </section>
}