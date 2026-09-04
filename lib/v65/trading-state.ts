
export function deriveTradingLabState(x:{brokerConnected:boolean;lastRunAt?:string|null;evaluated:number;orders:number;fills:number;maturedOutcomes:number}){
 const executionLabel=!x.brokerConnected?"BROKER NOT CONNECTED":x.fills>0?`PAPER TRADING · ${x.fills} FILLS`:x.orders>0?`ORDERS SENT · ${x.orders}`:x.evaluated>0?"RUNNING · NO ORDERS QUALIFIED":"CONNECTED · NO TRADES YET";
 const learningLabel=x.maturedOutcomes>0?`LEARNING · ${x.maturedOutcomes} MATURED OUTCOMES`:"NOT LEARNING YET";
 const nextStep=!x.brokerConnected?"Connect Alpaca Paper credentials.":x.evaluated===0?"Generate fresh decisions/snapshots, then let the automatic runner evaluate them.":x.orders===0?"Review the dominant decision/risk blockers preventing intents from reaching the broker.":x.maturedOutcomes===0?"Allow paper fills to mature before calibration can learn from outcomes.":"Compare challenger evidence with the frozen production engine; do not auto-promote weights.";
 return{executionLabel,learningLabel,nextStep,lastRunAt:x.lastRunAt||null};
}
