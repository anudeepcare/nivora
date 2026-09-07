import type {EvidenceBackedReason,InvestmentThesis} from "./domain";
import {stabilizeSlowMetric} from "../../v65/thesis-stability";

export interface PriorThesisState {strength:number;evidenceFingerprint:string;lastMaterialChangeAt:string}
export interface BuildInvestmentThesisInput {
  slowScore:number|null;
  slowEvidenceFingerprint:string;
  prior?:PriorThesisState;
  now:string;
  companyState:string;
  positive:EvidenceBackedReason[];
  negative:EvidenceBackedReason[];
  marketMayBeMissing:EvidenceBackedReason[];
  invalidators:string[];
}

export function buildInvestmentThesis(input:BuildInvestmentThesisInput):InvestmentThesis{
  if(input.slowScore==null){
    return{
      strength:input.prior?.strength??null,
      direction:"STABLE",
      directionDelta:null,
      companyState:input.companyState,
      whyItCanWin:input.positive,
      marketMayBeMissing:input.marketMayBeMissing,
      strengtheningEvidence:[],
      weakeningEvidence:input.negative,
      invalidationConditions:input.invalidators,
      evidenceFingerprint:input.slowEvidenceFingerprint,
      lastMaterialChangeAt:input.prior?.lastMaterialChangeAt??input.now
    };
  }
  const stable=stabilizeSlowMetric(
    input.prior?{value:input.prior.strength,evidenceFingerprint:input.prior.evidenceFingerprint,lastMeaningfulChangeAt:input.prior.lastMaterialChangeAt}:undefined,
    {candidateValue:Math.round(input.slowScore),evidenceFingerprint:input.slowEvidenceFingerprint,now:input.now,changedBecause:[...input.positive,...input.negative].map(x=>x.text)}
  );
  const delta=stable.value-(input.prior?.strength??stable.value);
  const direction:InvestmentThesis["direction"]=stable.value<30?"BROKEN":delta>=5?"STRENGTHENING":delta<=-5?"WEAKENING":"STABLE";
  return{
    strength:stable.value,
    direction,
    directionDelta:delta,
    companyState:input.companyState,
    whyItCanWin:input.positive,
    marketMayBeMissing:input.marketMayBeMissing,
    strengtheningEvidence:direction==="STRENGTHENING"?input.positive:[],
    weakeningEvidence:input.negative,
    invalidationConditions:input.invalidators,
    evidenceFingerprint:input.slowEvidenceFingerprint,
    lastMaterialChangeAt:stable.lastMeaningfulChangeAt
  };
}
