import {NextResponse} from "next/server";
import {loadAurynCanonicalSnapshots} from "@/lib/auryn/v935/canonical";
import {rateLimitDistributed,requestKey} from "@/lib/rate-limit";

export const dynamic="force-dynamic";

function symbolsFrom(req:Request){
 return [...new Set((new URL(req.url).searchParams.get("symbols")||"").split(",").map(x=>x.trim().toUpperCase()).filter(Boolean))].slice(0,40);
}

export async function GET(req:Request){
 const rl=await rateLimitDistributed(`decision-summaries:${requestKey(req)}`,60,60_000);
 if(!rl.ok)return NextResponse.json({error:"Too many decision-summary requests."},{status:429,headers:{"Retry-After":"30"}});
 const symbols=symbolsFrom(req);if(!symbols.length)return NextResponse.json({items:[]},{headers:{"Cache-Control":"private, no-store, max-age=0"}});
 const snapshots=await loadAurynCanonicalSnapshots(symbols);
 const items=symbols.map(symbol=>{
  const canonical=snapshots.get(symbol),research=canonical?.research,snapshot=canonical?.market??null;
  const v931=research?.decision??null;
  const canonicalAction=research?.action??null,canonicalOwnerAction=research?.ownerAction??null;
  return{
   symbol,
   decisionRole:canonicalAction?"CANONICAL_LAST_VERIFIED":"ANALYSIS_REQUIRED",
   decisionSnapshotId:research?.decisionSnapshotId??null,
   decisionAsOf:research?.observedAt??null,
   decisionFingerprint:research?.fingerprint??null,
   canonicalAction,
   canonicalOwnerAction,
   longTermAction:v931?.longTermAction??null,
   setupState:v931?.setupState??null,
   marketIntelligenceSnapshotId:research?.marketIntelligenceSnapshotId??null,
   marketIntelligence:research?{snapshotId:research.marketIntelligenceSnapshotId,timeframes:research.timeframes,actionMap:research.actionMap,levels:research.levels}:null,
   timeframes:research?.timeframes??null,
   actionMap:research?.actionMap??null,
   levels:research?.levels??null,
   decisionScore:research?.decisionScore??null,
   evidenceCompleteness:research?.evidenceCompleteness??null,
   thesisScore:research?.thesisScore??null,
   archetype:research?.archetype??null,
   displayPrice:snapshot?.displayPrice??null,
   analysisPrice:snapshot?.decisionPrice??null,
   executionPrice:snapshot?.executionPrice??null,
   priceUse:snapshot?.priceUse??"BLOCKED",
   priceState:snapshot?.priceState??"UNAVAILABLE",
   session:snapshot?.session??null,
   priceAsOf:snapshot?.decisionPriceAsOf??snapshot?.asOf??null,
   marketSnapshotId:snapshot?.snapshotId??null,
   researchSafe:Boolean(snapshot?.priceSensitiveAllowed),
   executionTradable:Boolean(snapshot?.executionTradable&&research?.state==="READY"&&v931?.executionAction==="READY"),
   marketTruth:snapshot
  };
 });
 return NextResponse.json({items,contract:"AURYN_V9_3_4_CANONICAL_SURFACE",decisionSemantics:"CANONICAL_LAST_VERIFIED",generatedAt:new Date().toISOString()},{headers:{"Cache-Control":"private, no-store, max-age=0"}});
}
