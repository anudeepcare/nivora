import {BACKGROUND_CALLS_PER_MINUTE,PROVIDER_CALLS_PER_MINUTE} from "./jobs";
export const providerBudget={providerLimit:PROVIDER_CALLS_PER_MINUTE,backgroundLimit:BACKGROUND_CALLS_PER_MINUTE,interactiveHeadroom:PROVIDER_CALLS_PER_MINUTE-BACKGROUND_CALLS_PER_MINUTE};
export function callsNeededForBatch(symbols:number,callsPerSymbol=1){return Math.max(1,Math.ceil(symbols*Math.max(.1,callsPerSymbol)))}
