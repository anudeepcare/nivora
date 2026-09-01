import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {AlpacaPaperBroker} from "@/lib/alpaca-paper";
import {deriveTradeIntent} from "@/lib/nivora-trade-intent";
import {evaluateTradingRisk,DEFAULT_PAPER_RISK_POLICY} from "@/lib/nivora-trading-risk";
import {planPaperOrder} from "@/lib/nivora-paper-execution";
import {normalizeTwelveQuote} from "@/lib/nivora-live-quote";
import {normalizeAlpacaQuote,type ExecutionQuote} from "@/lib/nivora-execution-quote";
import {marketSessionAt} from "@/lib/nivora-market-session";
import {sharedJson} from "@/lib/shared-cache";
import {ENGINE_VERSION,TRADING_LAB_VERSION} from "@/lib/nivora-version";
import {buildClosedTradesFromFills} from "@/lib/nivora-trading-metrics";
import {explainNoIntent} from "@/lib/nivora-trading-evaluation";
export const dynamic="force-dynamic";
const unauthorized=()=>NextResponse.json({error:"Unauthorized."},{status:401});
async function run(req:Request,automatic=false){
 const secret=process.env.TRADING_LAB_CRON_SECRET||process.env.CRON_SECRET;if(!secret||req.headers.get("authorization")!==`Bearer ${secret}`)return unauthorized();
 const session=marketSessionAt(new Date());if(session==="CLOSED"||session==="OVERNIGHT")return NextResponse.json({status:"skipped",code:"MARKET_CLOSED",mode:"paper",session,automatic,engineVersion:ENGINE_VERSION,tradingLabVersion:TRADING_LAB_VERSION});
 if(process.env.TRADING_LAB_PAPER_ENABLED!=="true")return NextResponse.json({status:"disabled",reason:"Set TRADING_LAB_PAPER_ENABLED=true to enable autonomous paper execution."});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY,twelve=process.env.TWELVE_DATA_API_KEY;if(!url||!key||!twelve)return NextResponse.json({error:"Trading Lab storage or quote provider is not configured."},{status:503});
 const alpacaKey=process.env.ALPACA_PAPER_API_KEY||"",alpacaSecret=process.env.ALPACA_PAPER_API_SECRET||"";if(!alpacaKey||!alpacaSecret)return NextResponse.json({error:"Alpaca Paper credentials are not configured."},{status:503});
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}),broker=new AlpacaPaperBroker(alpacaKey,alpacaSecret);
 const recordEvaluation=async(s:any,status:string,action:string,reason:string,riskCode:string|null=null,clientOrderId:string|null=null,details:any={})=>{const {error}=await db.from("nivora_v61_trade_evaluations").upsert({evaluation_key:`${String(s.id)}:${status}`,snapshot_id:String(s.id),symbol:String(s.symbol||"").toUpperCase(),evaluated_at:new Date().toISOString(),today_action:action,status,reason,risk_code:riskCode,client_order_id:clientOrderId,engine_version:ENGINE_VERSION,trading_lab_version:TRADING_LAB_VERSION,details},{onConflict:"evaluation_key"});if(error)throw error};
 const account=await broker.getAccount(),positions=await broker.getPositions(),positionMap=new Map(positions.map(p=>[p.symbol,p]));
 // Reconcile broker fills first so the dashboard and risk history mature without manual intervention.
 const activities=await broker.getFillActivities(new Date(Date.now()-30*24*60*60_000).toISOString());
 if(activities.length){const orderIds=[...new Set(activities.map(a=>a.orderId).filter(Boolean))];const {data:knownOrders}=orderIds.length?await db.from("nivora_v61_paper_orders").select("id,broker_order_id").in("broker_order_id",orderIds):{data:[] as any[]};const orderMap=new Map((knownOrders||[]).map((o:any)=>[String(o.broker_order_id),Number(o.id)]));for(const a of activities){await db.from("nivora_v61_trade_fills").upsert({order_id:orderMap.get(a.orderId)||null,broker_fill_id:a.id,symbol:a.symbol,side:a.side,qty:a.qty,fill_price:a.price,filled_at:a.transactionTime,fees:0,evidence:{broker:"alpaca",paper:true}},{onConflict:"broker_fill_id"})}}
 const {data:allFills}=await db.from("nivora_v61_trade_fills").select("broker_fill_id,symbol,side,qty,fill_price,fees,filled_at").order("filled_at",{ascending:true});const closed=buildClosedTradesFromFills((allFills||[]).map((f:any)=>({id:String(f.broker_fill_id||""),symbol:f.symbol,side:f.side,qty:Number(f.qty||0),price:Number(f.fill_price||0),fees:Number(f.fees||0)})));for(const c of closed){await db.from("nivora_v61_trade_fills").update({realized_pnl:c.pnl,return_pct:c.returnPct}).eq("broker_fill_id",c.sourceFillId)}
 const since=new Date(Date.now()-30*60_000).toISOString();
 const {data:snapshots,error}=await db.from("nivora_v59_decision_snapshots").select("id,symbol,observed_at,price,evidence_fingerprint,decision").eq("engine_version",ENGINE_VERSION).gte("observed_at",since).order("observed_at",{ascending:false}).limit(50);if(error)throw error;
 const latest=new Map<string,any>();for(const s of snapshots||[])if(!latest.has(s.symbol))latest.set(s.symbol,s);
 const results:any[]=[];
 for(const s of latest.values()){
  const d=s.decision||{},today=d.today;if(!today){const x=explainNoIntent(undefined,false);await recordEvaluation(s,"NO_INTENT","NONE",x.reason,x.code);results.push({symbol:s.symbol,status:"NO_INTENT",action:"NONE",reason:x.reason});continue;}
  const pos=positionMap.get(s.symbol);const intent=deriveTradeIntent({symbol:s.symbol,snapshotId:String(s.id),evidenceFingerprint:String(s.evidence_fingerprint||""),price:Number(s.price||0),observedAt:String(s.observed_at),thesisScore:Number(d.thesisScore||0),opportunityScore:Number(d.opportunityScore||0),companyScore:Number(d.companyScore||0),today});if(!intent){const x=explainNoIntent(today,Boolean(pos));await recordEvaluation(s,"NO_INTENT",String(today.action||"NO ACTION"),x.reason,x.code,null,{today});results.push({symbol:s.symbol,status:"NO_INTENT",action:String(today.action||"NO ACTION"),reason:x.reason});continue;}
  const {data:existing}=await db.from("nivora_v61_trade_intents").select("id").eq("intent_id",intent.id).maybeSingle();if(existing){await recordEvaluation(s,"DUPLICATE",String(today.action||"NO ACTION"),"This evidence/action already produced a trade intent.","DUPLICATE");results.push({symbol:s.symbol,status:"DUPLICATE",action:String(today.action||"NO ACTION"),reason:"This evidence/action already produced a trade intent."});continue}
  let quote:ExecutionQuote;try{const aq=await broker.getLatestExecutionQuote(s.symbol);quote=normalizeAlpacaQuote(s.symbol,aq.quote,aq.trade,new Date())}catch{const raw=await sharedJson(`https://api.twelvedata.com/quote?symbol=${encodeURIComponent(s.symbol)}&prepost=true&apikey=${twelve}`,["twelve","trade-lab-quote",s.symbol],5,1800);const tq=normalizeTwelveQuote(raw,new Date());quote={...tq,bid:null,ask:null,spreadPct:null,changePct:tq.changePct,provider:"twelvedata"}}
  const context={equity:account.equity,cash:account.cash,dailyPnlPct:account.dailyPnlPct,currentPositionValue:Math.abs(pos?.marketValue||0),openPositions:positions.length,duplicate:false,quote:{price:quote.price,ageSeconds:quote.ageSeconds,freshness:quote.freshness,changePct:quote.changePct,spreadPct:quote.spreadPct}};
  const quoteDetails={quoteProvider:quote.provider,quoteAgeSeconds:quote.ageSeconds,quoteTimestamp:quote.providerTimestamp,marketSession:quote.session,spreadPct:quote.spreadPct,automatic};
  const risk=evaluateTradingRisk(intent,context,DEFAULT_PAPER_RISK_POLICY);
  await db.from("nivora_v61_trade_intents").insert({intent_id:intent.id,symbol:intent.symbol,snapshot_id:intent.snapshotId,evidence_fingerprint:intent.evidenceFingerprint,side:intent.side,intent_type:intent.intentType,target_notional:intent.targetNotional,approved_notional:risk.approvedNotional,status:risk.allowed?"AUTHORIZED":"BLOCKED",risk_code:risk.code,risk_reason:risk.reason,engine_version:ENGINE_VERSION,trading_lab_version:TRADING_LAB_VERSION,source_intent:intent,source_context:context});
  if(!risk.allowed){await recordEvaluation(s,"BLOCKED",String(today.action||"NO ACTION"),risk.reason,risk.code,null,{risk,...quoteDetails});results.push({symbol:s.symbol,status:"BLOCKED",action:String(today.action||"NO ACTION"),reason:risk.reason,riskCode:risk.code});continue}
  const order=planPaperOrder(intent,risk.approvedNotional,quote.price),submitted=await broker.submitOrder(order);
  await db.from("nivora_v61_paper_orders").insert({intent_id:intent.id,broker:"alpaca",broker_order_id:submitted.id,client_order_id:submitted.clientOrderId,symbol:submitted.symbol,side:submitted.side,qty:submitted.qty,limit_price:order.limitPrice,status:submitted.status,submitted_at:submitted.submittedAt||new Date().toISOString(),order_payload:order,broker_response:submitted});
  await recordEvaluation(s,"SUBMITTED",String(today.action||"NO ACTION"),"Paper order submitted to Alpaca.",risk.code,submitted.clientOrderId,{risk,orderStatus:submitted.status,...quoteDetails});
  results.push({symbol:s.symbol,status:"SUBMITTED",action:String(today.action||"NO ACTION"),reason:"Paper order submitted to Alpaca.",clientOrderId:submitted.clientOrderId});
 }
 return NextResponse.json({status:"ok",mode:"paper",automatic,session,engineVersion:ENGINE_VERSION,tradingLabVersion:TRADING_LAB_VERSION,processed:latest.size,results});
}
export async function POST(req:Request){return run(req,false)}
export async function GET(req:Request){return run(req,true)}
