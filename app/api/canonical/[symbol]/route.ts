import {NextResponse} from "next/server";
import {loadAurynCanonicalSnapshot} from "@/lib/auryn/v935/canonical";
import {rateLimitDistributed,requestKey} from "@/lib/rate-limit";
export const dynamic="force-dynamic";
export async function GET(req:Request,{params}:{params:Promise<{symbol:string}>}){
 const rl=await rateLimitDistributed(`canonical-v935:${requestKey(req)}`,180,60_000);if(!rl.ok)return NextResponse.json({error:"Too many canonical snapshot requests."},{status:429,headers:{"Retry-After":"30"}});
 const {symbol:raw}=await params;const symbol=decodeURIComponent(raw).toUpperCase();
 if(!symbol)return NextResponse.json({error:"Symbol is required."},{status:400});
 const snapshot=await loadAurynCanonicalSnapshot(symbol);return NextResponse.json(snapshot,{headers:{"Cache-Control":"private, max-age=5, stale-while-revalidate=30"}});
}
