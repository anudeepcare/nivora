import type {Bar} from '../../nivora-technical-engine';
import type {AurynTimeframe,IndicatorComponent,TechnicalRating,TimeframeTechnicalState} from './domain';
import {smaN,emaN,computeRsi14,computeMacd,computeStochastic,computeCci,computeWilliamsR,computeRoc,computeMomentum,computeAtr,computeAdx,computeRealizedVol,computeObv,linearSlope} from './indicators';

const clamp=(n:number,min=0,max=100)=>Math.max(min,Math.min(max,n));
const rnd=(n:number,d=2)=>Math.round(n*10**d)/10**d;
const ratingFromScore=(s:number):TechnicalRating=>s>=18?'BUY':s<=-18?'SELL':'NEUTRAL';
const component=(id:string,label:string,family:IndicatorComponent['family'],value:number|null,rating:TechnicalRating,reason:string):IndicatorComponent=>({id,label,family,value:value==null?null:rnd(value,4),rating,reason});
const maRating=(price:number,ma:number|null):TechnicalRating=>ma==null?'NEUTRAL':price>ma*1.002?'BUY':price<ma*.998?'SELL':'NEUTRAL';
const scoreRating=(x:number,buy:number,sell:number):TechnicalRating=>x>=buy?'BUY':x<=sell?'SELL':'NEUTRAL';
const points=(r:TechnicalRating)=>r==='BUY'?1:r==='SELL'?-1:0;
const label=(n:number)=>n>=67?'Strong':n<42?'Weak':'Mixed';
const annual=(tf:AurynTimeframe)=>tf==='15M'?26*252:tf==='1H'?6.5*252:tf==='4H'?1.625*252:tf==='1W'?52:252;
const retLookback=(tf:AurynTimeframe)=>tf==='15M'?26:tf==='1H'?20:tf==='4H'?15:tf==='1W'?13:20;

