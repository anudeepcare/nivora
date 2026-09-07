import type {DecisionConfidence} from "./domain";
import type {MetricValidationState} from "../../v65/domain";

export interface DecisionConfidenceInput {
  coverage:number;
  freshness:number;
  sourceQuality:number;
  modelSuitability:number;
  agreement:number;
  validationState:MetricValidationState;
}

const clamp=(n:number)=>Math.max(0,Math.min(100,n));

export function buildDecisionConfidence(input:DecisionConfidenceInput):DecisionConfidence{
  let score=Math.round(
    clamp(input.coverage)*.28+
    clamp(input.freshness)*.14+
    clamp(input.sourceQuality)*.18+
    clamp(input.modelSuitability)*.22+
    clamp(input.agreement)*.18
  );
  if(input.validationState==="HEURISTIC")score=Math.min(score,74);
  else if(input.validationState==="COLLECTING")score=Math.min(score,59);
  else if(input.validationState==="UNAVAILABLE")score=Math.min(score,39);
  const label:DecisionConfidence["label"]=score>=78?"HIGH":score>=58?"MEDIUM":"LOW";
  return{score,label,coverage:clamp(input.coverage),freshness:clamp(input.freshness),sourceQuality:clamp(input.sourceQuality),modelSuitability:clamp(input.modelSuitability),agreement:clamp(input.agreement),validationState:input.validationState};
}

export const sourceQuality=(source:string)=>source==="SEC"?100:source==="ISSUER"?90:source==="PROVIDER"?75:60;

export function evidenceFreshness(asOf:string,evidenceAsOf:string|null,scope:string){
  if(!evidenceAsOf)return 35;
  const ageDays=Math.max(0,(Date.parse(asOf)-Date.parse(evidenceAsOf))/86400000);
  if(!Number.isFinite(ageDays))return 35;
  if(scope==="ANNUAL")return ageDays<=450?90:ageDays<=550?65:40;
  if(scope==="QUARTER"||scope==="TTM")return ageDays<=120?90:ageDays<=180?70:45;
  return ageDays<=2?95:ageDays<=7?80:ageDays<=30?60:35;
}
