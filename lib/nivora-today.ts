import {TODAY_POLICY_VERSION} from "./nivora-version";
export type TodayAction="BUY"|"ADD"|"HOLD"|"WAIT"|"TRIM"|"SELL"|"NO ACTION";
export type TodayDecision={action:TodayAction;blocked:boolean;reason:string;policyVersion:string};

type DecisionLike={thesisScore:number;opportunityScore:number;companyScore:number;thesisLabel:string;thesisState:string;timing?:{label?:string;score?:number};valuationLabel?:string;vetoes?:string[];consistency?:{ok?:boolean;notes?:string[]}};

export function deriveTodayAction(d:DecisionLike,owns:boolean):TodayDecision{
  const vetoes=d.vetoes||[],consistent=d.consistency?.ok!==false;
  if(d.thesisState==="Broken"||d.thesisScore<29||vetoes.length>=2||!consistent){
    return{action:owns?"SELL":"WAIT",blocked:true,reason:!consistent?`Decision blocked by consistency gate${d.consistency?.notes?.[0]?`: ${d.consistency.notes[0]}`:"."}`:"Long-term thesis/veto evidence blocks new risk.",policyVersion:TODAY_POLICY_VERSION};
  }
  if(d.thesisLabel==="BEARISH")return{action:owns?"SELL":"WAIT",blocked:true,reason:"Bearish fundamental evidence blocks a timing-led buy.",policyVersion:TODAY_POLICY_VERSION};
  const timing=d.timing?.label||"WAIT";
  if(owns){
    if(d.thesisState==="Weakening"&&d.thesisScore<50)return{action:"TRIM",blocked:false,reason:"Thesis is weakening enough to reduce exposure while evidence is reassessed.",policyVersion:TODAY_POLICY_VERSION};
    if(d.valuationLabel==="Expensive"&&timing==="OVEREXTENDED"&&d.thesisScore<72)return{action:"TRIM",blocked:false,reason:"Valuation and extension are elevated relative to conviction.",policyVersion:TODAY_POLICY_VERSION};
    if(d.thesisScore>=68&&d.opportunityScore>=62&&(timing==="ATTRACTIVE"||timing==="SELECTIVE"))return{action:"ADD",blocked:false,reason:"Constructive thesis and acceptable entry support staged additional capital.",policyVersion:TODAY_POLICY_VERSION};
    return{action:"HOLD",blocked:false,reason:"The position remains investable but does not require a change today.",policyVersion:TODAY_POLICY_VERSION};
  }
  if(timing==="OVEREXTENDED"||timing==="WEAK")return{action:"WAIT",blocked:false,reason:timing==="OVEREXTENDED"?"Thesis may be valid, but price is too extended to chase.":"Price has not stabilized enough for a new position.",policyVersion:TODAY_POLICY_VERSION};
  if(d.thesisScore>=74&&d.opportunityScore>=68&&d.companyScore>=62&&timing==="ATTRACTIVE")return{action:"BUY",blocked:false,reason:"Business, thesis, opportunity and entry timing are aligned for staged new capital.",policyVersion:TODAY_POLICY_VERSION};
  if(d.thesisScore>=68&&d.opportunityScore>=62&&timing==="SELECTIVE")return{action:"BUY",blocked:false,reason:"Constructive thesis supports a selective starter position with disciplined sizing.",policyVersion:TODAY_POLICY_VERSION};
  if(d.thesisLabel==="BULLISH")return{action:"WAIT",blocked:false,reason:"Long-term thesis is constructive, but today's entry does not provide enough edge.",policyVersion:TODAY_POLICY_VERSION};
  return{action:"NO ACTION",blocked:false,reason:"Evidence is mixed and does not justify deploying new capital today.",policyVersion:TODAY_POLICY_VERSION};
}
