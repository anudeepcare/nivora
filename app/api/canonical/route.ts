import {NextResponse} from "next/server";
import {loadAurynCanonicalSnapshots} from "@/lib/auryn/v935/canonical";
import {rateLimitDistributed,requestKey} from "@/lib/rate-limit";
export const dynamic="force-dynamic";
export async function GET(req:Request){
 const rl=await rateLimitDistributed(`canonical-v935-batch:${requestKey(req)}`,90,60_000);if(!rl.ok)return NextResponse.json({error:"Too many canonical batch requests."},{status:429,headers:{"Retry-After":"30"}});
 const symbols=[...new Set((new URL(req.url).searchParams.get("symbols")||"").split(",").map(x=>x.trim().toUpperCase()).filter(Boolean))].slice(0,50);
 const m=await loadAurynCanonicalSnapshots(symbols,6);return NextResponse.json({contract:"AURYN_V9_3_5_CANONICAL_BATCH",version:"auryn-v9.3.5",generatedAt:new Date().toISOString(),items:symbols.map(s=>m.get(s)).filter(Boolean)},{headers:{"Cache-Control":"private, max-age=5, stale-while-revalidate=30"}});
}
