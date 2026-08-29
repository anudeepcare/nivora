import {NextResponse} from "next/server";
const SEC_HEADERS={"User-Agent":"NIVORA research app support@nivora.local","Accept-Encoding":"gzip, deflate"};
const TAX=["us-gaap","ifrs-full"];
function money(n:number){if(!isFinite(n))return"—";const a=Math.abs(n),s=n<0?"-":"";const x=Math.abs(n);if(a>=1e12)return `${s}$${(x/1e12).toFixed(2)}T`;if(a>=1e9)return `${s}$${(x/1e9).toFixed(2)}B`;if(a>=1e6)return `${s}$${(x/1e6).toFixed(1)}M`;return `${s}$${Math.round(x).toLocaleString()}`}
function pct(n:number){return `${n>=0?"+":""}${n.toFixed(1)}%`}
function factsFor(facts:any,tags:string[]){for(const tax of TAX){for(const tag of tags){const f=facts?.[tax]?.[tag];if(!f)continue;for(const [unit,arr] of Object.entries(f.units||{})){if(Array.isArray(arr)&&arr.length)return {unit,arr:arr as any[]}}}}return null}
function annualSeries(facts:any,tags:string[]){const f=factsFor(facts,tags);if(!f)return[];const a=f.arr.filter((x:any)=>["10-K","20-F","40-F"].includes(x.form)&&x.val!=null).sort((x:any,y:any)=>String(x.end).localeCompare(String(y.end)));const byEnd=new Map<string,any>();for(const x of a)byEnd.set(String(x.end),x);return [...byEnd.values()].slice(-4)}
function latest(facts:any,tags:string[]){const f=factsFor(facts,tags);if(!f)return null;const a=f.arr.filter((x:any)=>["10-K","10-Q","20-F","6-K","40-F"].includes(x.form)&&x.val!=null).sort((x:any,y:any)=>String(x.end).localeCompare(String(y.end))||String(x.filed).localeCompare(String(y.filed)));return a.at(-1)?.val??null}
function latestAnnual(facts:any,tags:string[]){const a=annualSeries(facts,tags);return a.at(-1)?.val??null}
function growth(facts:any,tags:string[]){const a=annualSeries(facts,tags);if(a.length<2)return null;const n=+a.at(-1)!.val,p=+a.at(-2)!.val;return p?((n/p)-1)*100:null}
function classifyFiling(form:string,desc:string){const d=(form+" "+desc).toLowerCase();if(form==="S-3"||form==="424B5"||d.includes("offering")||d.includes("prospectus"))return {label:"Financing / dilution watch",tone:"risk",materiality:"High"};if(form==="8-K"||form==="6-K")return {label:"Material company update",tone:"watch",materiality:"High"};if(["10-Q","10-K","20-F","40-F"].includes(form))return {label:"Financial results / filing",tone:"info",materiality:"High"};if(form==="4")return {label:"Insider transaction filing",tone:"watch",materiality:"Medium"};return {label:"SEC filing",tone:"info",materiality:"Medium"}}
export async function GET(_:Request,{params}:{params:Promise<{symbol:string}>}){const{symbol:raw}=await params;const symbol=decodeURIComponent(raw).toUpperCase();if(symbol.includes("/"))return NextResponse.json({name:symbol,assetType:"crypto",fundamentals:[],filings:[],fundamentalSignal:{label:"Not applicable",tone:"neutral",reasons:["Crypto is evaluated with market, liquidity and network-specific data instead of SEC company fundamentals."]}});
try{
 const tickers=await fetch("https://www.sec.gov/files/company_tickers.json",{headers:SEC_HEADERS,next:{revalidate:86400}}).then(r=>r.json());
 const entry=Object.values(tickers).find((x:any)=>String(x.ticker).toUpperCase()===symbol) as any;
 if(!entry)return NextResponse.json({name:symbol,fundamentals:[],filings:[],fundamentalSignal:{label:"Limited",tone:"neutral",reasons:["No SEC company-facts match was found for this symbol."]}});
 const cik=String(entry.cik_str).padStart(10,"0");
 const [facts,subs]=await Promise.all([
  fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`,{headers:SEC_HEADERS,next:{revalidate:21600}}).then(r=>r.json()),
  fetch(`https://data.sec.gov/submissions/CIK${cik}.json`,{headers:SEC_HEADERS,next:{revalidate:3600}}).then(r=>r.json())
 ]);
 const revTags=["RevenueFromContractWithCustomerExcludingAssessedTax","Revenues","SalesRevenueNet","Revenue","RevenueFromContractsWithCustomers"];
 const niTags=["NetIncomeLoss","ProfitLoss","ProfitLossFromContinuingOperations"];
 const cashTags=["CashAndCashEquivalentsAtCarryingValue","CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents","CashAndCashEquivalents"];
 const assetsTags=["Assets","AssetsCurrent"];
 const liabTags=["Liabilities","LiabilitiesCurrent"];
 const opCashTags=["NetCashProvidedByUsedInOperatingActivities","CashFlowsFromUsedInOperatingActivities"];
 const capexTags=["PaymentsToAcquirePropertyPlantAndEquipment","PurchaseOfPropertyPlantAndEquipment"];
 const grossTags=["GrossProfit","GrossProfitLoss"];
 const opIncomeTags=["OperatingIncomeLoss","ProfitLossFromOperatingActivities"];
 const rev=latestAnnual(facts.facts,revTags)??latest(facts.facts,revTags),ni=latestAnnual(facts.facts,niTags)??latest(facts.facts,niTags),cash=latest(facts.facts,cashTags),assets=latest(facts.facts,assetsTags),liab=latest(facts.facts,liabTags),opCash=latestAnnual(facts.facts,opCashTags),capex=latestAnnual(facts.facts,capexTags),gross=latestAnnual(facts.facts,grossTags),opIncome=latestAnnual(facts.facts,opIncomeTags);
 const revGrowth=growth(facts.facts,revTags),niGrowth=growth(facts.facts,niTags),fcf=opCash!=null&&capex!=null?+opCash-Math.abs(+capex):null,opMargin=rev&&opIncome!=null?(+opIncome/+rev)*100:null,grossMargin=rev&&gross!=null?(+gross/+rev)*100:null,leverage=assets&&liab!=null?(+liab/+assets)*100:null;
 const fundamentals:any[]=[];
 if(rev!=null)fundamentals.push({label:"Annual revenue",value:money(+rev),detail:revGrowth!=null?`${pct(revGrowth)} YoY`:undefined});
 if(ni!=null)fundamentals.push({label:"Annual net income",value:money(+ni),detail:niGrowth!=null?`${pct(niGrowth)} YoY`:undefined});
 if(fcf!=null)fundamentals.push({label:"Free cash flow",value:money(fcf),detail:fcf>0?"Positive":"Negative"});
 if(cash!=null)fundamentals.push({label:"Cash & equivalents",value:money(+cash)});
 if(opMargin!=null)fundamentals.push({label:"Operating margin",value:`${opMargin.toFixed(1)}%`});
 if(grossMargin!=null)fundamentals.push({label:"Gross margin",value:`${grossMargin.toFixed(1)}%`});
 if(leverage!=null)fundamentals.push({label:"Liabilities / assets",value:`${leverage.toFixed(1)}%`});
 let score=0;const reasons:string[]=[];
 if(revGrowth!=null){if(revGrowth>15){score+=2;reasons.push("Revenue growth is strong.")}else if(revGrowth>0){score+=1;reasons.push("Revenue is growing.")}else{score-=1;reasons.push("Revenue growth is negative.")}}
 if(ni!=null){if(+ni>0){score+=1;reasons.push("The company is profitable on the latest annual filing.")}else{score-=1;reasons.push("Latest annual net income is negative.")}}
 if(fcf!=null){if(fcf>0){score+=1;reasons.push("Free cash flow is positive.")}else{score-=1;reasons.push("Free cash flow is negative.")}}
 if(opMargin!=null&&opMargin>12){score+=1;reasons.push("Operating margin is healthy.")}
 if(leverage!=null){if(leverage<65)score+=1;else if(leverage>85)score-=1}
 if(cash!=null&&liab!=null&&+cash>+liab*.25){score+=1;reasons.push("Cash provides a meaningful balance-sheet cushion.")}
 const fundamentalSignal=score>=4?{label:"Strong",tone:"good",score,reasons}:score<=0?{label:"Weak / watch",tone:"bad",score,reasons}:{label:"Mixed",tone:"mid",score,reasons};
 const r=subs.filings?.recent||{},filings=(r.form||[]).map((form:string,i:number)=>{const description=r.primaryDocDescription?.[i]||r.primaryDocument?.[i]||"SEC filing",classify=classifyFiling(form,description);return{form,date:r.filingDate?.[i],accession:r.accessionNumber?.[i],description,url:`https://www.sec.gov/Archives/edgar/data/${entry.cik_str}/${String(r.accessionNumber?.[i]||"").replaceAll("-","")}/${r.primaryDocument?.[i]||""}`,...classify}}).filter((x:any)=>["8-K","10-Q","10-K","6-K","20-F","40-F","S-3","424B5","4"].includes(x.form)).slice(0,14);
 const filingRisk=filings.find((x:any)=>x.tone==="risk");
 return NextResponse.json({name:entry.title,cik,assetType:"stock",fundamentals,fundamentalSignal,filings,filingRisk,rawMetrics:{revGrowth,niGrowth,fcf,opMargin,grossMargin,leverage}});
}catch{return NextResponse.json({name:symbol,fundamentals:[],filings:[],fundamentalSignal:{label:"Limited",tone:"neutral",reasons:["SEC data could not be loaded right now."]}})}
}
