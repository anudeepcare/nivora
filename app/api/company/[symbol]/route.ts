import {NextResponse} from "next/server";
import {sharedJson,nowIso} from "@/lib/shared-cache";
const SEC_HEADERS={"User-Agent":"NIVORA research app support@nivora.local","Accept-Encoding":"gzip, deflate"};
const TAX=["us-gaap","ifrs-full"];
function money(n:number){if(!isFinite(n))return"—";const a=Math.abs(n),s=n<0?"-":"";const x=Math.abs(n);if(a>=1e12)return `${s}$${(x/1e12).toFixed(2)}T`;if(a>=1e9)return `${s}$${(x/1e9).toFixed(2)}B`;if(a>=1e6)return `${s}$${(x/1e6).toFixed(1)}M`;return `${s}$${Math.round(x).toLocaleString()}`}
function pct(n:number){return `${n>=0?"+":""}${n.toFixed(1)}%`}
function factsFor(facts:any,tags:string[]){for(const tax of TAX){for(const tag of tags){const f=facts?.[tax]?.[tag];if(!f)continue;for(const [unit,arr] of Object.entries(f.units||{})){if(Array.isArray(arr)&&arr.length)return {unit,arr:arr as any[]}}}}return null}
function annualSeries(facts:any,tags:string[]){const f=factsFor(facts,tags);if(!f)return[];const a=f.arr.filter((x:any)=>["10-K","20-F","40-F"].includes(x.form)&&x.val!=null).sort((x:any,y:any)=>String(x.end).localeCompare(String(y.end)));const byEnd=new Map<string,any>();for(const x of a)byEnd.set(String(x.end),x);return [...byEnd.values()].slice(-5)}
function latest(facts:any,tags:string[]){const f=factsFor(facts,tags);if(!f)return null;const a=f.arr.filter((x:any)=>["10-K","10-Q","20-F","6-K","40-F"].includes(x.form)&&x.val!=null).sort((x:any,y:any)=>String(x.end).localeCompare(String(y.end))||String(x.filed).localeCompare(String(y.filed)));return a.at(-1)?.val??null}
function latestAnnual(facts:any,tags:string[]){const a=annualSeries(facts,tags);return a.at(-1)?.val??null}
function growth(facts:any,tags:string[]){const a=annualSeries(facts,tags);if(a.length<2)return null;const n=+a.at(-1)!.val,p=+a.at(-2)!.val;return p?((n/p)-1)*100:null}
function trendLabel(values:number[]){if(values.length<2)return"Limited";let up=0,down=0;for(let i=1;i<values.length;i++){if(values[i]>values[i-1])up++;else if(values[i]<values[i-1])down++;}return up>=Math.max(2,values.length-2)?"Strong":up>down?"Improving":down>up?"Weakening":"Mixed"}
function score100(n:number){return Math.max(0,Math.min(100,Math.round(n)))}
function classifyFiling(form:string,desc:string){const d=(form+" "+desc).toLowerCase();if(form==="S-3"||form==="424B5"||d.includes("offering")||d.includes("prospectus"))return {label:"Financing / dilution watch",tone:"risk",materiality:"High"};if(form==="8-K"||form==="6-K")return {label:"Material company update",tone:"watch",materiality:"High"};if(["10-Q","10-K","20-F","40-F"].includes(form))return {label:"Financial results / filing",tone:"info",materiality:"High"};if(form==="4")return {label:"Insider transaction filing",tone:"watch",materiality:"Medium"};return {label:"SEC filing",tone:"info",materiality:"Medium"}}
export async function GET(_:Request,{params}:{params:Promise<{symbol:string}>}){const{symbol:raw}=await params;const symbol=decodeURIComponent(raw).toUpperCase();if(symbol.includes("/"))return NextResponse.json({name:symbol,assetType:"crypto",fundamentals:[],filings:[],fundamentalSignal:{label:"Not applicable",tone:"neutral",reasons:["Crypto is evaluated with market, liquidity and network-specific data instead of SEC company fundamentals."]}});
try{
 const tickers=await sharedJson("https://www.sec.gov/files/company_tickers.json",["sec","tickers"],86400,2800,SEC_HEADERS);
 const entry=Object.values(tickers).find((x:any)=>String(x.ticker).toUpperCase()===symbol) as any;
 if(!entry)return NextResponse.json({name:symbol,fundamentals:[],filings:[],fundamentalSignal:{label:"Limited",tone:"neutral",reasons:["No SEC company-facts match was found for this symbol."]}});
 const cik=String(entry.cik_str).padStart(10,"0");
 const [facts,subs]=await Promise.all([
  sharedJson(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`,["sec","facts",cik],21600,3200,SEC_HEADERS),
  sharedJson(`https://data.sec.gov/submissions/CIK${cik}.json`,["sec","submissions",cik],300,3000,SEC_HEADERS)
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
 const revSeries=annualSeries(facts.facts,revTags),niSeries=annualSeries(facts.facts,niTags),opCashSeries=annualSeries(facts.facts,opCashTags);
 const years=[...new Set([...revSeries,...niSeries].map((x:any)=>String(x.end).slice(0,4)))].sort().slice(-5);
 const history=years.map(year=>{const rr=revSeries.find((x:any)=>String(x.end).startsWith(year)),nn=niSeries.find((x:any)=>String(x.end).startsWith(year)),cc=opCashSeries.find((x:any)=>String(x.end).startsWith(year));return{year,revenue:rr?+rr.val:null,netIncome:nn?+nn.val:null,operatingCashFlow:cc?+cc.val:null}});
 const revVals=history.map(x=>x.revenue).filter((x):x is number=>x!=null),niVals=history.map(x=>x.netIncome).filter((x):x is number=>x!=null);
 const revenueTrend=trendLabel(revVals),profitTrend=trendLabel(niVals);
 const profitableYears=niVals.length?niVals.filter(x=>x>0).length/niVals.length:0;
 const positiveCashYears=history.filter(x=>x.operatingCashFlow!=null).length?history.filter(x=>(x.operatingCashFlow??0)>0).length/history.filter(x=>x.operatingCashFlow!=null).length:0;
 let fiveScore=50; if(revenueTrend==="Strong")fiveScore+=18;else if(revenueTrend==="Improving")fiveScore+=10;else if(revenueTrend==="Weakening")fiveScore-=12; fiveScore+=(profitableYears-.5)*28; fiveScore+=(positiveCashYears-.5)*18; if(opMargin!=null)fiveScore+=Math.max(-10,Math.min(12,(opMargin-8)*.7)); if(leverage!=null)fiveScore+=leverage<55?8:leverage>85?-10:0;
 const fiveYearRecord={score:score100(fiveScore),years:history.length,revenueTrend,profitTrend,profitableYears:Math.round(profitableYears*100),positiveCashYears:Math.round(positiveCashYears*100),history,summary:history.length<3?"Limited long-term filing history is available.":revenueTrend==="Strong"&&profitableYears>=.6?"Revenue history is strong and profitability has been relatively consistent.":revenueTrend==="Weakening"?"The multi-year revenue record is weakening and deserves closer review.":"The five-year business record is mixed; use current fundamentals and catalysts for context."};
 const fundamentals:any[]=[];
 if(rev!=null)fundamentals.push({label:"Annual revenue",value:money(+rev),detail:revGrowth!=null?`${pct(revGrowth)} YoY`:undefined});
 if(ni!=null)fundamentals.push({label:"Annual net income",value:money(+ni),detail:niGrowth!=null?`${pct(niGrowth)} YoY`:undefined});
 if(fcf!=null)fundamentals.push({label:"Free cash flow",value:money(fcf),detail:fcf>0?"Positive":"Negative"});
 if(cash!=null)fundamentals.push({label:"Cash & equivalents",value:money(+cash)});
 if(opMargin!=null)fundamentals.push({label:"Operating margin",value:`${opMargin.toFixed(1)}%`});
 if(grossMargin!=null)fundamentals.push({label:"Gross margin",value:`${grossMargin.toFixed(1)}%`});
 if(leverage!=null)fundamentals.push({label:"Liabilities / assets",value:`${leverage.toFixed(1)}%`});
 let score=0;const reasons:string[]=[];const positiveReasons:string[]=[];const riskReasons:string[]=[];
 const pos=(x:string)=>{reasons.push(x);positiveReasons.push(x)};const neg=(x:string)=>{reasons.push(x);riskReasons.push(x)};
 if(revGrowth!=null){if(revGrowth>15){score+=2;pos("Revenue growth is strong.")}else if(revGrowth>0){score+=1;pos("Revenue is growing.")}else{score-=1;neg("Revenue growth is negative.")}}
 if(ni!=null){if(+ni>0){score+=1;pos("The company is profitable on the latest annual filing.")}else{score-=1;neg("Latest annual net income is negative.")}}
 if(fcf!=null){if(fcf>0){score+=1;pos("Free cash flow is positive.")}else{score-=1;neg("Free cash flow is negative.")}}
 if(opMargin!=null&&opMargin>12){score+=1;pos("Operating margin is healthy.")}
 if(leverage!=null){if(leverage<65){score+=1;pos("Balance-sheet leverage is moderate.")}else if(leverage>85){score-=1;neg("Liabilities are high relative to assets.")}}
 if(cash!=null&&liab!=null&&+cash>+liab*.25){score+=1;pos("Cash provides a meaningful balance-sheet cushion.")}
 const businessScore=score100(50+score*8+(fiveYearRecord.score-50)*.35);
 const fundamentalSignal=businessScore>=72?{label:"Strong",tone:"good",score:businessScore,reasons,positiveReasons,riskReasons}:businessScore<45?{label:"Weak / watch",tone:"bad",score:businessScore,reasons,positiveReasons,riskReasons}:{label:"Mixed",tone:"mid",score:businessScore,reasons,positiveReasons,riskReasons};
 const r=subs.filings?.recent||{},filings=(r.form||[]).map((form:string,i:number)=>{const description=r.primaryDocDescription?.[i]||r.primaryDocument?.[i]||"SEC filing",classify=classifyFiling(form,description);return{form,date:r.filingDate?.[i],accession:r.accessionNumber?.[i],description,url:`https://www.sec.gov/Archives/edgar/data/${entry.cik_str}/${String(r.accessionNumber?.[i]||"").replaceAll("-","")}/${r.primaryDocument?.[i]||""}`,...classify}}).filter((x:any)=>["8-K","10-Q","10-K","6-K","20-F","40-F","S-3","424B5","4"].includes(x.form)).slice(0,14);
 const filingRisk=filings.find((x:any)=>x.tone==="risk");
 return NextResponse.json({name:entry.title,cik,assetType:"stock",freshness:{fundamentalsAt:nowIso(),fundamentalsTtlSeconds:21600,filingsTtlSeconds:300},fundamentals,fundamentalSignal,fiveYearRecord,filings,filingRisk,rawMetrics:{revGrowth,niGrowth,fcf,opMargin,grossMargin,leverage}});
}catch{return NextResponse.json({name:symbol,fundamentals:[],filings:[],fundamentalSignal:{label:"Limited",tone:"neutral",reasons:["SEC data could not be loaded right now."]}})}
}
