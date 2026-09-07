import type {BusinessModel,CanonicalFactorKey,DecisionConfidence,Horizon,HorizonDecision,InvestmentThesis,MoatAssessment,PrimaryInvestmentAction} from "./domain";

export interface ResolveV4DecisionInput {
  businessModel:BusinessModel;
  slowScore:number|null;
  opportunityScore:number|null;
  riskScore:number|null;
  technicalScore:number|null;
  valuationScore:number|null;
  catalystScore:number|null;
  sectorScore:number|null;
  thesis:Pick<InvestmentThesis,"strength"|"direction">;
  moat:Pick<MoatAssessment,"score"|"direction">;
  confidence:DecisionConfidence;
  missingRequired:CanonicalFactorKey[];
  hardVetoes:string[];
  softConstraints:string[];
  modelSuitability:number;
}

export interface ResolveV4DecisionResult {
  primaryAction:PrimaryInvestmentAction;
  horizonDecisions:HorizonDecision[];
  reasonCodes:string[];
}

const HORIZONS:Horizon[]=["NOW","SWING","SIX_TO_TWELVE_MONTHS","THREE_TO_FIVE_YEARS"];
const weighted=(parts:Array<[number|null,number]>)=>{
  const usable=parts.filter(([v,w])=>v!=null&&Number.isFinite(v)&&w>0) as Array<[number,number]>;
  const w=usable.reduce((s,[,weight])=>s+weight,0);
  return w?usable.reduce((s,[v,weight])=>s+v*weight,0)/w:50;
};
const actionFromScore=(score:number):PrimaryInvestmentAction=>score>=80?"STRONG_BUY":score>=66?"BUY":score>=50?"HOLD":score>=35?"REDUCE":"SELL";
const fixed=(action:PrimaryInvestmentAction,confidence:DecisionConfidence,reason:string):ResolveV4DecisionResult=>({
  primaryAction:action,reasonCodes:[reason],horizonDecisions:HORIZONS.map(horizon=>({horizon,action,confidence,reasonCodes:[reason]}))
});
const buy=(a:PrimaryInvestmentAction)=>a==="BUY"||a==="STRONG_BUY";

function applyHorizonGuards(horizon:Horizon,action:PrimaryInvestmentAction,input:ResolveV4DecisionInput){
  let out=action;
  if(input.riskScore!=null&&input.riskScore>=85&&buy(out))out="HOLD";
  if(input.thesis.direction==="WEAKENING"&&out==="STRONG_BUY")out="BUY";
  if(input.thesis.direction==="WEAKENING"&&input.thesis.strength!=null&&input.thesis.strength<58&&out==="BUY")out="HOLD";
  if(input.modelSuitability<.60&&out==="STRONG_BUY")out="BUY";
  if(input.modelSuitability<.60&&out==="BUY")out="HOLD";
  if(input.softConstraints.includes("TECHNICAL_INSTABILITY")&&(horizon==="NOW"||horizon==="SWING")){
    if(buy(out))out="HOLD";
    else if(out==="REDUCE"&&input.slowScore!=null&&input.slowScore>=65)out="HOLD";
  }
  if(input.softConstraints.includes("EXTREME_VALUATION")&&horizon==="SIX_TO_TWELVE_MONTHS"&&buy(out))out="HOLD";
  if(input.softConstraints.includes("NEAR_BINARY_EVENT")&&horizon==="NOW"&&input.businessModel!=="BIOTECH_PHARMA"&&buy(out))out="HOLD";
  return out;
}

function reasons(input:ResolveV4DecisionInput,primary:PrimaryInvestmentAction){
  const out:string[]=[];
  if(input.thesis.strength!=null&&input.thesis.strength>=75)out.push("LONG_TERM_THESIS_STRONG");
  if(input.softConstraints.includes("TECHNICAL_INSTABILITY"))out.push("TECHNICAL_WEAKNESS_LIMITS_TIMING");
  if(input.softConstraints.includes("EXTREME_VALUATION"))out.push("VALUATION_CAPS_NEW_RISK");
  if(input.riskScore!=null&&input.riskScore>=85)out.push("RISK_CAP_ACTIVE");
  if(input.modelSuitability<.60)out.push("MODEL_SUITABILITY_CAP");
  if(primary==="SELL"&&input.thesis.direction==="BROKEN")out.push("THESIS_BROKEN");
  if(!out.length)out.push(primary==="STRONG_BUY"?"MULTI_HORIZON_CONVICTION":"MULTI_HORIZON_RESOLUTION");
  return [...new Set(out)];
}

