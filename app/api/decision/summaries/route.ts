import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {loadCanonicalMarketSnapshots} from "@/lib/auryn/market-data-gateway";
import {rateLimitDistributed,requestKey} from "@/lib/rate-limit";

export const dynamic="force-dynamic";

function db(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 return url&&key?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):null;
}
function symbolsFrom(req:Request){
 return [...new Set((new URL(req.url).searchParams.get("symbols")||"").split(",").map(x=>x.trim().toUpperCase()).filter(Boolean))].slice(0,40);
}
function latestBySymbol(rows:any[]){
 const out=new Map<string,any>();
 for(const row of rows||[]){const symbol=String(row?.symbol||"").toUpperCase();if(symbol&&!out.has(symbol))out.set(symbol,row)}
 return out;
}

export async function GET(req:Request){
 const rl=await rateLimitDistributed(`decision-summaries:${requestKey(req)}`,60,60_000);
 if(!rl.ok)return NextResponse.json({error:"Too many decision-summary requests."},{status:429,headers:{"Retry-After":"30"}});
 const symbols=symbolsFrom(req);if(!symbols.length)return NextResponse.json({items:[]},{headers:{"Cache-Control":"private, no-store, max-age=0"}});
 const client=db();let rows:any[]=[];
 if(client){
  const {data}=await client.from("nivora_v59_decision_snapshots")
   .select("symbol,observed_at,price,evidence_fingerprint,decision,evidence")
   .in("symbol",symbols).order("observed_at",{ascending:false}).limit(Math.min(1000,Math.max(80,symbols.length*20)));
  rows=data||[];
 }
 const latest=latestBySymbol(rows);
 const twelveKey=process.env.TWELVE_DATA_API_KEY||"",alpacaKey=process.env.ALPACA_PAPER_API_KEY||"",alpacaSecret=process.env.ALPACA_PAPER_API_SECRET||"";
 const markets=await loadCanonicalMarketSnapshots(symbols.map(symbol=>({symbol,twelveKey,alpacaKey,alpacaSecret,asOf:new Date()})),6);
 const items=symbols.map(symbol=>{
  const row=latest.get(symbol),v931=row?.evidence?.v931||null,legacy=row?.decision||null,snapshot=markets.get(symbol)?.snapshot||null;
  const canonicalAction=v931?.newMoneyAction??legacy?.primaryAction??null;
  const canonicalOwnerAction=v931?.ownerAction??legacy?.ownerAction??null;
  return{
   symbol,
   decisionRole:canonicalAction?"CANONICAL_LAST_VERIFIED":"ANALYSIS_REQUIRED",
   decisionSnapshotId:v931?.snapshotId??legacy?.snapshotId??null,
   decisionAsOf:row?.observed_at??null,
   decisionFingerprint:row?.evidence_fingerprint??null,
   canonicalAction,
   canonicalOwnerAction,
   longTermAction:v931?.longTermAction??null,
   setupState:v931?.setupState??null,
   decisionScore:v931?.decisionScore??legacy?.decisionStrength?.score??null,
   evidenceCompleteness:v931?.evidenceCompleteness??legacy?.evidenceConfidence?.score??null,
   thesisScore:legacy?.thesis?.strength??null,
   archetype:legacy?.classification?.businessModel??null,
   displayPrice:snapshot?.displayPrice??null,
   analysisPrice:snapshot?.decisionPrice??null,
   executionPrice:snapshot?.executionPrice??null,
   priceUse:snapshot?.priceUse??"BLOCKED",
   priceState:snapshot?.priceState??"UNAVAILABLE",
   session:snapshot?.session??null,
   priceAsOf:snapshot?.decisionPriceAsOf??snapshot?.asOf??null,
   marketSnapshotId:snapshot?.snapshotId??null,
   researchSafe:Boolean(snapshot?.priceSensitiveAllowed),
   executionTradable:Boolean(snapshot?.executionTradable),
   marketTruth:snapshot
  };
 });
 return NextResponse.json({items,contract:"AURYN_V9_3_1_CANONICAL_SURFACE",decisionSemantics:"CANONICAL_LAST_VERIFIED",generatedAt:new Date().toISOString()},{headers:{"Cache-Control":"private, no-store, max-age=0"}});
}
