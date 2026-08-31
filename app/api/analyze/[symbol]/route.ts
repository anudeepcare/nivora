import {NextResponse} from "next/server";
import {clamp,avg,sma,rnd,ema,rsi,atr,stddev,macd,obv,slope,pct} from "@/lib/quant";
import {sharedJson,nowIso} from "@/lib/shared-cache";
import {rateLimitDistributed,requestKey} from "@/lib/rate-limit";

const EXCHANGE_HINTS:Record<string,string>={SAP:"NYSE"};
async function series(symbol:string,key:string,size=240,revalidate=45,timeout=3200){
  const exchange=EXCHANGE_HINTS[symbol];
  const u=`https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=1day&outputsize=${size}${exchange?`&exchange=${encodeURIComponent(exchange)}`:""}&apikey=${key}`;
  return sharedJson(u,["twelve","series",symbol,String(size)],revalidate,timeout);
}
function qLabel(n:number,good=67,bad=42){return n>=good?"Strong":n<bad?"Weak":"Mixed"}
export async function GET(req:Request,{params}:{params:Promise<{symbol:string}>}){
 const rl=await rateLimitDistributed(`analyze:${requestKey(req)}`,45,60_000);if(!rl.ok)return NextResponse.json({error:"Too many analysis requests. Please wait a moment."},{status:429,headers:{"Retry-After":"60"}});
 const{symbol:raw}=await params; const symbol=decodeURIComponent(raw).toUpperCase(); const key=process.env.TWELVE_DATA_API_KEY;
 if(!key)return NextResponse.json({error:"Add TWELVE_DATA_API_KEY to .env.local to enable live analysis."},{status:503});
 try{
  const isCrypto=symbol.includes("/"); const benchmark=isCrypto?(symbol.startsWith("BTC/")?null:"BTC/USD"):"SPY";
  const [j,bj]=await Promise.all([series(symbol,key,260,45,2800),benchmark?series(benchmark,key,100,90,1800).catch(()=>null):Promise.resolve(null)]);
  if(!Array.isArray(j?.values)||j.values.length<40)throw new Error(j?.message||`No usable market history returned for ${symbol}`);\n  const rows=j.values.slice().reverse(),c=rows.map((x:any)=>+x.close),h=rows.map((x:any)=>+x.high),l=rows.map((x:any)=>+x.low),v=rows.map((x:any)=>+x.volume||0),p=c.at(-1)!,prev=c.at(-2)??p;
  const e20=ema(c,20).at(-1)!,e50=ema(c,50).at(-1)!,e200=ema(c,200).at(-1)!,rv=rsi(c),a=atr(rows),v20=sma(v,20),v5=sma(v,5),ret5=p/(c.at(-6)??p)-1,ret20=p/(c.at(-21)??p)-1,ret60=p/(c.at(-61)??p)-1;
  const m=macd(c),sd20=stddev(c,20),bbZ=sd20?(p-sma(c,20))/(2*sd20):0,ov=obv(c,v),obvSlope=slope(ov,10),volumeRatio=v20?v5/v20:1;
  let bench20=0,bench60=0,marketTrend=50,benchPrice:number|null=null;
  if(bj?.values){const br=bj.values.slice().reverse(),bc=br.map((x:any)=>+x.close),bp=bc.at(-1)!;benchPrice=Number.isFinite(bp)?bp:null;bench20=bp/(bc.at(-21)??bp)-1;bench60=bp/(bc.at(-61)??bp)-1;const be20=ema(bc,20).at(-1)!,be50=ema(bc,50).at(-1)!;marketTrend=clamp(50+(bp>be20?18:-18)+(be20>be50?18:-18)+bench20*80,12,88)}
  const rel20=(ret20-bench20)*100,rel60=(ret60-bench60)*100;
  const trend=clamp(50+(p>e20?11:-11)+(e20>e50?14:-14)+(e50>e200?13:-13)+ret60*45+rel60*.6,8,94);
  const momentum=clamp(50+(rv-50)*.75+ret20*125+(m.hist>0?9:-9)+ret5*70,8,94);
  const flow=clamp(50+(volumeRatio-1)*36+(obvSlope>0?10:-10)+(p>(c.at(-6)??p)?7:-7),8,94);
  const low60=Math.min(...l.slice(-60)),high60=Math.max(...h.slice(-60)),structure=clamp(30+70*(p-low60)/(high60-low60||1),8,94);
  const sixSlice=c.slice(-126),sixStart=sixSlice[0]??p,sixReturn=sixStart?((p/sixStart)-1)*100:0,sixHigh=Math.max(...h.slice(-126)),sixLow=Math.min(...l.slice(-126));
  const oneYearClose=c.slice(-252),oneYearHigh=h.slice(-252),oneYearLow=l.slice(-252);
  const oneYearStart=oneYearClose[0]??p,oneYearReturn=oneYearStart?((p/oneYearStart)-1)*100:0;
  const yearHigh=Math.max(...oneYearHigh),yearLow=Math.min(...oneYearLow);
  const rangePosition=yearHigh>yearLow?((p-yearLow)/(yearHigh-yearLow))*100:50;
  const currentYear=Number(String(rows.at(-1)?.datetime||"").slice(0,4))||new Date().getFullYear();
  const ytdIndex=Math.max(0,rows.findIndex((x:any)=>Number(String(x.datetime||"").slice(0,4))===currentYear));
  const ytdStart=c[ytdIndex]??p,ytdReturn=ytdStart?((p/ytdStart)-1)*100:0;
  let peak=sixSlice[0]??p,maxDrawdown=0;for(const x of sixSlice){if(x>peak)peak=x;const dd=peak?((x/peak)-1)*100:0;if(dd<maxDrawdown)maxDrawdown=dd}
  const sixMonthScore=clamp(50+sixReturn*.65+(p>e50?10:-10)+(e50>e200?10:-10)+Math.max(-15,maxDrawdown*.35),5,95);
  const sixMonthLabel=sixMonthScore>=70?"Strong":sixMonthScore<42?"Weak":"Mixed";
  const extATR=Math.abs(p-e20)/(a||p*.02),extension=clamp(extATR*32+Math.max(0,Math.abs(bbZ)-.7)*22,5,94);
  const nearestSupportCandidates=[e20,e50,...l.slice(-80)].filter(x=>x<p).sort((x,y)=>y-x),nearestResCandidates=[...h.slice(-80)].filter(x=>x>p).sort((x,y)=>x-y);
  const support=rnd(nearestSupportCandidates.find(x=>p-x>=a*.35)??p-a*1.35),majorSupport=rnd(nearestSupportCandidates.find(x=>x<support-a*.65)??p-a*2.8);
  const invalidation=rnd(Math.max(low60,majorSupport-a*.95));
  const resistance=rnd(nearestResCandidates.find(x=>x-p>=a*.35)??p+a*1.35),breakout=rnd(nearestResCandidates.find(x=>x>resistance+a*.65)??p+a*2.7);
  const preferredEntry=rnd(Math.max(majorSupport,(support+majorSupport)/2));
  const riskToInv=Math.max(.01,p-invalidation),reward=Math.max(.01,resistance-p),rr=reward/riskToInv;
  const marketPenalty=marketTrend<38?9:0;
  const entry=clamp(trend*.18+momentum*.15+flow*.13+structure*.14+(100-extension)*.24+clamp(rr*35)*.10+clamp(rel20+50)*.06-marketPenalty,8,94);
  const risk=clamp(24+extension*.32+(a/p)*560+(p-support>2.4*a?12:0)+(marketTrend<38?9:0),8,94);
  const marketRegime=marketTrend>=63?"Supportive":marketTrend<38?"Risk-off":"Mixed";
  const relativeStrength=rel20>=5?"Leading":rel20<=-5?"Lagging":"In line";
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
  const candles=rows.slice(-180).map((x:any)=>({time:x.datetime,open:+x.open,high:+x.high,low:+x.low,close:+x.close,volume:+x.volume||0}));
  const why=[p>e20?"Price is above its 20-day equilibrium.":"Price is below its 20-day equilibrium.",e20>e50?"Short trend leads the intermediate trend.":"Short trend remains below the intermediate trend.",volumeRatio>1.08?"Recent volume is above normal.":"Recent volume is not showing strong confirmation.",extension>=60?"Price is stretched enough that mean-reversion risk matters.":"Price is not unusually stretched."];
  return NextResponse.json({symbol,name:j.meta?.symbol||symbol,assetType:isCrypto?"crypto":"stock",price:rnd(p),changePct:rnd(pct(p,prev)),volumeRatio:rnd(volumeRatio),sixMonth:{score:Math.round(sixMonthScore),label:sixMonthLabel,returnPct:rnd(sixReturn),maxDrawdownPct:rnd(maxDrawdown),high:rnd(sixHigh),low:rnd(sixLow),summary:sixMonthLabel==="Strong"?"The 6-month price record is constructive.":sixMonthLabel==="Weak"?"The 6-month price record is weak; rallies need confirmation.":"The 6-month price record is mixed."},performance:{sixMonthPct:rnd(sixReturn),ytdPct:rnd(ytdReturn),oneYearPct:rnd(oneYearReturn),yearHigh:rnd(yearHigh),yearLow:rnd(yearLow),rangePositionPct:Math.round(clamp(rangePosition,0,100))},freshness:{priceAt:nowIso(),decisionAt:nowIso(),priceTtlSeconds:45,decisionTtlSeconds:45},volatility:{atr14:rnd(a),atrPct:rnd(a/p*100)},market:{benchmark,benchmarkPrice:benchPrice!=null?rnd(benchPrice):null,regime:marketRegime,score:Math.round(marketTrend),relativeStrength,relative20:rnd(rel20)},scores:{trend:Math.round(trend),momentum:Math.round(momentum),flow:Math.round(flow),structure:Math.round(structure),entry:Math.round(entry),risk:Math.round(risk),extension:Math.round(extension)},labels:{trend:qLabel(trend),momentum:qLabel(momentum),flow:qLabel(flow),structure:qLabel(structure),entry:entry>=68?"Good":entry<48?"Poor":"Improving",risk:risk<40?"Lower":risk<70?"Moderate":"High",extension:extension>=65?"Stretched":extension<38?"Normal":"Elevated"},views:{today,swing,longTerm,own},levels:{preferredEntry,support,majorSupport,resistance,breakout,invalidation},engine:{Trend:Math.round(trend),Momentum:Math.round(momentum),Flow:Math.round(flow),Structure:Math.round(structure),RSI:Math.round(rv),MACD:m.hist>0?"Positive":"Negative",Extension:Math.round(extension),"Relative strength":relativeStrength,"Market regime":marketRegime},candles,positives:positives.slice(0,4),risks:risks.slice(0,4),why,riskReward:rnd(rr)},{headers:{"Cache-Control":"public, s-maxage=45, stale-while-revalidate=180"}});
 }catch(e:any){return NextResponse.json({error:e.name==="AbortError"?"Market data timed out. Please try again.":e.message||"Analysis failed"},{status:500})}
}
