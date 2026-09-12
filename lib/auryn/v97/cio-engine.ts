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
  const compounderQuality=round(weighted([
    [s.business,.58],
    [s.earningsRevisions,.27],
    [s.catalystsRegime,.05],
    [s.riskAsymmetry,.10]
  ]));

  const weaknesses:string[]=[];
  if(finite(s.business)&&s.business<42)weaknesses.push("BUSINESS_QUALITY");
  if(finite(s.earningsRevisions)&&s.earningsRevisions<42)weaknesses.push("EARNINGS_REVISIONS");
  if(finite(s.riskAsymmetry)&&s.riskAsymmetry<30)weaknesses.push("RISK_ASYMMETRY");
  if(t.structuralBreak)weaknesses.push("STRUCTURAL_BREAK");

  const businessWeak=finite(s.business)?clamp(50-s.business)*1.4:0;
  const earningsWeak=finite(s.earningsRevisions)?clamp(50-s.earningsRevisions)*1.25:0;
  const riskWeak=finite(s.riskAsymmetry)?clamp(35-s.riskAsymmetry)*.8:0;
  let deterioration=round(Math.min(100,businessWeak*.42+earningsWeak*.38+riskWeak*.20+Math.max(0,weaknesses.length-1)*23+(t.structuralBreak?18:0)));
  // A lone weak family is a watch, not a thesis break.
  if(weaknesses.length<=1)deterioration=Math.min(deterioration,45);
  const deteriorationState:AurynCioAssessment["deterioration"]["state"]=
    deterioration>=75?"SEVERE":deterioration>=58?"DETERIORATING":deterioration>=32?"WATCH":"STABLE";

  // Valuation clock: an independently produced Base value may strengthen/weaken deployment.
  // Current price is used only here, after Base value already exists, to measure expected annual return.
  const iv=input.independentValuation;
  const independentExpectedReturn=iv&&iv.marketPrice>0&&iv.baseValue>0&&iv.horizonYears>0
    ?((iv.baseValue/iv.marketPrice)**(1/iv.horizonYears)-1)*100:null;
  const independentValuationScore=independentExpectedReturn==null?null:clamp(50+independentExpectedReturn*2);
  const valuationForDeployment=independentValuationScore==null?s.valuation:weighted([[s.valuation,.35],[independentValuationScore,.65]]);
  // Fast brain: deployment/timing. Valuation and asymmetry matter more than perfect technical confirmation.
  const technicalComposite=weighted([[t.trend,.35],[t.structure,.30],[t.momentum,.20],[t.flow,.15]]);
  const deploymentQuality=round(weighted([
    [valuationForDeployment,.25],
    [s.marketStructure,.18],
    [s.riskAsymmetry,.23],
    [s.catalystsRegime,.10],
    [technicalComposite,.24]
  ]));

  const agreement=round(100-Math.min(60,dispersion([s.business,s.earningsRevisions,s.valuation,s.marketStructure,s.riskAsymmetry,technicalComposite])*1.65));
  const missingValuationPenalty=finite(s.valuation)?1:.86;
  const confidence=round(clamp(input.evidenceCompleteness)*(.72+.28*(agreement/100))*missingValuationPenalty);

  const hardBreak=(finite(s.business)&&finite(s.earningsRevisions)&&s.business<30&&s.earningsRevisions<30)
    || (finite(s.riskAsymmetry)&&s.riskAsymmetry<20)
    || (t.structuralBreak&&compounderQuality<50)
    || deterioration>=78;

  let longTerm:AurynCioAssessment["longTermAction"]=
    hardBreak||deterioration>=70||compounderQuality<43?"UNATTRACTIVE":
    compounderQuality>=74&&deterioration<55?"ATTRACTIVE":"SELECTIVE";

  let newMoney:AurynCioAssessment["newMoneyAction"]="WAIT";
  if(hardBreak)newMoney="AVOID";
  else if(compounderQuality>=84&&deploymentQuality>=76&&confidence>=78&&(s.riskAsymmetry??50)>=62)newMoney="STRONG_BUY";
  else if(compounderQuality>=72&&deploymentQuality>=63&&confidence>=68&&(s.riskAsymmetry??50)>=52)newMoney="BUY";
  else if(compounderQuality>=66&&deploymentQuality>=55&&confidence>=58&&(s.riskAsymmetry??50)>=40)newMoney="START_SMALL";
  else if(compounderQuality>=60&&deploymentQuality>=60&&confidence>=66)newMoney="START_SMALL";
  else if(compounderQuality<38&&deploymentQuality<42)newMoney="AVOID";

  let owner:AurynCioAssessment["ownerAction"]=
    deterioration>=86?"EXIT":
    deterioration>=68?"REDUCE":
    compounderQuality>=78&&deploymentQuality>=58&&confidence>=65?"ADD":
    compounderQuality>=60?"HOLD":
    compounderQuality>=45?"WATCH":"REDUCE";
  if(t.structuralBreak&&compounderQuality<45)owner="EXIT";

  const upgradeConditions:string[]=[];
  const downgradeConditions:string[]=[];
  if((s.valuation??50)<65)upgradeConditions.push("Expected return / valuation improves into an attractive range.");
  if((s.marketStructure??50)<60)upgradeConditions.push("Completed-bar market structure improves without thesis deterioration.");
  if((s.riskAsymmetry??50)<55)upgradeConditions.push("Downside/upside asymmetry improves.");
  if(compounderQuality<74)upgradeConditions.push("Business quality and forward fundamental evidence strengthen.");
  downgradeConditions.push("Two or more fundamental evidence families deteriorate persistently.");
  downgradeConditions.push("Risk/asymmetry falls below the severe-risk threshold.");
  if(!t.structuralBreak)downgradeConditions.push("Canonical structural invalidation is confirmed on completed data.");

  const rationale=[
    `Compounder quality ${compounderQuality}/100 is driven primarily by business and forward-fundamental evidence.`,
    `Deployment quality ${deploymentQuality}/100 governs timing and capital intensity separately from long-term quality.`,
    `Deterioration ${deterioration}/100 (${deteriorationState.toLowerCase()}) requires corroboration rather than one noisy input.`,
    `Decision confidence ${confidence}/100 reflects evidence completeness and cross-pillar agreement.`
  ];

  return{
    compounderQuality,
    deterioration:{score:deterioration,state:deteriorationState,corroboratingWeaknesses:weaknesses},
    deploymentQuality,agreement,confidence,
    newMoneyAction:newMoney,ownerAction:owner,longTermAction:longTerm,
    upgradeConditions,downgradeConditions,rationale
  };
}