export function resolveV4Decision(input:ResolveV4DecisionInput):ResolveV4DecisionResult{
  const insufficient=(reason:string)=>fixed("INSUFFICIENT_EVIDENCE",input.confidence,reason);
  const sellAll=(reason:string)=>fixed("SELL",input.confidence,reason);
  if(input.missingRequired.length||input.modelSuitability<.40||input.thesis.strength==null||input.slowScore==null||input.riskScore==null)return insufficient("CRITICAL_EVIDENCE_MISSING");
  if(input.hardVetoes.includes("FRAUD_OR_GOVERNANCE_FAILURE"))return sellAll("HARD_VETO_GOVERNANCE");
  if(input.hardVetoes.includes("SOLVENCY_OR_FINANCING_FAILURE"))return sellAll("HARD_VETO_SOLVENCY");
  if(input.thesis.direction==="BROKEN"||input.thesis.strength<30)return sellAll("THESIS_BROKEN");

  const nowScore=weighted([[input.technicalScore,.45],[input.catalystScore,.20],[input.sectorScore,.15],[100-input.riskScore,.20]]);
  const swingScore=weighted([[input.technicalScore,.30],[input.opportunityScore,.25],[input.catalystScore,.15],[input.slowScore,.20],[100-input.riskScore,.10]]);
  const mediumScore=weighted([[input.slowScore,.40],[input.valuationScore,.20],[input.opportunityScore,.20],[input.sectorScore,.10],[100-input.riskScore,.10]]);
  const longScore=weighted([[input.slowScore,.50],[input.moat.score,.20],[input.valuationScore,.15],[input.opportunityScore,.10],[100-input.riskScore,.05]]);
  const scoreByHorizon:Record<Horizon,number>={NOW:nowScore,SWING:swingScore,SIX_TO_TWELVE_MONTHS:mediumScore,THREE_TO_FIVE_YEARS:longScore};
  const guardedByHorizon=Object.fromEntries(HORIZONS.map(h=>[h,applyHorizonGuards(h,actionFromScore(scoreByHorizon[h]),input)])) as Record<Horizon,PrimaryInvestmentAction>;

  if(input.softConstraints.includes("EXTREME_VALUATION")){
    const canRemainLongBuy=input.slowScore>=85&&input.moat.score!=null&&input.moat.score>=80&&input.riskScore<65;
    if(!canRemainLongBuy&&buy(guardedByHorizon.THREE_TO_FIVE_YEARS))guardedByHorizon.THREE_TO_FIVE_YEARS="HOLD";
    else if(canRemainLongBuy&&guardedByHorizon.THREE_TO_FIVE_YEARS==="STRONG_BUY")guardedByHorizon.THREE_TO_FIVE_YEARS="BUY";
  }

  const medium=guardedByHorizon.SIX_TO_TWELVE_MONTHS;
  const long=guardedByHorizon.THREE_TO_FIVE_YEARS;
  let primary:PrimaryInvestmentAction=medium;
  if(medium==="STRONG_BUY"&&long==="STRONG_BUY")primary="STRONG_BUY";
  else if((["BUY","STRONG_BUY"] as PrimaryInvestmentAction[]).includes(medium)&&(["BUY","STRONG_BUY"] as PrimaryInvestmentAction[]).includes(long))primary="BUY";
  else if(medium==="SELL"||long==="SELL")primary="REDUCE";
  else if(medium==="REDUCE"||long==="REDUCE")primary="REDUCE";
  else primary="HOLD";

  if(input.softConstraints.includes("TECHNICAL_INSTABILITY")&&primary==="STRONG_BUY")primary="BUY";
  if(input.softConstraints.includes("EXTREME_VALUATION")&&buy(primary))primary="HOLD";
  if(input.riskScore>=85&&buy(primary))primary="HOLD";
  if(input.modelSuitability<.60&&buy(primary))primary="HOLD";

  const reasonCodes=reasons(input,primary);
  const horizonDecisions=HORIZONS.map(horizon=>({horizon,action:guardedByHorizon[horizon],confidence:input.confidence,reasonCodes:[...reasonCodes]}));
  return{primaryAction:primary,horizonDecisions,reasonCodes};
}
