import {buildV935Provenance} from "../v935/provenance";
import {INTELLIGENCE_POLICY_VERSION} from "../v931/domain";
import {validateResearchDecision} from "./research-contract";
export const AUTONOMOUS_RESEARCH_ENGINE_VERSION=INTELLIGENCE_POLICY_VERSION;
export async function persistAutonomousResearch(client:any,symbol:string,result:any){
 if(result?.state!=="RESEARCH_READY"||!validateResearchDecision(result?.decision))throw new Error("AUTONOMOUS_RESEARCH_NOT_READY");
 const d=result.decision,m=result.marketTruth,mi=result.marketIntelligence,observedAt=new Date().toISOString();
 if(typeof m?.decisionPrice!=="number"||!Number.isFinite(m.decisionPrice)||m.decisionPrice<=0)throw new Error("VERIFIED_MARKET_PRICE_REQUIRED");
 const fingerprint=`${INTELLIGENCE_POLICY_VERSION}:${d.snapshotId}:${d.newMoneyAction}:${d.evidenceCompleteness}`;
 const canonical=buildV935Provenance({symbol,marketSnapshotId:m?.snapshotId??null,researchSnapshotId:d?.snapshotId??null,fingerprint,generatedAt:observedAt});
 const row={symbol,observed_at:observedAt,price:Number(m?.decisionPrice),engine_version:AUTONOMOUS_RESEARCH_ENGINE_VERSION,weights_version:INTELLIGENCE_POLICY_VERSION,valuation_version:"reported-financial-valuation-2026-10-16",today_policy_version:INTELLIGENCE_POLICY_VERSION,evidence_fingerprint:fingerprint,benchmark_symbol:"SPY",sector_benchmark_symbol:null,decision:d,evidence:{v931:d,v934:mi??null,v935:canonical,events:Array.isArray(result.events)?result.events:[],financialEvidence:result.financial??null,decisionSnapshot:result.snapshot??null,v995:{autonomous:true,policyVersion:INTELLIGENCE_POLICY_VERSION,generatedAt:observedAt}}};
 const {error}=await client.from("nivora_v59_decision_snapshots").insert(row);if(error)throw error;return{row,fingerprint,canonicalSnapshotId:canonical.snapshotId};
}
