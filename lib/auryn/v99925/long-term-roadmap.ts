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
const pct=(a:number,b:number)=>a?((b/a)-1)*100:0;
export function buildLongTermRoadmap(input:any[],currentInput?:number|null){
 const weekly=aggregateWeekly(input),closes=weekly.map(x=>x.close),current=n(currentInput)??closes.at(-1)??null;
 if(weekly.length<8||current==null)return{state:"BUILDING",score:null,weeklyBars:weekly,reason:"More weekly history is required before AURYN publishes a long-term structure."};
 const lookback=weekly.slice(-Math.min(156,weekly.length)),swingLow=Math.min(...lookback.map(x=>x.low)),swingHigh=Math.max(...lookback.map(x=>x.high)),range=Math.max(.0001,swingHigh-swingLow);
 const fib382=swingHigh-range*.382,fib50=swingHigh-range*.5,fib618=swingHigh-range*.618,fib786=swingHigh-range*.786;
 const extension1272=swingLow+range*1.272,extension1618=swingLow+range*1.618;
 const wma20=wma(closes,20),wma50=wma(closes,50),wma200=wma(closes,200);
 const recent=weekly.slice(-26),hi26=Math.max(...recent.map(x=>x.high)),lo26=Math.min(...recent.map(x=>x.low)),bandPct=pct(lo26,hi26);
 const atr=recent.reduce((s,b)=>s+(b.high-b.low),0)/recent.length,consolidating=bandPct<=35||atr/current<=.08;
 let consolidationWeeks=0;if(consolidating){for(let i=weekly.length-1;i>=0;i--){const b=weekly[i];if(b.high<=hi26*1.03&&b.low>=lo26*.97)consolidationWeeks++;else break;}}
 const above50=wma50!=null&&current>wma50,above200=wma200!=null&&current>wma200;
 const entryLow=Math.min(fib618,fib50),entryHigh=Math.max(fib618,fib50);
 const support=Math.max(swingLow,Math.min(fib786,fib618)),invalidation=Math.min(fib786,support);
 const confirm=Math.max(entryHigh,wma50??entryHigh),priorHigh=swingHigh;
 const momentum=weekly.length>13?pct(weekly.at(-14)!.close,current):0;
 const score=Math.round(Math.max(0,Math.min(100,50+(above50?12:-8)+(above200?12:-5)+(consolidating?6:0)+(momentum>0?10:-5)+(current>=entryLow&&current<=entryHigh?8:0))));
 const state=score>=78?"BULLISH":score>=62?"ACCUMULATION":score>=45?"NEUTRAL":"DEFENSIVE";
 const waveConfidence=Math.round(Math.max(0,Math.min(100,35+(momentum>0?15:0)+(above50?15:0)+(above200?15:0)+(consolidating?10:0))));
 const waveCandidate=waveConfidence>=70?"IMPULSE_CANDIDATE":waveConfidence>=52?"BASE_OR_CORRECTION":"UNCONFIRMED";
 const nextTrigger=current<confirm?confirm:current<priorHigh?priorHigh:extension1272;
 return{state,score,current,weeklyBars:weekly,swingLow,swingHigh,wma20,wma50,wma200,fib382,fib50,fib618,fib786,extension1272,extension1618,entryLow,entryHigh,support,invalidation,confirm,priorHigh,consolidationWeeks,waveCandidate,waveConfidence,confidence:waveConfidence,nextTrigger,above50,above200,momentumPct:momentum};
}
