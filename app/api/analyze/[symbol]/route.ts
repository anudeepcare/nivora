import {NextResponse} from "next/server";
import {clamp,rnd,ema,pct} from "@/lib/quant";
import {computeTechnicalSnapshot,type Bar} from "@/lib/nivora-technical-engine";
import {assessBarSeriesIntegrity} from "@/lib/nivora-bar-integrity";
import {AlpacaPaperBroker} from "@/lib/alpaca-paper";
import {sharedJson,nowIso} from "@/lib/shared-cache";
import {rateLimitDistributed,requestKey} from "@/lib/rate-limit";
import {classifySecuritySymbol,isSupportedEquitySecurity} from "@/lib/auryn/v82/security-master";
import {loadV934DecisionBars} from "@/lib/auryn/v934/twelve-multitimeframe";
import {buildAurynMarketIntelligenceSnapshot} from "@/lib/auryn/v934/intelligence-snapshot";
import {loadCanonicalMarketSnapshot} from "@/lib/auryn/market-data-gateway";
import {buildCanonicalMarketSnapshot} from "@/lib/auryn/market-truth";
import {lastCompletedRegularSessionCloseTimestamp} from "@/lib/nivora-market-session";
import {assessHistoryCoverage} from "@/lib/auryn/v82/provider-coverage";
import {marketCalendarAt} from "@/lib/nivora-market-session";
import {completedDailyBars} from "@/lib/auryn/v84/completed-bars";

