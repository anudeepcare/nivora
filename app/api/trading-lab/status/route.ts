import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {summarizeTradingPerformance} from "@/lib/nivora-trading-metrics";
import {ENGINE_VERSION,TRADING_LAB_VERSION} from "@/lib/nivora-version";
import {marketSessionAt} from "@/lib/nivora-market-session";
import {AlpacaPaperBroker} from "@/lib/alpaca-paper";

export const dynamic="force-dynamic";

export async function GET(){
 const alpacaKey=process.env.ALPACA_PAPER_API_KEY||"";
 const alpacaSecret=process.env.ALPACA_PAPER_API_SECRET||"";
 const configured=Boolean(alpacaKey&&alpacaSecret);
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;

 if(!url||!key)return NextResponse.json({
  status:"unavailable",
  version:TRADING_LAB_VERSION,
  engineVersion:ENGINE_VERSION,
  broker:{mode:"paper",configured,connected:false},
  runner:{automatic:true,schedule:"GitHub Actions · every 10 min in regular-session UTC window",marketSession:marketSessionAt(new Date()),lastAutomaticRun:null,lastRunOk:null},
  liveExecution:"approval-required",
  metrics:summarizeTradingPerformance([]),
  recentEvaluations:[],
  funnel:{snapshots:0,evaluated:0,intents:0,authorized:0,blocked:0,submitted:0},
  reason:"Trading Lab storage is not configured."
 });

 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const since=new Date(Date.now()-30*60_000).toISOString();

 const [
  tradesResult,intentsResult,ordersResult,snapshotsResult,evaluationsResult,
  recentOrdersResult,recentFillsResult,runnerHealthResult
 ]=await Promise.all([
  db.from("nivora_v61_trade_fills").select("realized_pnl,return_pct,benchmark_return_pct").not("realized_pnl","is",null).order("filled_at",{ascending:true}).limit(1000),
  db.from("nivora_v61_trade_intents").select("id",{count:"exact",head:true}),
  db.from("nivora_v61_paper_orders").select("id",{count:"exact",head:true}),
  db.from("nivora_v59_decision_snapshots").select("id",{count:"exact",head:true}).eq("engine_version",ENGINE_VERSION).gte("observed_at",since),
  db.from("nivora_v61_trade_evaluations").select("snapshot_id,symbol,today_action,status,reason,risk_code,client_order_id,evaluated_at,details").eq("engine_version",ENGINE_VERSION).gte("evaluated_at",since).order("evaluated_at",{ascending:false}).limit(200),
  db.from("nivora_v61_paper_orders").select("id,symbol,client_order_id,status,submitted_at,created_at").order("created_at",{ascending:false}).limit(100),
  db.from("nivora_v61_trade_fills").select("order_id,symbol,side,qty,fill_price,realized_pnl,return_pct,filled_at").order("filled_at",{ascending:false}).limit(200),
  db.from("nivora_provider_health").select("ok,error_code,latency_ms,checked_at").eq("provider","nivora").eq("capability","paper-runner").order("checked_at",{ascending:false}).limit(1).maybeSingle()
 ]);

 let brokerHealth:any={configured,connected:false,equity:null,cash:null,positions:null,clock:null,error:null};
 if(configured){
  try{
   const broker=new AlpacaPaperBroker(alpacaKey,alpacaSecret);
   const [account,positions,clock]=await Promise.all([broker.getAccount(),broker.getPositions(),broker.getClock()]);
   brokerHealth={configured:true,connected:true,equity:account.equity,cash:account.cash,positions:positions.length,clock,error:null};
  }catch(error:any){
   brokerHealth={configured:true,connected:false,equity:null,cash:null,positions:null,clock:null,error:error?.message||"Alpaca Paper connectivity check failed."};
  }
 }

 const trades=tradesResult.data||[];
 const auditStatus=evaluationsResult.error?"migration-required":"ready";
 const evaluations=(evaluationsResult.data||[]) as any[];
 const orders=(recentOrdersResult.data||[]) as any[];
 const fills=(recentFillsResult.data||[]) as any[];

 const orderByClient=new Map(orders.map(o=>[String(o.client_order_id||""),o]));
 const fillByOrder=new Map<number,any>();
 for(const f of fills){const id=Number(f.order_id||0);if(id&&!fillByOrder.has(id))fillByOrder.set(id,f)}

 const latestBySnapshot=new Map<string,any>();
 for(const e of evaluations){const id=String(e.snapshot_id||"");if(id&&!latestBySnapshot.has(id))latestBySnapshot.set(id,e)}
 const latest=[...latestBySnapshot.values()];

 const recentEvaluations=latest.slice(0,50).map(e=>{
  const order=e.client_order_id?orderByClient.get(String(e.client_order_id)):null;
  const fill=order?fillByOrder.get(Number(order.id)):null;
  return{
   symbol:e.symbol,
   action:e.today_action||"NONE",
   status:e.status,
   reason:e.reason,
   riskCode:e.risk_code||null,
   evaluatedAt:e.evaluated_at,
   quoteProvider:e.details?.quoteProvider||null,
   quoteAgeSeconds:e.details?.quoteAgeSeconds??null,
   marketSession:e.details?.marketSession||null,
   integrityState:e.details?.integrityState||null,
   disagreementPct:e.details?.disagreementPct??null,
   automatic:Boolean(e.details?.automatic),
   clientOrderId:e.client_order_id||null,
   orderStatus:order?.status||null,
   submittedAt:order?.submitted_at||null,
   fillStatus:fill?"FILLED":null,
   filledAt:fill?.filled_at||null,
   fillPrice:fill?.fill_price==null?null:Number(fill.fill_price),
   realizedPnl:fill?.realized_pnl==null?null:Number(fill.realized_pnl),
   returnPct:fill?.return_pct==null?null:Number(fill.return_pct)
  };
 });

 const uniqueSnapshots=new Set(evaluations.map(e=>String(e.snapshot_id||"")).filter(Boolean));
 const statusBySnapshot=new Map<string,Set<string>>();
 for(const e of evaluations){
  const id=String(e.snapshot_id||"");if(!id)continue;
  const set=statusBySnapshot.get(id)||new Set<string>();set.add(String(e.status||""));statusBySnapshot.set(id,set);
 }
 const has=(status:string)=>[...statusBySnapshot.values()].filter(s=>s.has(status)).length;
 const intentCount=[...statusBySnapshot.values()].filter(s=>[...s].some(x=>x!=="NO_INTENT")).length;
 const metrics=summarizeTradingPerformance(trades.map((x:any)=>({
  pnl:Number(x.realized_pnl||0),
  returnPct:Number(x.return_pct||0),
  benchmarkReturnPct:x.benchmark_return_pct==null?null:Number(x.benchmark_return_pct)
 })));

 const runnerHealth=runnerHealthResult.data as any;
 const currentSession=marketSessionAt(new Date());
 const latestOrder=orders[0]||null;

 return NextResponse.json({
  status:configured&&brokerHealth.connected?"ready":configured?"paper-broker-unreachable":"paper-broker-not-configured",
  version:TRADING_LAB_VERSION,
  engineVersion:ENGINE_VERSION,
  broker:{name:"Alpaca",mode:"paper",...brokerHealth},
  runner:{
   automatic:true,
   scheduler:"GitHub Actions",
   schedule:"Every 10 minutes during the regular-session UTC window",
   marketSession:currentSession,
   lastAutomaticRun:runnerHealth?.checked_at||null,
   lastRunOk:runnerHealth?.ok??null,
   lastRunCode:runnerHealth?.error_code||null,
   lastRunLatencyMs:runnerHealth?.latency_ms??null
  },
  selfTest:{
   orderEnabled:process.env.TRADING_LAB_SELF_TEST_ORDER_ENABLED==="true",
   symbol:String(process.env.TRADING_LAB_SELF_TEST_SYMBOL||"SPY").toUpperCase(),
   endpoint:"/api/trading-lab/diagnostics",
   mode:"paper-submit-and-cancel"
  },
  lastOrder:{at:latestOrder?.submitted_at||latestOrder?.created_at||null,symbol:latestOrder?.symbol||null,status:latestOrder?.status||null},
  liveExecution:"approval-required",
  auditStatus,
  auditReason:evaluationsResult.error?.message||null,
  intents:intentsResult.count||0,
  orders:ordersResult.count||0,
  funnel:{snapshots:snapshotsResult.count||0,evaluated:uniqueSnapshots.size,intents:intentCount,authorized:has("SUBMITTED"),blocked:has("BLOCKED"),submitted:has("SUBMITTED")},
  recentEvaluations,
  metrics,
  note:"Trading Lab metrics are realized paper results, not a guarantee of future returns."
 },{headers:{"Cache-Control":"private, no-store, max-age=0"}});
}
