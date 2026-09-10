import {NextResponse} from "next/server";
import {deriveTradeIntent} from "@/lib/nivora-trade-intent";
import {evaluateTradingRisk,DEFAULT_PAPER_RISK_POLICY} from "@/lib/nivora-trading-risk";
import {planPaperOrder} from "@/lib/nivora-paper-execution";
export const dynamic="force-dynamic";
export async function POST(req:Request){
 try{
  const body=await req.json();
  const v934=body?.snapshot?.evidence?.v934??body?.marketIntelligence??null;
  if(!v934?.snapshotId||!v934?.marketTruthSnapshotId)return NextResponse.json({status:"BLOCKED",intent:null,risk:{allowed:false,code:"MARKET_INTELLIGENCE_MISSING",reason:"A current V9.3.4 canonical market-intelligence snapshot is required before Trading Lab evaluation."},order:null,mode:"paper",liveExecution:"approval-required"},{status:409});
  const intent=deriveTradeIntent(body.snapshot);if(!intent)return NextResponse.json({status:"NO_TRADE",intent:null,marketIntelligenceSnapshotId:v934.snapshotId});
  const risk=evaluateTradingRisk(intent,body.context,body.policy||DEFAULT_PAPER_RISK_POLICY);
  const order=risk.allowed?planPaperOrder(intent,risk.approvedNotional,Number(body.context?.quote?.price||intent.referencePrice)):null;
  return NextResponse.json({status:risk.allowed?"AUTHORIZED":"BLOCKED",intent,risk,order,marketIntelligenceSnapshotId:v934.snapshotId,mode:"paper",liveExecution:"approval-required"});
 }catch(e:any){return NextResponse.json({error:e?.message||"Invalid Trading Lab request."},{status:400})}
}
