import type {CanonicalMarketSnapshot} from '../market-truth';
import type {TechnicalSnapshot} from '../../nivora-technical-engine';
import type {ExecutionPlan,PriceZone} from './domain';
import type {InvestmentThesis,PrimaryInvestmentAction} from '../v4/domain';

const round=(n:number)=>Math.round(n*100)/100;
const zone=(label:string,center:number,width:number,multiplier:number,basis:string):PriceZone=>({label,low:round(center-width),high:round(center+width),multiplier,basis});
const buyLike=(a:PrimaryInvestmentAction)=>a==='BUY'||a==='STRONG_BUY';
export function buildExecutionPlan({marketTruth,technical,thesis,riskScore,primaryAction='BUY',ownerAction='BUY',valuationDecisionGrade=true}:{marketTruth:CanonicalMarketSnapshot;technical:TechnicalSnapshot|null;thesis:Pick<InvestmentThesis,'strength'|'direction'>;riskScore:number|null;primaryAction?:PrimaryInvestmentAction;ownerAction?:PrimaryInvestmentAction;valuationDecisionGrade?:boolean}):ExecutionPlan{
  if(!marketTruth.priceSensitiveAllowed||marketTruth.decisionPrice==null||!technical){
    return{snapshotId:marketTruth.snapshotId,state:'BLOCKED',intent:'BLOCKED',reason:marketTruth.reason||'Market truth is not verified.',currentPrice:null,initialEntry:null,dcaZones:[],confirmation:null,invalidation:null,targets:[],riskPerShare:null};
  }
  const px=marketTruth.decisionPrice,atr=Math.max(.01,technical.volatility.atr14||px*.03),inv=round(Math.min(technical.levels.invalidation,technical.levels.majorSupport-atr*.35));
  const thesisBroken=thesis.direction==='BROKEN'||(thesis.strength!=null&&thesis.strength<40);
  const isExit=primaryAction==='SELL'||ownerAction==='SELL'||thesisBroken;
  const isReduce=!isExit&&(primaryAction==='REDUCE'||ownerAction==='REDUCE');
  const canAccumulate=!isExit&&!isReduce&&buyLike(primaryAction)&&valuationDecisionGrade;
  const intent=isExit?'EXIT':isReduce?'REDUCE':canAccumulate?'ACCUMULATE':'WATCH';
  const initialCenter=Math.min(px,Math.max(technical.levels.support,technical.levels.preferredEntry));
  const initialLabel=canAccumulate?'Initial entry':'Watch / accumulation zone';
  const initial=(!isExit&&!isReduce)?zone(initialLabel,initialCenter,Math.min(atr*.22,Math.max(.01,initialCenter-inv)*.15),canAccumulate?1:0,canAccumulate?'Nearest structural support / preferred-entry confluence.':'Structural zone only; not an instruction to add while the current decision is HOLD or valuation is not decision-grade.'):null;
  const dca:PriceZone[]=[];
  if(canAccumulate&&initial){
    const candidates=[
      {c:Math.min(technical.levels.support-atr*.35,initial.low-atr*.18),m:1,label:'DCA 1'},
      {c:Math.min(technical.levels.majorSupport,initial.low-atr*.7),m:riskScore!=null&&riskScore>=80?1:1.5,label:'DCA 2'},
      {c:Math.min(technical.levels.majorSupport-atr*.65,initial.low-atr*1.25),m:riskScore!=null&&riskScore>=75?1.25:2,label:'DCA 3'}
    ];
    let ceiling=initial.low;
    for(const x of candidates){
      if(x.c<=inv+atr*.15)continue;
      const z=zone(x.label,x.c,Math.min(atr*.14,Math.max(.01,x.c-inv)*.12),x.m,'Staged structural support; valid only while the long-term thesis remains intact.');
      if(z.low>inv&&z.high<ceiling){dca.push(z);ceiling=z.low;}
    }
  }
  const confirm=(!isExit&&!isReduce&&initial)?round(Math.max(technical.levels.resistance,px+atr*.65,initial.high+atr*.25)):null;
  const t1=confirm==null?null:round(Math.max(technical.levels.breakout,confirm+atr));
  const t2=t1==null?null:round(t1+atr*2);
  const targets=t1==null?[]:[{label:'T1',price:t1},{label:'T2',price:t2!}];
  const reason=isExit?'Structural thesis or exit policy disables averaging.':isReduce?'Risk/reward policy calls for reducing exposure; averaging is disabled.':canAccumulate?'Verified market truth with one canonical staged execution plan.':'Current decision is not an active new-money buy, or valuation is not decision-grade; AURYN shows structural watch levels without DCA instructions.';
  return{snapshotId:marketTruth.snapshotId,state:'READY',intent,reason,currentPrice:round(px),initialEntry:initial,dcaZones:dca,confirmation:confirm,invalidation:inv,targets,riskPerShare:round(Math.max(0,px-inv))};
}
