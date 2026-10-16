import {suggestMultiplier,type PlanningEvidence} from './auryn/planning/policy';
const labels:Record<string,string>={STRONG_BUY:'Strong buy',BUY:'Buy',START_SMALL:'Start small',WAIT:'Wait',AVOID:'Avoid',ADD:'Add',HOLD:'Hold',WATCH:'Watch',REDUCE:'Reduce',EXIT:'Exit'};
export function firstGlance(decision:any,state='READY'){
 const ready=state==='READY'&&Boolean(labels[decision?.newMoneyAction]);
 return{label:ready?labels[decision.newMoneyAction]:'Review data',owner:ready?(labels[decision?.ownerAction]||'Review'):'Review',tone:!ready?'neutral':['BUY','STRONG_BUY','START_SMALL'].includes(decision.newMoneyAction)?'positive':decision.newMoneyAction==='AVOID'?'negative':'caution',ready};
}
export function concreteRisk(values:unknown[]):string|null{
 return values.find((x):x is string=>typeof x==='string'&&x.trim().length>0&&!/^[A-Z_]+$/.test(x)&&!/(current source-backed|measured market\/macro regime context|no major pillar|expand expert evidence|source-backed.*catalyst state)/i.test(x))?.trim()??null;
}
export function dcaIndicator(evidence:PlanningEvidence|null){
 if(!evidence||!evidence.evidenceReady||!evidence.snapshotId||!evidence.references.length||evidence.thesis==='unknown'||evidence.valuation==='unknown'||evidence.fundingRisk==='unknown')return{label:'Review needed',multiplier:null,reason:!evidence||!evidence.evidenceReady?'Current company evidence is not ready.':evidence.valuation==='unknown'?'A supported valuation is needed before a contribution can be suggested.':evidence.fundingRisk==='unknown'?'Funding risk needs review before suggesting a contribution.':'The business thesis needs review.'};
 const proposal=suggestMultiplier(evidence,'recurring');return{label:proposal.multiplier===0?'Pause':`${proposal.multiplier}×`,multiplier:proposal.multiplier,reason:proposal.reason};
}
export function shouldFitChart(x:{rangeChanged:boolean;dataChanged:boolean;userAdjusted:boolean;hasRange:boolean}){return x.rangeChanged||!x.hasRange||(x.dataChanged&&!x.userAdjusted);}
