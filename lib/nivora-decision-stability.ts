export type DecisionTransition="STABLE"|"EVIDENCE_CHANGE"|"NOISE_FLIP";
export function classifyDecisionTransition(previousAction:string,currentAction:string,materialEvidenceChanged:boolean):DecisionTransition{
  if(previousAction===currentAction)return "STABLE";
  return materialEvidenceChanged?"EVIDENCE_CHANGE":"NOISE_FLIP";
}
export function decisionStabilityMetrics(rows:Array<{action:string;materialEvidenceChanged:boolean}>){
  let transitions=0,flips=0,unexplainedFlips=0;
  for(let i=1;i<rows.length;i++){
    transitions++;if(rows[i-1].action!==rows[i].action){flips++;if(!rows[i].materialEvidenceChanged)unexplainedFlips++;}
  }
  const pct=(n:number)=>transitions?Math.round(n/transitions*1000)/10:0;
  return{transitions,flips,unexplainedFlips,flipRatePct:pct(flips),unexplainedFlipRatePct:pct(unexplainedFlips)};
}
