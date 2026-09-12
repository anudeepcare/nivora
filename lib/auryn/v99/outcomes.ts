import {OUTCOME_HORIZONS,outcomeDueAt,type OutcomeHorizon} from "./shadow-cio";
export function buildOutcomeSchedule(snapshotId:string,evaluationDate:string){return OUTCOME_HORIZONS.map((h:OutcomeHorizon)=>({snapshotId,horizon:h,dueDate:outcomeDueAt(evaluationDate,h)}))}
