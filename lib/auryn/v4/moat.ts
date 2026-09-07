import type {EvidenceBackedReason,FactorObservation,MoatAssessment} from "./domain";

export interface PriorMoatState {score:number;evidenceFingerprint:string;lastMaterialChangeAt:string}
export interface BuildMoatInput {
  signals:FactorObservation[];
  prior?:PriorMoatState;
  evidenceFingerprint:string;
  now:string;
  drivers:EvidenceBackedReason[];
  threats:EvidenceBackedReason[];
}

export function buildMoatAssessment(input:BuildMoatInput):MoatAssessment{
  const usable=input.signals.filter(x=>x.score!=null&&Number.isFinite(x.score)&&x.evidenceIds.length>0);
  if(!usable.length)return{score:null,direction:"UNKNOWN",delta:null,drivers:input.drivers,threats:input.threats};
  const candidate=Math.round(usable.reduce((s,x)=>s+Number(x.score),0)/usable.length);
  if(input.prior&&input.prior.evidenceFingerprint===input.evidenceFingerprint){
    return{score:input.prior.score,direction:"STABLE",delta:0,drivers:input.drivers,threats:input.threats};
  }
  const delta=input.prior==null?null:candidate-input.prior.score;
  const direction:MoatAssessment["direction"]=delta==null?"STABLE":delta>=4?"EXPANDING":delta<=-4?"ERODING":"STABLE";
  return{score:candidate,direction,delta,drivers:input.drivers,threats:input.threats};
}
