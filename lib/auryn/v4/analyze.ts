import {classifyV4Security} from "./classification";
import {selectAnalystModel} from "./model-registry";
import {evaluateV4Factors} from "./factors";
import {buildMoatAssessment} from "./moat";
import {buildInvestmentThesis} from "./thesis";
import {buildNarrativeAssessment} from "./narrative";
import {buildDecisionConfidence,evidenceFreshness,sourceQuality} from "./confidence";
import {resolveV4Decision} from "./decision";
import {AURYN_V4_ENGINE_VERSION} from "./version";
import type {AnalystEvidenceBundle,AurynV4CoreAnalysis,CanonicalFactorKey} from "./domain";

export function buildAurynV4CoreAnalysis(bundle:AnalystEvidenceBundle):AurynV4CoreAnalysis{
  const classification=classifyV4Security({...bundle.classificationInput,evidence:bundle.evidenceRefs});
  const selected=selectAnalystModel(classification);
  const factorResult=evaluateV4Factors(bundle.observations,selected.definition);
  const moatFingerprint=JSON.stringify(bundle.moatSignals.map(x=>[x.factor,x.score,[...x.evidenceIds].sort()]));
  const moat=buildMoatAssessment({signals:bundle.moatSignals,prior:bundle.priorMoat,evidenceFingerprint:moatFingerprint,now:bundle.asOf,drivers:bundle.moatReasons.drivers,threats:bundle.moatReasons.threats});
  const thesis=buildInvestmentThesis({slowScore:factorResult.slowScore,slowEvidenceFingerprint:bundle.slowEvidenceFingerprint,prior:bundle.priorThesis,now:bundle.asOf,companyState:`${classification.businessModel} · ${classification.lifecycle}`,positive:bundle.thesisReasons.positive,negative:bundle.thesisReasons.negative,marketMayBeMissing:bundle.thesisReasons.marketMayBeMissing,invalidators:bundle.thesisInvalidators});
  const narrative=buildNarrativeAssessment(bundle.narrative);
  const sourceQualityScore=bundle.evidenceRefs.length?bundle.evidenceRefs.reduce((s,e)=>s+sourceQuality(e.source),0)/bundle.evidenceRefs.length:35;
  const freshnessScore=bundle.evidenceRefs.length?bundle.evidenceRefs.reduce((s,e)=>s+evidenceFreshness(bundle.asOf,e.asOf,e.scope),0)/bundle.evidenceRefs.length:35;
  const agreementScore=Math.max(40,100-bundle.evidenceConflicts.length*20);
  const confidence=buildDecisionConfidence({coverage:factorResult.coverage,freshness:freshnessScore,sourceQuality:sourceQualityScore,modelSuitability:selected.suitability*100,agreement:agreementScore,validationState:factorResult.validationState});
  const score=(key:CanonicalFactorKey)=>factorResult.assessments[key]?.score??null;
  const decision=resolveV4Decision({businessModel:classification.businessModel,slowScore:factorResult.slowScore,opportunityScore:factorResult.opportunityScore,riskScore:factorResult.riskScore,technicalScore:score("TECHNICALS"),valuationScore:score("VALUATION"),catalystScore:score("CATALYSTS"),sectorScore:score("SECTOR_INDUSTRY"),thesis,moat,confidence,missingRequired:factorResult.missingRequired,hardVetoes:bundle.hardVetoes,softConstraints:bundle.softConstraints,modelSuitability:selected.suitability});
  return{version:"auryn-v4",engineVersion:AURYN_V4_ENGINE_VERSION,symbol:bundle.symbol,classification,analystModel:{id:selected.definition.id,version:selected.definition.version,suitability:selected.suitability},factors:factorResult.assessments,thesis,moat,narrative,primaryAction:decision.primaryAction,ownerAction:decision.ownerAction,horizonDecisions:decision.horizonDecisions,confidence,reasonCodes:decision.reasonCodes};
}
