import {TODAY_POLICY_VERSION} from "./nivora-version";
import {evaluateBuyCalibration,type BuyCalibrationResult,type BuyCalibrationInput} from "./nivora-buy-calibration";
export type TodayAction="BUY"|"ADD"|"HOLD"|"WAIT"|"AVOID"|"TRIM"|"SELL"|"NO ACTION";
export type TodayDecision={action:TodayAction;blocked:boolean;reason:string;policyVersion:string;buyPath?:string|null;buyTier?:"STARTER"|"CONFIRMED"|null;buyAudit?:BuyCalibrationResult|null};

type DecisionLike=BuyCalibrationInput;

export function deriveTodayAction(d:DecisionLike,owns:boolean):TodayDecision{
  const vetoes=d.vetoes||[],consistent=d.consistency?.ok!==false;
  if(!owns&&vetoes.length>0)return{action:"AVOID",blocked:true,reason:`Hard veto blocks new capital: ${vetoes[0]}`,policyVersion:TODAY_POLICY_VERSION,buyAudit:evaluateBuyCalibration(d)};
  if(d.thesisState==="Broken"||d.thesisScore<29||vetoes.length>=2||!consistent){
    return{action:owns?"SELL":"AVOID",blocked:true,reason:!consistent?`Decision blocked by consistency gate${d.consistency?.notes?.[0]?`: ${d.consistency.notes[0]}`:"."}`:"Long-term thesis/veto evidence blocks new risk.",policyVersion:TODAY_POLICY_VERSION};
  }
  if(d.thesisLabel==="BEARISH")return{action:owns?"SELL":"AVOID",blocked:true,reason:"Bearish fundamental evidence blocks new capital until the thesis materially recovers.",policyVersion:TODAY_POLICY_VERSION};
  const timing=d.timing?.label||"WAIT";
  const buyAudit=evaluateBuyCalibration(d);
  if(owns){
    if(d.thesisState==="Weakening"&&d.thesisScore<50)return{action:"TRIM",blocked:false,reason:"Thesis is weakening enough to reduce exposure while evidence is reassessed.",policyVersion:TODAY_POLICY_VERSION,buyAudit};
    if(d.valuationLabel==="Expensive"&&timing==="OVEREXTENDED"&&d.thesisScore<72)return{action:"TRIM",blocked:false,reason:"Valuation and extension are elevated relative to conviction.",policyVersion:TODAY_POLICY_VERSION,buyAudit};
    if(buyAudit.eligible)return{action:"ADD",blocked:false,reason:`${buyAudit.tier==="CONFIRMED"?"Confirmed":"Starter"} ${buyAudit.path!.replaceAll("_"," ").toLowerCase()} pathway supports staged additional capital.`,policyVersion:TODAY_POLICY_VERSION,buyPath:buyAudit.path,buyTier:buyAudit.tier,buyAudit};
    return{action:"HOLD",blocked:false,reason:"The position remains investable but does not require a change today.",policyVersion:TODAY_POLICY_VERSION,buyAudit};
  }
  if(buyAudit.eligible)return{action:"BUY",blocked:false,reason:`${buyAudit.tier==="CONFIRMED"?"Confirmed":"Starter"} ${buyAudit.path!.replaceAll("_"," ").toLowerCase()} pathway is satisfied for staged new capital.`,policyVersion:TODAY_POLICY_VERSION,buyPath:buyAudit.path,buyTier:buyAudit.tier,buyAudit};
  if(timing==="OVEREXTENDED"||timing==="WEAK")return{action:"WAIT",blocked:false,reason:buyAudit.primaryBlocker|| (timing==="OVEREXTENDED"?"Thesis may be valid, but price is too extended to chase.":"Price has not stabilized enough for a new position."),policyVersion:TODAY_POLICY_VERSION,buyAudit};
  if(d.thesisLabel==="BULLISH")return{action:"WAIT",blocked:false,reason:`Closest BUY path ${String(buyAudit.closestPath||"STANDARD").replaceAll("_"," ")} is not ready: ${buyAudit.primaryBlocker||"insufficient edge."}`,policyVersion:TODAY_POLICY_VERSION,buyAudit};
  return{action:"NO ACTION",blocked:false,reason:`Evidence is mixed and does not justify deploying new capital today${buyAudit.primaryBlocker?`: ${buyAudit.primaryBlocker}`:"."}`,policyVersion:TODAY_POLICY_VERSION,buyAudit};
}
