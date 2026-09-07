import type {EvidenceBackedReason,NarrativeAssessment} from "./domain";

export interface BuildNarrativeInput {
  market:EvidenceBackedReason[];
  auryn:EvidenceBackedReason[];
  expectationGapScore:number|null;
}

export function buildNarrativeAssessment(input:BuildNarrativeInput):NarrativeAssessment{
  const cited=input.auryn.filter(r=>r.evidenceIds.length>0);
  let state:NarrativeAssessment["contrarianEdge"]["state"]="NO_DEFENSIBLE_EDGE";
  if(cited.length&&input.expectationGapScore!=null){
    state=input.expectationGapScore>=65?"POSITIVE_EDGE":input.expectationGapScore<=35?"NEGATIVE_EDGE":"CONSENSUS_ALIGNED";
  }
  return{
    marketNarrative:input.market.filter(r=>r.evidenceIds.length>0),
    aurynThesis:cited,
    contrarianEdge:{state,reason:state==="NO_DEFENSIBLE_EDGE"?null:cited[0]??null}
  };
}
