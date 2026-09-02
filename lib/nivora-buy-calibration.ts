
export type BuyPath=
 |"QUALITY_COMPOUNDER"
 |"CYCLICAL_VALUE"
 |"GROWTH_MOMENTUM"
 |"FINANCIAL_VALUE"
 |"CATALYST_GROWTH"
 |"BALANCED_STANDARD";

export type BuyTier="STARTER"|"CONFIRMED";

export type BuyCalibrationInput={
 symbol?:string;
 thesisScore:number;
 opportunityScore:number;
 companyScore:number;
 thesisLabel:string;
 thesisState:string;
 timing?:{label?:string;score?:number};
 valuationLabel?:string;
 vetoes?:string[];
 consistency?:{ok?:boolean;notes?:string[]};
 archetype?:string;
 factors?:{financial?:number|null;growth?:number|null;forward?:number|null;risk?:number|null};
 valuationAvailable?:boolean;
 valuationRobustness?:string;
 stabilizationState?:string;
 marketModelDisagreement?:string;
 earlyWarningLevel?:string;
};

export type BuyPathResult={
 path:BuyPath;
 eligible:boolean;
 tier:BuyTier;
 passed:string[];
 failed:string[];
 distance:number;
};

export type BuyCalibrationResult={
 eligible:boolean;
 path:BuyPath|null;
 tier:BuyTier|null;
 blockers:string[];
 primaryBlocker:string;
 closestPath:BuyPath|null;
 paths:BuyPathResult[];
 hardBlocked:boolean;
};

const n=(x:any,f=50)=>Number.isFinite(Number(x))?Number(x):f;
const yes=(ok:boolean,label:string,passed:string[],failed:string[],gap=1)=>{
 (ok?passed:failed).push(label);
 return ok?0:gap;
};

function hardBlocks(x:BuyCalibrationInput){
 const out:string[]=[];
 if(x.consistency?.ok===false)out.push(`Consistency gate: ${x.consistency?.notes?.[0]||"decision evidence conflicts."}`);
 if((x.vetoes?.length||0)>0)out.push(`Hard veto: ${x.vetoes![0]}`);
 if(x.thesisState==="Broken"||x.thesisScore<29)out.push("Long-term thesis is broken or below the minimum capital threshold.");
 if(String(x.thesisLabel).toUpperCase()==="BEARISH")out.push("Bearish fundamental thesis blocks new capital.");
 const timing=String(x.timing?.label||"WAIT").toUpperCase();
 if(timing==="WEAK")out.push("Timing is WEAK; price stabilization is required.");
 if(timing==="OVEREXTENDED")out.push("Timing is OVEREXTENDED; NIVORA will not chase.");
 if(String(x.stabilizationState||"").toUpperCase()==="REQUIRED")out.push("Price stabilization is required before new capital.");
 if(String(x.earlyWarningLevel||"").toUpperCase()==="HIGH")out.push("Fast-moving early-warning risk is HIGH; new capital is withheld.");
 if(String(x.marketModelDisagreement||"").toUpperCase()==="HIGH"&&String(x.valuationRobustness||"").toUpperCase()==="FRAGILE")out.push("High market/model disagreement plus fragile valuation blocks new capital.");
 return out;
}

function qualityCompounder(x:BuyCalibrationInput):BuyPathResult{
 const p:string[]=[],f:string[]=[];let d=0;
 const timing=n(x.timing?.score,0),financial=n(x.factors?.financial),forward=n(x.factors?.forward),risk=n(x.factors?.risk,60);
 d+=yes(x.thesisScore>=72,"Thesis ≥ 72",p,f,Math.max(0,72-x.thesisScore));
 d+=yes(x.companyScore>=72,"Company quality ≥ 72",p,f,Math.max(0,72-x.companyScore));
 d+=yes(x.opportunityScore>=64,"Opportunity ≥ 64",p,f,Math.max(0,64-x.opportunityScore));
 d+=yes(forward>=60,"Forward evidence ≥ 60",p,f,Math.max(0,60-forward));
 d+=yes(financial>=58,"Financial quality ≥ 58",p,f,Math.max(0,58-financial));
 d+=yes(risk<=58,"Risk pressure ≤ 58",p,f,Math.max(0,risk-58));
 d+=yes(timing>=50,"Timing score ≥ 50",p,f,Math.max(0,50-timing)*1.5);
 if(String(x.stabilizationState||"").toUpperCase()==="WATCH")d+=yes(timing>=55,"WATCH stabilization requires timing ≥ 55",p,f,Math.max(0,55-timing)*1.5);
 const eligible=f.length===0;
 return{path:"QUALITY_COMPOUNDER",eligible,tier:timing>=60&&x.opportunityScore>=70?"CONFIRMED":"STARTER",passed:p,failed:f,distance:+d.toFixed(2)};
}

