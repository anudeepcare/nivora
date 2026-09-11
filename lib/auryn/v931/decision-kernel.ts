import {V931_VERSION,type InstitutionalDecision,type InstitutionalLongTermAction,type InstitutionalNewMoneyAction,type InstitutionalOwnerAction,type Pillar,type PillarEvidence,type PillarKey,type SetupState} from './domain';
import type {PrimaryInvestmentAction} from '../v4/domain';
import {resolveSetupTransition} from './setup-state';

const clamp=(n:number)=>Math.max(0,Math.min(100,Math.round(Number.isFinite(n)?n:50)));
const labels:Record<PillarKey,string>={business:'Business quality',earningsRevisions:'Earnings & revisions',valuation:'Valuation / expected return',marketStructure:'Market structure',catalystsRegime:'Catalysts / regime',riskAsymmetry:'Risk / asymmetry'};
const weights:Record<PillarKey,number>={business:.24,earningsRevisions:.18,valuation:.16,marketStructure:.18,catalystsRegime:.08,riskAsymmetry:.16};
function pillar(key:PillarKey,score:number|null,evidence?:PillarEvidence|null):Pillar{
 if(score==null||!Number.isFinite(score))return{key,label:labels[key],score:null,state:'UNAVAILABLE',impact:'UNAVAILABLE',why:evidence?.why||`${labels[key]} evidence is unavailable; AURYN withholds the vote instead of treating missing data as bearish.`,evidenceIds:evidence?.evidenceIds||[],asOf:evidence?.asOf??null};
 const s=clamp(score),state=s>=72?'STRONG':s>=60?'CONSTRUCTIVE':s>=45?'MIXED':'WEAK',impact=s>=62?'POSITIVE':s<45?'NEGATIVE':'NEUTRAL';
 return{key,label:labels[key],score:s,state,impact,why:evidence?.why||`${labels[key]} measures ${s}/100 on the canonical snapshot; expand Expert Evidence for the underlying observations.`,evidenceIds:evidence?.evidenceIds||[],asOf:evidence?.asOf??null};
}
const actionText=(x:string)=>x.replaceAll('_',' ');
const round1=(n:number)=>Math.round(n*10)/10;

