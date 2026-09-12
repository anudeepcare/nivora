export async function persistAutonomousResearch(client:any,symbol:string,result:any){
 if(result?.state!=="RESEARCH_READY")throw new Error("AUTONOMOUS_RESEARCH_NOT_READY");
 const d=result.decision,m=result.marketTruth,mi=result.marketIntelligence,observedAt=new Date().toISOString();
 const fingerprint=`v995:${d.snapshotId}:${d.newMoneyAction}:${d.evidenceCompleteness}`;
 const row={symbol,observed_at:observedAt,price:Number(m?.decisionPrice),engine_version:"auryn-v9.8",weights_version:"auryn-v9.3.1-institutional",valuation_version:"auryn-v9.8-three-clock",today_policy_version:"auryn-v9.3.1",evidence_fingerprint:fingerprint,benchmark_symbol:"SPY",sector_benchmark_symbol:null,decision:d,evidence:{v931:d,v934:mi??null,v995:{autonomous:true,generatedAt:observedAt}}};
 const {error}=await client.from("nivora_v59_decision_snapshots").insert(row);if(error)throw error;return{row,fingerprint};
}
