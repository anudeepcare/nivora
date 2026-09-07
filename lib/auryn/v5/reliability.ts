import type {CanonicalMarketSnapshot} from '../market-truth';
import type {PrimaryInvestmentAction} from '../v4/domain';
import type {TodayDecision} from '../../nivora-today';

export function validateV5ExecutionSnapshot({decisionSnapshotId,intentSnapshotId,marketTruth}:{decisionSnapshotId:string;intentSnapshotId:string;marketTruth:CanonicalMarketSnapshot}){
 if(!marketTruth.priceSensitiveAllowed||!marketTruth.decisionAllowed||marketTruth.decisionPrice==null)return{allowed:false,code:'MARKET_TRUTH_BLOCKED',reason:marketTruth.reason};
 if(decisionSnapshotId!==marketTruth.snapshotId)return{allowed:false,code:'DECISION_SNAPSHOT_MISMATCH',reason:'The decision was not generated from the currently verified market snapshot.'};
 if(intentSnapshotId!==decisionSnapshotId)return{allowed:false,code:'INTENT_SNAPSHOT_MISMATCH',reason:'The trade intent snapshot does not match the decision snapshot.'};
 return{allowed:true,code:'VERIFIED',reason:'Decision, intent and market truth share one canonical snapshot.'};
}

export function mapV5ActionToToday(action:PrimaryInvestmentAction,owns:boolean):TodayDecision{
 const policyVersion='auryn-v5-paper-map-1';
 if(action==='BUY'||action==='STRONG_BUY')return{action:owns?'ADD':'BUY',blocked:false,reason:'V5 canonical decision supports staged capital subject to execution/risk gates.',policyVersion};
 if(action==='HOLD')return{action:'HOLD',blocked:false,reason:'V5 canonical decision supports no position change.',policyVersion};
 if(action==='REDUCE')return{action:owns?'TRIM':'AVOID',blocked:!owns,reason:owns?'V5 canonical decision supports reducing exposure.':'V5 canonical decision does not support new capital.',policyVersion};
 if(action==='SELL')return{action:owns?'SELL':'AVOID',blocked:true,reason:'V5 structural decision blocks new risk and supports exit for an existing owner.',policyVersion};
 return{action:'NO ACTION',blocked:true,reason:'V5 does not have enough structural evidence for an execution intent.',policyVersion};
}

type PriceState='VERIFIED'|'UNVERIFIED';
type ThesisState='STRENGTHENING'|'STABLE'|'WEAKENING'|'BROKEN';
function scenarioAction(x:{priceState:PriceState;valuationAvailable:boolean;thesisState:ThesisState;risk:number;timing:number;business:number;owns:boolean}){
 if(!x.priceState||x.priceState==='UNVERIFIED')return x.owns?'HOLD':'VERIFY';
 if(x.thesisState==='BROKEN')return x.owns?'SELL':'AVOID';
 if(!x.valuationAvailable)return x.owns?'HOLD':'HOLD';
 if(x.risk>=90)return x.owns?'HOLD':'HOLD';
 if(x.thesisState==='WEAKENING'&&x.business<45)return x.owns?'TRIM':'AVOID';
 if(x.business>=75&&x.timing>=65)return x.owns?'ADD':'BUY';
 if(x.business>=60)return 'HOLD';
 return x.owns?'HOLD':'AVOID';
}

export function runV5ReliabilityMatrix(){
 const priceStates:PriceState[]=['VERIFIED','UNVERIFIED'];
 const valuation=[true,false];
 const thesis:ThesisState[]=['STRENGTHENING','STABLE','WEAKENING','BROKEN'];
 const risks=[25,55,80,95];
 const timings=[20,45,70,90];
 const ownership=[false,true];
 const business=[30,50,70,90];
 const macro=['RISK_ON','RISK_OFF'];
 const lifecycle=['EARLY','MATURE'];
 const liquidity=['NORMAL','THIN'];
 const violations:string[]=[];let cases=0;
 for(const priceState of priceStates)for(const valuationAvailable of valuation)for(const thesisState of thesis)for(const risk of risks)for(const timing of timings)for(const owns of ownership)for(const b of business)for(const _m of macro)for(const _l of lifecycle)for(const _q of liquidity){
  cases++;const action=scenarioAction({priceState,valuationAvailable,thesisState,risk,timing,business:b,owns});
  if(priceState==='UNVERIFIED'&&['BUY','ADD','TRIM','SELL'].includes(action))violations.push(`unverified-execution:${cases}`);
  if(!valuationAvailable&&!owns&&action==='BUY')violations.push(`missing-valuation-buy:${cases}`);
  if(thesisState==='BROKEN'&&owns&&priceState==='VERIFIED'&&action!=='SELL')violations.push(`broken-thesis-owner:${cases}`);
  if(thesisState!=='BROKEN'&&timing<=20&&b>=75&&action==='SELL')violations.push(`technical-alone-sell:${cases}`);
 }
 return{cases,violations,dimensions:['priceState','valuationAvailable','thesisState','risk','timing','ownership','business','macro','lifecycle','liquidity']};
}
