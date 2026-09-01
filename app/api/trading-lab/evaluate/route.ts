import {NextResponse} from "next/server";
import {deriveTradeIntent} from "@/lib/nivora-trade-intent";
import {evaluateTradingRisk,DEFAULT_PAPER_RISK_POLICY} from "@/lib/nivora-trading-risk";
import {planPaperOrder} from "@/lib/nivora-paper-execution";
export const dynamic="force-dynamic";
export async function POST(req:Request){
 try{const body=await req.json();const intent=deriveTradeIntent(body.snapshot);if(!intent)return NextResponse.json({status:"NO_TRADE",intent:null});const risk=evaluateTradingRisk(intent,body.context,body.policy||DEFAULT_PAPER_RISK_POLICY);const order=risk.allowed?planPaperOrder(intent,risk.approvedNotional,Number(body.context?.quote?.price||intent.referencePrice)):null;return NextResponse.json({status:risk.allowed?"AUTHORIZED":"BLOCKED",intent,risk,order,mode:"paper",liveExecution:"approval-required"})}catch(e:any){return NextResponse.json({error:e?.message||"Invalid Trading Lab request."},{status:400})}
}
