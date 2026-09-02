import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {ENGINE_VERSION} from "@/lib/nivora-version";

export const dynamic="force-dynamic";

export async function GET(req:Request){
 const secret=process.env.TRADING_LAB_CRON_SECRET||process.env.CRON_SECRET;
 if(!secret||req.headers.get("authorization")!==`Bearer ${secret}`)return NextResponse.json({error:"Unauthorized."},{status:401});

 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({error:"Decision audit storage is not configured."},{status:503});
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});

 const {data,error}=await db.from("nivora_v59_decision_snapshots")
  .select("id,symbol,observed_at,decision,engine_version")
  .eq("engine_version",ENGINE_VERSION)
  .order("observed_at",{ascending:false})
  .limit(1000);
 if(error)return NextResponse.json({error:error.message},{status:500});

 const latest=new Map<string,any>();
 for(const row of data||[]){
  const symbol=String(row.symbol||"").toUpperCase();
  if(symbol&&!latest.has(symbol))latest.set(symbol,row);
 }

 const actions:Record<string,number>={},paths:Record<string,number>={},blockers:Record<string,number>={};
 const details:any[]=[];
 for(const row of latest.values()){
  const d=row.decision||{},today=d.today||{};
  const action=String(today.action||"MISSING");
  actions[action]=(actions[action]||0)+1;
  const buyAudit=today.buyAudit||null;
  const path=String(today.buyPath||buyAudit?.path||"");
  if(path)paths[path]=(paths[path]||0)+1;
  const blocker=String(buyAudit?.primaryBlocker||"");
  if(blocker)blockers[blocker]=(blockers[blocker]||0)+1;
  details.push({
   symbol:String(row.symbol||"").toUpperCase(),
   observedAt:row.observed_at,
   action,
   thesisScore:Number(d.thesisScore||0),
   opportunityScore:Number(d.opportunityScore||0),
   companyScore:Number(d.companyScore||0),
   timingScore:Number(d.timing?.score||0),
   timingLabel:d.timing?.label||null,
   archetype:d.archetype||null,
   buyPath:today.buyPath||null,
   buyTier:today.buyTier||null,
   closestPath:buyAudit?.closestPath||null,
   primaryBlocker:blocker||null,
   pathDistance:buyAudit?.paths?.[0]?.distance??null,
   blockers:Array.isArray(buyAudit?.blockers)?buyAudit.blockers.slice(0,5):[]
  });
 }

 const dominantBlockers=Object.entries(blockers).sort((a,b)=>b[1]-a[1]).map(([reason,count])=>({reason,count}));
 const closestToBuy=details
  .filter(x=>x.action!=="BUY"&&x.closestPath&&Number.isFinite(Number(x.pathDistance)))
  .sort((a,b)=>Number(a.pathDistance)-Number(b.pathDistance))
  .slice(0,30);

 return NextResponse.json({
  status:"ok",
  engineVersion:ENGINE_VERSION,
  sample:"latest snapshot per analyzed symbol",
  total:details.length,
  actions,
  buyPaths:paths,
  dominantBlockers:dominantBlockers.slice(0,20),
  closestToBuy,
  details
 },{headers:{"Cache-Control":"private, no-store, max-age=0"}});
}
