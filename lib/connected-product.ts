import type {Position,Quote,Research} from './types';
import {perspective} from './analysis.ts';
import {decisionGuide} from './decision-guide.ts';
import {researchOutlook} from './outlook.ts';

export function openingAssessment(r:Research){
 const p=perspective(r),guide=decisionGuide(r,p),model=researchOutlook(r);
 return [
  {id:'business',tab:'Thesis' as const,title:'Business quality',label:p.last?p.business:'Financial evidence needed',detail:p.last?`${p.periodBasis} · ${p.last.end} · ${p.last.currency}`:'No comparable financial period supplied.'},
  {id:'value',tab:'Valuation' as const,title:'Valuation',label:model.available?'Scenario range available':'Fair value not established',detail:model.available?'Conditional estimates; inspect the horizon and assumptions before judging the price.':'Comparable inputs and explicit model assumptions are needed; consensus is separate.'},
  {id:'entry',tab:'Technicals' as const,title:'Entry conditions',label:guide.buying.label,detail:guide.buying.reason},
 ];
}

// Classification is supplied evidence, never inferred from company names.
// All weights use priced USD assets plus recorded cash; no FX is assumed.
export function portfolioExposure(positions:Position[],quotes:Record<string,Quote>,sectors:Record<string,string>,move:number){
 const groups=new Map<string,number>(),excluded=new Set<string>();let total=0,invested=0,classifiedValue=0;
 for(const p of positions){
  const q=quotes[p.symbol],cash=p.assetType==='cash';
  if(!Number.isFinite(p.quantity)||p.quantity<=0||!Number.isFinite(p.cost)||p.cost<0||
    (cash?(p.currency!=='USD'||p.symbol!=='USD'):(!q||q.stale||q.currency!=='USD'||!Number.isFinite(q.price)||q.price!<=0))){excluded.add(p.symbol);continue;}
  const value=p.quantity*(cash?1:q.price!),name=cash?'Cash':p.assetType==='crypto'?'Crypto':sectors[p.symbol]?.trim()||'Unclassified';
  total+=value;if(!cash)invested+=value;if(!cash&&name!=='Unclassified')classifiedValue+=value;
  groups.set(name,(groups.get(name)??0)+value);
 }
 return {total,invested,classifiedValue,excluded:[...excluded],groups:[...groups].map(([name,value])=>({name,value,weight:total>0?value/total*100:0})).sort((a,b)=>b.value-a.value),hypotheticalChange:Number.isFinite(move)&&move>=-100&&move<=100?invested*move/100:null};
}
export function analysisIntent(value:unknown):string{
 const intents:Record<string,string>={explain:'Explain the supplied cash generation and earnings evidence in plain language.',missing:'Identify the most important missing evidence; do not fill gaps with assumptions.',challenge:'Present the strongest evidence-based counterargument to a positive interpretation.',strengthen:'Explain which supplied observations support the case and what future evidence would strengthen it.'};
 if(typeof value!=='string'||!Object.hasOwn(intents,value))throw Error('Choose a supported research question.');
 return intents[value];
}