function qLabel(n:number,good=67,bad=42){return n>=good?"Strong":n<bad?"Weak":"Mixed"}
export async function GET(req:Request,{params}:{params:Promise<{symbol:string}>}){
 const rl=await rateLimitDistributed(`analyze:${requestKey(req)}`,45,60_000);if(!rl.ok)return NextResponse.json({error:"Too many analysis requests. Please wait a moment."},{status:429,headers:{"Retry-After":"60"}});
 const{symbol:raw}=await params; const symbol=decodeURIComponent(raw).toUpperCase(); const key=process.env.TWELVE_DATA_API_KEY;
 const isCrypto=symbol.includes("/");
 const security=classifySecuritySymbol(symbol);
 if(!isCrypto&&!isSupportedEquitySecurity(security))return NextResponse.json({error:`${symbol} is not supported by the common-equity analysis pipeline.`,code:"UNSUPPORTED_INSTRUMENT",analysisStatus:"QUARANTINED",security,researchSafe:false,executionTradable:false},{status:422,headers:{"Cache-Control":"private, no-store, max-age=0"}});
 if(!key)return NextResponse.json({error:"Add TWELVE_DATA_API_KEY to .env.local to enable live analysis."},{status:503});
 try{
  const benchmark=isCrypto?(symbol.startsWith("BTC/")?null:"BTC/USD"):"SPY";
  const alpacaBarsPromise:Promise<Bar[]|null>=!isCrypto&&process.env.ALPACA_PAPER_API_KEY&&process.env.ALPACA_PAPER_API_SECRET
   ?new AlpacaPaperBroker(process.env.ALPACA_PAPER_API_KEY,process.env.ALPACA_PAPER_API_SECRET).getRecentBars(symbol,40).catch(()=>null)
   :Promise.resolve(null);
  const asOf=new Date();
  const fetchJson=(url:string,keyParts:string[],revalidate:number,timeout:number)=>sharedJson(url,keyParts,revalidate,timeout);
  const benchPromise=benchmark&&benchmark!==symbol?Promise.race([loadV934DecisionBars({symbol:benchmark,key,asOf,fetchJson}).catch(()=>null),new Promise<null>(resolve=>setTimeout(()=>resolve(null),900))]):Promise.resolve(null);
  const alpacaBarsFast=Promise.race([alpacaBarsPromise,new Promise<null>(resolve=>setTimeout(()=>resolve(null),600))]);
  const marketGatewayPromise=Promise.race([
    loadCanonicalMarketSnapshot({symbol,twelveKey:key,alpacaKey:process.env.ALPACA_PAPER_API_KEY||'',alpacaSecret:process.env.ALPACA_PAPER_API_SECRET||'',asOf}).catch(()=>null),
    new Promise<null>(resolve=>setTimeout(()=>resolve(null),1200))
  ]);
  const [v934Bars,v934Bench,marketGateway,alpacaBars]=await Promise.all([
    loadV934DecisionBars({symbol,key,asOf,fetchJson}),
    benchPromise,
    marketGatewayPromise,
    alpacaBarsFast
  ]);
  const j=v934Bars.rawDaily,bj=v934Bench?.rawDaily??null;
  if(!j&&v934Bars.errors?.["1D"])return NextResponse.json({error:"Market history provider is temporarily unavailable. AURYN kept live price/research shell active and will retry automatically.",code:"PROVIDER_TEMPORARY_FAILURE",analysisStatus:"RETRY",security,providerDiagnostics:v934Bars.errors,researchSafe:Boolean(marketGateway?.snapshot?.priceSensitiveAllowed),executionTradable:false},{status:503,headers:{"Retry-After":"5","Cache-Control":"private, no-store, max-age=0"}});
  const coverage=assessHistoryCoverage(symbol,j);
  if(coverage.code==="PROVIDER_RATE_LIMITED")return NextResponse.json({error:coverage.reason,code:coverage.code,analysisStatus:"RETRY",security,coverage,researchSafe:false,executionTradable:false},{status:429,headers:{"Retry-After":"60","Cache-Control":"private, no-store, max-age=0"}});
  if(!coverage.analysisAllowed)return NextResponse.json({error:coverage.reason,code:coverage.code,analysisStatus:"QUARANTINED",security,coverage,researchSafe:false,executionTradable:false},{status:422,headers:{"Cache-Control":"private, no-store, max-age=0"}});
  const calendar=marketCalendarAt(asOf);
  const barRows:Bar[]=v934Bars.confirmed["1D"]??[];
  const benchRows:Bar[]|null=(benchmark===symbol?barRows:(v934Bench?.confirmed["1D"]??null)) as Bar[]|null;
  const technical=computeTechnicalSnapshot(barRows,benchRows,benchmark);
  if(!technical)throw new Error("Insufficient market history for technical analysis.");
  const fallbackClose=barRows.at(-1)?.close??null;
  const marketTruth=marketGateway?.snapshot??buildCanonicalMarketSnapshot({symbol,asOf,primary:null,secondary:null,regularClose:fallbackClose,regularCloseTimestamp:fallbackClose!=null?lastCompletedRegularSessionCloseTimestamp(asOf):null});
  const benchmarkConfirmed=benchmark===symbol?v934Bars.confirmed:(v934Bench?.confirmed??{});
  const marketIntelligence=buildAurynMarketIntelligenceSnapshot({symbol,marketTruth,confirmedBars:v934Bars.confirmed,benchmarkBars:benchmarkConfirmed,previewBars:{},benchmark});
  const analysisAnchor=barRows.at(-1)??null,analysisAnchorPrice=analysisAnchor?.close??technical.price,analysisAnchorAsOf=analysisAnchor?.datetime??null;
  const seriesIntegrity=assessBarSeriesIntegrity(barRows,alpacaBars);
  const c=barRows.map(x=>x.close),h=barRows.map(x=>x.high),l=barRows.map(x=>x.low),v=barRows.map(x=>x.volume);
  const p=technical.price,prev=c.at(-2)??p;
  const e20=ema(c,20).at(-1)!,e50=ema(c,50).at(-1)!,e200=ema(c,200).at(-1)!;
  const a=technical.volatility.atr14,volumeRatio=technical.volumeRatio;
  const trend=technical.scores.trend,momentum=technical.scores.momentum,flow=technical.scores.flow,structure=technical.scores.structure;
  const low60=Math.min(...l.slice(-60)),high60=Math.max(...h.slice(-60));
  const marketTrend=technical.market.score,benchPrice=technical.market.benchmarkPrice,rel20=technical.market.relative20;
  const sixSlice=c.slice(-126),sixStart=sixSlice[0]??p,sixReturn=sixStart?((p/sixStart)-1)*100:0,sixHigh=Math.max(...h.slice(-126)),sixLow=Math.min(...l.slice(-126));
  const oneYearClose=c.slice(-252),oneYearHigh=h.slice(-252),oneYearLow=l.slice(-252);
  const oneYearStart=oneYearClose[0]??p,oneYearReturn=oneYearStart?((p/oneYearStart)-1)*100:0;
  const yearHigh=Math.max(...oneYearHigh),yearLow=Math.min(...oneYearLow);
  const rangePosition=yearHigh>yearLow?((p-yearLow)/(yearHigh-yearLow))*100:50;
  const currentYear=Number(String(analysisAnchorAsOf||"").slice(0,4))||new Date().getFullYear();
  const ytdIndex=Math.max(0,barRows.findIndex((x:any)=>Number(String(x.datetime||"").slice(0,4))===currentYear));
  const ytdStart=c[ytdIndex]??p,ytdReturn=ytdStart?((p/ytdStart)-1)*100:0;
  let peak=sixSlice[0]??p,maxDrawdown=0;for(const x of sixSlice){if(x>peak)peak=x;const dd=peak?((x/peak)-1)*100:0;if(dd<maxDrawdown)maxDrawdown=dd}
  const sixMonthScore=clamp(50+sixReturn*.65+(p>e50?10:-10)+(e50>e200?10:-10)+Math.max(-15,maxDrawdown*.35),5,95);
  const sixMonthLabel=sixMonthScore>=70?"Strong":sixMonthScore<42?"Weak":"Mixed";
  const extension=technical.scores.extension;
  const support=technical.levels.support,majorSupport=technical.levels.majorSupport,invalidation=technical.levels.invalidation;
  const resistance=technical.levels.resistance,breakout=technical.levels.breakout,preferredEntry=technical.levels.preferredEntry;
  const rr=technical.riskReward,entry=technical.scores.entry,risk=technical.scores.risk;
  const marketRegime=technical.market.regime,relativeStrength=technical.market.relativeStrength;
  const positives:string[]=[];const risks:string[]=[];
  if(trend>=65)positives.push("Primary price structure is strong.");else if(trend<42)risks.push("Primary price structure is weak.");
  if(momentum>=65)positives.push("Momentum is confirming the move.");else if(momentum<42)risks.push("Momentum has not stabilized yet.");
  if(flow>=62)positives.push("Recent volume/flow is supportive.");else if(flow<42)risks.push("Volume/flow confirmation is weak.");
  if(relativeStrength==="Leading")positives.push(`Relative strength is leading ${benchmark||"its benchmark"}.`);else if(relativeStrength==="Lagging")risks.push(`Relative strength is lagging ${benchmark||"its benchmark"}.`);
  if(extension>=65)risks.push("Price is extended versus its recent equilibrium.");else if(extension<38)positives.push("Price is not unusually extended.");
  if(marketRegime==="Supportive")positives.push("The broader market regime is supportive.");else if(marketRegime==="Risk-off")risks.push("The broader market regime is risk-off.");
  const today=entry>=72&&risk<64?{label:"BUY ZONE",tone:"good",text:"Price location, momentum and risk are aligned well enough for a disciplined entry."}:trend>=66&&extension>=60?{label:"DON'T CHASE",tone:"bad",text:"The trend is strong, but price is stretched. Prefer a pullback or confirmed breakout retest."}:entry>=58?{label:"START SMALL / WAIT",tone:"mid",text:"The setup is improving, but confirmation is incomplete. A partial entry or patience is more disciplined than forcing size."}:{label:"WAIT",tone:"bad",text:"Today's price does not offer a strong enough entry yet. Let price prove support or confirmation first."};
  const swing=trend>=62&&momentum>=58&&entry>=60?{label:"CONSTRUCTIVE",tone:"good",text:"The swing setup is constructive if price continues to respect support and momentum holds."}:trend<42||momentum<40?{label:"NOT YET",tone:"bad",text:"The swing setup is weak. Wait for trend and momentum to improve before treating a bounce as confirmation."}:{label:"WATCH",tone:"mid",text:"The swing setup is mixed. A cleaner pullback hold or breakout confirmation would improve it."};
  const longTerm=trend>=60?{label:"WATCH / BUILD ON GOOD ENTRIES",tone:"good",text:"Longer-term price structure is constructive, but business quality and valuation should confirm the thesis before adding aggressively."}:trend<38?{label:"WAIT FOR STABILITY",tone:"bad",text:"Longer-term price structure is weak. Fundamental quality may still be intact, but price has not stabilized."}:{label:"WATCH",tone:"mid",text:"The longer-term price picture is mixed. Use fundamentals and valuation to decide whether weakness is opportunity or deterioration."};
  const own=p<invalidation?{label:"REASSESS / REDUCE RISK",tone:"bad",text:`Price is below the technical invalidation area near $${invalidation}. Recheck the business thesis and position risk.`}:p<support?{label:"HOLD / WATCH CLOSELY",tone:"mid",text:`Price is below nearest support. Watch whether $${majorSupport} stabilizes and whether the business thesis remains intact.`}:{label:"HOLD / WATCH",tone:"good",text:`The setup remains healthier while $${support} holds. Avoid adding simply because price is down; wait for a quality entry or confirmation.`};
  const candles=barRows.slice(-180).map((x:any)=>({time:x.datetime,open:+x.open,high:+x.high,low:+x.low,close:+x.close,volume:+x.volume||0}));
  const why=[p>e20?"Price is above its 20-day equilibrium.":"Price is below its 20-day equilibrium.",e20>e50?"Short trend leads the intermediate trend.":"Short trend remains below the intermediate trend.",volumeRatio>1.08?"Recent volume is above normal.":"Recent volume is not showing strong confirmation.",extension>=60?"Price is stretched enough that mean-reversion risk matters.":"Price is not unusually stretched."];
  return NextResponse.json({symbol,name:j?.meta?.symbol||symbol,assetType:isCrypto?"crypto":"stock",security,analysisStatus:"OK",marketTruth,marketIntelligence,price:rnd(analysisAnchorPrice),priceRole:"ANALYSIS_ANCHOR",analysisAnchorPrice:rnd(analysisAnchorPrice),analysisAnchorAsOf,analysisAnchorRole:"COMPLETED_DAILY_BAR",changePct:rnd(pct(p,prev)),volumeRatio:rnd(volumeRatio),technicalState:technical.technicalState,indicators:technical.indicators,indicatorVersion:technical.indicatorVersion,technicalStateVersion:technical.technicalStateVersion,sixMonth:{score:Math.round(sixMonthScore),label:sixMonthLabel,returnPct:rnd(sixReturn),maxDrawdownPct:rnd(maxDrawdown),high:rnd(sixHigh),low:rnd(sixLow),summary:sixMonthLabel==="Strong"?"The 6-month price record is constructive.":sixMonthLabel==="Weak"?"The 6-month price record is weak; rallies need confirmation.":"The 6-month price record is mixed."},performance:{sixMonthPct:rnd(sixReturn),ytdPct:rnd(ytdReturn),oneYearPct:rnd(oneYearReturn),yearHigh:rnd(yearHigh),yearLow:rnd(yearLow),rangePositionPct:Math.round(clamp(rangePosition,0,100))},freshness:{priceAt:analysisAnchorAsOf,decisionAt:nowIso(),priceTtlSeconds:86400,decisionTtlSeconds:45},dataIntegrity:{historicalBars:seriesIntegrity},volatility:{atr14:rnd(a),atrPct:rnd(a/p*100)},market:{benchmark,benchmarkPrice:benchPrice!=null?rnd(benchPrice):null,regime:marketRegime,score:Math.round(marketTrend),relativeStrength,relative20:rnd(rel20)},scores:{trend:Math.round(trend),momentum:Math.round(momentum),flow:Math.round(flow),structure:Math.round(structure),entry:Math.round(entry),risk:Math.round(risk),extension:Math.round(extension)},labels:{trend:qLabel(trend),momentum:qLabel(momentum),flow:qLabel(flow),structure:qLabel(structure),entry:entry>=68?"Good":entry<48?"Poor":"Improving",risk:risk<40?"Lower":risk<70?"Moderate":"High",extension:extension>=65?"Stretched":extension<38?"Normal":"Elevated"},views:{today,swing,longTerm,own},levels:{preferredEntry,support,majorSupport,resistance,breakout,invalidation},engine:{Trend:Math.round(trend),Momentum:Math.round(momentum),Flow:Math.round(flow),Structure:Math.round(structure),Extension:Math.round(extension),"Relative strength":relativeStrength,"Market regime":marketRegime,"Indicator version":technical.indicatorVersion},candles,positives:positives.slice(0,4),risks:risks.slice(0,4),why,riskReward:rnd(rr)},{headers:{"Cache-Control":"private, no-store, max-age=0"}});
 }catch(e:any){
  const coverage=assessHistoryCoverage(symbol,{message:e?.message||String(e)});
  if(coverage.code==="PROVIDER_RATE_LIMITED")return NextResponse.json({error:coverage.reason,code:coverage.code,analysisStatus:"RETRY",security,coverage,researchSafe:false,executionTradable:false},{status:429,headers:{"Retry-After":"60","Cache-Control":"private, no-store, max-age=0"}});
  if(coverage.code==="PROVIDER_COVERAGE_MISSING"||coverage.code==="MARKET_HISTORY_UNAVAILABLE")return NextResponse.json({error:coverage.reason,code:coverage.code,analysisStatus:"QUARANTINED",security,coverage,researchSafe:false,executionTradable:false},{status:422,headers:{"Cache-Control":"private, no-store, max-age=0"}});
  return NextResponse.json({error:e.name==="AbortError"?"Market data timed out. Please try again.":e.message||"Analysis failed"},{status:500})
 }
}
