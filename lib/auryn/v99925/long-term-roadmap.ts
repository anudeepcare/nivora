export type RoadmapBar={time?:string|number;date?:string;open:number;high:number;low:number;close:number;volume?:number};
const n=(x:any)=>Number.isFinite(Number(x))?Number(x):null;
const stamp=(b:any)=>{const raw=b.time??b.date??0;if(typeof raw==="number"||/^\d+$/.test(String(raw))){const x=Number(raw);return x<1e12?x*1000:x}return new Date(raw).getTime()};

export function aggregateWeekly(input:any[]):RoadmapBar[]{
 const bars=input.map(b=>({time:b.time??b.date,open:n(b.open)!,high:n(b.high)!,low:n(b.low)!,close:n(b.close)!,volume:n(b.volume)??0})).filter(b=>[b.open,b.high,b.low,b.close].every(Number.isFinite)&&Number.isFinite(stamp(b))).sort((a,b)=>stamp(a)-stamp(b));
 const out:RoadmapBar[]=[];let key="",w:any=null;
 for(const b of bars){const d=new Date(stamp(b)),k=`${d.getUTCFullYear()}-${Math.floor((Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate())-Date.UTC(d.getUTCFullYear(),0,1))/604800000)}`;
  if(k!==key){if(w)out.push(w);key=k;w={...b};}else{w.high=Math.max(w.high,b.high);w.low=Math.min(w.low,b.low);w.close=b.close;w.volume=(w.volume||0)+(b.volume||0);w.time=b.time;}
 }if(w)out.push(w);return out;
}
export function wma(values:number[],period:number){if(values.length<period)return null;const a=values.slice(-period),den=period*(period+1)/2;return a.reduce((s,v,i)=>s+v*(i+1),0)/den}
export function hma(values:number[],period:number){
 if(values.length<period)return null;const half=Math.max(2,Math.floor(period/2)),root=Math.max(2,Math.round(Math.sqrt(period))),raw:number[]=[];
 for(let i=period;i<=values.length;i++){const slice=values.slice(0,i),a=wma(slice,half),b=wma(slice,period);if(a!=null&&b!=null)raw.push(2*a-b)}
 return wma(raw,Math.min(root,raw.length));
}
const pct=(a:number,b:number)=>a?((b/a)-1)*100:0;
export function buildLongTermRoadmap(input:any[],currentInput?:number|null){
 const weekly=aggregateWeekly(input),closes=weekly.map(x=>x.close),current=n(currentInput)??closes.at(-1)??null;
 if(weekly.length<8||current==null)return{state:"BUILDING",score:null,weeklyBars:weekly,reason:"More weekly history is required before AURYN publishes a long-term structure."};
 const lookback=weekly.slice(-Math.min(156,weekly.length)),swingLow=Math.min(...lookback.map(x=>x.low)),swingHigh=Math.max(...lookback.map(x=>x.high)),range=Math.max(.0001,swingHigh-swingLow);
 const fib382=swingHigh-range*.382,fib50=swingHigh-range*.5,fib618=swingHigh-range*.618,fib786=swingHigh-range*.786;
 const extension1272=swingLow+range*1.272,extension1618=swingLow+range*1.618;
 const wma20=wma(closes,20),wma50=wma(closes,50),wma200=wma(closes,200),weeklyHma=hma(closes,20);
 const volSeries=weekly.map(x=>Number(x.volume||0)),avgVolume=volSeries.length>=20?volSeries.slice(-20).reduce((a,b)=>a+b,0)/20:null,lastVolume=volSeries.at(-1)??null,volumeRatio=avgVolume&&lastVolume!=null?lastVolume/avgVolume:null;
 const flowWeeks=weekly.slice(-12),upVol=flowWeeks.filter(x=>x.close>=x.open).reduce((s,x)=>s+Number(x.volume||0),0),downVol=flowWeeks.filter(x=>x.close<x.open).reduce((s,x)=>s+Number(x.volume||0),0),accumulationScore=(upVol+downVol)>0?Math.round(upVol/(upVol+downVol)*100):null;
 const channelBars=weekly.slice(-26),firstClose=channelBars[0]?.close??current,lastClose=channelBars.at(-1)?.close??current,trendChannel=lastClose>firstClose*1.08?"RISING":lastClose<firstClose*.92?"FALLING":"SIDEWAYS";
 const recent=weekly.slice(-26),hi26=Math.max(...recent.map(x=>x.high)),lo26=Math.min(...recent.map(x=>x.low)),bandPct=pct(lo26,hi26);
 const atr=recent.reduce((s,b)=>s+(b.high-b.low),0)/recent.length,consolidating=bandPct<=35||atr/current<=.08;
 let consolidationWeeks=0;if(consolidating){for(let i=weekly.length-1;i>=0;i--){const b=weekly[i];if(b.high<=hi26*1.03&&b.low>=lo26*.97)consolidationWeeks++;else break;}}
 const above50=wma50!=null&&current>wma50,above200=wma200!=null&&current>wma200;
 const entryLow=Math.min(fib618,fib50),entryHigh=Math.max(fib618,fib50);
 const support=Math.max(swingLow,Math.min(fib786,fib618)),invalidation=Math.min(fib786,support);
 const confirm=Math.max(entryHigh,wma50??entryHigh),priorHigh=swingHigh;
 const momentum=weekly.length>13?pct(weekly.at(-14)!.close,current):0;
 const confluenceScore=Math.round(Math.max(0,Math.min(100,50+(above50?10:-6)+(above200?10:-5)+(weeklyHma!=null&&current>weeklyHma?8:-4)+(accumulationScore!=null&&accumulationScore>=55?8:0)+(volumeRatio!=null&&volumeRatio>=1?6:0)+(consolidating?6:0))));
 const score=Math.round(Math.max(0,Math.min(100,confluenceScore+(momentum>0?5:-3)+(current>=entryLow&&current<=entryHigh?5:0))));
 const state=score>=78?"BULLISH":score>=62?"ACCUMULATION":score>=45?"NEUTRAL":"DEFENSIVE";
 const waveConfidence=Math.round(Math.max(0,Math.min(100,35+(momentum>0?15:0)+(above50?15:0)+(above200?15:0)+(consolidating?10:0))));
 const waveCandidate=waveConfidence>=70?"IMPULSE_CANDIDATE":waveConfidence>=52?"BASE_OR_CORRECTION":"UNCONFIRMED";
 const nextTrigger=current<confirm?confirm:current<priorHigh?priorHigh:extension1272;
 return{state,score,current,weeklyBars:weekly,swingLow,swingHigh,wma20,wma50,wma200,weeklyHma,volumeRatio,accumulationScore,trendChannel,confluenceScore,fib382,fib50,fib618,fib786,extension1272,extension1618,entryLow,entryHigh,support,invalidation,confirm,priorHigh,consolidationWeeks,waveCandidate,waveConfidence,confidence:waveConfidence,nextTrigger,above50,above200,momentumPct:momentum};
}
