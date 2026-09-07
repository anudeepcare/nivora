import type {CanonicalMarketSnapshot} from '../market-truth';
import type {TechnicalSnapshot} from '../../nivora-technical-engine';
import type {ExecutionPlan,PriceZone} from './domain';
import type {InvestmentThesis} from '../v4/domain';

const round=(n:number)=>Math.round(n*100)/100;
const zone=(label:string,center:number,width:number,multiplier:number,basis:string):PriceZone=>({label,low:round(center-width),high:round(center+width),multiplier,basis});
export function buildExecutionPlan({marketTruth,technical,thesis,riskScore}:{marketTruth:CanonicalMarketSnapshot;technical:TechnicalSnapshot|null;thesis:Pick<InvestmentThesis,'strength'|'direction'>;riskScore:number|null}):ExecutionPlan{
  if(!marketTruth.priceSensitiveAllowed||marketTruth.decisionPrice==null||!technical){
    return{snapshotId:marketTruth.snapshotId,state:'BLOCKED',reason:marketTruth.reason||'Market truth is not verified.',currentPrice:null,initialEntry:null,dcaZones:[],confirmation:null,invalidation:null,targets:[],riskPerShare:null};
  }
  const px=marketTruth.decisionPrice,atr=Math.max(.01,technical.volatility.atr14||px*.03),inv=round(Math.min(technical.levels.invalidation,technical.levels.majorSupport-atr*.35));
  const thesisBroken=thesis.direction==='BROKEN'||(thesis.strength!=null&&thesis.strength<40);
  const initialCenter=Math.min(px,Math.max(technical.levels.support,technical.levels.preferredEntry));
  const initial=zone('Initial entry',initialCenter,Math.min(atr*.22,Math.max(.01,initialCenter-inv)*.15),1,'Nearest structural support / preferred-entry confluence.');
  const dca:PriceZone[]=[];
  if(!thesisBroken){
    const candidates=[
      {c:technical.levels.support-atr*.35,m:1,label:'DCA 1'},
      {c:technical.levels.majorSupport,m:riskScore!=null&&riskScore>=80?1:1.5,label:'DCA 2'},
      {c:technical.levels.majorSupport-atr*.65,m:riskScore!=null&&riskScore>=75?1.25:2,label:'DCA 3'}
    ];
    for(const x of candidates){
      if(x.c<=inv+atr*.15)continue;
      const z=zone(x.label,x.c,atr*.16,x.m,'Staged structural support; only valid while the long-term thesis remains intact.');
      if(z.low>inv&&z.high<=initial.high)dca.push(z);
    }
  }
  const confirm=round(Math.max(technical.levels.resistance,px+atr*.65));
  const t1=round(Math.max(technical.levels.breakout,confirm+atr));
  const t2=round(t1+atr*2);
  return{snapshotId:marketTruth.snapshotId,state:'READY',reason:thesisBroken?'Structural thesis is broken/weak; averaging is disabled even though market price is verified.':'Verified market truth with one canonical staged execution plan.',currentPrice:round(px),initialEntry:initial,dcaZones:dca,confirmation:confirm,invalidation:inv,targets:[{label:'T1',price:t1},{label:'T2',price:t2}],riskPerShare:round(Math.max(0,px-inv))};
}
