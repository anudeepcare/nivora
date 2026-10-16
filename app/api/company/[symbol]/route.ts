import {NextResponse} from "next/server";
import {sharedJson,nowIso} from "@/lib/shared-cache";
import {buildSecCompanyEvidence} from "@/lib/sec-company-evidence";
const SEC_HEADERS={"User-Agent":process.env.SEC_USER_AGENT||"AURYN research app support@nivora.local","Accept-Encoding":"gzip, deflate"};
function unavailableEvidence(reason:string,label="Limited"){
 const empty=buildSecCompanyEvidence({facts:{}},{asOf:nowIso()});
 return {...empty,dataQuality:{...empty.dataQuality,warnings:[reason]},fundamentalSignal:{...empty.fundamentalSignal,label,reasons:[reason]}};
}
function classifyFiling(form:string,desc:string){const d=(form+" "+desc).toLowerCase();if(form==="S-3"||form==="424B5"||d.includes("offering")||d.includes("prospectus"))return {label:"Financing / dilution watch",tone:"risk",materiality:"High"};if(form==="8-K"||form==="6-K")return {label:"Material company update",tone:"watch",materiality:"High"};if(["10-Q","10-K","20-F","40-F"].includes(form))return {label:"Financial results / filing",tone:"info",materiality:"High"};if(form==="4")return {label:"Insider transaction filing",tone:"watch",materiality:"Medium"};return {label:"SEC filing",tone:"info",materiality:"Medium"}}
export async function GET(_:Request,{params}:{params:Promise<{symbol:string}>}){const{symbol:raw}=await params;const symbol=decodeURIComponent(raw).toUpperCase();if(symbol.includes("/"))return NextResponse.json({name:symbol,assetType:"crypto",filings:[],...unavailableEvidence("Crypto is evaluated with market, liquidity and network-specific data instead of SEC company fundamentals.","Not applicable")});
try{
 const tickers=await sharedJson("https://www.sec.gov/files/company_tickers.json",["sec","tickers"],86400,2800,SEC_HEADERS);
 const entry=Object.values(tickers).find((x:any)=>String(x.ticker).toUpperCase()===symbol) as any;
 if(!entry)return NextResponse.json({name:symbol,filings:[],...unavailableEvidence("No SEC company-facts match was found for this symbol.")});
 const cik=String(entry.cik_str).padStart(10,"0");
 const [facts,subs]=await Promise.all([
  sharedJson(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`,["sec","facts",cik],21600,3200,SEC_HEADERS),
  sharedJson(`https://data.sec.gov/submissions/CIK${cik}.json`,["sec","submissions",cik],300,3000,SEC_HEADERS)
 ]);
 const companyEvidence=buildSecCompanyEvidence(facts,{cik,asOf:nowIso()});
 const r=subs.filings?.recent||{},filings=(r.form||[]).map((form:string,i:number)=>{const description=r.primaryDocDescription?.[i]||r.primaryDocument?.[i]||"SEC filing",classify=classifyFiling(form,description);return{form,date:r.filingDate?.[i],accession:r.accessionNumber?.[i],description,url:`https://www.sec.gov/Archives/edgar/data/${entry.cik_str}/${String(r.accessionNumber?.[i]||"").replaceAll("-","")}/${r.primaryDocument?.[i]||""}`,...classify}}).filter((x:any)=>["8-K","10-Q","10-K","6-K","20-F","40-F","S-3","424B5","4"].includes(x.form)).slice(0,14);
 const filingRisk=filings.find((x:any)=>x.tone==="risk");
 return NextResponse.json({name:entry.title,cik,assetType:"stock",freshness:{fundamentalsAt:nowIso(),fundamentalsTtlSeconds:21600,filingsTtlSeconds:300},...companyEvidence,filings,filingRisk});
}catch{return NextResponse.json({name:symbol,filings:[],...unavailableEvidence("SEC data could not be loaded right now.")})}
}
