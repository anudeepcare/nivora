import type {TodayDecision} from '../../nivora-today';
import type {InstitutionalNewMoneyAction,InstitutionalOwnerAction} from '../v931/domain';

export function mapInstitutionalActionToToday(newMoney:InstitutionalNewMoneyAction,owner:InstitutionalOwnerAction,owns:boolean):TodayDecision{
 const policyVersion='auryn-v9.3.4.3-paper-map-1';
 if(owns){
  if(owner==='ADD')return{action:'ADD',blocked:false,reason:'Canonical owner policy supports adding exposure subject to execution and risk gates.',policyVersion,buyTier:'CONFIRMED'};
  if(owner==='REDUCE')return{action:'TRIM',blocked:false,reason:'Canonical owner policy supports reducing exposure.',policyVersion};
  if(owner==='EXIT')return{action:'SELL',blocked:true,reason:'Canonical owner policy requires exit/reassessment before new risk.',policyVersion};
  return{action:'HOLD',blocked:false,reason:owner==='WATCH'?'Canonical owner policy is WATCH; hold position size while evidence is reassessed.':'Canonical owner policy supports holding current exposure.',policyVersion};
 }
 if(newMoney==='STRONG_BUY')return{action:'BUY',blocked:false,reason:'Canonical new-money policy supports a confirmed staged entry.',policyVersion,buyTier:'CONFIRMED'};
 if(newMoney==='BUY')return{action:'BUY',blocked:false,reason:'Canonical new-money policy supports staged capital subject to execution and risk gates.',policyVersion,buyTier:'CONFIRMED'};
 if(newMoney==='START_SMALL')return{action:'BUY',blocked:false,reason:'Canonical new-money policy supports only a starter position while material uncertainty remains.',policyVersion,buyTier:'STARTER'};
 if(newMoney==='AVOID')return{action:'AVOID',blocked:true,reason:'Canonical new-money policy does not support deploying new capital.',policyVersion};
 return{action:'NO ACTION',blocked:false,reason:'Canonical new-money policy is WAIT; no paper order should be created.',policyVersion};
}
