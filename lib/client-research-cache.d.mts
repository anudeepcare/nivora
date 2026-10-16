export type ResearchWarmEntry={d?:any;company?:any;context?:any;institutional?:any;ts:number;companyTs?:number;contextTs?:number;institutionalTs?:number};
export const COMPANY_EVIDENCE_CONTRACT:'sec-company-evidence-v3';
export function isCurrentCompanyEvidence(data:any):boolean;
export function createResearchJsonCache(options?:{fetcher?:typeof fetch;now?:()=>number;maxEntries?:number}):{
  get(url:string,options?:{signal?:AbortSignal;ttlMs?:number}):Promise<any>;
  peek(url:string,ttlMs?:number):any|undefined;
};
export function createResearchWarmCache(options?:{now?:()=>number;maxEntries?:number;maxAgeMs?:number}):{
  get(symbol:string):ResearchWarmEntry|undefined;
  set(symbol:string,entry:ResearchWarmEntry):ResearchWarmEntry;
  merge(symbol:string,patch:Partial<ResearchWarmEntry>):ResearchWarmEntry;
};
