import type {PlanningEvidence} from './policy';
/** One adapter shared by stock research and portfolio planning. Never promote stale research. */
export function planningEvidenceFromSnapshot(snapshot:any):PlanningEvidence|null{
 const research=snapshot?.research,decision=research?.decision,financial=research?.financialEvidence;
 if(!decision)return null;
 const score=decision.pillars?.valuation?.score;
 return{snapshotId:decision.snapshotId??'',knownAt:research.observedAt??'',
 thesis:decision.hardVetoReasons?.includes('FUNDAMENTAL_THESIS_BREAK')?'broken':decision.longTermAction==='ATTRACTIVE'?'intact':decision.longTermAction==='UNASSESSED'?'unknown':'uncertain',
 valuation:typeof score!=='number'||!Number.isFinite(score)?'unknown':score>=65?'supported':score<45?'expensive':'neutral',
 fundingRisk:['normal','elevated','critical'].includes(financial?.fundingRisk?.state)?financial.fundingRisk.state:'unknown',
 evidenceReady:research.state==='READY',tacticalSetup:['TRENDING','BREAKOUT_CONFIRMED'].includes(decision.setupState)?'confirmed':'weak',
 references:[...new Set<string>([...(financial?.evidenceIds??[]),...(financial?.fundingRisk?.evidenceIds??[])].filter((x:unknown)=>typeof x==='string'&&x.length>0))]};
}
