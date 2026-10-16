import type {AurynCioAssessment,CioScoreInputs,CioTechnicalInputs} from "./domain";

const clamp=(n:number)=>Math.max(0,Math.min(100,Number.isFinite(n)?n:50));
const round=(n:number)=>Math.round(clamp(n));
const finite=(n:number|null|undefined):n is number=>n!=null&&Number.isFinite(n);
const weighted=(xs:Array<[number|null|undefined,number]>,fallback=50)=>{
  const a=xs.filter(([v])=>finite(v)) as Array<[number,number]>;
  const d=a.reduce((s,[,w])=>s+w,0);
  return d?a.reduce((s,[v,w])=>s+clamp(v)*w,0)/d:fallback;
};
const dispersion=(xs:Array<number|null|undefined>)=>{
  const a=xs.filter(finite);
  if(a.length<2)return 0;
  const mean=a.reduce((s,x)=>s+x,0)/a.length;
  return Math.sqrt(a.reduce((s,x)=>s+(x-mean)**2,0)/a.length);
};

export function buildAurynCioAssessment(input:{
  scores:CioScoreInputs;
  technical:CioTechnicalInputs;
  evidenceCompleteness:number;
  independentValuation?:{marketPrice:number;baseValue:number;horizonYears:number;confidence:number}|null;
}):AurynCioAssessment{
  const s=input.scores,t=input.technical;
  // Slow brain: business economics dominate. Tactical price action never enters this score.
  const fundamentalsKnown=finite(s.business);
  const compounderQuality=fundamentalsKnown?round(weighted([[s.business,.68],[s.earningsRevisions,.32]])):null;

  const weaknesses:string[]=[];
  if(finite(s.business)&&s.business<42)weaknesses.push("BUSINESS_QUALITY");
  if(finite(s.earningsRevisions)&&s.earningsRevisions<42)weaknesses.push("EARNINGS_REVISIONS");
  const businessWeak=finite(s.business)?clamp(50-s.business)*1.4:0;
  const earningsWeak=finite(s.earningsRevisions)?clamp(50-s.earningsRevisions)*1.25:0;
  let deterioration=round(businessWeak*.52+earningsWeak*.48+(weaknesses.length===2?45:0));
  if(weaknesses.length<=1)deterioration=Math.min(deterioration,45);
  const deteriorationState:AurynCioAssessment["deterioration"]["state"]=
    !fundamentalsKnown?"UNASSESSED":deterioration>=75?"SEVERE":deterioration>=58?"DETERIORATING":deterioration>=32?"WATCH":"STABLE";

  // Valuation clock: an independently produced Base value may strengthen/weaken deployment.
  // Current price is used only here, after Base value already exists, to measure expected annual return.
  const iv=input.independentValuation;
  const independentExpectedReturn=iv&&iv.marketPrice>0&&iv.baseValue>0&&iv.horizonYears>0
    ?((iv.baseValue/iv.marketPrice)**(1/iv.horizonYears)-1)*100:null;
  const independentValuationScore=independentExpectedReturn==null?null:clamp(50+independentExpectedReturn*2);
  const valuationForDeployment=independentValuationScore==null?s.valuation:weighted([[s.valuation,.35],[independentValuationScore,.65]]);
  // Fast brain: deployment/timing. Valuation and asymmetry matter more than perfect technical confirmation.
  const technicalComposite=weighted([[t.trend,.35],[t.structure,.30],[t.momentum,.20],[t.flowAvailable===false?null:t.flow,.15]]);
  const deploymentQuality=round(weighted([
    [valuationForDeployment,.25],

    [s.riskAsymmetry,.23],
    [s.catalystsRegime,.10],
    [weighted([[s.marketStructure,.5],[technicalComposite,.5]]),.42]
  ]));

  const agreement=round(100-Math.min(60,dispersion([s.business,s.earningsRevisions,s.valuation,s.marketStructure,s.riskAsymmetry])*1.65));
  const missingValuationPenalty=finite(s.valuation)?1:.86;
  const coverage=Math.min(clamp(input.evidenceCompleteness),Object.values(s).filter(finite).length/6*100);
  const confidence=round(coverage*(.72+.28*(agreement/100))*missingValuationPenalty);

  const hardBreak=fundamentalsKnown&&finite(s.earningsRevisions)&&((s.business!<30&&s.earningsRevisions<30)||deterioration>=78);
  const quality=compounderQuality;
  const longTerm:AurynCioAssessment["longTermAction"]=quality===null?"UNASSESSED":
    hardBreak||deterioration>=70||quality<43?"UNATTRACTIVE":
    quality>=74&&deterioration<55?"ATTRACTIVE":"SELECTIVE";
  // Unknown valuation or allocation risk never earns a capital instruction.
  const eligible=quality!==null&&finite(s.valuation)&&finite(s.riskAsymmetry)&&finite(s.marketStructure)
    &&s.riskAsymmetry>=20&&!t.structuralBreak;
  let newMoney:AurynCioAssessment["newMoneyAction"]="WAIT";
  if(hardBreak)newMoney="AVOID";
  else if(eligible){
    if(quality>=84&&deploymentQuality>=76&&confidence>=78&&s.riskAsymmetry!>=62)newMoney="STRONG_BUY";
    else if(quality>=72&&deploymentQuality>=63&&confidence>=68&&s.riskAsymmetry!>=52)newMoney="BUY";
    else if(quality>=66&&deploymentQuality>=55&&confidence>=58&&s.riskAsymmetry!>=40)newMoney="START_SMALL";
    else if(quality>=60&&deploymentQuality>=60&&confidence>=66)newMoney="START_SMALL";
    else if(quality<38&&deploymentQuality<42)newMoney="AVOID";
  }
  const owner:AurynCioAssessment["ownerAction"]=quality===null?"WATCH":
    deterioration>=86?"EXIT":deterioration>=68?"REDUCE":
    eligible&&quality>=78&&deploymentQuality>=58&&confidence>=65?"ADD":
    quality>=60?"HOLD":quality>=45?"WATCH":"REDUCE";

  const upgradeConditions:string[]=[];
  const downgradeConditions:string[]=[];
  if((s.valuation??50)<65)upgradeConditions.push("Expected return / valuation improves into an attractive range.");
  if((s.marketStructure??50)<60)upgradeConditions.push("Completed-bar market structure improves without thesis deterioration.");
  if((s.riskAsymmetry??50)<55)upgradeConditions.push("Downside/upside asymmetry improves.");
  if(compounderQuality===null||compounderQuality<74)upgradeConditions.push("Business quality and forward fundamental evidence strengthen.");
  downgradeConditions.push("Two or more fundamental evidence families deteriorate persistently.");
  downgradeConditions.push("Risk/asymmetry falls below the severe-risk threshold.");
  if(!t.structuralBreak)downgradeConditions.push("Canonical structural invalidation is confirmed on completed data.");

  const rationale=[
    compounderQuality===null?"Business assessment is unavailable: sourced business evidence is required.":`Compounder quality ${compounderQuality}/100 uses business and fundamental evidence only.`,
    `Deployment quality ${deploymentQuality}/100 governs timing and capital intensity separately from long-term quality.`,
    `Deterioration ${deterioration}/100 (${deteriorationState.toLowerCase()}) requires corroboration rather than one noisy input.`,
    `Evidence quality ${confidence}/100 reflects coverage and cross-family agreement; it is not an outcome probability.`
  ];

  return{
    compounderQuality,
    deterioration:{score:deterioration,state:deteriorationState,corroboratingWeaknesses:weaknesses},
    deploymentQuality,agreement,confidence,
    newMoneyAction:newMoney,ownerAction:owner,longTermAction:longTerm,
    upgradeConditions,downgradeConditions,rationale
  };
}