function cyclicalValue(x:BuyCalibrationInput):BuyPathResult{
 const p:string[]=[],f:string[]=[];let d=0;
 const timing=n(x.timing?.score,0),financial=n(x.factors?.financial),forward=n(x.factors?.forward),risk=n(x.factors?.risk,60);
 d+=yes(x.thesisScore>=68,"Thesis ≥ 68",p,f,Math.max(0,68-x.thesisScore));
 d+=yes(x.companyScore>=64,"Company quality ≥ 64",p,f,Math.max(0,64-x.companyScore));
 d+=yes(x.opportunityScore>=62,"Opportunity ≥ 62",p,f,Math.max(0,62-x.opportunityScore));
 d+=yes(financial>=65,"Financial quality ≥ 65",p,f,Math.max(0,65-financial));
 d+=yes(forward>=58,"Forward evidence ≥ 58",p,f,Math.max(0,58-forward));
 d+=yes(risk<=58,"Risk pressure ≤ 58",p,f,Math.max(0,risk-58));
 d+=yes(timing>=55,"Timing score ≥ 55",p,f,Math.max(0,55-timing)*1.5);
 if(x.valuationAvailable===true)d+=yes(x.valuationLabel!=="Expensive","Valuation is not Expensive",p,f,x.valuationLabel==="Expensive"?8:0);
 const eligible=f.length===0;
 return{path:"CYCLICAL_VALUE",eligible,tier:timing>=65&&x.opportunityScore>=68?"CONFIRMED":"STARTER",passed:p,failed:f,distance:+d.toFixed(2)};
}

function growthMomentum(x:BuyCalibrationInput):BuyPathResult{
 const p:string[]=[],f:string[]=[];let d=0;
 const timing=n(x.timing?.score,0),financial=n(x.factors?.financial),growth=n(x.factors?.growth),forward=n(x.factors?.forward),risk=n(x.factors?.risk,60);
 d+=yes(x.thesisScore>=75,"Thesis ≥ 75",p,f,Math.max(0,75-x.thesisScore));
 d+=yes(x.companyScore>=68,"Company quality ≥ 68",p,f,Math.max(0,68-x.companyScore));
 d+=yes(x.opportunityScore>=65,"Opportunity ≥ 65",p,f,Math.max(0,65-x.opportunityScore));
 d+=yes(growth>=72,"Growth evidence ≥ 72",p,f,Math.max(0,72-growth));
 d+=yes(forward>=68,"Forward evidence ≥ 68",p,f,Math.max(0,68-forward));
 d+=yes(financial>=48,"Financial quality ≥ 48",p,f,Math.max(0,48-financial));
 d+=yes(risk<=58,"Risk pressure ≤ 58",p,f,Math.max(0,risk-58));
 d+=yes(timing>=58,"Timing score ≥ 58",p,f,Math.max(0,58-timing)*1.5);
 const eligible=f.length===0;
 return{path:"GROWTH_MOMENTUM",eligible,tier:timing>=68&&forward>=75?"CONFIRMED":"STARTER",passed:p,failed:f,distance:+d.toFixed(2)};
}

function financialValue(x:BuyCalibrationInput):BuyPathResult{
 const p:string[]=[],f:string[]=[];let d=0;
 const timing=n(x.timing?.score,0),financial=n(x.factors?.financial),forward=n(x.factors?.forward),risk=n(x.factors?.risk,60);
 d+=yes(x.thesisScore>=68,"Thesis ≥ 68",p,f,Math.max(0,68-x.thesisScore));
 d+=yes(x.companyScore>=65,"Company quality ≥ 65",p,f,Math.max(0,65-x.companyScore));
 d+=yes(x.opportunityScore>=62,"Opportunity ≥ 62",p,f,Math.max(0,62-x.opportunityScore));
 d+=yes(financial>=68,"Financial quality ≥ 68",p,f,Math.max(0,68-financial));
 d+=yes(forward>=55,"Forward evidence ≥ 55",p,f,Math.max(0,55-forward));
 d+=yes(risk<=55,"Risk pressure ≤ 55",p,f,Math.max(0,risk-55));
 d+=yes(timing>=52,"Timing score ≥ 52",p,f,Math.max(0,52-timing)*1.5);
 if(x.valuationAvailable===true)d+=yes(x.valuationLabel!=="Expensive","Valuation is not Expensive",p,f,x.valuationLabel==="Expensive"?8:0);
 const eligible=f.length===0;
 return{path:"FINANCIAL_VALUE",eligible,tier:timing>=62&&x.opportunityScore>=68?"CONFIRMED":"STARTER",passed:p,failed:f,distance:+d.toFixed(2)};
}