export function computeTimeframeTechnicalState(rows:Bar[],benchRows:Bar[]|null,timeframe:AurynTimeframe,benchmark:string|null):TimeframeTechnicalState|null{
  if(!Array.isArray(rows)||rows.length<40)return null;
  const closes=rows.map(x=>x.close),price=closes.at(-1)!;const components:IndicatorComponent[]=[];
  for(const n of [10,20,30,50,100,200]){
    const s=smaN(closes,n),e=emaN(closes,n);components.push(component(`SMA_${n}`,`SMA ${n}`,'MOVING_AVERAGE',s,maRating(price,s),s==null?`Need ${n} bars.`:`Price ${price>=s?'above':'below'} SMA ${n}.`));components.push(component(`EMA_${n}`,`EMA ${n}`,'MOVING_AVERAGE',e,maRating(price,e),e==null?`Need ${n} bars.`:`Price ${price>=e?'above':'below'} EMA ${n}.`));
  }
  const rsi=computeRsi14(closes),macd=computeMacd(closes),stoch=computeStochastic(rows),cci=computeCci(rows),wr=computeWilliamsR(rows),roc=computeRoc(closes),mom=computeMomentum(closes),adx=computeAdx(rows),atr=computeAtr(rows);
  const mean20=smaN(closes,20)??price;const last20=closes.slice(-20),sd=Math.sqrt(last20.reduce((a,v)=>a+(v-mean20)**2,0)/Math.max(1,last20.length));const bbZ=sd?(price-mean20)/(2*sd):0;
  const obv=computeObv(rows),obvSlope=linearSlope(obv,10);const v20=rows.slice(-21,-1).reduce((a,b)=>a+b.volume,0)/Math.max(1,rows.slice(-21,-1).length),vr=v20?rows.at(-1)!.volume/v20:1;
  components.push(component('RSI_14','RSI 14','OSCILLATOR',rsi,rsi>=55&&rsi<75?'BUY':rsi<=45&&rsi>25?'SELL':'NEUTRAL',`RSI ${rnd(rsi,1)}.`));
  components.push(component('MACD','MACD 12/26/9','OSCILLATOR',macd.histogram,macd.histogram>0&&macd.line>macd.signal?'BUY':macd.histogram<0&&macd.line<macd.signal?'SELL':'NEUTRAL',`MACD histogram ${rnd(macd.histogram,3)}.`));
  components.push(component('STOCH','Stochastic 14/3','OSCILLATOR',stoch.k,stoch.k>stoch.d&&stoch.k<80?'BUY':stoch.k<stoch.d&&stoch.k>20?'SELL':'NEUTRAL',`%K ${rnd(stoch.k,1)} vs %D ${rnd(stoch.d,1)}.`));
  components.push(component('CCI_20','CCI 20','OSCILLATOR',cci,scoreRating(cci,50,-50),`CCI ${rnd(cci,1)}.`));
  components.push(component('WILLIAMS_R','Williams %R 14','OSCILLATOR',wr,wr>-50&&wr>-80?'BUY':wr<-50&&wr<-20?'SELL':'NEUTRAL',`Williams %R ${rnd(wr,1)}.`));
  components.push(component('ROC_12','ROC 12','OSCILLATOR',roc,scoreRating(roc,.5,-.5),`12-bar ROC ${rnd(roc,2)}%.`));
  components.push(component('MOM_10','Momentum 10','OSCILLATOR',mom,scoreRating(mom,0.001,-0.001),`10-bar momentum ${rnd(mom,2)}.`));
  components.push(component('ADX_DMI','ADX / DMI','OSCILLATOR',adx.adx,adx.adx<18?'NEUTRAL':adx.plusDi>adx.minusDi?'BUY':'SELL',`ADX ${rnd(adx.adx,1)}, +DI ${rnd(adx.plusDi,1)}, -DI ${rnd(adx.minusDi,1)}.`));
  components.push(component('BOLLINGER','Bollinger position','VOLATILITY',bbZ,bbZ>.15?'BUY':bbZ<-.15?'SELL':'NEUTRAL',`Price is ${rnd(bbZ,2)} half-band units from the 20-bar mean.`));
  components.push(component('OBV','OBV participation','PARTICIPATION',obvSlope,obvSlope>0?'BUY':obvSlope<0?'SELL':'NEUTRAL',`OBV slope ${rnd(obvSlope,1)}.`));
  components.push(component('VOLUME','Relative volume','PARTICIPATION',vr,vr>=1.2?'BUY':vr<.7?'SELL':'NEUTRAL',`Current volume is ${rnd(vr,2)}x the prior 20-bar average.`));

  const look=retLookback(timeframe),base=closes.at(-1-Math.min(look,closes.length-1))??price,ret=base?((price/base)-1)*100:null;let benchRet:number|null=null,relative:number|null=null;
  if(benchRows&&benchRows.length>look){const bc=benchRows.map(x=>x.close),bp=bc.at(-1)!,bb=bc.at(-1-look)??bp;benchRet=bb?((bp/bb)-1)*100:null;if(ret!=null&&benchRet!=null)relative=ret-benchRet}
  const relRating:TechnicalRating=relative==null?'NEUTRAL':relative>=2?'BUY':relative<=-2?'SELL':'NEUTRAL';components.push(component('RELATIVE_STRENGTH',`Relative strength vs ${benchmark||'benchmark'}`,'RELATIVE_STRENGTH',relative,relRating,relative==null?'Benchmark evidence unavailable.':`${rnd(relative,2)} pts vs ${benchmark}.`));

  const eligible=components.filter(x=>x.value!=null),sum=eligible.reduce((a,x)=>a+points(x.rating),0),score=eligible.length?Math.round(sum/eligible.length*100):0;const counts={buy:eligible.filter(x=>x.rating==='BUY').length,neutral:eligible.filter(x=>x.rating==='NEUTRAL').length,sell:eligible.filter(x=>x.rating==='SELL').length};
  const ma=eligible.filter(x=>x.family==='MOVING_AVERAGE'),osc=eligible.filter(x=>x.family==='OSCILLATOR'),part=eligible.filter(x=>x.family==='PARTICIPATION');const fam=(x:IndicatorComponent[])=>clamp(50+(x.length?x.reduce((a,v)=>a+points(v.rating),0)/x.length*45:0),5,95);
  const atrPct=price?atr/price*100:0,rv=computeRealizedVol(closes,annual(timeframe)),volRegime=atrPct>4?'HIGH':atrPct<1?'LOW':'NORMAL';
  return{timeframe,asOf:String(rows.at(-1)!.datetime),price:rnd(price),rating:ratingFromScore(score),score,counts,components,trend:{score:Math.round(fam(ma)),label:label(fam(ma))},momentum:{score:Math.round(fam(osc)),label:label(fam(osc))},participation:{score:Math.round(fam(part)),label:label(fam(part))},relativeStrength:{benchmark,score:Math.round(clamp(50+(relative??0)*4,5,95)),returnPct:ret==null?null:rnd(ret),benchmarkReturnPct:benchRet==null?null:rnd(benchRet),relativePct:relative==null?null:rnd(relative)},volatility:{atr:rnd(atr),atrPct:rnd(atrPct),realizedVolPct:rv==null?null:rnd(rv),regime:volRegime},sourceBarCount:rows.length,confirmed:true};
}
