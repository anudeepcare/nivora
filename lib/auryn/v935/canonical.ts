import {INTELLIGENCE_POLICY_VERSION} from "../v931/domain";
import {projectMarketIntelligence} from "../v934/projections";
import {createClient} from "@supabase/supabase-js";
import {loadCanonicalMarketSnapshot} from "@/lib/auryn/market-data-gateway";
import {classifySecuritySymbol} from "@/lib/auryn/v82/security-master";
import {loadCanonicalCryptoSnapshot} from "@/lib/auryn/canonical-crypto";
import {isCryptoQuoteSymbol,normalizeQuoteSymbol} from "@/lib/auryn/quote-symbol";
import type {AurynCanonicalSnapshot,CanonicalResearchProjection,CanonicalSecurityIdentity} from "./domain";
import {buildV935Provenance,V935_CANONICAL_CONTRACT,V935_CANONICAL_VERSION} from "./provenance";

function db(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 return url&&key?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):null;
}
function num(v:any){return typeof v==="number"&&Number.isFinite(v)?v:null}
function identity(symbol:string):CanonicalSecurityIdentity{
 const x:any=classifySecuritySymbol(symbol);
 const assetType=isCryptoQuoteSymbol(symbol)?"CRYPTO":x?.assetType==="EQUITY"||x?.type==="EQUITY"?"EQUITY":"EQUITY";
 return {symbol,assetType,exchange:assetType==="CRYPTO"?null:x?.exchange??null,mic:assetType==="CRYPTO"?null:x?.mic??x?.micCode??null,currency:assetType==="CRYPTO"?symbol.split('/')[1]:x?.currency??"USD"};
}
export function researchFromRow(row:any):CanonicalResearchProjection{
 if(!row)return {state:"ANALYSIS_REQUIRED",observedAt:null,decisionSnapshotId:null,fingerprint:null,action:null,ownerAction:null,longTermAction:null,setupState:null,decisionScore:null,evidenceCompleteness:null,marketIntelligenceSnapshotId:null,timeframes:null,actionMap:null,levels:null,thesisScore:null,opportunityScore:null,archetype:null};
 const raw=row?.evidence?.v934??null;
 const v934=raw?.confirmed&&raw?.actionMap?projectMarketIntelligence(raw):raw;
 const v931=row?.evidence?.v931??null,legacy=row?.decision??null;
 const age=Date.now()-new Date(row.observed_at??'').getTime();
 const trusted=v931?.policyVersion===INTELLIGENCE_POLICY_VERSION&&row?.evidence?.v995?.autonomous===true&&row.evidence.v995.policyVersion===INTELLIGENCE_POLICY_VERSION;
 const state=!trusted?'ANALYSIS_REQUIRED':Number.isFinite(age)&&age>=0&&age<=7*24*3600_000?'READY':'STALE_VERIFIED';
 return {state,observedAt:row.observed_at??null,decisionSnapshotId:v931?.snapshotId??legacy?.snapshotId??null,
 fingerprint:row.evidence_fingerprint??null,policyVersion:v931?.policyVersion??null,decision:trusted?v931:null,
 financialEvidence:trusted?row.evidence.financialEvidence??null:null,events:trusted&&Array.isArray(row.evidence.events)?row.evidence.events:[],
 action:trusted?v931.newMoneyAction:null,ownerAction:trusted?v931.ownerAction:null,longTermAction:trusted?v931.longTermAction:null,
 setupState:trusted?v931.setupState??null:null,decisionScore:trusted?num(v931.decisionScore):null,evidenceCompleteness:trusted?num(v931.evidenceCompleteness):null,
 marketIntelligenceSnapshotId:v934?.snapshotId??null,timeframes:v934?.timeframes??null,actionMap:v934?.actionMap??null,levels:v934?.levels??null,
 thesisScore:trusted?num(v931.dimensions?.business?.score):null,opportunityScore:trusted?num(v931.decisionScore):null,
 archetype:row.evidence.financialEvidence?.thesis?.businessModel??legacy?.classification?.businessModel??null};
}
async function latestDecision(symbol:string){
 const client=db();if(!client)return null;
 const {data}=await client.from("nivora_v59_decision_snapshots").select("symbol,observed_at,evidence_fingerprint,decision,evidence").eq("symbol",symbol).order("observed_at",{ascending:false}).limit(1).maybeSingle();
 return data||null;
}
export async function loadAurynCanonicalSnapshot(symbolRaw:string):Promise<AurynCanonicalSnapshot>{
 const symbol=normalizeQuoteSymbol(symbolRaw); const generatedAt=new Date().toISOString();
 const rowPromise=latestDecision(symbol).catch(()=>null);
 const twelveKey=process.env.TWELVE_DATA_API_KEY||"",alpacaKey=process.env.ALPACA_PAPER_API_KEY||"",alpacaSecret=process.env.ALPACA_PAPER_API_SECRET||"";
 const marketPromise=isCryptoQuoteSymbol(symbol)?loadCanonicalCryptoSnapshot(symbol):(twelveKey||alpacaKey)?loadCanonicalMarketSnapshot({symbol,twelveKey,alpacaKey,alpacaSecret,asOf:new Date()}).then(x=>({...x.snapshot,displayChangePct:x.displayQuote.changePct,companyName:x.providerRaw.twelve?.name??null})).catch(()=>null):Promise.resolve(null);
 const [row,market]=await Promise.all([rowPromise,marketPromise]);
 const research=researchFromRow(row); const security={...identity(symbol),name:(market as any)?.companyName??null};
 const marketUnavailable=!market||market.displayPrice==null;
 const degraded=marketUnavailable||research.state!=="READY";
 const degradedReason=marketUnavailable?"MARKET_TRUTH_REFRESHING":research.state==="ANALYSIS_REQUIRED"?"ANALYSIS_REQUIRED":research.state==="STALE_VERIFIED"?"RESEARCH_REFRESH_RECOMMENDED":null;
 const provenance=buildV935Provenance({symbol,marketSnapshotId:market?.snapshotId??null,researchSnapshotId:research.decisionSnapshotId??null,fingerprint:research.fingerprint??null,generatedAt});
 return {contract:V935_CANONICAL_CONTRACT,version:V935_CANONICAL_VERSION,snapshotId:provenance.snapshotId,generatedAt,security,market,research,degraded,degradedReason};
}
/** Workspace reads reuse persisted evidence without buying a fresh quote per symbol. */
export async function loadStoredCanonicalSnapshot(symbolRaw:string):Promise<AurynCanonicalSnapshot>{
 const symbol=normalizeQuoteSymbol(symbolRaw),generatedAt=new Date().toISOString(),row=await latestDecision(symbol),research=researchFromRow(row),security=identity(symbol);
 const provenance=buildV935Provenance({symbol,marketSnapshotId:null,researchSnapshotId:research.decisionSnapshotId??null,fingerprint:research.fingerprint??null,generatedAt});
 return {contract:V935_CANONICAL_CONTRACT,version:V935_CANONICAL_VERSION,snapshotId:provenance.snapshotId,generatedAt,security,market:null,research,degraded:research.state!=='READY',degradedReason:research.state==='READY'?null:'RESEARCH_REFRESH_RECOMMENDED'};
}
export async function loadAurynCanonicalSnapshots(symbols:string[],concurrency=6){
 const unique=[...new Set(symbols.map(x=>x.trim().toUpperCase()).filter(Boolean))].slice(0,50);const out=new Map<string,AurynCanonicalSnapshot>();let i=0;
 async function worker(){while(i<unique.length){const idx=i++;const s=unique[idx];out.set(s,await loadAurynCanonicalSnapshot(s))}}
 await Promise.all(Array.from({length:Math.min(concurrency,unique.length||1)},worker));return out;
}
