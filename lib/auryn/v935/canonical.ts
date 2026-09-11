import {createClient} from "@supabase/supabase-js";
import {loadCanonicalMarketSnapshot} from "@/lib/auryn/market-data-gateway";
import {classifySecuritySymbol} from "@/lib/auryn/v82/security-master";
import type {AurynCanonicalSnapshot,CanonicalResearchProjection,CanonicalSecurityIdentity} from "./domain";

function db(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 return url&&key?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):null;
}
function hashText(s:string){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0}return h.toString(36)}
function num(v:any){const n=Number(v);return Number.isFinite(n)?n:null}
function identity(symbol:string):CanonicalSecurityIdentity{
 const x:any=classifySecuritySymbol(symbol);
 const assetType=symbol.includes("/")?"CRYPTO":x?.assetType==="EQUITY"||x?.type==="EQUITY"?"EQUITY":"EQUITY";
 return {symbol,assetType,exchange:x?.exchange??null,mic:x?.mic??x?.micCode??null,currency:x?.currency??(assetType==="EQUITY"?"USD":null)};
}
function researchFromRow(row:any):CanonicalResearchProjection{
 if(!row)return {state:"ANALYSIS_REQUIRED",observedAt:null,decisionSnapshotId:null,fingerprint:null,action:null,ownerAction:null,longTermAction:null,setupState:null,decisionScore:null,evidenceCompleteness:null,marketIntelligenceSnapshotId:null,timeframes:null,actionMap:null,levels:null,thesisScore:null,opportunityScore:null,archetype:null};
 const v934=row?.evidence?.v934||null,v931=row?.evidence?.v931||null,legacy=row?.decision||null,age=Date.now()-new Date(row.observed_at||0).getTime();
 return {state:age<=7*24*3600_000?"READY":"STALE_VERIFIED",observedAt:row.observed_at??null,decisionSnapshotId:v931?.snapshotId??legacy?.snapshotId??null,fingerprint:row.evidence_fingerprint??null,action:v931?.newMoneyAction??legacy?.primaryAction??null,ownerAction:v931?.ownerAction??legacy?.ownerAction??null,longTermAction:v931?.longTermAction??null,setupState:v931?.setupState??null,decisionScore:num(v931?.decisionScore??legacy?.decisionStrength?.score),evidenceCompleteness:num(v931?.evidenceCompleteness??legacy?.evidenceConfidence?.score),marketIntelligenceSnapshotId:v934?.snapshotId??null,timeframes:v934?.timeframes??null,actionMap:v934?.actionMap??null,levels:v934?.levels??null,thesisScore:num(legacy?.thesis?.strength),opportunityScore:num(row?.evidence?.investorDecision?.opportunityScore??legacy?.opportunityScore),archetype:legacy?.classification?.businessModel??null};
}
async function latestDecision(symbol:string){
 const client=db();if(!client)return null;
 const {data}=await client.from("nivora_v59_decision_snapshots").select("symbol,observed_at,evidence_fingerprint,decision,evidence").eq("symbol",symbol).order("observed_at",{ascending:false}).limit(1).maybeSingle();
 return data||null;
}
export async function loadAurynCanonicalSnapshot(symbolRaw:string):Promise<AurynCanonicalSnapshot>{
 const symbol=symbolRaw.trim().toUpperCase(); const generatedAt=new Date().toISOString();
 const rowPromise=latestDecision(symbol).catch(()=>null);
 const twelveKey=process.env.TWELVE_DATA_API_KEY||"",alpacaKey=process.env.ALPACA_PAPER_API_KEY||"",alpacaSecret=process.env.ALPACA_PAPER_API_SECRET||"";
 const marketPromise=(twelveKey||alpacaKey)?loadCanonicalMarketSnapshot({symbol,twelveKey,alpacaKey,alpacaSecret,asOf:new Date()}).then(x=>x.snapshot).catch(()=>null):Promise.resolve(null);
 const [row,market]=await Promise.all([rowPromise,marketPromise]);
 const research=researchFromRow(row); const security=identity(symbol);
 const degraded=!market||research.state!=="READY";
 const degradedReason=!market?"MARKET_TRUTH_REFRESHING":research.state==="ANALYSIS_REQUIRED"?"ANALYSIS_REQUIRED":research.state==="STALE_VERIFIED"?"RESEARCH_REFRESH_RECOMMENDED":null;
 const basis=JSON.stringify({symbol,market:market?.snapshotId??null,research:research.decisionSnapshotId??research.fingerprint??null});
 return {contract:"AURYN_V9_3_5_CANONICAL_SNAPSHOT",version:"auryn-v9.3.5",snapshotId:`${symbol}-v935-${hashText(basis)}`,generatedAt,security,market,research,degraded,degradedReason};
}
export async function loadAurynCanonicalSnapshots(symbols:string[],concurrency=6){
 const unique=[...new Set(symbols.map(x=>x.trim().toUpperCase()).filter(Boolean))].slice(0,50);const out=new Map<string,AurynCanonicalSnapshot>();let i=0;
 async function worker(){while(i<unique.length){const idx=i++;const s=unique[idx];out.set(s,await loadAurynCanonicalSnapshot(s))}}
 await Promise.all(Array.from({length:Math.min(concurrency,unique.length||1)},worker));return out;
}
