
import type {BuyCalibrationResult} from "./nivora-buy-calibration";

export type ActionTriggerResult={currentAction:string;targetAction:string;requirements:string[];blockers:string[];summary:string};
export function buildActionTriggers(d:{
 action:string;owns:boolean;thesisScore:number;opportunityScore:number;companyScore:number;
 timingScore:number;timingLabel:string;thesisState:string;thesisLabel?:string;valuationLabel?:string;vetoes?:string[];
 buyAudit?:BuyCalibrationResult|null;
}):ActionTriggerResult{
 const audit=d.buyAudit;
 const blockers:string[]=[];
 if(audit?.blockers?.length)blockers.push(...audit.blockers.slice(0,3));
 else{
  if(d.timingLabel==="WEAK"||d.timingLabel==="OVEREXTENDED"||d.timingScore<45)blockers.push(`Timing is ${d.timingScore}/100 (${d.timingLabel}); price/technical evidence must stabilize.`);
  if(d.thesisScore<68)blockers.push(`Thesis ${d.thesisScore}/100 is below the constructive capital threshold.`);
  if(d.opportunityScore<62)blockers.push(`Opportunity ${d.opportunityScore}/100 is below the staged-capital threshold.`);
  if((d.vetoes?.length||0)>0)blockers.push(`Hard veto active: ${d.vetoes![0]}.`);
 }
 const bearish=d.thesisLabel==="BEARISH"||d.thesisState==="Broken";

 if(d.owns){
  if(d.action==="SELL"||d.action==="TRIM")return{
   currentAction:d.action,targetAction:"HOLD",
   requirements:["Thesis must recover and no hard veto may remain.","Forward evidence must stop deteriorating."],
   blockers,summary:"Risk must improve before NIVORA stops reducing exposure."
  };
  if(d.action==="ADD"&&audit?.eligible)return{
   currentAction:d.action,targetAction:"ADD",
   requirements:audit.paths.find(x=>x.path===audit.path)?.passed.slice(0,5)||[],
   blockers:[],summary:`${audit.tier} ${audit.path?.replaceAll("_"," ")} path is currently satisfied.`
  };
  return{
   currentAction:d.action,targetAction:"ADD",
   requirements:audit?.paths?.[0]?.failed||["A calibrated owner ADD pathway must be satisfied."],
   blockers,summary:audit?.primaryBlocker?`Closest ADD path ${audit.closestPath?.replaceAll("_"," ")}: ${audit.primaryBlocker}`:"Additional capital requires a calibrated BUY/ADD pathway."
  };
 }

 if(bearish||(d.vetoes?.length||0)>0||d.action==="AVOID")return{
  currentAction:d.action,targetAction:"REASSESS",
  requirements:["Bearish/veto evidence must materially improve.","Thesis must recover above the constructive threshold.","No hard veto may remain before any new-money entry is considered."],
  blockers,summary:"No new-money entry is authorized. Reassess only after the blocking thesis/risk evidence improves."
 };

 if(d.action==="BUY"&&audit?.eligible)return{
  currentAction:d.action,targetAction:"BUY",
  requirements:audit.paths.find(x=>x.path===audit.path)?.passed.slice(0,5)||[],
  blockers:[],summary:`${audit.tier} ${audit.path?.replaceAll("_"," ")} path is satisfied.`
 };

 return{
  currentAction:d.action,targetAction:"BUY",
  requirements:audit?.paths?.[0]?.failed||["Thesis ≥ 74/100 for a confirmed entry, or an archetype-calibrated starter path","Opportunity must clear the applicable path threshold","Company quality must clear the applicable path threshold","Timing must meet the applicable path threshold","No hard veto"],
  blockers,summary:audit?.primaryBlocker?`Closest BUY path ${audit.closestPath?.replaceAll("_"," ")}: ${audit.primaryBlocker}`:blockers.length?`Current blocker: ${blockers[0]}`:"BUY requires a calibrated pathway."
 };
}
