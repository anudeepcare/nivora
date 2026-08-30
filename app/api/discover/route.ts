import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";

function serverDb(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;return url&&key?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):null}
const actionable=new Set(["BUY / START","START / PULLBACK"]);
function normalize(x:any){return{symbol:x.symbol,price:Number(x.price),changePct:Number(x.change_pct||0),score:Number(x.score||0),rankScore:Number(x.rank_score||x.score||0),confidence:Number(x.confidence||0),technical:Number(x.technical||0),entry:Number(x.entry_score||0),risk:Number(x.risk_score||0),action:x.action,category:x.category,reason:x.reason,levels:{entryLow:Number(x.entry_low),entryHigh:Number(x.entry_high),target1:Number(x.target_1),target2:Number(x.target_2),stop:Number(x.thesis_break),rr:x.reward_risk==null?null:Number(x.reward_risk),geometryValid:!!x.geometry_valid,geometryReason:x.geometry_reason||null},metrics:{trend:Number(x.trend||0),momentum:Number(x.momentum||0),flow:Number(x.flow||0),extension:Number(x.extension||0)},scannedAt:x.scanned_at,changedAt:x.changed_at,previousAction:x.previous_action,previousRankScore:x.previous_rank_score,source:x.source}};

export async function GET(req:Request){
  const db=serverDb();if(!db)return NextResponse.json({items:[],coverage:{mode:"scanner-not-configured",fullMarket:false,scanned:0,eligibleUniverse:0},partial:true});
  const url=new URL(req.url),mode=url.searchParams.get("mode")||"discover",category=url.searchParams.get("category")||"All";const limit=Math.max(1,Math.min(100,Number(url.searchParams.get("limit")||40)));
  const [{data:state},{count:universeCount},{count:scannedCountRaw}]=await Promise.all([
    db.from("nivora_scan_state").select("*").eq("id",1).maybeSingle(),
    db.from("nivora_market_universe").select("symbol",{count:"exact",head:true}).eq("active",true),
    db.from("nivora_market_scan").select("symbol",{count:"exact",head:true})
  ]);
  const scannedCount=Number(scannedCountRaw||0),eligible=Number(universeCount||0),coveragePct=eligible?Math.min(100,Math.round(scannedCount/eligible*1000)/10):0;
  const fullMarket=eligible>0&&scannedCount>=Math.max(1,eligible*.90);
  const todayCutoff=new Date(Date.now()-24*3600_000).toISOString();
  // During warm-up, do not pretend a partial alphabetical/rolling batch is Discover.
  // Once broad coverage exists, keep serving the ranked persisted snapshot while refreshes continue.
  let items:any[]=[];let error:any=null;
  if(fullMarket){
    let q=db.from("nivora_market_scan").select("*").eq("geometry_valid",true).order("rank_score",{ascending:false}).limit(Math.max(limit*5,150));
    if(category!=="All")q=q.eq("category",category);
    const res=await q;error=res.error;items=(res.data||[]).map(normalize);
    if(mode==="today")items=items.filter((x:any)=>x.previousAction&&x.changedAt>=todayCutoff&&(x.previousAction!==x.action||Math.abs((x.previousRankScore??x.rankScore)-x.rankScore)>=6)&&(actionable.has(x.action)||x.action?.includes("EXIT")||x.category==="Exit watch"||x.rankScore>=78)).slice(0,12);
    else items=items.slice(0,limit);
  }
  if(error)return NextResponse.json({items:[],coverage:{mode:"scanner-error",fullMarket:false,scanned:scannedCount,eligibleUniverse:eligible,error:error.message},partial:true});
  return NextResponse.json({items,coverage:{mode:"persisted-market-scan",fullMarket,scanned:scannedCount,fresh24h:Number(state?.fresh_count||0),eligibleUniverse:eligible,coveragePct,lastScanAt:state?.last_scan_at||null,lastCompleteScanAt:state?.last_complete_scan_at||null,scanRunning:!!state?.scan_running,scanStartedAt:state?.scan_started_at||null},partial:!fullMarket},{headers:{"Cache-Control":"public, s-maxage=60, stale-while-revalidate=180"}});
}
