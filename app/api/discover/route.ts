import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";

function serverDb(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)return null;
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
const actionable=new Set(["BUY / START","START / PULLBACK"]);
function normalize(x:any){return{
  symbol:x.symbol,price:Number(x.price),changePct:Number(x.change_pct||0),score:Number(x.score||0),rankScore:Number(x.rank_score||x.score||0),confidence:Number(x.confidence||0),
  technical:Number(x.technical||0),entry:Number(x.entry_score||0),risk:Number(x.risk_score||0),action:x.action,category:x.category,reason:x.reason,
  levels:{entryLow:Number(x.entry_low),entryHigh:Number(x.entry_high),target1:Number(x.target_1),target2:Number(x.target_2),stop:Number(x.thesis_break),rr:x.reward_risk==null?null:Number(x.reward_risk),geometryValid:!!x.geometry_valid,geometryReason:x.geometry_reason||null},
  metrics:{trend:Number(x.trend||0),momentum:Number(x.momentum||0),flow:Number(x.flow||0),extension:Number(x.extension||0)},scannedAt:x.scanned_at,changedAt:x.changed_at,previousAction:x.previous_action,previousRankScore:x.previous_rank_score,source:x.source
}};

export async function GET(req:Request){
  const db=serverDb();
  if(!db)return NextResponse.json({items:[],coverage:{mode:"scanner-not-configured",fullMarket:false,scanned:0},partial:true},{status:200});
  const url=new URL(req.url),mode=url.searchParams.get("mode")||"discover",category=url.searchParams.get("category")||"All";
  const limit=Math.max(1,Math.min(100,Number(url.searchParams.get("limit")||40)));
  const cutoff=new Date(Date.now()-72*3600_000).toISOString();
  const todayCutoff=new Date(Date.now()-24*3600_000).toISOString();
  let q=db.from("nivora_market_scan").select("*").gte("scanned_at",cutoff).eq("geometry_valid",true).order("rank_score",{ascending:false}).limit(Math.max(limit*4,100));
  if(category!=="All")q=q.eq("category",category);
  const [{data, error},{data:state},{count:universeCount}]=await Promise.all([
    q,
    db.from("nivora_scan_state").select("*").eq("id",1).maybeSingle(),
    db.from("nivora_market_universe").select("symbol",{count:"exact",head:true}).eq("active",true)
  ]);
  if(error)return NextResponse.json({items:[],coverage:{mode:"scanner-error",fullMarket:false,scanned:0,error:error.message},partial:true});
  let items=(data||[]).map(normalize);
  if(mode==="today"){
    // Today is a change feed, not a duplicate of Discover. New symbols during initial
    // warm-up do not count as a meaningful change until they have a prior observation.
    items=items.filter((x:any)=>x.previousAction && x.changedAt>=todayCutoff && (x.previousAction!==x.action || Math.abs((x.previousRankScore??x.rankScore)-x.rankScore)>=6) && (actionable.has(x.action)||x.action?.includes("EXIT")||x.category==="Exit watch"||x.rankScore>=78)).slice(0,12);
  }else items=items.slice(0,limit);
  const {count:scannedCountRaw}=await db.from("nivora_market_scan").select("symbol",{count:"exact",head:true}).gte("scanned_at",cutoff);
  const scannedCount=Number(scannedCountRaw||0);
  const fullMarket=!!universeCount&&scannedCount>=Math.max(1,Number(universeCount)*.90);
  return NextResponse.json({items,coverage:{mode:"persisted-market-scan",fullMarket,scanned:scannedCount,eligibleUniverse:universeCount||0,lastScanAt:state?.last_scan_at||null,lastUniverseSync:state?.last_universe_sync||null},partial:!fullMarket},
    {headers:{"Cache-Control":"public, s-maxage=120, stale-while-revalidate=300"}});
}
