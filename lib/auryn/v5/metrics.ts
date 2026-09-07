import type {AurynV4CoreAnalysis,CanonicalFactorKey} from '../v4/domain';
import type {Bar,TechnicalSnapshot} from '../../nivora-technical-engine';
import type {MetricDirection,MetricFamily,MetricRole,ProfessionalMetric} from './domain';

const finite=(x:unknown):x is number=>typeof x==='number'&&Number.isFinite(x);

const avg=(a:number[])=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
const ema=(a:number[],n:number)=>{if(!a.length)return null;const k=2/(n+1);let x=a[0];for(let i=1;i<a.length;i++)x=a[i]*k+x*(1-k);return x;};
const calcAdx=(bars:Bar[],n=14)=>{
  if(bars.length<n*2+1)return{adx:null,plusDI:null,minusDI:null};
  const tr:number[]=[],plus:number[]=[],minus:number[]=[];
  for(let i=1;i<bars.length;i++){
    const hi=Number(bars[i].high),lo=Number(bars[i].low),prevC=Number(bars[i-1].close),prevH=Number(bars[i-1].high),prevL=Number(bars[i-1].low);
    const up=hi-prevH,down=prevL-lo;
    tr.push(Math.max(hi-lo,Math.abs(hi-prevC),Math.abs(lo-prevC)));
    plus.push(up>down&&up>0?up:0); minus.push(down>up&&down>0?down:0);
  }
  let trS=tr.slice(0,n).reduce((a,b)=>a+b,0),pS=plus.slice(0,n).reduce((a,b)=>a+b,0),mS=minus.slice(0,n).reduce((a,b)=>a+b,0);
  const dx:number[]=[]; let pdi=trS?100*pS/trS:0,mdi=trS?100*mS/trS:0; dx.push(pdi+mdi?100*Math.abs(pdi-mdi)/(pdi+mdi):0);
  for(let i=n;i<tr.length;i++){trS=trS-trS/n+tr[i];pS=pS-pS/n+plus[i];mS=mS-mS/n+minus[i];pdi=trS?100*pS/trS:0;mdi=trS?100*mS/trS:0;dx.push(pdi+mdi?100*Math.abs(pdi-mdi)/(pdi+mdi):0);}
  if(dx.length<n)return{adx:null,plusDI:pdi,minusDI:mdi};
  let adx=avg(dx.slice(0,n)); for(let i=n;i<dx.length;i++)adx=((adx*(n-1))+dx[i])/n;
  return{adx,plusDI:pdi,minusDI:mdi};
};
const calcAdvanced=(bars:Bar[])=>{
  if(bars.length<20)return null;
  const c=bars.map(x=>Number(x.close)),h=bars.map(x=>Number(x.high)),l=bars.map(x=>Number(x.low)),v=bars.map(x=>Number(x.volume||0));const p=c.at(-1)!;
  const tp=bars.map(x=>(Number(x.high)+Number(x.low)+Number(x.close))/3);
  const last20=bars.slice(-20),c20=c.slice(-20),h20=h.slice(-20),l20=l.slice(-20),v20=v.slice(-20);
  const mean20=avg(c20),sd20=Math.sqrt(avg(c20.map(x=>(x-mean20)**2))); const bollingerWidth=mean20?((4*sd20)/mean20)*100:null;
  const hh=Math.max(...h20),ll=Math.min(...l20),donchianPosition=hh>ll?((p-ll)/(hh-ll))*100:null;
  const roc20=c.length>=21?(p/(c.at(-21)??p)-1)*100:null;
  const low14=Math.min(...l.slice(-14)),high14=Math.max(...h.slice(-14)); const stochasticK=high14>low14?((p-low14)/(high14-low14))*100:null;
  const tp20=tp.slice(-20),tpMean=avg(tp20),md=avg(tp20.map(x=>Math.abs(x-tpMean))),cci20=md?((tp.at(-1)!-tpMean)/(.015*md)):null;
  let posMF=0,negMF=0;for(let i=Math.max(1,bars.length-14);i<bars.length;i++){const mf=tp[i]*v[i];if(tp[i]>=tp[i-1])posMF+=mf;else negMF+=mf;}const mfr=negMF===0?(posMF>0?100:1):posMF/negMF;const mfi14=100-(100/(1+mfr));
  let mfv=0,vol=0;for(const b of last20){const range=Number(b.high)-Number(b.low);const mult=range?((Number(b.close)-Number(b.low))-(Number(b.high)-Number(b.close)))/range:0;mfv+=mult*Number(b.volume||0);vol+=Number(b.volume||0);}const cmf20=vol?mfv/vol:null;
  let obv=0;const obvs:number[]=[0];for(let i=1;i<c.length;i++){obv+=c[i]>c[i-1]?v[i]:c[i]<c[i-1]?-v[i]:0;obvs.push(obv);}const obvN=Math.min(10,obvs.length-1);const obvSlope=obvN>0?(obvs.at(-1)!-obvs.at(-(obvN+1))!)/Math.max(1,avg(v.slice(-obvN))):null;
  const vwapDen=v20.reduce((a,b)=>a+b,0),vwap20=vwapDen?tp.slice(-20).reduce((sum,x,i)=>sum+x*v20[i],0)/vwapDen:null;const vwap20Distance=vwap20?((p/vwap20)-1)*100:null;
  const volumeDryUp=avg(v.slice(-20))?avg(v.slice(-5))/avg(v.slice(-20)):null;
  const atr=bars.slice(-14).reduce((sum,b,i,arr)=>{const idx=bars.length-arr.length+i;const prev=idx>0?Number(bars[idx-1].close):Number(b.close);return sum+Math.max(Number(b.high)-Number(b.low),Math.abs(Number(b.high)-prev),Math.abs(Number(b.low)-prev));},0)/Math.min(14,bars.length);
  const e20=ema(c.slice(-60),20),kUpper=e20!=null?e20+2*atr:null,kLower=e20!=null?e20-2*atr:null,keltnerPosition=kUpper!=null&&kLower!=null&&kUpper>kLower?((p-kLower)/(kUpper-kLower))*100:null;
  const {adx,plusDI,minusDI}=calcAdx(bars,14),dmiSpread=plusDI!=null&&minusDI!=null?plusDI-minusDI:null;
  const conv9=bars.length>=9?(Math.max(...h.slice(-9))+Math.min(...l.slice(-9)))/2:null;
  const base26=bars.length>=26?(Math.max(...h.slice(-26))+Math.min(...l.slice(-26)))/2:null;
  const spanB52=bars.length>=52?(Math.max(...h.slice(-52))+Math.min(...l.slice(-52)))/2:null;
  const spanA=conv9!=null&&base26!=null?(conv9+base26)/2:null;
  const cloudTop=spanA!=null&&spanB52!=null?Math.max(spanA,spanB52):null,cloudBottom=spanA!=null&&spanB52!=null?Math.min(spanA,spanB52):null;
  const ichimokuPosition=cloudTop==null||cloudBottom==null?null:p>cloudTop?1:p<cloudBottom?-1:0;
  const last60=bars.slice(-60); let anchorIdx=0;for(let i=1;i<last60.length;i++)if(Number(last60[i].low)<Number(last60[anchorIdx].low))anchorIdx=i;
  const anchored=last60.slice(anchorIdx);const avDen=anchored.reduce((sum,b)=>sum+Number(b.volume||0),0);const avwap=avDen?anchored.reduce((sum,b)=>sum+((Number(b.high)+Number(b.low)+Number(b.close))/3)*Number(b.volume||0),0)/avDen:null;const anchoredVwapDistance=avwap?((p/avwap)-1)*100:null;
  const profile=bars.slice(-60);const pLo=Math.min(...profile.map(b=>Number(b.low))),pHi=Math.max(...profile.map(b=>Number(b.high)));let profilePoc:number|null=null;
  if(pHi>pLo){const bins=20,vols=Array(bins).fill(0);for(const b of profile){const typical=(Number(b.high)+Number(b.low)+Number(b.close))/3;const idx=Math.min(bins-1,Math.max(0,Math.floor((typical-pLo)/(pHi-pLo)*bins)));vols[idx]+=Number(b.volume||0);}const idx=vols.indexOf(Math.max(...vols));profilePoc=pLo+(idx+.5)*(pHi-pLo)/bins;}
  const volumeProfilePocDistance=profilePoc?((p/profilePoc)-1)*100:null;
  const bbUpper=mean20+2*sd20,bbLower=mean20-2*sd20;const squeezeState=kUpper!=null&&kLower!=null?(bbUpper<kUpper&&bbLower>kLower?1:0):null;
  return{stochasticK,cci20,mfi14,cmf20,obvSlope,roc20,bollingerWidth,donchianPosition,vwap20Distance,volumeDryUp,keltnerPosition,adx,dmiSpread,ichimokuPosition,anchoredVwapDistance,volumeProfilePocDistance,squeezeState};
};
const scoreState=(v:number,inverse=false):MetricDirection=>{
  const n=inverse?100-v:v;
  return n>=75?'STRONG':n>=60?'BULLISH':n>=45?'MIXED':n>=30?'WEAK':'BEARISH';
};
const push=(out:ProfessionalMetric[],m:ProfessionalMetric)=>out.push(m);
const factorMap:Partial<Record<CanonicalFactorKey,{id:string;label:string;family:MetricFamily;role:MetricRole;inverse?:boolean}>>={
  BUSINESS_QUALITY:{id:'businessQuality',label:'Business quality',family:'BUSINESS',role:'DECISION'},
  GROWTH_INFLECTION:{id:'growthInflection',label:'Growth inflection',family:'BUSINESS',role:'DECISION'},
  FUNDAMENTALS_EARNINGS:{id:'fundamentals',label:'Fundamentals & earnings',family:'FUNDAMENTALS',role:'DECISION'},
  VALUATION:{id:'valuation',label:'Valuation',family:'VALUATION',role:'DECISION'},
  CATALYSTS:{id:'catalysts',label:'Catalysts',family:'CATALYSTS',role:'CONTEXT'},
  SECTOR_INDUSTRY:{id:'sector',label:'Sector / industry',family:'SECTOR',role:'CONTEXT'},
  RISK:{id:'riskPressure',label:'Risk pressure',family:'RISK',role:'RISK',inverse:true},
};
export function buildProfessionalMetrics({technical,v4,bars=[]}:{technical:TechnicalSnapshot|null|undefined;v4:AurynV4CoreAnalysis;bars?:Bar[]}):ProfessionalMetric[]{
  const out:ProfessionalMetric[]=[];
  const addNum=(id:string,label:string,family:MetricFamily,role:MetricRole,value:number|null,state:MetricDirection,interpretation:string,source:string,higherIsBetter:boolean|null=true,unit:string|null=null,timeframe:string|null=null)=>push(out,{id,label,family,role,value,unit,state,interpretation,available:value!=null,higherIsBetter,source,timeframe,decisionImpact:value==null?'UNAVAILABLE':state==='BEARISH'||state==='WEAK'||state==='HIGH'?'NEGATIVE':state==='BULLISH'||state==='STRONG'||state==='OVERSOLD'?'POSITIVE':'CONTEXT'});
  if(technical){
    const i=technical.indicators,t=technical.technicalState,rsi=finite(i.rsi14)?i.rsi14:null;
    const rsiState:MetricDirection=rsi==null?'N/A':rsi>=70?'OVERBOUGHT':rsi<=30?'OVERSOLD':rsi>=55?'BULLISH':rsi<=45?'BEARISH':'NEUTRAL';
    addNum('rsi14','RSI · 14','MOMENTUM','TIMING',rsi,rsiState,rsiState==='OVERBOUGHT'?'Momentum is strong, but short-term chase risk is elevated; RSI alone is not a sell signal.':rsiState==='OVERSOLD'?'Price is stretched to the downside; oversold alone is not a buy signal without thesis and structure confirmation.':'RSI describes current momentum regime.','verified bars',true,null,'Daily');
    const mh=i.macd?.histogram;
    addNum('macdHistogram','MACD histogram','MOMENTUM','TIMING',finite(mh)?mh:null,finite(mh)?(mh>0?'BULLISH':mh<0?'BEARISH':'NEUTRAL'):'N/A','MACD measures trend-momentum convergence; histogram direction is supporting timing evidence.','verified bars',true,null,'Daily');
    addNum('trend','Trend strength','TREND','TIMING',t.trend,scoreState(t.trend),'Composite of moving-average structure, medium-term return and relative trend.','technical engine',true,'/100','Daily');
    addNum('entryQuality','Entry quality','STRUCTURE','TIMING',t.entryQuality,scoreState(t.entryQuality),'Rates current entry quality separately from long-term company quality.','technical engine',true,'/100','Daily');
    addNum('participation','Participation','VOLUME_FLOW','TIMING',t.participation,scoreState(t.participation),'Volume and flow confirmation for the current move.','technical engine',true,'/100','Daily');
    addNum('volumeRatio20','Relative volume · 20D','VOLUME_FLOW','TIMING',finite(i.volumeRatio20)?i.volumeRatio20:null,finite(i.volumeRatio20)?(i.volumeRatio20>=1.35?'STRONG':i.volumeRatio20<.7?'WEAK':'NEUTRAL'):'N/A','Current volume relative to the 20-day average; stronger participation improves breakout quality.','verified bars',true,'x','Daily');
    addNum('atrPct','ATR · 14','VOLATILITY','RISK',finite(i.atrPct)?i.atrPct:null,finite(i.atrPct)?(i.atrPct>=7?'HIGH':i.atrPct<=2?'LOW':'NEUTRAL'):'N/A','Typical daily range as a percentage of price; higher ATR requires wider risk bands and smaller sizing.','verified bars',false,'%','Daily');
    addNum('realizedVol20','Realized volatility · 20D','VOLATILITY','RISK',finite(i.realizedVol20)?i.realizedVol20:null,finite(i.realizedVol20)?(i.realizedVol20>=70?'HIGH':i.realizedVol20<=25?'LOW':'NEUTRAL'):'N/A','Annualized recent realized volatility.','verified bars',false,'%','Daily');
    addNum('bollingerPosition','Bollinger position','VOLATILITY','TIMING',finite(i.bollingerPosition)?i.bollingerPosition:null,finite(i.bollingerPosition)?(i.bollingerPosition>=90?'OVERBOUGHT':i.bollingerPosition<=10?'OVERSOLD':'NEUTRAL'):'N/A','Position inside the 20-day, 2σ Bollinger envelope; extremes indicate stretch, not standalone reversal.','verified bars',null,'%','Daily');
    addNum('distance20','Distance from 20D MA','TREND','TIMING',finite(i.distance20Pct)?i.distance20Pct:null,finite(i.distance20Pct)?(i.distance20Pct>0?'BULLISH':'BEARISH'):'N/A','Distance from short-term trend equilibrium.','verified bars',true,'%','Daily');
    addNum('distance50','Distance from 50D MA','TREND','TIMING',finite(i.distance50Pct)?i.distance50Pct:null,finite(i.distance50Pct)?(i.distance50Pct>0?'BULLISH':'BEARISH'):'N/A','Distance from intermediate trend equilibrium.','verified bars',true,'%','Daily');
    addNum('distance200','Distance from 200D MA','TREND','TIMING',finite(i.distance200Pct)?i.distance200Pct:null,finite(i.distance200Pct)?(i.distance200Pct>0?'BULLISH':'BEARISH'):'N/A','Distance from long-term trend equilibrium.','verified bars',true,'%','Daily');
    addNum('drawdown52w','52-week drawdown','STRUCTURE','CONTEXT',finite(i.drawdown52wPct)?i.drawdown52wPct:null,finite(i.drawdown52wPct)?(i.drawdown52wPct<=-35?'WEAK':i.drawdown52wPct>=-10?'STRONG':'MIXED'):'N/A','Distance from the 52-week high; deep drawdowns can signal damage or opportunity depending on thesis.','verified bars',true,'%','Daily');
    addNum('relative20','Relative strength vs benchmark','RELATIVE_STRENGTH','TIMING',finite(technical.market.relative20)?technical.market.relative20:null,technical.market.relativeStrength==='Leading'?'BULLISH':technical.market.relativeStrength==='Lagging'?'BEARISH':'NEUTRAL','Measures recent performance versus the selected benchmark.','verified bars',true,'%','20D');
  }

  const adv=calcAdvanced(bars);
  if(adv){
    addNum('stochasticK','Stochastic %K','MOMENTUM','TIMING',adv.stochasticK,adv.stochasticK==null?'N/A':adv.stochasticK>=80?'OVERBOUGHT':adv.stochasticK<=20?'OVERSOLD':'NEUTRAL','Fast momentum oscillator; extremes are context, not standalone reversal signals.','verified bars',true,'%','Daily');
    addNum('cci20','CCI · 20','MOMENTUM','TIMING',adv.cci20,adv.cci20==null?'N/A':adv.cci20>=100?'BULLISH':adv.cci20<=-100?'BEARISH':'NEUTRAL','Commodity Channel Index measures deviation from recent typical price.','verified bars',true,null,'Daily');
    addNum('mfi14','Money Flow Index · 14','MOMENTUM','TIMING',adv.mfi14,adv.mfi14==null?'N/A':adv.mfi14>=80?'OVERBOUGHT':adv.mfi14<=20?'OVERSOLD':adv.mfi14>=55?'BULLISH':adv.mfi14<=45?'BEARISH':'NEUTRAL','Volume-weighted momentum oscillator combining price and participation.','verified bars',true,null,'Daily');
    addNum('cmf20','Chaikin Money Flow · 20','VOLUME_FLOW','TIMING',adv.cmf20,adv.cmf20==null?'N/A':adv.cmf20>.08?'BULLISH':adv.cmf20<-.08?'BEARISH':'NEUTRAL','Measures whether closes are persistently occurring near the high or low of the daily range on volume.','verified bars',true,null,'20D');
    addNum('obvSlope','OBV slope','VOLUME_FLOW','TIMING',adv.obvSlope,adv.obvSlope==null?'N/A':adv.obvSlope>0?'BULLISH':adv.obvSlope<0?'BEARISH':'NEUTRAL','Direction of On-Balance Volume over the recent window.','verified bars',true,null,'10D');
    addNum('roc20','Rate of change · 20D','MOMENTUM','TIMING',adv.roc20,adv.roc20==null?'N/A':adv.roc20>5?'BULLISH':adv.roc20<-5?'BEARISH':'NEUTRAL','Twenty-session price rate of change.','verified bars',true,'%','20D');
    addNum('bollingerWidth','Bollinger width','VOLATILITY','CONTEXT',adv.bollingerWidth,adv.bollingerWidth==null?'N/A':adv.bollingerWidth<8?'LOW':adv.bollingerWidth>20?'HIGH':'NEUTRAL','Band width identifies volatility compression and expansion regimes.','verified bars',null,'%','20D');
    addNum('donchianPosition','Donchian position · 20D','STRUCTURE','TIMING',adv.donchianPosition,adv.donchianPosition==null?'N/A':adv.donchianPosition>=90?'BULLISH':adv.donchianPosition<=10?'BEARISH':'NEUTRAL','Position within the recent 20-day high-low channel.','verified bars',true,'%','20D');
    addNum('vwap20Distance','20D VWAP distance','STRUCTURE','TIMING',adv.vwap20Distance,adv.vwap20Distance==null?'N/A':adv.vwap20Distance>0?'BULLISH':'BEARISH','Distance from volume-weighted average price over the recent 20 sessions.','verified bars',true,'%','20D');
    addNum('volumeDryUp','Volume dry-up · 5D/20D','VOLUME_FLOW','CONTEXT',adv.volumeDryUp,adv.volumeDryUp==null?'N/A':adv.volumeDryUp<.65?'LOW':adv.volumeDryUp>1.35?'HIGH':'NEUTRAL','Low volume during consolidation can support a base; high volume can signal participation or distribution depending on price direction.','verified bars',null,'x','5D/20D');
    addNum('keltnerPosition','Keltner position','VOLATILITY','TIMING',adv.keltnerPosition,adv.keltnerPosition==null?'N/A':adv.keltnerPosition>=100?'OVERBOUGHT':adv.keltnerPosition<=0?'OVERSOLD':'NEUTRAL','Position relative to an EMA/ATR channel; useful for squeeze and extension context.','verified bars',null,'%','Daily');
    addNum('adx14','ADX · 14','TREND','CONTEXT',adv.adx,adv.adx==null?'N/A':adv.adx>=25?'STRONG':adv.adx<18?'WEAK':'NEUTRAL','Average Directional Index measures trend strength, not direction; readings above roughly 25 indicate a more established trend.','verified bars',null,null,'Daily');
    addNum('dmiSpread','DMI +DI minus -DI','TREND','TIMING',adv.dmiSpread,adv.dmiSpread==null?'N/A':adv.dmiSpread>5?'BULLISH':adv.dmiSpread<-5?'BEARISH':'NEUTRAL','Directional Movement spread shows whether positive or negative directional pressure is dominant.','verified bars',true,null,'Daily');
    addNum('ichimokuPosition','Ichimoku cloud position','TREND','CONTEXT',adv.ichimokuPosition,adv.ichimokuPosition==null?'N/A':adv.ichimokuPosition>0?'BULLISH':adv.ichimokuPosition<0?'BEARISH':'NEUTRAL','Current price relative to the 9/26/52 Ichimoku cloud context; used as trend structure support, not a standalone signal.','verified bars',true,null,'Daily');
    addNum('anchoredVwapDistance','Anchored VWAP distance','STRUCTURE','TIMING',adv.anchoredVwapDistance,adv.anchoredVwapDistance==null?'N/A':adv.anchoredVwapDistance>0?'BULLISH':'BEARISH','Distance from VWAP anchored to the lowest low in the recent 60-session structure, useful for reclaim/support context.','verified bars',true,'%','60D anchor');
    addNum('volumeProfilePocDistance','Volume-profile POC distance','STRUCTURE','CONTEXT',adv.volumeProfilePocDistance,adv.volumeProfilePocDistance==null?'N/A':Math.abs(adv.volumeProfilePocDistance)<=3?'NEUTRAL':adv.volumeProfilePocDistance>0?'BULLISH':'BEARISH','Approximate distance from the highest-volume price bin over 60 sessions; this is a bar-derived proxy, not full tick-level volume profile.','verified bars',null,'%','60D');
    push(out,{id:'squeezeState',label:'Bollinger / Keltner squeeze',family:'VOLATILITY',role:'CONTEXT',value:adv.squeezeState==null?null:(adv.squeezeState?'SQUEEZE':'EXPANDED'),state:adv.squeezeState==null?'N/A':adv.squeezeState?'LOW':'NEUTRAL',interpretation:adv.squeezeState?'Bollinger Bands are inside the Keltner channel, indicating volatility compression that can precede expansion.':'No active Bollinger/Keltner compression state is detected.',available:adv.squeezeState!=null,higherIsBetter:null,source:'verified bars',timeframe:'Daily',decisionImpact:'CONTEXT'});
  }
  for(const [key,meta] of Object.entries(factorMap) as Array<[CanonicalFactorKey,NonNullable<typeof factorMap[CanonicalFactorKey]>]>){
    const f=v4.factors[key];
    const preliminaryValuation=key==='VALUATION'&&f?.validationState!=='MEASURED'&&/preliminary|not allowed|unsupported|unavailable/i.test(String(f?.reason||''));
    const value=preliminaryValuation?null:(finite(f?.score)?f!.score:null);
    push(out,{id:meta.id,label:meta.label,family:meta.family,role:meta.role,value,unit:'/100',state:value==null?'N/A':scoreState(value,Boolean(meta.inverse)),interpretation:value==null?(preliminaryValuation?'Valuation is preliminary or not decision-grade; AURYN treats it as unavailable instead of a bearish zero.':'Evidence is unavailable; AURYN does not treat missing data as bearish.'):f?.reason||`${meta.label} contributes to the canonical decision.`,available:value!=null,higherIsBetter:meta.inverse?false:true,source:f?.validationState||'canonical evidence',decisionImpact:value==null?'UNAVAILABLE':'CONTEXT'});
  }
  addNum('thesisStrength','Thesis strength','THESIS','DECISION',v4.thesis.strength,v4.thesis.strength==null?'N/A':scoreState(v4.thesis.strength),`Structural thesis is ${v4.thesis.direction.toLowerCase().replaceAll('_',' ')}.`,'canonical V4 thesis',true,'/100','Long term');
  addNum('moat','Moat / durability','MOAT','DECISION',v4.moat.score,v4.moat.score==null?'N/A':scoreState(v4.moat.score),`Competitive durability is ${v4.moat.direction.toLowerCase()}.`,'canonical V4 moat',true,'/100','Long term');
  return out;
}
