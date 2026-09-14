const severity:Record<string,number>={AVOID:100,TRIM_RISK:90,WATCH:55,ADD:45,HOLD:0};
export function portfolioPriorityScore(x:any){
 const action=String(x.portfolioAction||"HOLD"),weight=Math.max(0,Number(x.weightPct||0)),evidence=Math.max(0,Math.min(100,Number(x.evidenceCompleteness??50)));
 const concentration=Math.max(0,weight-10)*1.5,base=severity[action]??20;
 return Math.round((base+weight*2+concentration)*(0.7+evidence/333));
}
export function rankPortfolioActions<T extends Record<string,any>>(rows:T[]):Array<T&{priorityScore:number}>{
 return rows.map(x=>({...x,priorityScore:portfolioPriorityScore(x)})).sort((a,b)=>b.priorityScore-a.priorityScore||Number(b.weightPct||0)-Number(a.weightPct||0));
}
