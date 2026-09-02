
export type ActionTriggerResult={currentAction:string;targetAction:string;requirements:string[];blockers:string[];summary:string};
export function buildActionTriggers(d:{
 action:string;owns:boolean;thesisScore:number;opportunityScore:number;companyScore:number;
 timingScore:number;timingLabel:string;thesisState:string;thesisLabel?:string;valuationLabel?:string;vetoes?:string[]
}):ActionTriggerResult{
 const blockers:string[]=[];
 if(d.timingLabel==="WEAK"||d.timingLabel==="OVEREXTENDED"||d.timingScore<45)blockers.push(`Timing is ${d.timingScore}/100 (${d.timingLabel}); price/technical evidence must stabilize.`);
 if(d.thesisScore<68)blockers.push(`Thesis ${d.thesisScore}/100 is below the constructive capital threshold.`);
 if(d.opportunityScore<62)blockers.push(`Opportunity ${d.opportunityScore}/100 is below the staged-capital threshold.`);
 if((d.vetoes?.length||0)>0)blockers.push(`Hard veto active: ${d.vetoes![0]}.`);
 const bearish=d.thesisLabel==="BEARISH"||d.thesisState==="Broken";

 if(d.owns){
  if(d.action==="SELL"||d.action==="TRIM")return{
   currentAction:d.action,targetAction:"HOLD",
   requirements:["Thesis must recover and no hard veto may remain.","Forward evidence must stop deteriorating."],
   blockers,summary:"Risk must improve before NIVORA stops reducing exposure."
  };
  return{
   currentAction:d.action,targetAction:"ADD",
   requirements:["Thesis ≥ 68/100","Opportunity ≥ 62/100","Timing must be ATTRACTIVE or SELECTIVE","No hard veto"],
   blockers,summary:"Additional capital requires durable thesis evidence, acceptable entry quality and no veto."
  };
 }

 if(bearish||(d.vetoes?.length||0)>0||d.action==="AVOID")return{
  currentAction:d.action,targetAction:"REASSESS",
  requirements:["Bearish/veto evidence must materially improve.","Thesis must recover above the constructive threshold.","No hard veto may remain before any new-money entry is considered."],
  blockers,summary:"No new-money entry is authorized. Reassess only after the blocking thesis/risk evidence improves."
 };

 return{
  currentAction:d.action,targetAction:"BUY",
  requirements:["Thesis ≥ 74/100 for an ATTRACTIVE entry, or ≥ 68/100 for SELECTIVE","Opportunity ≥ 68/100 for ATTRACTIVE, or ≥ 62/100 for SELECTIVE","Company quality ≥ 62/100","Timing must be ATTRACTIVE or SELECTIVE","No hard veto"],
  blockers,summary:blockers.length?`Current blocker: ${blockers[0]}`:"BUY conditions are close to satisfied; final action still depends on consistency and veto gates."
 };
}