function catalystGrowth(x:BuyCalibrationInput):BuyPathResult{
 const p:string[]=[],f:string[]=[];let d=0;
 const timing=n(x.timing?.score,0),growth=n(x.factors?.growth),forward=n(x.factors?.forward),risk=n(x.factors?.risk,60);
 d+=yes(x.thesisScore>=78,"Thesis ≥ 78",p,f,Math.max(0,78-x.thesisScore));
 d+=yes(x.companyScore>=62,"Company quality ≥ 62",p,f,Math.max(0,62-x.companyScore));
 d+=yes(x.opportunityScore>=66,"Opportunity ≥ 66",p,f,Math.max(0,66-x.opportunityScore));
 d+=yes(growth>=75,"Growth evidence ≥ 75",p,f,Math.max(0,75-growth));
 d+=yes(forward>=72,"Forward/catalyst evidence ≥ 72",p,f,Math.max(0,72-forward));
 d+=yes(risk<=52,"Risk pressure ≤ 52",p,f,Math.max(0,risk-52));
 d+=yes(timing>=60,"Timing score ≥ 60",p,f,Math.max(0,60-timing)*1.5);
 const eligible=f.length===0;
 return{path:"CATALYST_GROWTH",eligible,tier:timing>=68&&forward>=80?"CONFIRMED":"STARTER",passed:p,failed:f,distance:+d.toFixed(2)};
}

function balanced(x:BuyCalibrationInput):BuyPathResult{
 const p:string[]=[],f:string[]=[];let d=0;
 const timing=n(x.timing?.score,0),forward=n(x.factors?.forward,60),risk=n(x.factors?.risk,55);
 d+=yes(x.thesisScore>=72,"Thesis ≥ 72",p,f,Math.max(0,72-x.thesisScore));
 d+=yes(x.companyScore>=65,"Company quality ≥ 65",p,f,Math.max(0,65-x.companyScore));
 d+=yes(x.opportunityScore>=65,"Opportunity ≥ 65",p,f,Math.max(0,65-x.opportunityScore));
 d+=yes(forward>=58,"Forward evidence ≥ 58",p,f,Math.max(0,58-forward));
 d+=yes(risk<=58,"Risk pressure ≤ 58",p,f,Math.max(0,risk-58));
 d+=yes(timing>=55,"Timing score ≥ 55",p,f,Math.max(0,55-timing)*1.5);
 const eligible=f.length===0;
 return{path:"BALANCED_STANDARD",eligible,tier:timing>=65&&x.opportunityScore>=70?"CONFIRMED":"STARTER",passed:p,failed:f,distance:+d.toFixed(2)};
}

function candidatePaths(x:BuyCalibrationInput){
 const a=String(x.archetype||"general").toLowerCase();
 if(a==="compounder"||a==="infrastructure")return[qualityCompounder(x),balanced(x)];
 if(a==="cyclical"||a==="miner")return[cyclicalValue(x),balanced(x)];
 if(a==="hypergrowth"||a==="ai_infrastructure")return[growthMomentum(x),balanced(x)];
 if(a==="pre_scale"||a==="biotech")return[catalystGrowth(x)];
 if(a==="bank"||a==="insurer")return[financialValue(x),balanced(x)];
 return[balanced(x),qualityCompounder(x)];
}

export function evaluateBuyCalibration(x:BuyCalibrationInput):BuyCalibrationResult{
 const hard=hardBlocks(x);
 const paths=candidatePaths(x).sort((a,b)=>a.distance-b.distance);
 if(hard.length)return{eligible:false,path:null,tier:null,blockers:hard,primaryBlocker:hard[0],closestPath:paths[0]?.path||null,paths,hardBlocked:true};
 const winner=paths.find(p=>p.eligible);
 if(winner)return{eligible:true,path:winner.path,tier:winner.tier,blockers:[],primaryBlocker:"",closestPath:winner.path,paths,hardBlocked:false};
 const closest=paths[0];
 const blockers=closest?.failed||["No calibrated BUY pathway is currently satisfied."];
 return{eligible:false,path:null,tier:null,blockers,primaryBlocker:blockers[0],closestPath:closest?.path||null,paths,hardBlocked:false};
}

export function auditDecisionDistribution(rows:BuyCalibrationInput[]){
 const actions:Record<string,number>={},paths:Record<string,number>={},blockers:Record<string,number>={};
 const details=rows.map(x=>{
  const cal=evaluateBuyCalibration(x);
  let action:string;
  if(cal.eligible)action="BUY";
  else if((x.vetoes?.length||0)>0||x.consistency?.ok===false||x.thesisState==="Broken"||x.thesisScore<29||String(x.thesisLabel).toUpperCase()==="BEARISH")action="AVOID";
  else if(String(x.thesisLabel).toUpperCase()==="BULLISH")action="WAIT";
  else action="NO ACTION";
  actions[action]=(actions[action]||0)+1;
  if(cal.path)paths[cal.path]=(paths[cal.path]||0)+1;
  if(!cal.eligible&&cal.primaryBlocker)blockers[cal.primaryBlocker]=(blockers[cal.primaryBlocker]||0)+1;
  return{symbol:x.symbol||"",action,calibration:cal};
 });
 const dominantBlockers=Object.entries(blockers).sort((a,b)=>b[1]-a[1]).map(([reason,count])=>({reason,count}));
 return{total:rows.length,actions,paths,blockers,dominantBlockers,details};
}
