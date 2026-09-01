import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {freshnessDistribution} from "@/lib/nivora-scan-freshness";

function serverDb(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;return url&&key?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):null}
function normalize(x:any){return{
  symbol:x.symbol,name:x.company_name||x.symbol,price:Number(x.price||0),changePct:Number(x.change_pct||0),
  companyScore:Number(x.company_score||0),growthScore:Number(x.growth_score||0),financialScore:Number(x.financial_score||0),analystScore:Number(x.analyst_score||0),valuationScore:Number(x.valuation_score||0),
  thesisScore:Number(x.thesis_score||0),opportunityScore:Number(x.opportunity_score||0),confidence:Number(x.evidence_confidence||0),
  thesisLabel:x.thesis_label,thesisState:x.thesis_state,action:x.action,reason:x.reason,mainRisk:x.main_risk,
  targetMean:x.target_mean==null?null:Number(x.target_mean),targetUpsidePct:x.target_upside_pct==null?null:Number(x.target_upside_pct),
  scannedAt:x.scanned_at,changedAt:x.changed_at,previousThesisScore:x.previous_thesis_score,previousAction:x.previous_action
}}

export async function GET(req:Request){
  const db=serverDb();if(!db)return NextResponse.json({items:[],coverage:{mode:"scanner-not-configured",ready:false,scanned:0,eligibleUniverse:0},partial:true});
  const url=new URL(req.url),mode=url.searchParams.get("mode")||"discover";const limit=Math.max(1,Math.min(100,Number(url.searchParams.get("limit")||40)));
  const now=Date.now(),cut24=new Date(now-24*3600_000).toISOString(),cut7=new Date(now-7*24*3600_000).toISOString(),cut30=new Date(now-30*24*3600_000).toISOString();
  const [{data:state},{count:universeCount},{count:investmentCountRaw},{count:fresh24},{count:fresh7},{count:fresh30}]=await Promise.all([
    db.from("nivora_scan_state").select("*").eq("id",1).maybeSingle(),
    db.from("nivora_market_universe").select("symbol",{count:"exact",head:true}).eq("active",true),
    db.from("nivora_investment_scan").select("symbol",{count:"exact",head:true}),
    db.from("nivora_investment_scan").select("symbol",{count:"exact",head:true}).gte("scanned_at",cut24),
    db.from("nivora_investment_scan").select("symbol",{count:"exact",head:true}).gte("scanned_at",cut7),
    db.from("nivora_investment_scan").select("symbol",{count:"exact",head:true}).gte("scanned_at",cut30)
  ]);
  const eligible=Number(universeCount||0),scanned=Number(investmentCountRaw||0),coveragePct=eligible?Math.min(100,Math.round(scanned/eligible*1000)/10):0;
  const freshness=freshnessDistribution(scanned,Number(fresh24||0),Number(fresh7||0),Number(fresh30||0));
  // We allow a clearly-labelled preview after 75 qualified companies so Today/Discover are useful while coverage grows.
  // Full-market language is reserved for >=90% coverage.
  const previewReady=scanned>=1,fullMarket=eligible>0&&scanned>=Math.max(1,eligible*.90),todayCutoff=new Date(Date.now()-36*3600_000).toISOString();
  let items:any[]=[];
  if(previewReady){
    let q=db.from("nivora_investment_scan").select("*").gte("market_cap_m",750).gte("evidence_confidence",55);
    q=mode==="today"?q.order("changed_at",{ascending:false}).limit(120):q.order("opportunity_score",{ascending:false}).limit(Math.max(limit*4,120));
    const {data,error}=await q;if(error)return NextResponse.json({items:[],coverage:{mode:"investment-scan-error",ready:false,error:error.message,scanned,eligibleUniverse:eligible},partial:true});
    items=(data||[]).map(normalize);
    if(mode==="today")items=items.filter((x:any)=>x.previousAction&&(x.changedAt||"")>=todayCutoff&&(x.previousAction!==x.action||Math.abs(Number(x.previousThesisScore||x.thesisScore)-x.thesisScore)>=6)).slice(0,limit);
    else items=items.slice(0,limit);
  }
  const diagnostic=scanned>0?null:eligible===0?"Market universe is empty — run the market-universe scanner first.":!state?.last_investment_scan_at?"Investment scanner has not completed a successful run yet.":"Investment scanner ran but stored 0 qualified companies — check FINNHUB_API_KEY, workflow logs and market-cap filters.";
  return NextResponse.json({items,coverage:{mode:"thesis-first-investment-scan",ready:previewReady,fullMarket,scanned,fresh48h:Number(state?.investment_fresh_count||0),freshness,eligibleUniverse:eligible,coveragePct,lastScanAt:state?.last_investment_scan_at||null,scanRunning:!!state?.scan_running,preview:previewReady&&!fullMarket,diagnostic},partial:!fullMarket},{headers:{"Cache-Control":"public, s-maxage=60, stale-while-revalidate=180"}});
}
