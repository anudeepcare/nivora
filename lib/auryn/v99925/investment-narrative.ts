const m=(x:any)=>Number.isFinite(Number(x))?`$${Number(x).toFixed(2)}`:"—";
export function buildInvestmentNarrative({businessScore,trajectory,valuationState,fairValue,marginOfSafety,roadmap,timingState,changed}:any){
 const whyOwn=businessScore==null?"Business evidence is still building.":`${businessScore>=85?"High-quality":"Current"} business evidence scores ${Math.round(businessScore)}/100${trajectory?` with a ${String(trajectory).toLowerCase()} trajectory`:""}.`;
 const whatWorth=fairValue!=null?`Fundamental fair value is ${m(fairValue)}${marginOfSafety!=null?`; model margin of safety is ${Number(marginOfSafety).toFixed(1)}%`:""}.`:`Valuation evidence is ${String(valuationState||"partial").toLowerCase()}; AURYN withholds fair value until the selected method is sufficiently supported.`;
 const whereAccumulate=roadmap?.entryLow!=null?`Long-term structural accumulation is strongest around ${m(roadmap.entryLow)}–${m(roadmap.entryHigh)}; this is structural context, not a guaranteed reversal zone.`:"Long-term accumulation levels are still building.";
 const whatConfirms=roadmap?.nextTrigger!=null?`The next long-term confirmation is ${m(roadmap.nextTrigger)}${roadmap.wma50?`; the 50-WMA is ${m(roadmap.wma50)}`:""}.`:"Long-term confirmation is still building.";
 const whatBreaks=roadmap?.invalidation!=null?`A sustained weekly loss of ${m(roadmap.invalidation)} invalidates this mapped price structure. Business-thesis deterioration is evaluated separately.`:"No decision-grade structural invalidation is published yet.";
 const whatChanged=changed||"No canonical long-term thesis change is confirmed on this snapshot.";
 const nextDecision=`${timingState||"Current timing"} remains the execution state. ${roadmap?.nextTrigger!=null?`Reassess at ${m(roadmap.nextTrigger)} or on material fundamental evidence change.`:"Reassess when new decision-grade evidence arrives."}`;
 return{whyOwn,whatWorth,whereAccumulate,whatConfirms,whatBreaks,whatChanged,nextDecision};
}
