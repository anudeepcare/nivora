import type {TodayDecision} from "./nivora-today";

export type NoIntentExplanation={code:"NO_POSITION"|"NO_INTENT"|"MISSING_TODAY";reason:string};

export function explainNoIntent(today:TodayDecision|undefined,hasPosition:boolean):NoIntentExplanation{
 if(!today)return{code:"MISSING_TODAY",reason:"Frozen decision has no Today action."};
 if((today.action==="SELL"||today.action==="TRIM")&&!hasPosition)return{code:"NO_POSITION",reason:"No paper position exists to exit."};
 return{code:"NO_INTENT",reason:`Today action ${today.action} does not authorize a paper trade intent.`};
}
