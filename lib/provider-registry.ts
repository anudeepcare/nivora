export type ProviderCapability="quotes"|"candles"|"fundamentals"|"news"|"earnings"|"options"|"flow"|"estimates";
export type ProviderDescriptor={id:string;capabilities:ProviderCapability[];priority:number;realTime:boolean;licensed:boolean};

export const providers:ProviderDescriptor[]=[
 {id:"twelvedata",capabilities:["quotes","candles"],priority:10,realTime:true,licensed:true},
 {id:"finnhub",capabilities:["quotes","news","earnings"],priority:20,realTime:true,licensed:true},
 {id:"sec",capabilities:["fundamentals"],priority:10,realTime:false,licensed:true},
 {id:"marketdata",capabilities:["options"],priority:10,realTime:false,licensed:true},
];

export function providersFor(cap:ProviderCapability){
 return providers.filter(p=>p.capabilities.includes(cap)).sort((a,b)=>a.priority-b.priority);
}
