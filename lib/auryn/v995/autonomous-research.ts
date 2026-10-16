import {buildInvestorDecision} from "../../nivora-investor";
import {adaptCurrentEvidenceToV4} from "../v4/current-evidence-adapter";
import {buildAurynV4CoreAnalysis} from "../v4/analyze";
import {buildAurynV5Analysis} from "../v5/analyze";
import {collectResearchEvents} from "../v931/research-events";
import {buildCanonicalAssessment} from "../v931/canonical-assessment";
import {classifyResearchFailure,validateResearchDecision} from "./research-contract";

const finite=(x:any)=>x!==null&&x!==undefined&&Number.isFinite(Number(x));
async function get(fetcher:typeof fetch,origin:string,path:string){
 const r=await fetcher(`${origin}${path}`,{cache:"no-store",headers:{"x-auryn-background-research":"1"}});
 let j:any=null;try{j=await r.json()}catch{}
 if(!r.ok||j?.error){const e:any=new Error(j?.error||`HTTP_${r.status}`);e.status=r.status;e.code=j?.code;throw e}return j;
}
export async function runAutonomousCanonicalResearch(symbolRaw:string,{origin,fetcher=fetch}:{origin:string;fetcher?:typeof fetch}){
 const symbol=symbolRaw.toUpperCase();
 try{
  const [d,company,context,institutional]=await Promise.all([
   get(fetcher,origin,`/api/analyze/${encodeURIComponent(symbol)}`),get(fetcher,origin,`/api/company/${encodeURIComponent(symbol)}`),
   get(fetcher,origin,`/api/context/${encodeURIComponent(symbol)}`),get(fetcher,origin,`/api/institutional/${encodeURIComponent(symbol)}`)
  ]);
  const marketTruth=d?.marketTruth;if(!marketTruth?.snapshotId)return{state:"INSUFFICIENT_EVIDENCE" as const,reason:"MARKET_TRUTH_MISSING"};
  const px=Number(marketTruth.decisionPrice),market=finite(px)?{...d,price:px,canonicalMarketSnapshot:marketTruth}:{...d,canonicalMarketSnapshot:marketTruth};
  const legacy=buildInvestorDecision({market,company,context,institutional,owns:false,position:null});
  const v4=buildAurynV4CoreAnalysis(adaptCurrentEvidenceToV4({symbol,asOf:marketTruth.asOf||new Date().toISOString(),market,company,context,institutional,legacyDecision:legacy}));
  const v5=buildAurynV5Analysis({symbol,marketTruth,v4,technical:market?.technicalState&&market?.indicators?market:null,bars:Array.isArray(market?.candles)?market.candles:[]});
  const {decision,snapshot,financial}=buildCanonicalAssessment({symbol,marketTruth,v5,company,context,marketData:d});
  if(!validateResearchDecision(decision))return{state:"INSUFFICIENT_EVIDENCE" as const,reason:"CANONICAL_DECISION_INCOMPLETE"};
  return{state:"RESEARCH_READY" as const,decision,snapshot,financial,events:collectResearchEvents(symbol,company,context,marketTruth.asOf),marketTruth,marketIntelligence:d?.marketIntelligence??null};
 }catch(e:any){return{state:classifyResearchFailure(e),reason:String(e?.code||e?.message||e)}}
}