export function buildInstitutionalDecisionKernel(input:{snapshotId:string;symbol:string;marketPrice:number|null;executionTradable:boolean;previousSetupState:SetupState|null;scores:{business:number|null;earningsRevisions:number|null;valuation:number|null;marketStructure:number|null;catalystsRegime:number|null;riskAsymmetry:number|null};pillarEvidence?:Partial<Record<PillarKey,PillarEvidence>>;technical:{trend:number;momentum:number;flow:number;structure:number;nearResistance:boolean;confirmedBreakout:boolean;structuralBreak:boolean;reclaimLevel:number|null;invalidation:number|null};evidenceCompleteness:number;canonicalAction?:PrimaryInvestmentAction|null;canonicalOwnerAction?:PrimaryInvestmentAction|null}):InstitutionalDecision{
 const pe=input.pillarEvidence||{};
 const pillars={business:pillar('business',input.scores.business,pe.business),earningsRevisions:pillar('earningsRevisions',input.scores.earningsRevisions,pe.earningsRevisions),valuation:pillar('valuation',input.scores.valuation,pe.valuation),marketStructure:pillar('marketStructure',input.scores.marketStructure,pe.marketStructure),catalystsRegime:pillar('catalystsRegime',input.scores.catalystsRegime,pe.catalystsRegime),riskAsymmetry:pillar('riskAsymmetry',input.scores.riskAsymmetry,pe.riskAsymmetry)};
 const vals=Object.values(pillars).filter(p=>p.score!=null) as Array<Pillar&{score:number}>;
 const denom=vals.reduce((s,p)=>s+weights[p.key],0)||1;
 const score=clamp(vals.reduce((s,p)=>s+p.score*weights[p.key],0)/denom);
 const transition=resolveSetupTransition({...input.technical,previous:input.previousSetupState});
 const hardVetoReasons:string[]=[];
 const policyReasons:string[]=[];
 const business=pillars.business.score,earnings=pillars.earningsRevisions.score,valuation=pillars.valuation.score,marketStructure=pillars.marketStructure.score,riskAsymmetry=pillars.riskAsymmetry.score;
 if(input.technical.structuralBreak)hardVetoReasons.push('CONFIRMED_STRUCTURAL_INVALIDATION');
 if(riskAsymmetry!=null&&riskAsymmetry<20)hardVetoReasons.push('SEVERE_RISK_ASYMMETRY');
 if(business!=null&&earnings!=null&&business<30&&earnings<30)hardVetoReasons.push('FUNDAMENTAL_THESIS_BREAK');
 const setupPositive=['RECLAIM_ATTEMPT','BREAKOUT_WATCH','BREAKOUT_READY','BREAKOUT_CONFIRMED','TRENDING'].includes(transition.state);
 const setupStrong=['BREAKOUT_CONFIRMED','TRENDING'].includes(transition.state);
 const setupDamaged=['DAMAGED','FAILED_RECLAIM'].includes(transition.state);
 let newMoney:InstitutionalNewMoneyAction='WAIT';
 if(hardVetoReasons.length){newMoney='AVOID';policyReasons.push(`Hard veto: ${hardVetoReasons.join(', ')}`);}
 else if(score>=82&&input.evidenceCompleteness>=85&&setupStrong&&(marketStructure??0)>=75&&(riskAsymmetry??0)>=65&&(business??50)>=70&&(earnings??50)>=65){newMoney='STRONG_BUY';policyReasons.push('Exceptional multi-pillar alignment with confirmed structure and strong asymmetry.');}
 else if(score>=67&&input.evidenceCompleteness>=75&&setupPositive&&!setupDamaged&&(marketStructure??0)>=64&&(riskAsymmetry??0)>=54&&Math.max(business??0,earnings??0)>=60){newMoney='BUY';policyReasons.push('Positive multi-pillar evidence with confirmed market structure and acceptable asymmetry.');}
 else if(score>=61&&input.evidenceCompleteness>=65&&setupPositive&&!setupDamaged&&(marketStructure??0)>=56&&(riskAsymmetry??0)>=44&&Math.max(business??0,earnings??0)>=58){newMoney='START_SMALL';policyReasons.push(valuation==null?'Positive evidence supports a partial position, but missing valuation evidence caps conviction.':'Positive evidence supports a partial position while one or more material uncertainties remain.');}
 else if(score<40&&((marketStructure??50)<40||(riskAsymmetry??50)<30)&&Math.min(business??50,earnings??50)<40){newMoney='AVOID';policyReasons.push('Weak evidence and poor market/risk conditions do not support new capital.');}
 else {newMoney='WAIT';policyReasons.push('Evidence is not yet strong enough across structure, asymmetry and decision quality for new capital.');}
 let owner:InstitutionalOwnerAction=score>=74&&(riskAsymmetry??50)>=55?'ADD':score>=53?'HOLD':score>=40?'WATCH':score>=28?'REDUCE':'EXIT';
 if(input.technical.structuralBreak&&score<45)owner='EXIT';
 const longTerm:InstitutionalLongTermAction=business!=null&&business>=75&&earnings!=null&&earnings>=58?'ATTRACTIVE':business!=null&&business<42?'UNATTRACTIVE':earnings!=null&&earnings<35?'UNATTRACTIVE':'SELECTIVE';
 const attribution=Object.values(pillars).map(p=>({pillar:p.key,label:p.label,score:p.score,weight:weights[p.key],contribution:p.score==null?0:round1((p.score-50)*weights[p.key]),direction:p.impact})).sort((a,b)=>Math.abs(b.contribution)-Math.abs(a.contribution));
 const ordered=[...vals].sort((a,b)=>Math.abs((b.score??50)-50)-Math.abs((a.score??50)-50));
 const drivers=ordered.filter(p=>p.score>=60).slice(0,3).map(p=>p.why);
 const counterEvidence=ordered.filter(p=>p.score<55).slice(0,3).map(p=>p.why);
 if(!drivers.length)drivers.push('No pillar has earned a strong positive state; AURYN is withholding a stronger call until the evidence improves.');
 if(!counterEvidence.length)counterEvidence.push('No major pillar is weak on this snapshot; execution and position risk are still governed separately from research conviction.');
 const reclaim=input.technical.reclaimLevel;
 const nextDecisionTrigger=reclaim!=null?`A completed daily close above $${reclaim.toFixed(2)} with participation confirmation is the next setup upgrade trigger.`:transition.state==='TRENDING'?'Maintain trend structure and thesis evidence; no forced entry trigger is active.':'A completed bar must materially improve trend, structure and participation before the setup upgrades.';
 const evidenceCompleteness=clamp(input.evidenceCompleteness);
 return{version:V931_VERSION,snapshotId:input.snapshotId,symbol:input.symbol.toUpperCase(),newMoneyAction:newMoney,ownerAction:owner,longTermAction:longTerm,executionAction:input.executionTradable?'READY':'BLOCKED',canonicalPrimaryAction:newMoney,legacyChallengerAction:input.canonicalAction??null,hardVetoReasons,policyReasons,setupState:transition.state,decisionScore:score,confidenceScore:evidenceCompleteness,confidenceBasis:'EVIDENCE_QUALITY_UNCALIBRATED',evidenceCompleteness,pillars,attribution,drivers,counterEvidence,nextDecisionTrigger,invalidationTrigger:input.technical.invalidation==null?null:`Thesis/setup risk increases materially below $${input.technical.invalidation.toFixed(2)}.`,horizons:{now:newMoney,swing:transition.state==='BREAKOUT_CONFIRMED'||transition.state==='TRENDING'?'CONSTRUCTIVE':'WAIT',sixToTwelveMonths:longTerm,threeToFiveYears:longTerm},changeExplanation:{changed:transition.changed,from:input.previousSetupState,to:transition.state,trigger:transition.trigger,changedEvidence:transition.changedEvidence,unchangedEvidence:transition.unchangedEvidence}};
}
