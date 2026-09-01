export const BROKER_CONTRACT_VERSION="v61-broker-1" as const;
export const ALPACA_PAPER_BASE_URL="https://paper-api.alpaca.markets" as const;
export type BrokerMode="paper"|"live";
export type BrokerAuthorization={status:"AUTHORIZED"|"APPROVAL_REQUIRED"|"DISABLED";mayTransmit:boolean;reason:string;version:string};
export function authorizeBrokerExecution(x:{mode:BrokerMode;autoSubmit:boolean;approvedByUser?:boolean}):BrokerAuthorization{
 if(x.mode==="live")return{status:"APPROVAL_REQUIRED",mayTransmit:false,reason:"Live-money orders require explicit user approval and cannot be auto-submitted by Trading Lab.",version:BROKER_CONTRACT_VERSION};
 if(!x.autoSubmit)return{status:"DISABLED",mayTransmit:false,reason:"Automatic paper submission is disabled.",version:BROKER_CONTRACT_VERSION};
 return{status:"AUTHORIZED",mayTransmit:true,reason:"Autonomous execution is permitted only for the configured paper account.",version:BROKER_CONTRACT_VERSION};
}
