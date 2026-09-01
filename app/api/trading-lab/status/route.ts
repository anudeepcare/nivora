import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {summarizeTradingPerformance} from "@/lib/nivora-trading-metrics";
import {ENGINE_VERSION,TRADING_LAB_VERSION} from "@/lib/nivora-version";
export const dynamic="force-dynamic";
export async function GET(){
 const configured=Boolean(process.env.ALPACA_PAPER_API_KEY&&process.env.ALPACA_PAPER_API_SECRET),url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({status:"unavailable",version:TRADING_LAB_VERSION,engineVersion:ENGINE_VERSION,broker:{mode:"paper",configured},liveExecution:"approval-required",metrics:summarizeTradingPerformance([]),reason:"Trading Lab storage is not configured."});
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const [{data:trades},{count:intents},{count:orders}]=await Promise.all([
  db.from("nivora_v61_trade_fills").select("realized_pnl,return_pct,benchmark_return_pct").not("realized_pnl","is",null).order("filled_at",{ascending:true}).limit(1000),
  db.from("nivora_v61_trade_intents").select("id",{count:"exact",head:true}),
  db.from("nivora_v61_paper_orders").select("id",{count:"exact",head:true})
 ]);
 const metrics=summarizeTradingPerformance((trades||[]).map((x:any)=>({pnl:Number(x.realized_pnl||0),returnPct:Number(x.return_pct||0),benchmarkReturnPct:x.benchmark_return_pct==null?null:Number(x.benchmark_return_pct)})));
 return NextResponse.json({status:configured?"ready":"paper-broker-not-configured",version:TRADING_LAB_VERSION,engineVersion:ENGINE_VERSION,broker:{name:"Alpaca",mode:"paper",configured},liveExecution:"approval-required",intents:intents||0,orders:orders||0,metrics,note:"Trading Lab metrics are realized paper results, not a guarantee of future returns."},{headers:{"Cache-Control":"private, max-age=30"}});
}
