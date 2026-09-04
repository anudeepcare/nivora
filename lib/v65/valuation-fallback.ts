
export type ValuationFallback={
 available:boolean;framework:string;reason:string;drivers:string[];absoluteTarget:null;
};
export function buildValuationFallback(x:{archetype:string;valuationBasis?:string|null;reason?:string|null}):ValuationFallback{
 const a=String(x.archetype||"general").toLowerCase();
 if(a==="ai_infrastructure"||a==="hypergrowth"||a==="pre_scale")return{
  available:true,absoluteTarget:null,
  framework:a==="ai_infrastructure"?"Capacity / forward revenue economics":"Forward revenue / unit-economics framework",
  reason:x.reason||"Absolute fair value is not decision-grade for this archetype.",
  drivers:a==="ai_infrastructure"?["contracted / available capacity","forward revenue per capacity unit","gross margin and utilization","capital intensity / financing"]:["forward revenue growth","gross margin trajectory","cash burn / FCF path","reasonable peer multiple range"]
 };
 if(a==="biotech")return{available:true,absoluteTarget:null,framework:"Pipeline / probability-weighted scenario framework",reason:x.reason||"Binary clinical/regulatory outcomes make a single absolute target misleading.",drivers:["pipeline milestones","probability of success","cash runway / dilution","commercial opportunity by program"]};
 if(a==="bank"||a==="insurer")return{available:true,absoluteTarget:null,framework:"Book value / normalized earnings / capital-return framework",reason:x.reason||"Financial-sector valuation requires balance-sheet-specific evidence.",drivers:["book value growth","normalized ROE","capital ratios","credit / reserve quality"]};
 if(a==="cyclical"||a==="miner")return{available:true,absoluteTarget:null,framework:"Mid-cycle earnings / asset-value framework",reason:x.reason||"Spot-cycle earnings are too volatile for a single DCF target.",drivers:["mid-cycle commodity / pricing assumption","normalized margins","balance-sheet leverage","asset quality / replacement value"]};
 return{available:true,absoluteTarget:null,framework:"Relative valuation / normalized cash-economics framework",reason:x.reason||"Absolute fair value is not established.",drivers:["normalized earnings or cash flow","growth durability","balance-sheet risk","peer / historical valuation range"]};
}
