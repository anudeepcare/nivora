import type {Bar,TechnicalSnapshot} from '../../nivora-technical-engine';
import type {PatternSignal} from './domain';

const clamp=(n:number,min=0,max=100)=>Math.max(min,Math.min(max,n));
const conf=(s:number):PatternSignal['confidence']=>s>=75?'HIGH':s>=55?'MEDIUM':'LOW';
function pivots(bars:Bar[]){
  const lows:{i:number,p:number}[]=[];const highs:{i:number,p:number}[]=[];
  for(let i=2;i<bars.length-2;i++){
    const w=bars.slice(i-2,i+3);
    if(bars[i].low===Math.min(...w.map(x=>x.low)))lows.push({i,p:bars[i].low});
    if(bars[i].high===Math.max(...w.map(x=>x.high)))highs.push({i,p:bars[i].high});
  }
  return{lows,highs};
}
export function analyzeTechnicalPatterns(bars:Bar[],technical:TechnicalSnapshot|null):PatternSignal[]{
  if(!technical||bars.length<20)return[];
  const {lows,highs}=pivots(bars);const out:PatternSignal[]=[];const px=technical.price;
  const last2=lows.slice(-2); const lastHighs=highs.slice(-2);
  if(last2.length===2){
    const [a,b]=last2; const sep=b.i-a.i; const diff=Math.abs(b.p-a.p)/Math.max(a.p,b.p);
    if(sep>=5&&sep<=35&&diff<=.06){
      const score=clamp(70+(1-diff/.06)*18+(technical.scores.momentum-50)*.15);
      out.push({type:'DOUBLE_BOTTOM',state:px>Math.max(a.p,b.p)*1.08?'CONFIRMED':'FORMING',confidence:conf(score),score:Math.round(score),summary:'Two significant lows formed in the same structural zone; confirmation requires reclaiming intervening resistance.',trigger:technical.levels.resistance,invalidation:Math.min(a.p,b.p),target:technical.levels.breakout,supportingMetrics:['structure','momentum','volumeRatio20']});
    }
    if(b.p>a.p*1.025){
      const score=clamp(58+(technical.scores.momentum-50)*.25+(technical.scores.flow-50)*.15);
      out.push({type:technical.scores.trend>=55?'CONFIRMED_REVERSAL':'EARLY_REVERSAL',state:technical.scores.trend>=55?'CONFIRMED':'FORMING',confidence:conf(score),score:Math.round(score),summary:'A newer swing low is above the prior major low while momentum is improving, consistent with an early reversal structure.',trigger:technical.levels.resistance,invalidation:b.p,target:technical.levels.breakout,supportingMetrics:['trend','momentum','relativeStrength']});
    }
  }
  if(lastHighs.length>=2&&last2.length>=2){
    const hh=lastHighs.at(-1)!.p>=lastHighs.at(-2)!.p*.98; const hl=last2.at(-1)!.p>=last2.at(-2)!.p*.98;
    if(hh&&hl&&technical.scores.structure>=50){
      const score=clamp(55+technical.scores.structure*.25+technical.scores.flow*.15-35);
      out.push({type:'BASE_BUILDING',state:px>=technical.levels.resistance*.99?'WATCH':'FORMING',confidence:conf(score),score:Math.round(score),summary:'Price is building a constructive base with improving swing structure; breakout quality still depends on participation.',trigger:technical.levels.resistance,invalidation:technical.levels.majorSupport,target:technical.levels.breakout,supportingMetrics:['structure','participation','resistance']});
    }
  }
  if(px>technical.levels.resistance&&technical.indicators.volumeRatio20>=1.2){
    const score=clamp(60+technical.scores.flow*.25+technical.scores.momentum*.2-25);
    out.push({type:'BREAKOUT_CONFIRMED',state:'CONFIRMED',confidence:conf(score),score:Math.round(score),summary:'Price is above structural resistance with above-normal participation.',trigger:technical.levels.resistance,invalidation:technical.levels.support,target:technical.levels.breakout,supportingMetrics:['volumeRatio20','momentum','resistance']});
  }else if(px>=technical.levels.resistance*.94&&technical.scores.momentum>=60){
    const score=clamp(52+technical.scores.momentum*.25+technical.scores.flow*.15-20);
    out.push({type:'BREAKOUT_READY',state:'WATCH',confidence:conf(score),score:Math.round(score),summary:'Momentum is constructive near resistance, but price has not yet produced a confirmed breakout.',trigger:technical.levels.resistance,invalidation:technical.levels.support,target:technical.levels.breakout,supportingMetrics:['momentum','participation','resistance']});
  }
  if(!out.length)out.push({type:technical.scores.trend<35?'TREND_BREAKDOWN':'UNKNOWN',state:'WATCH',confidence:'LOW',score:40,summary:'No high-confidence classical structure is currently dominant.',trigger:technical.levels.resistance,invalidation:technical.levels.invalidation,target:technical.levels.breakout,supportingMetrics:['trend','structure']});
  return out.sort((a,b)=>b.score-a.score);
}
